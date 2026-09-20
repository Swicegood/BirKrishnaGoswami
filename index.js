import { Platform } from 'react-native';
import TrackPlayer from '@rntp/player';

if (Platform.OS !== 'web') {
  TrackPlayer.registerPlaybackSession(() => {
    require('./service');
  });
}

require('expo-router/entry');
