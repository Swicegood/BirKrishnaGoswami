import { registerRootComponent } from 'expo';
import TrackPlayer from 'react-native-track-player';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

// Register TrackPlayer service AFTER registerRootComponent (like BKGAudio)
// Try to use logger, but don't let it block execution if it fails
let logger = null;
try {
  logger = require('./utils/logger').default;
  logger.info('INDEX.JS: About to register TrackPlayer service', {}, 'Index');
} catch (loggerError) {
  // Logger failed, but continue with service registration
}

try {
  TrackPlayer.registerPlaybackService(() => {
    if (logger) {
      logger.info('INDEX.JS: TrackPlayer service function called', {}, 'Index');
    }
    return require('./service');
  });
  if (logger) {
    logger.info('INDEX.JS: TrackPlayer service registered successfully', {}, 'Index');
  }
} catch (error) {
  if (logger) {
    logger.error('INDEX.JS: Failed to register TrackPlayer service', { 
      error: error instanceof Error ? error.message : String(error) 
    }, 'Index');
  }
}
