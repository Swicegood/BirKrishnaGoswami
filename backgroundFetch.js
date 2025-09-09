import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import TrackPlayer, { State } from 'react-native-track-player';
import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from './utils/logger';

const BACKGROUND_FETCH_TASK = 'background-fetch';

TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    logger.info('Background fetch started', {}, 'BackgroundFetch');
    
    // Get current playlist and index from AsyncStorage
    const playlistData = await AsyncStorage.getItem('currentPlaylist');
    const currentIndexStr = await AsyncStorage.getItem('currentIndex');
    
    if (!playlistData || !currentIndexStr) {
      logger.info('No playlist data found in background', {}, 'BackgroundFetch');
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }
    
    const playlist = JSON.parse(playlistData);
    const currentIndex = parseInt(currentIndexStr, 10);
    
    // Check if there's a next track available
    if (currentIndex < playlist.length - 1) {
      const playerState = await TrackPlayer.getState();
      
      // If no track is playing, try to start the next one
      if (playerState === State.Stopped || playerState === State.Paused) {
        const nextIndex = currentIndex + 1;
        const nextTrack = playlist[nextIndex];
        
        logger.info('Starting next track in background', {
          currentIndex,
          nextIndex,
          nextTrack: nextTrack.title
        }, 'BackgroundFetch');
        
        // Load and play the next track
        await TrackPlayer.reset();
        await TrackPlayer.add({
          id: '1',
          url: nextTrack.url,
          title: nextTrack.title,
          artist: 'BKG Audio',
          album: 'Spiritual Discourses',
          genre: 'Spiritual',
          duration: 0, // Will be updated when track loads
        });
        
        await TrackPlayer.play();
        
        // Update the current index in storage
        await AsyncStorage.setItem('currentIndex', nextIndex.toString());
        
        logger.info('Successfully started next track in background', {
          newIndex: nextIndex,
          track: nextTrack.title
        }, 'BackgroundFetch');
        
        return BackgroundFetch.BackgroundFetchResult.NewData;
      } else {
        logger.info('Track is already playing in background', {
          state: playerState
        }, 'BackgroundFetch');
        return BackgroundFetch.BackgroundFetchResult.NoData;
      }
    } else {
      logger.info('No more tracks to play in background', {
        currentIndex,
        playlistLength: playlist.length
      }, 'BackgroundFetch');
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }
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
