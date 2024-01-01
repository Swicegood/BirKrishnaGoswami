import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, useColorScheme } from 'react-native';
import Colors from '../constants/Colors';
import { Drawer } from 'expo-router/drawer';
import { Link, Tabs } from 'expo-router';
function RootLayout() {
  return (
    <Drawer>
      <Drawer.Screen
        name="about" // This is the name of the page and must match the url from root
        options={{
          drawerLabel: 'About',
          title: 'overview',
        }}
      />
      <Drawer.Screen
        name="travel" // This is the name of the page and must match the url from root
        options={{
          drawerLabel: 'Travel Schedule',
          title: 'Travel Schedule',
        }}
      />
      <Drawer.Screen
        name="blog" // This is the name of the page and must match the url from root
        options={{
          drawerLabel: 'Blog',
          title: 'Gurudeva\'s Blog',
        }}
      />
      <Drawer.Screen
        name="downloads" // This is the name of the page and must match the url from root
        options={{
          drawerLabel: 'Downloads',
          title: 'Downloads',
        }}
      />
    </Drawer>
  );
}
/**
 * You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
 */
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}


export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: 'index',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function Layout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,    
  })
  return (
    <Drawer>
      <Drawer.Screen
        name="about" // This is the name of the page and must match the url from root
        options={{
          drawerLabel: 'About',
          title: 'overview',
        }}
      />
      <Drawer.Screen
        name="travel" // This is the name of the page and must match the url from root
        options={{
          drawerLabel: 'Travel Schedule',
          title: 'Travel Schedule',
        }}
      />
      <Drawer.Screen
        name="blog" // This is the name of the page and must match the url from root
        options={{
          drawerLabel: 'Blog',
          title: 'Gurudeva\'s Blog',
        }}
      />
      <Drawer.Screen
        name="downloads" // This is the name of the page and must match the url from root
        options={{
          drawerLabel: 'Downloads',
          title: 'Downloads',
        }}
      />
    </Drawer>
  );
  ;

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
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ title: 'About' }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
