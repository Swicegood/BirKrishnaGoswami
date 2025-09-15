import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import TrackPlayer, { State } from 'react-native-track-player';
import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from './utils/logger';

const BACKGROUND_FETCH_TASK = 'background-fetch';

TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    logger.info('Background fetch started', {}, 'BackgroundFetch');
    // Simple approach like BKGAudio - just try to keep playback alive
    await TrackPlayer.play();
    logger.info('Background fetch completed', {}, 'BackgroundFetch');
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    logger.error('Background fetch failed', { 
      error: error instanceof Error ? error.message : String(error) 
    }, 'BackgroundFetch');
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export const registerBackgroundFetch = async () => {
  try {
    await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
      minimumInterval: 60, // 1 minute
      stopOnTerminate: false,
      startOnBoot: true,
    });
    logger.info('Background fetch registered', {}, 'BackgroundFetch');
  } catch (err) {
    logger.error('Background fetch registration failed', { 
      error: err instanceof Error ? err.message : String(err) 
    }, 'BackgroundFetch');
  }
};

export const unregisterBackgroundFetch = async () => {
  try {
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
    logger.info('Background fetch unregistered', {}, 'BackgroundFetch');
  } catch (err) {
    logger.error('Background fetch unregistration failed', { 
      error: err instanceof Error ? err.message : String(err) 
    }, 'BackgroundFetch');
  }
};
