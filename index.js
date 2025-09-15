import { registerRootComponent } from 'expo';
import TrackPlayer from 'react-native-track-player';
import logger from './utils/logger';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

// Register TrackPlayer service AFTER registerRootComponent (like BKGAudio)

logger.info('About to register TrackPlayer service...', {}, 'Index');
try {
  TrackPlayer.registerPlaybackService(() => {
    logger.info('TrackPlayer service function called', {}, 'Index');
    return require('./service.js');
  });
  logger.info('TrackPlayer service registered successfully', {}, 'Index');
} catch (error) {
  logger.error('Failed to register TrackPlayer service', { 
    error: error instanceof Error ? error.message : String(error) 
  }, 'Index');
}
