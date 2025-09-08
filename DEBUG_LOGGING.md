
# Debug Logging System

This app includes a comprehensive debug logging system that's only available in debug-preview mode.

## Features

- **Conditional Logging**: Logs are only captured when in debug-preview mode
- **Debug Screen**: A dedicated screen to view, filter, and export logs
- **Multiple Log Levels**: Info, Warning, Error, and Debug levels
- **Source Tracking**: Each log entry can include a source identifier
- **Data Attachments**: Logs can include additional data objects
- **Filtering & Search**: Filter by log level and search through log messages
- **Export Functionality**: Export logs for debugging purposes

## Usage

### Building with Debug Logging

To build the app with debug logging enabled, use the `debug-preview` EAS profile:

```bash
# For iOS
eas build --platform ios --profile debug-preview

# For Android  
eas build --platform android --profile debug-preview

# For both platforms
eas build --platform all --profile debug-preview
```

### Building without Debug Logging

For production builds, use the standard profiles:

```bash
# For iOS
eas build --platform ios --profile preview

# For Android
eas build --platform android --profile preview

# For production
eas build --platform all --profile production
```

### Accessing Debug Logs

When running a debug-preview build:

1. Open the app
2. Open the drawer menu (hamburger icon)
3. Look for "Debug Logs" option (only visible in debug-preview mode)
4. Tap to open the debug logs screen

### Using the Logger in Code

```typescript
import logger from '../utils/logger';

// Basic logging
logger.info('User logged in successfully');
logger.warn('API response was slow', { responseTime: 2500 });
logger.error('Failed to load data', { error: error.message });
logger.debug('Component rendered', { props });

// With source tracking
logger.info('Navigation changed', { pathname }, 'Navigation');
logger.error('API call failed', { url, status }, 'API');
```

## Log Levels

- **Info**: General information about app flow
- **Warning**: Potential issues that don't break functionality
- **Error**: Errors that affect functionality
- **Debug**: Detailed debugging information

## Debug Screen Features

- **Real-time Updates**: Logs update as they're generated
- **Filtering**: Filter by log level (All, Info, Warn, Error, Debug)
- **Search**: Search through log messages and data
- **Details View**: Tap any log to see full details
- **Export**: Export logs for external analysis
- **Clear**: Clear all logs (with confirmation)

## Configuration

The debug logging system is configured in:

- `app.json`: Contains the release channel configuration
- `eas.json`: Defines the debug-preview build profile
- `utils/logger.ts`: Core logging functionality
- `app/DebugLogsScreen.tsx`: Debug logs viewer screen

## Security

- Debug logging is completely disabled in production builds
- The debug logs screen is hidden in non-debug builds
- No sensitive data should be logged (passwords, tokens, etc.)
- Logs are stored in memory only and cleared when the app restarts
