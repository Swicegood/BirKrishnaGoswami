// Service file loaded - this will be logged when the module is required

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
  console.log('SERVICE.JS: TrackPlayer service function called!');
  logger.info('TrackPlayer service module loaded and function called', {}, 'TrackPlayerService');
  logger.info('TrackPlayer service started', {}, 'TrackPlayerService');
  
  // Request background execution time to prevent suspension
  requestBackgroundExecution();

  TrackPlayer.addEventListener(Event.RemotePlay, async () => {
    logger.info('RemotePlay event received', {}, 'TrackPlayerService');
    try {
      // Log current player state before handling
      const state = await TrackPlayer.getState();
      const currentTrack = await TrackPlayer.getCurrentTrack();
      const queue = await TrackPlayer.getQueue();
      logger.info('RemotePlay - Current player state', { 
        state,
        hasTrack: currentTrack !== null,
        trackIndex: currentTrack,
        queueLength: queue.length,
        platform: Platform.OS
      }, 'TrackPlayerService');
      
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
      // Log current player state before handling
      const state = await TrackPlayer.getState();
      const currentTrack = await TrackPlayer.getCurrentTrack();
      const queue = await TrackPlayer.getQueue();
      logger.info('RemotePause - Current player state', { 
        state,
        hasTrack: currentTrack !== null,
        trackIndex: currentTrack,
        queueLength: queue.length,
        platform: Platform.OS
      }, 'TrackPlayerService');
      
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
    isManualNavigation = true;
    try {
      const focusGranted = await requestAudioFocus();
      if (!focusGranted) {
        logger.error('Failed to get audio focus for RemoteNext', {}, 'TrackPlayerService');
        return;
      }
      
      await TrackPlayer.skipToNext();
      await playWithRetry();
      
      const nextIndex = await TrackPlayer.getCurrentTrack();
      if (typeof nextIndex === 'number') {
        await AsyncStorage.setItem('currentIndex', nextIndex.toString());
        logger.info('RemoteNext advanced queue', { nextIndex }, 'TrackPlayerService');
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
    isManualNavigation = true;
    try {
      const focusGranted = await requestAudioFocus();
      if (!focusGranted) {
        logger.error('Failed to get audio focus for RemotePrevious', {}, 'TrackPlayerService');
        return;
      }
      
      await TrackPlayer.skipToPrevious();
      await playWithRetry();
      
      const prevIndex = await TrackPlayer.getCurrentTrack();
      if (typeof prevIndex === 'number') {
        await AsyncStorage.setItem('currentIndex', prevIndex.toString());
        logger.info('RemotePrevious moved queue backwards', { prevIndex }, 'TrackPlayerService');
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
      const numericPosition = Number(event.position) || 0;
      await TrackPlayer.seekTo(numericPosition);
      logger.info('Remote seek completed', { position: numericPosition }, 'TrackPlayerService');
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
      logger.info('Manual navigation in progress, ignoring queue end', {}, 'TrackPlayerService');
    }
  });
};
