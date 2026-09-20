import TrackPlayer, { Event, PlaybackState } from '@rntp/player';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import { Platform } from 'react-native';
import logger from './utils/logger';

let isManualNavigation = false;

global.setManualNavigation = (value) => {
  isManualNavigation = value;
  logger.info('Manual navigation flag set', { value }, 'TrackPlayerService');
};

const persistActiveTrack = async (reason) => {
  try {
    const item = TrackPlayer.getActiveMediaItem();
    const progress = TrackPlayer.getProgress();
    const index = TrackPlayer.getActiveMediaItemIndex();
    if (!item?.url) {
      return;
    }

    await AsyncStorage.setItem('lastSongUrl', item.url);
    await AsyncStorage.setItem('lastSongPosition', String(progress.position ?? 0));
    if (typeof index === 'number') {
      await AsyncStorage.setItem('currentIndex', index.toString());
    }

    logger.info('Saved last song state', {
      url: item.url,
      position: progress.position,
      title: item.title,
      reason,
    }, 'TrackPlayerService');
  } catch (error) {
    logger.error('Failed to persist active track', {
      error: error instanceof Error ? error.message : String(error),
      reason,
    }, 'TrackPlayerService');
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
      error: error instanceof Error ? error.message : String(error),
    }, 'TrackPlayerService');
    return false;
  }
};

logger.info('TrackPlayer playback session started', { platform: Platform.OS }, 'TrackPlayerService');

TrackPlayer.addEventListener(Event.MediaItemTransition, async ({ item, index }) => {
  logger.info('Media item transition', {
    title: item?.title,
    artist: item?.artist,
    albumTitle: item?.albumTitle,
    index,
  }, 'TrackPlayerService');

  if (typeof index === 'number') {
    try {
      await AsyncStorage.setItem('currentIndex', index.toString());
    } catch (error) {
      logger.error('Failed to persist current index', {
        error: error instanceof Error ? error.message : String(error),
        index,
      }, 'TrackPlayerService');
    }
  }
});

TrackPlayer.addEventListener(Event.PlaybackStateChanged, async ({ state }) => {
  logger.info('PlaybackStateChanged', { state }, 'TrackPlayerService');

  if (state === PlaybackState.Idle || state === PlaybackState.Ended) {
    if (state === PlaybackState.Ended && isManualNavigation) {
      logger.info('Manual navigation in progress, ignoring ended state persistence delay', {}, 'TrackPlayerService');
    }
    await persistActiveTrack(`state-${state}`);
  }
});

TrackPlayer.addEventListener(Event.IsPlayingChanged, async ({ playing }) => {
  logger.info('IsPlayingChanged', { playing }, 'TrackPlayerService');
  if (!playing) {
    await persistActiveTrack('not-playing');
  }
});

TrackPlayer.addEventListener(Event.PlaybackError, async ({ code, message }) => {
  logger.error('Playback error occurred', { code, message }, 'TrackPlayerService');
  try {
    if (code === 'network') {
      TrackPlayer.retry();
      TrackPlayer.play();
      return;
    }

    await requestAudioFocus();
    TrackPlayer.skipToNext();
    TrackPlayer.play();
  } catch (error) {
    logger.error('Failed to recover from playback error', {
      error: error instanceof Error ? error.message : String(error),
      code,
    }, 'TrackPlayerService');
  }
});
