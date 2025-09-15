import TrackPlayer, { Event, State } from 'react-native-track-player';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import { AppState, Platform } from 'react-native';
import logger from './utils/logger';

// Global flag to prevent service interference during manual navigation
let isManualNavigation = false;
let backgroundTaskId = null;

// Function to set manual navigation flag (will be called from main app)
global.setManualNavigation = (value) => {
  isManualNavigation = value;
  logger.info('Manual navigation flag set', { value }, 'TrackPlayerService');
};

// Request background execution time to prevent suspension
const requestBackgroundExecution = () => {
  if (Platform.OS === 'ios') {
    try {
      // Request background execution time
      backgroundTaskId = require('react-native').AppState.addEventListener('change', (nextAppState) => {
        if (nextAppState === 'background') {
          logger.info('App entering background - requesting execution time', {}, 'TrackPlayerService');
        } else if (nextAppState === 'active') {
          logger.info('App entering foreground', {}, 'TrackPlayerService');
        }
      });
      logger.info('Background execution requested', { backgroundTaskId }, 'TrackPlayerService');
    } catch (error) {
      logger.error('Failed to request background execution', { 
        error: error instanceof Error ? error.message : String(error) 
      }, 'TrackPlayerService');
    }
  }
};

const requestAudioFocus = async () => {
  logger.info('Requesting audio focus', {}, 'TrackPlayerService');
  try {
    await Audio.setAudioModeAsync({
      staysActiveInBackground: true,
      interruptionModeIOS: InterruptionModeIOS.DuckOthers,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
      playThroughEarpieceAndroid: false,
    });
    logger.info('Audio focus granted', {}, 'TrackPlayerService');
    return true;
  } catch (error) {
    logger.error('Failed to set audio mode', { 
      error: error instanceof Error ? error.message : String(error) 
    }, 'TrackPlayerService');
    return false;
  }
};

const playWithRetry = async (maxRetries = 3) => {
  logger.info('Starting play with retry', { maxRetries }, 'TrackPlayerService');
  for (let i = 0; i < maxRetries; i++) {
    try {
      await TrackPlayer.play();
      logger.info('Play successful', { attempt: i + 1 }, 'TrackPlayerService');
      return true;
    } catch (error) {
      logger.warn('Play attempt failed', { 
        attempt: i + 1, 
        maxRetries,
        error: error instanceof Error ? error.message : String(error)
      }, 'TrackPlayerService');
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
};

module.exports = async function () {
  logger.info('TrackPlayer service started', {}, 'TrackPlayerService');
  
  // Request background execution time to prevent suspension
  requestBackgroundExecution();

  TrackPlayer.addEventListener(Event.RemotePlay, async () => {
    logger.info('RemotePlay event received', {}, 'TrackPlayerService');
    try {
      await requestAudioFocus();
      await TrackPlayer.play();
      logger.info('RemotePlay executed successfully', {}, 'TrackPlayerService');
    } catch (error) {
      logger.error('Error in RemotePlay', { 
        error: error instanceof Error ? error.message : String(error) 
      }, 'TrackPlayerService');
    }
  });

  TrackPlayer.addEventListener(Event.RemotePause, async () => {
    logger.info('RemotePause event received', {}, 'TrackPlayerService');
    try {
      await TrackPlayer.pause();
      logger.info('RemotePause executed successfully', {}, 'TrackPlayerService');
    } catch (error) {
      logger.error('Error in RemotePause', { 
        error: error instanceof Error ? error.message : String(error) 
      }, 'TrackPlayerService');
    }
  });

  TrackPlayer.addEventListener(Event.RemoteStop, async () => {
    logger.info('RemoteStop event received', {}, 'TrackPlayerService');
    try {
      const position = await TrackPlayer.getPosition();
      const currentTrack = await TrackPlayer.getCurrentTrack();
      if (currentTrack) {
        const trackObject = await TrackPlayer.getTrack(currentTrack);
        await AsyncStorage.setItem('lastSongUrl', trackObject.url);
        await AsyncStorage.setItem('lastSongPosition', position.toString());
        logger.info('Saved last song state', { 
          url: trackObject.url, 
          position,
          title: trackObject.title
        }, 'TrackPlayerService');
      }
      await TrackPlayer.destroy();
      logger.info('TrackPlayer destroyed', {}, 'TrackPlayerService');
    } catch (error) {
      logger.error('Error in RemoteStop event', { 
        error: error instanceof Error ? error.message : String(error) 
      }, 'TrackPlayerService');
    }
  });

  TrackPlayer.addEventListener(Event.RemoteNext, async () => {
    logger.info('RemoteNext event received', {}, 'TrackPlayerService');
    
    // Set manual navigation flag to prevent auto-continuation interference
    isManualNavigation = true;
    logger.info('Manual navigation flag set to true for RemoteNext', {}, 'TrackPlayerService');
    
    try {
      // Get next track from current playlist or go to next file
      const currentTrack = await TrackPlayer.getCurrentTrack();
      if (currentTrack !== null) {
        const trackObject = await TrackPlayer.getTrack(currentTrack);
        const playlistData = await AsyncStorage.getItem('currentPlaylist');
        const currentIndex = await AsyncStorage.getItem('currentIndex');
        
        logger.info('Processing RemoteNext', { 
          currentTrack: trackObject?.title,
          hasPlaylist: !!playlistData,
          currentIndex
        }, 'TrackPlayerService');
        
        if (playlistData && currentIndex !== null) {
          const playlist = JSON.parse(playlistData);
          const nextIndex = parseInt(currentIndex) + 1;
          
          if (nextIndex < playlist.length) {
            const nextTrack = playlist[nextIndex];
            logger.info('Loading next track from playlist', { 
              nextTrack: nextTrack.title,
              nextIndex,
              fromIndex: currentIndex
            }, 'TrackPlayerService');
            
            await TrackPlayer.reset();
            await TrackPlayer.add({
              id: nextIndex.toString(),
              url: nextTrack.url,
              title: nextTrack.title,
            });
            
            await AsyncStorage.setItem('currentIndex', nextIndex.toString());
            
            const focusGranted = await requestAudioFocus();
            if (focusGranted) {
              await playWithRetry();
            } else {
              logger.error('Failed to get audio focus for next track', {}, 'TrackPlayerService');
            }
          } else {
            logger.info('No more tracks in playlist', { 
              nextIndex, 
              playlistLength: playlist.length 
            }, 'TrackPlayerService');
          }
        } else {
          logger.warn('No playlist data or current index for RemoteNext', {
            hasPlaylist: !!playlistData,
            currentIndex
          }, 'TrackPlayerService');
        }
      }
    } catch (error) {
      logger.error('Error in RemoteNext event', { 
        error: error instanceof Error ? error.message : String(error) 
      }, 'TrackPlayerService');
    } finally {
      // Clear manual navigation flag after a delay to prevent race conditions
      setTimeout(() => {
        isManualNavigation = false;
        logger.info('Manual navigation flag cleared after RemoteNext', {}, 'TrackPlayerService');
      }, 3000);
    }
  });

  TrackPlayer.addEventListener(Event.RemotePrevious, async () => {
    logger.info('RemotePrevious event received', {}, 'TrackPlayerService');
    
    // Set manual navigation flag to prevent auto-continuation interference
    isManualNavigation = true;
    logger.info('Manual navigation flag set to true for RemotePrevious', {}, 'TrackPlayerService');
    
    try {
      const currentTrack = await TrackPlayer.getCurrentTrack();
      if (currentTrack !== null) {
        const trackObject = await TrackPlayer.getTrack(currentTrack);
        const playlistData = await AsyncStorage.getItem('currentPlaylist');
        const currentIndex = await AsyncStorage.getItem('currentIndex');
        
        logger.info('Processing RemotePrevious', { 
          currentTrack: trackObject?.title,
          hasPlaylist: !!playlistData,
          currentIndex
        }, 'TrackPlayerService');
        
        if (playlistData && currentIndex !== null) {
          const playlist = JSON.parse(playlistData);
          const prevIndex = parseInt(currentIndex) - 1;
          
          if (prevIndex >= 0) {
            const prevTrack = playlist[prevIndex];
            logger.info('Loading previous track from playlist', { 
              prevTrack: prevTrack.title,
              prevIndex,
              fromIndex: currentIndex
            }, 'TrackPlayerService');
            
            await TrackPlayer.reset();
            await TrackPlayer.add({
              id: prevIndex.toString(),
              url: prevTrack.url,
              title: prevTrack.title,
            });
            
            await AsyncStorage.setItem('currentIndex', prevIndex.toString());
            
            const focusGranted = await requestAudioFocus();
            if (focusGranted) {
              await playWithRetry();
            } else {
              logger.error('Failed to get audio focus for previous track', {}, 'TrackPlayerService');
            }
          } else {
            logger.info('Already at first track in playlist', { 
              prevIndex, 
              currentIndex 
            }, 'TrackPlayerService');
          }
        } else {
          logger.warn('No playlist data or current index for RemotePrevious', {
            hasPlaylist: !!playlistData,
            currentIndex
          }, 'TrackPlayerService');
        }
      }
    } catch (error) {
      logger.error('Error in RemotePrevious event', { 
        error: error instanceof Error ? error.message : String(error) 
      }, 'TrackPlayerService');
    } finally {
      // Clear manual navigation flag after a delay to prevent race conditions
      setTimeout(() => {
        isManualNavigation = false;
        logger.info('Manual navigation flag cleared after RemotePrevious', {}, 'TrackPlayerService');
      }, 3000);
    }
  });

  TrackPlayer.addEventListener(Event.RemoteSeek, async (event) => {
    logger.info('RemoteSeek event received', { position: event.position }, 'TrackPlayerService');
    try {
      await TrackPlayer.seekTo(event.position);
      logger.info('Remote seek completed', { position: event.position }, 'TrackPlayerService');
    } catch (error) {
      logger.error('Error in RemoteSeek event', { 
        error: error instanceof Error ? error.message : String(error),
        position: event.position
      }, 'TrackPlayerService');
    }
  });

  // JumpForward/Backward events removed to match BKGAudio capabilities

  TrackPlayer.addEventListener(Event.PlaybackTrackChanged, async (event) => {
    logger.info('PlaybackTrackChanged event', { 
      nextTrack: event.nextTrack,
      previousTrack: event.previousTrack
    }, 'TrackPlayerService');
    if (event.nextTrack !== null) {
      try {
        const track = await TrackPlayer.getTrack(event.nextTrack);
        logger.info('Now playing track', { 
          title: track?.title,
          trackIndex: event.nextTrack
        }, 'TrackPlayerService');
      } catch (error) {
        logger.error('Error getting track info', { 
          error: error instanceof Error ? error.message : String(error),
          trackIndex: event.nextTrack
        }, 'TrackPlayerService');
      }
    }
  });

  TrackPlayer.addEventListener(Event.PlaybackState, async (event) => {
    logger.info('PlaybackState event', { state: event.state }, 'TrackPlayerService');
    
    if (event.state === State.Stopped) {
      logger.info('Playback stopped', {}, 'TrackPlayerService');
    } else if (event.state === State.Playing) {
      logger.info('Playback started', {}, 'TrackPlayerService');
    } else if (event.state === State.Paused) {
      logger.info('Playback paused', {}, 'TrackPlayerService');
    }
  });

  TrackPlayer.addEventListener(Event.PlaybackError, async (event) => {
    logger.error('Playback error occurred', { 
      error: event.error,
      code: event.code
    }, 'TrackPlayerService');
    // Handle playback errors - could retry or skip to next track
  });

  TrackPlayer.addEventListener(Event.PlaybackQueueEnded, async (event) => {
    logger.info('PlaybackQueueEnded event', { event }, 'TrackPlayerService');
    
    if (isManualNavigation) {
      logger.info('Manual navigation in progress, skipping auto-continuation', {}, 'TrackPlayerService');
      return;
    }
    
    try {
      // Auto-continue to next track if available
      const playlistData = await AsyncStorage.getItem('currentPlaylist');
      const currentIndex = await AsyncStorage.getItem('currentIndex');
      
      logger.info('Processing PlaybackQueueEnded', { 
        hasPlaylist: !!playlistData,
        currentIndex
      }, 'TrackPlayerService');
      
      if (playlistData && currentIndex !== null) {
        const playlist = JSON.parse(playlistData);
        const nextIndex = parseInt(currentIndex) + 1;
        
        if (nextIndex < playlist.length) {
          const nextTrack = playlist[nextIndex];
          logger.info('Auto-continuing to next track', { 
            nextTrack: nextTrack.title,
            nextIndex,
            fromIndex: currentIndex
          }, 'TrackPlayerService');
          
          await TrackPlayer.reset();
          await TrackPlayer.add({
            id: nextIndex.toString(),
            url: nextTrack.url,
            title: nextTrack.title,
          });
          
          await AsyncStorage.setItem('currentIndex', nextIndex.toString());
          
          const focusGranted = await requestAudioFocus();
          if (focusGranted) {
            await playWithRetry();
          } else {
            logger.error('Failed to get audio focus for auto-continuation', {}, 'TrackPlayerService');
          }
        } else {
          logger.info('End of playlist reached', { 
            nextIndex, 
            playlistLength: playlist.length 
          }, 'TrackPlayerService');
        }
      } else {
        logger.warn('No playlist data or current index for auto-continuation', {
          hasPlaylist: !!playlistData,
          currentIndex
        }, 'TrackPlayerService');
      }
    } catch (error) {
      logger.error('Error in PlaybackQueueEnded event', { 
        error: error instanceof Error ? error.message : String(error) 
      }, 'TrackPlayerService');
    }
  });
};
