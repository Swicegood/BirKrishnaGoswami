import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Platform } from 'react-native';
import CustomHeaderMain from '../components/CustomHeaderMain';
import TrackPlayer, { Capability } from 'react-native-track-player';
import logger from '../utils/logger';
import { registerBackgroundFetch, unregisterBackgroundFetch } from '../backgroundFetch';




export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(drawer)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    OblikBold: require('../assets/fonts/Oblik-Bold.otf'),
    UbuntuRegular: require('../assets/fonts/Ubuntu-Regular.ttf'),
    PacificoRegular: require('../assets/fonts/Pacifico-Regular.ttf'),
    ...FontAwesome.font,
  })
  
  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      logger.info('Fonts loaded successfully', { fontCount: Object.keys(FontAwesome.font).length + 4 }, 'AppLayout');
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Initialize TrackPlayer and Background Fetch
  useEffect(() => {
    if (!loaded) return; // Wait for fonts to load first
    
    const setupTrackPlayer = async () => {
      try {
        // Only setup TrackPlayer on native platforms
        if (Platform.OS === 'web') {
          logger.info('TrackPlayer not needed on web platform', { platform: Platform.OS }, 'TrackPlayer');
          return;
        }
        
        // Check if TrackPlayer is available
        if (!TrackPlayer) {
          logger.warn('TrackPlayer is not available - skipping setup', null, 'TrackPlayer');
          return;
        }
        
        // Setup the player with background capabilities
        await TrackPlayer.setupPlayer({
          waitForBuffer: true,
          autoHandleInterruptions: true,
        });
        
        // Configure capabilities for background playback including seek/jump
        await TrackPlayer.updateOptions({
          capabilities: [
            Capability.Play,
            Capability.Pause,
            Capability.SkipToNext,
            Capability.SkipToPrevious,
            Capability.SeekTo,
          ],
          compactCapabilities: [
            Capability.Play,
            Capability.Pause,
            Capability.SkipToNext,
            Capability.SkipToPrevious,
          ],
          progressUpdateEventInterval: 1,
        });
        
        logger.info('TrackPlayer setup complete with background capabilities', { platform: Platform.OS }, 'TrackPlayer');
        
        // Register background fetch for auto-advancing tracks
        await registerBackgroundFetch();
      } catch (error) {
        logger.error('Error setting up TrackPlayer', { error: error instanceof Error ? error.message : String(error), platform: Platform.OS }, 'TrackPlayer');
        // Don't throw the error, just log it to prevent app crash
      }
    };

    setupTrackPlayer();

    return () => {
      try {
        if (TrackPlayer && Platform.OS !== 'web') {
          // TrackPlayer doesn't have a destroy method, so we'll just log the cleanup
          logger.info('TrackPlayer cleanup', { platform: Platform.OS }, 'TrackPlayer');
        }
        // Unregister background fetch on cleanup
        unregisterBackgroundFetch();
      } catch (error) {
        logger.error('Error during TrackPlayer cleanup', { error: error instanceof Error ? error.message : String(error), platform: Platform.OS }, 'TrackPlayer');
      }
    };
  }, [loaded]); // Add loaded as dependency

  if (!loaded) {
    logger.debug('App not loaded yet, waiting for fonts', null, 'AppLayout');
    return null;
  }

  return <RootLayoutNav />;
}


function RootLayoutNav() {
  const pathname = usePathname();
  
  // Log navigation changes
  useEffect(() => {
    logger.info('Navigation changed', { pathname }, 'Navigation');
  }, [pathname]);

  // Test debug logging
  useEffect(() => {
    logger.info('App started', { 
      isDebugEnabled: logger.isDebugEnabled(),
      platform: Platform.OS,
      timestamp: new Date().toISOString()
    }, 'AppStart');
  }, []);


  return (
    <>
      <Stack
        screenOptions={{
          header: () =>  null
        }}
      >
        <Stack.Screen name="YoutubePlayer" options={{ animation: 'none', header: () => <CustomHeaderMain title='VIDEOS' /> }} />
        <Stack.Screen name="AudioStartScreen" options={{ header: () => <CustomHeaderMain title='AUDIO' /> }} />
        <Stack.Screen name="AudioScreen" options={{ header: () => null }} />
        <Stack.Screen name="ChantingScreen" options={{ header: () => <CustomHeaderMain title='CHANTING' /> }} />
        <Stack.Screen name="CustomImageGalleryScreen" options={{ header: () => <CustomHeaderMain title='PHOTOS' /> }} />
        <Stack.Screen name="DayScreen" options={{ header: () => <CustomHeaderMain title='AUDIO' /> }} />
        <Stack.Screen name="DeitiesScreen" options={{ header: () => <CustomHeaderMain title='DEITIES' /> }} />
        <Stack.Screen name="DeityGallery" options={{ header: () => <CustomHeaderMain title='DEITIES' /> }} />
        <Stack.Screen name="BooksScreen" options={{ header: () => <CustomHeaderMain title='BOOKS' /> }} />
        <Stack.Screen name="BlogScreen" options={{ header: () => <CustomHeaderMain title='BLOG' /> }} />
        <Stack.Screen name="DonationScreen" options={{ header: () => <CustomHeaderMain title='DONATE' /> }} />
        <Stack.Screen name="EbooksScreen" options={{ header: () => <CustomHeaderMain title='EBOOKS' /> }} />
        <Stack.Screen name="FilesScreen" options={{ header: () => null }} />
        <Stack.Screen name="FolderScreen" options={{ header: () => <CustomHeaderMain title='AUDIO' /> }} />
        <Stack.Screen name="GalleryScreen" options={{ header: () => <CustomHeaderMain title='GALLERY' /> }} />
        <Stack.Screen name="GurudevaPicsScreen" options={{ header: () => <CustomHeaderMain title='PHOTOS' /> }} />
        <Stack.Screen name="MemoriesScreen" options={{ header: () => <CustomHeaderMain title='MEMORIES' /> }} />
        <Stack.Screen name="MonthScreen" options={{ header: () => <CustomHeaderMain title='AUDIO' /> }} />
        <Stack.Screen name="NewsItemScreen" options={{ header: () => <CustomHeaderMain title='NEWS' /> }} />
        <Stack.Screen name="PdfViewScreen" options={{ header: () => <CustomHeaderMain title='PDF' /> }} />
        <Stack.Screen name="PhotosScreen" options={{ header: () => <CustomHeaderMain title='PHOTOS' /> }} />
        <Stack.Screen name="PicturesScreen" options={{ header: () => <CustomHeaderMain title='PICTURES' /> }} />
        <Stack.Screen name="PlaylistScreen" options={{ header: () => <CustomHeaderMain title='PLAYLIST' /> }} />
        <Stack.Screen name="PurchaseScreen" options={{ header: () => <CustomHeaderMain title='BOOKS' /> }} />
        <Stack.Screen name="QuoteScreen" options={{ header: () => <CustomHeaderMain title='QUOTE' /> }} />
        <Stack.Screen name="ReadVPScreen" options={{ header: () => <CustomHeaderMain title='VYASA PUJA' /> }} />
        <Stack.Screen name="SearchYouTubeScreen" options={{ header: () => <CustomHeaderMain title='VIDEOS' /> }} />
        <Stack.Screen name="TemplesScreen" options={{ header: () => <CustomHeaderMain title='TEMPLES' /> }} />
        <Stack.Screen name="YearScreen" options={{ header: () => <CustomHeaderMain title='AUDIO' /> }} />
        <Stack.Screen name="DebugLogsScreen" options={{ header: () => <CustomHeaderMain title='DEBUG LOGS' /> }} />
        <Stack.Screen name="VPBooksScreen" options={{ header: () => <CustomHeaderMain title='VP BOOKS' /> }} />
        <Stack.Screen name="(tabs2)" options={{ header: () => <CustomHeaderMain title='MEMORIES' /> }} />
        <Stack.Screen name="(tabs3)" options={{ header: () => <CustomHeaderMain title='VYASA PUJA' /> }} />
        <Stack.Screen name="[...missing]" options={{ header: () => <CustomHeaderMain title='Oops!' /> }} />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#993D39', // Use the same color as your header
  },
});