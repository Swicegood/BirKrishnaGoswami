import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import CustomHeaderMain from '../components/CustomHeaderMain';




export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(drawer)/index',
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
      console.log('loaded');
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    console.log('not loaded');
    return null;
  }

  return <RootLayoutNav />;
}


function RootLayoutNav() {
  const pathname = usePathname();


  return (
    <>
      <Stack
        initialRouteName="(drawer)/index"
        screenOptions={{
          header: () =>  null
        }}
      >
        <Stack.Screen name="YoutubePlayer" options={{ animation: 'none', header: () => <CustomHeaderMain title='VIDEOS' /> }} />
        <Stack.Screen name="AudioStartScreen" options={{ header: () => <CustomHeaderMain title='AUDIO' /> }} />
        <Stack.Screen name="ChantingScreen" options={{ header: () => <CustomHeaderMain title='CHANTING' /> }} />
        <Stack.Screen name="CustomImageGalleryScreen" options={{ header: () => <CustomHeaderMain title='PHOTOS' /> }} />
        <Stack.Screen name="DayScreen" options={{ header: () => <CustomHeaderMain title='AUDIO' /> }} />
        <Stack.Screen name="DeitiesScreen" options={{ header: () => <CustomHeaderMain title='DEITIES' /> }} />
        <Stack.Screen name="DeityGallery" options={{ header: () => <CustomHeaderMain title='DEITIES' /> }} />
        <Stack.Screen name="BooksScreen" options={{ header: () => <CustomHeaderMain title='BOOKS' /> }} />
        <Stack.Screen name="BlogScreen" options={{ header: () => <CustomHeaderMain title='BLOG' /> }} />
        <Stack.Screen name="DonationScreen" options={{ header: () => <CustomHeaderMain title='DONATE' /> }} />
        <Stack.Screen name="EbooksScreen" options={{ header: () => <CustomHeaderMain title='EBOOKS' /> }} />
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
    fontColor: 'white',
  },
});