import { useState, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import TrackPlayer, { State, Event, useTrackPlayerEvents, useProgress } from 'react-native-track-player';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import logger from '../utils/logger';

const useTrackPlayer = (onTrackLoaded) => {
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [playlist, setPlaylist] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const appState = useRef(AppState.currentState);
  const [appStateVisible, setAppStateVisible] = useState(appState.current);
  const isLoadingNewFile = useRef(false);
  const watchdogIntervalRef = useRef(null);
  const isTransitioning = useRef(false);
  
  const { position, duration } = useProgress();

  // Log hook initialization
  useEffect(() => {
    logger.info('useTrackPlayer hook initialized', {
      hasOnTrackLoaded: !!onTrackLoaded,
      initialAppState: appState.current
    }, 'useTrackPlayer');
  }, []);

  const ensureAudioSessionActive = async () => {
    logger.info('Ensuring audio session is active', {}, 'useTrackPlayer');
    try {
      await Audio.setAudioModeAsync({
        staysActiveInBackground: true,
        interruptionModeIOS: InterruptionModeIOS.DuckOthers,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
        playThroughEarpieceAndroid: false,
      });
      logger.info('Audio session reactivated successfully', {}, 'useTrackPlayer');
    } catch (error) {
      logger.error('Error reactivating audio session', { 
        error: error instanceof Error ? error.message : String(error) 
      }, 'useTrackPlayer');
    }
  };

  const startPlaybackWatchdog = () => {
    logger.info('Starting playback watchdog', {}, 'useTrackPlayer');
    return setInterval(async () => {
      try {
        const playerState = await TrackPlayer.getState();
        if (playerState === State.Playing) {
          const currentTrackIndex = await TrackPlayer.getCurrentTrack();
          if (currentTrackIndex !== null) {
            const track = await TrackPlayer.getTrack(currentTrackIndex);
            if (track) {
              const position = await TrackPlayer.getPosition();
              const duration = await TrackPlayer.getDuration();
              
              // Check if track has ended
              if (duration > 0 && position >= duration - 1000) {
                logger.info('Watchdog detected track ended, advancing to next', {
                  track: track.title,
                  position,
                  duration
                }, 'useTrackPlayer');
                await goToNextTrack();
              }
            }
          }
        }
      } catch (error) {
        logger.error('Watchdog error', { 
          error: error instanceof Error ? error.message : String(error) 
        }, 'useTrackPlayer');
      }
    }, 2000);
  };

  useEffect(() => {
    const setupAudioAndWatchdog = async () => {
      logger.info('Setting up audio session and watchdog', {}, 'useTrackPlayer');
      await ensureAudioSessionActive();
      
      // Start the watchdog
      watchdogIntervalRef.current = startPlaybackWatchdog();
    };

    setupAudioAndWatchdog();

    // Clean up function
    return () => {
      logger.info('Cleaning up useTrackPlayer watchdog', {}, 'useTrackPlayer');
      if (watchdogIntervalRef.current) {
        clearInterval(watchdogIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      logger.info('App state changed', { 
        from: appState.current, 
        to: nextAppState 
      }, 'useTrackPlayer');
      
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to the foreground
        logger.info('App moved to foreground, restarting watchdog', {}, 'useTrackPlayer');
        if (watchdogIntervalRef.current) {
          clearInterval(watchdogIntervalRef.current);
        }
        watchdogIntervalRef.current = startPlaybackWatchdog();
      }
      appState.current = nextAppState;
      setAppStateVisible(nextAppState);
    });

    return () => {
      logger.info('Removing app state listener', {}, 'useTrackPlayer');
      subscription.remove();
    };
  }, []);

  useTrackPlayerEvents([Event.PlaybackTrackChanged, Event.PlaybackState, Event.PlaybackError], async (event) => {
    logger.debug('TrackPlayer event received', { 
      type: event.type, 
      state: event.state,
      nextTrack: event.nextTrack,
      error: event.error
    }, 'useTrackPlayer');
    
    if (event.type === Event.PlaybackError) {
      logger.error('Playback error occurred', { 
        error: event.error 
      }, 'useTrackPlayer');
      await goToNextTrack();
    } else if (event.type === Event.PlaybackTrackChanged && event.nextTrack !== null) {
      const track = await TrackPlayer.getTrack(event.nextTrack);
      if (track) {
        logger.info('Track changed', { 
          track: track.title,
          trackIndex: event.nextTrack
        }, 'useTrackPlayer');
        setCurrentTrack(track);
        onTrackLoaded?.(true);
      }
    } else if (event.type === Event.PlaybackState) {
      const wasPlaying = isPlaying;
      const nowPlaying = event.state === State.Playing;
      setIsPlaying(nowPlaying);
      
      logger.info('Playback state changed', { 
        from: wasPlaying ? 'playing' : 'paused',
        to: nowPlaying ? 'playing' : 'paused',
        state: event.state
      }, 'useTrackPlayer');
      
      if (event.state === State.Stopped) {
        logger.info('Track stopped', {}, 'useTrackPlayer');
      }
    }
  });

  const loadTrack = async (trackUrl, trackTitle, shouldPlay = true, startPosition = 0) => {
    if (isLoadingNewFile.current) {
      logger.warn('Already loading a file, skipping load request', { 
        trackTitle, 
        trackUrl 
      }, 'useTrackPlayer');
      return;
    }

    logger.info('Loading track', { 
      trackTitle, 
      trackUrl, 
      shouldPlay, 
      startPosition 
    }, 'useTrackPlayer');

    isLoadingNewFile.current = true;
    setIsLoading(true);

    try {
      await TrackPlayer.reset();
      await TrackPlayer.add({
        id: '1',
        url: trackUrl,
        title: trackTitle,
      });

      if (shouldPlay) {
        await TrackPlayer.play();
        setIsPlaying(true);
        logger.info('Track loaded and started playing', { trackTitle }, 'useTrackPlayer');
      } else {
        logger.info('Track loaded but not playing', { trackTitle }, 'useTrackPlayer');
      }

      if (startPosition > 0) {
        await TrackPlayer.seekTo(startPosition);
        logger.info('Track seeked to start position', { 
          trackTitle, 
          startPosition 
        }, 'useTrackPlayer');
      }

      setCurrentTrack({ url: trackUrl, title: trackTitle });
      setIsLoading(false);
    } catch (error) {
      logger.error('Error loading track', { 
        error: error instanceof Error ? error.message : String(error),
        trackTitle,
        trackUrl
      }, 'useTrackPlayer');
      setIsLoading(false);
    } finally {
      isLoadingNewFile.current = false;
    }
  };

  const loadPlaylist = async (playlistData, startIndex = 0) => {
    logger.info('Loading playlist', { 
      trackCount: playlistData.length, 
      startIndex,
      startTrack: playlistData[startIndex]?.title
    }, 'useTrackPlayer');
    
    setPlaylist(playlistData);
    setCurrentIndex(startIndex);
    
    // Store playlist in AsyncStorage for background service
    try {
      await AsyncStorage.setItem('currentPlaylist', JSON.stringify(playlistData));
      await AsyncStorage.setItem('currentIndex', startIndex.toString());
      logger.debug('Playlist stored in AsyncStorage', { 
        trackCount: playlistData.length, 
        startIndex 
      }, 'useTrackPlayer');
    } catch (error) {
      logger.error('Error storing playlist in AsyncStorage', { 
        error: error instanceof Error ? error.message : String(error) 
      }, 'useTrackPlayer');
    }
    
    if (playlistData[startIndex]) {
      const track = playlistData[startIndex];
      await loadTrack(track.url, track.title, true, 0);
    } else {
      logger.warn('No track found at start index', { 
        startIndex, 
        playlistLength: playlistData.length 
      }, 'useTrackPlayer');
    }
  };

  const goToNextTrack = async () => {
    if (playlist.length > 0 && currentIndex < playlist.length - 1) {
      const nextIndex = currentIndex + 1;
      const nextTrack = playlist[nextIndex];
      
      logger.info('Advancing to next track', { 
        from: currentIndex, 
        to: nextIndex, 
        nextTrack: nextTrack.title 
      }, 'useTrackPlayer');
      
      // Set manual navigation flag to prevent interference
      global.setManualNavigation?.(true);
      
      try {
        await loadTrack(nextTrack.url, nextTrack.title, true, 0);
        setCurrentIndex(nextIndex);
        await AsyncStorage.setItem('currentIndex', nextIndex.toString());
        logger.info('Successfully advanced to next track', { 
          newIndex: nextIndex, 
          track: nextTrack.title 
        }, 'useTrackPlayer');
      } catch (error) {
        logger.error('Error advancing to next track', { 
          error: error instanceof Error ? error.message : String(error),
          nextIndex,
          nextTrack: nextTrack.title
        }, 'useTrackPlayer');
      } finally {
        // Clear manual navigation flag after delay
        setTimeout(() => {
          global.setManualNavigation?.(false);
        }, 3000);
      }
    } else {
      logger.info('Cannot advance to next track', { 
        currentIndex, 
        playlistLength: playlist.length 
      }, 'useTrackPlayer');
    }
  };

  const goToPreviousTrack = async () => {
    if (playlist.length > 0 && currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      const prevTrack = playlist[prevIndex];
      
      logger.info('Going to previous track', { 
        from: currentIndex, 
        to: prevIndex, 
        prevTrack: prevTrack.title 
      }, 'useTrackPlayer');
      
      // Set manual navigation flag to prevent interference
      global.setManualNavigation?.(true);
      
      try {
        await loadTrack(prevTrack.url, prevTrack.title, true, 0);
        setCurrentIndex(prevIndex);
        await AsyncStorage.setItem('currentIndex', prevIndex.toString());
        logger.info('Successfully went to previous track', { 
          newIndex: prevIndex, 
          track: prevTrack.title 
        }, 'useTrackPlayer');
      } catch (error) {
        logger.error('Error going to previous track', { 
          error: error instanceof Error ? error.message : String(error),
          prevIndex,
          prevTrack: prevTrack.title
        }, 'useTrackPlayer');
      } finally {
        // Clear manual navigation flag after delay
        setTimeout(() => {
          global.setManualNavigation?.(false);
        }, 3000);
      }
    } else {
      logger.info('Cannot go to previous track', { 
        currentIndex, 
        playlistLength: playlist.length 
      }, 'useTrackPlayer');
    }
  };

  const togglePlayback = async () => {
    logger.info('Toggling playback', { 
      currentState: isPlaying ? 'playing' : 'paused' 
    }, 'useTrackPlayer');
    
    try {
      if (isPlaying) {
        await TrackPlayer.pause();
        setIsPlaying(false);
        logger.info('Playback paused', {}, 'useTrackPlayer');
      } else {
        await TrackPlayer.play();
        setIsPlaying(true);
        logger.info('Playback started', {}, 'useTrackPlayer');
      }
    } catch (error) {
      logger.error('Error toggling playback', { 
        error: error instanceof Error ? error.message : String(error),
        wasPlaying: isPlaying
      }, 'useTrackPlayer');
    }
  };

  const seekTo = async (position) => {
    logger.info('Seeking to position', { position }, 'useTrackPlayer');
    try {
      await TrackPlayer.seekTo(position);
      logger.info('Seek completed', { position }, 'useTrackPlayer');
    } catch (error) {
      logger.error('Error seeking to position', { 
        error: error instanceof Error ? error.message : String(error),
        position
      }, 'useTrackPlayer');
    }
  };

  const seekForward = async (seconds = 30) => {
    logger.info('Seeking forward', { seconds }, 'useTrackPlayer');
    try {
      const currentPosition = await TrackPlayer.getPosition();
      const newPosition = Math.min(currentPosition + (seconds * 1000), duration);
      await TrackPlayer.seekTo(newPosition);
      logger.info('Seek forward completed', { 
        from: currentPosition, 
        to: newPosition, 
        seconds 
      }, 'useTrackPlayer');
    } catch (error) {
      logger.error('Error seeking forward', { 
        error: error instanceof Error ? error.message : String(error),
        seconds
      }, 'useTrackPlayer');
    }
  };

  const seekBackward = async (seconds = 15) => {
    logger.info('Seeking backward', { seconds }, 'useTrackPlayer');
    try {
      const currentPosition = await TrackPlayer.getPosition();
      const newPosition = Math.max(currentPosition - (seconds * 1000), 0);
      await TrackPlayer.seekTo(newPosition);
      logger.info('Seek backward completed', { 
        from: currentPosition, 
        to: newPosition, 
        seconds 
      }, 'useTrackPlayer');
    } catch (error) {
      logger.error('Error seeking backward', { 
        error: error instanceof Error ? error.message : String(error),
        seconds
      }, 'useTrackPlayer');
    }
  };

  const stopPlayback = async () => {
    logger.info('Stopping playback', {}, 'useTrackPlayer');
    try {
      await TrackPlayer.stop();
      setIsPlaying(false);
      logger.info('Playback stopped', {}, 'useTrackPlayer');
    } catch (error) {
      logger.error('Error stopping playback', { 
        error: error instanceof Error ? error.message : String(error) 
      }, 'useTrackPlayer');
    }
  };

  const cleanup = async () => {
    logger.info('Cleaning up TrackPlayer', {}, 'useTrackPlayer');
    try {
      if (watchdogIntervalRef.current) {
        clearInterval(watchdogIntervalRef.current);
      }
      await TrackPlayer.destroy();
      logger.info('TrackPlayer cleanup completed', {}, 'useTrackPlayer');
    } catch (error) {
      logger.error('Error cleaning up TrackPlayer', { 
        error: error instanceof Error ? error.message : String(error) 
      }, 'useTrackPlayer');
    }
  };

  return {
    // State
    isPlaying,
    isLoading,
    currentTrack,
    playlist,
    currentIndex,
    position,
    duration,
    appStateVisible,
    
    // Actions
    loadTrack,
    loadPlaylist,
    goToNextTrack,
    goToPreviousTrack,
    togglePlayback,
    seekTo,
    seekForward,
    seekBackward,
    stopPlayback,
    cleanup,
    
    // Utilities
    ensureAudioSessionActive,
  };
};

export default useTrackPlayer;
