
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useColorScheme, useWindowDimensions, Platform } from 'react-native';
import CustomHeader from '../../components/CustomHeader';
import CustomBackHeader from '../../components/CustomBackHeader';
import { Drawer } from 'expo-router/drawer';
import React, { useState, useEffect } from 'react';
import { View, Text, Dimensions, StyleSheet, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { Entypo, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import logger from '../../utils/logger';


const windowHeight = Dimensions.get('window').height;

function CustomDrawerContent() {
  const windowDimensions = useWindowDimensions();
  const isLandscape = windowDimensions.width > windowDimensions.height;
  const isApple = Platform.OS === 'ios';

  const [orientation, setOrientation] = useState(isLandscape ? 'LANDSCAPE' : 'PORTRAIT');

  useEffect(() => {
    setOrientation(isLandscape ? 'LANDSCAPE' : 'PORTRAIT');
  }, [isLandscape]);

  // Debug logging for drawer
  useEffect(() => {
    logger.info('Drawer rendered', { 
      isDebugEnabled: logger.isDebugEnabled(), 
      orientation: isLandscape ? 'LANDSCAPE' : 'PORTRAIT',
      platform: Platform.OS 
    }, 'Drawer');
  }, [isLandscape]);

  // Force re-render when debug mode changes
  const [debugMode, setDebugMode] = useState(() => {
    try {
      return logger.isDebugEnabled();
    } catch (error) {
      console.error('Error getting initial debug mode:', error);
      return false;
    }
  });
  
  useEffect(() => {
    // Check debug mode periodically in case it's not available initially
    const checkDebugMode = () => {
      try {
        const currentDebugMode = logger.isDebugEnabled();
        console.log('Checking debug mode:', { currentDebugMode, debugMode });
        if (currentDebugMode !== debugMode) {
          setDebugMode(currentDebugMode);
        }
      } catch (error) {
        console.error('Error checking debug mode:', error);
      }
    };
    
    // Check immediately
    checkDebugMode();
    
    // Check again after a short delay to catch late-loading environment variables
    const timeout = setTimeout(checkDebugMode, 1000);
    
    return () => clearTimeout(timeout);
  }, [debugMode]);


  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.drawerContent}>
        <View style={styles.header}>
          <View />
          <Image
            style={styles.logo}
            source={require('../../assets/images/drawer.png')}
          />
          <Text style={styles.headerText}>H. H. Bir Krishna Goswami Maharaja</Text>
        </View>
        {orientation === 'PORTRAIT' ? (
          <View style={styles.content}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Image source={require('../../assets/images/about.png')} style={styles.smalllogo} />
              <Link href="./BioScreen" asChild>
                <Text style={styles.aboutText}>    About</Text>
              </Link>
            </View>
            <Link href="./TravelScreen" asChild>
              <Text style={styles.drawerText}>
                <MaterialCommunityIcons name='calendar-clock-outline' size={18} color='black' />    Travel Schedule
              </Text>
            </Link>
            <Link href="./NewsScreen" asChild>
              <Text style={styles.drawerText}>
                <Ionicons name='newspaper-outline' size={18} color='black' />    News
            </Text>
            </Link>
            {isApple ?
                  <Link href="https://apps.apple.com/us/app/apple-store/6449051568" asChild>
                    <Text style={styles.drawerText}>
                      <Entypo name="download" size={18} color="#ED4D4E" />    Downloads
                    </Text>
                  </Link>
                  : null
                }
            {/* Hidden debug link at bottom of white section */}
            <View style={{ position: 'absolute', bottom: 10, left: 40 }}>
              <Link href="../DebugLogsScreen" asChild>
                <Text style={{ color: '#FFFFFF', backgroundColor: '#FFFFFF', fontSize: 12, padding: 4 }}>
                  Debug Logs
                </Text>
              </Link>
            </View>
          </View>
        ) : (
          <View style={styles.content}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Image source={require('../../assets/images/about.png')} style={styles.smalllogo} />
              <Link href="./BioScreen" asChild>
                <Text style={styles.aboutText}>    About        </Text>
              </Link>
              <Link href="./TravelScreen" asChild>
                <Text style={styles.aboutText}>
                  <MaterialCommunityIcons name='calendar-clock-outline' size={18} color='black' />    Travel Schedule
                </Text>
              </Link>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Link href="./NewsScreen" asChild>
                <Text style={styles.drawerText}>
                  <Ionicons name='newspaper-outline' size={18} color='black' />    News
                </Text>
              </Link>
                {isApple ?
                   <Link href="https://apps.apple.com/us/app/apple-store/6449051568" asChild>
                   <Text style={{ ...styles.drawerText, paddingLeft: 40 }}>
                     <Entypo name="download" size={18} color="#ED4D4E" />    Downloads
                   </Text>
               </Link>
                  : null
                }
            </View>
            {/* Hidden debug link at bottom of white section */}
            <View style={{ position: 'absolute', bottom: 10, left: 40 }}>
              <Link href="../DebugLogsScreen" asChild>
                <Text style={{ color: '#FFFFFF', backgroundColor: '#FFFFFF', fontSize: 12, padding: 4 }}>
                  Debug Logs
                </Text>
              </Link>
            </View>
          </View>
        )}
        <View style={styles.footer}>
        </View>
      </View>
    </SafeAreaView>
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

export default function DrawerLayout() {
  const colorScheme = useColorScheme();
  const { width: winWidth } = useWindowDimensions();
  // On web, prefer a numeric drawer width to avoid percent-based off-screen issues in landscape
  const webDrawerWidth = Platform.OS === 'web'
    ? Math.min(420, Math.max(300, Math.floor(winWidth * 0.3)))
    : undefined;

  return (
    <Drawer
      drawerContent={() => {
        return <CustomDrawerContent />
      }}
      screenOptions={{
        drawerType: "front",
        drawerStyle: {
          width: webDrawerWidth ?? "70%",
          maxWidth: Platform.OS === 'web' ? undefined : 400,
        },
        // Prevent swipe gestures on web which can cause unexpected offsets
        swipeEdgeWidth: Platform.OS === 'web' ? 0 : undefined,
        swipeEnabled: Platform.OS === 'web' ? false : undefined,
      }}
    >
      <Drawer.Screen
        name="BioScreen" // This is the name of the page and must match the url from root
        options={{
          drawerLabel: 'About',
          title: 'overview',
          header: () => <CustomBackHeader title='BIOGRAPHY' />,
        }}
      />
      <Drawer.Screen
        name="TravelScreen" // This is the name of the page and must match the url from root
        options={{
          drawerLabel: 'Travel Schedule',
          title: 'Travel Schedule',
          header: () => <CustomBackHeader title='TRAVEL' />,
        }}
      />
      <Drawer.Screen
        name="NewsScreen" // This is the name of the page and must match the url from root
        options={{
          drawerLabel: 'News',
          title: 'News About Gurudeva',
          header: () => <CustomBackHeader title='NEWS' />,
        }}
      />
      <Drawer.Screen
        name="index"
        options={{
          drawerLabel: 'Home',
          drawerItemStyle: { height: 0 },
          header: () => <CustomHeader />,
        }}
      />
    </Drawer>

  );

}
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#993D39',
  },
  header: {
    backgroundColor: '#ED4D4E',
    alignItems: 'center',
    justifyContent: 'center',
    height: .2 * windowHeight,
  },
  headerText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'PacificoRegular',
  },
  content: {
    backgroundColor: 'white',
    paddingLeft: 40,
    height: .67 * windowHeight,
  },
  footer: {
    backgroundColor: '#ED4D4E',
    alignItems: 'center',
    justifyContent: 'center',
    height: .15 * windowHeight,
  },
  drawerContent: {
    flex: 1,
    backgroundColor: 'white', // Customize your color
  },
  drawerText: {
    fontFamily: 'OblikBold', // Use the OblikBold font
    fontSize: 16,
    color: '#3f3f3f', // Choose your color
    marginTop: 20,
    marginBottom: 30,
  },
  aboutText: {
    fontFamily: 'OblikBold', // Use the OblikBold font
    fontSize: 16,
    color: '#3f3f3f', // Choose your color
    marginBottom: 30,
    marginTop: 32,
  },
  logo: {
    width: 110,
    height: 110,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  smalllogo: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
  },
});