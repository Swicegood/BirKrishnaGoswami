import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, useColorScheme, SafeAreaView } from 'react-native';
import StableHeader from '../components/StableHeader';




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
        screenOptions={{
          header: () => <StableHeader />,
        }}
      >
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