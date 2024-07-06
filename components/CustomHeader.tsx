import { Text, View } from './Themed';
import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, Image, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import MeasureView from '../app/api/MeasureView';


type DrawerParamList = {
  Home: undefined;
  // Add other routes here
};

const isTablet = () => {
  const { width, height } = Dimensions.get('window');
  const aspectRatio = width / height;
  const isLandscape = Math.min(width, height) >= 600 && (aspectRatio > 1.2 || aspectRatio < 0.9);
  console.log('isTablet: ', isLandscape);
  return isLandscape
}

function CustomHeader() {
  const navigation = useNavigation();
  const [ orientation, setOrientation ] = useState(Dimensions.get('window').width > Dimensions.get('window').height ? 'LANDSCAPE' : 'PORTRAIT');
  const [ width, setWidth ] = useState(Dimensions.get('window').width);

  const onSetWidth = (width: number) => {
    setWidth(width);
  };

  const onSetOrientation = (orientation: string) => {
    if ( ( Platform.OS === 'android' && ! isTablet() ) ||  Platform.OS === 'web') {
      if (orientation === 'LANDSCAPE') {
        setOrientation('PORTRAIT');
      } else {
        setOrientation('LANDSCAPE');
      }
      return;
    }
    setOrientation(orientation);
  }

  return (
    <>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea} edges={['right', 'top', 'left']}>
      <MeasureView onSetOrientation={onSetOrientation} onSetWidth={onSetWidth}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.menuButton} onPress={() => navigation.openDrawer()}>
            <Text style={styles.menuText}>☰</Text>
          </TouchableOpacity>
          <Image source={require('../assets/images/Crown.png')} style={{ width: 100, height: 85 ,position: 'absolute', top: 0 , left: (width / 2) - 50, zIndex: 1, resizeMode: 'contain' }} />
          <Text style={styles.headerText}></Text>
        </View>
        </MeasureView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#993D39', // Use the same color as your header
  },

  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    backgroundColor: '#ED4D4E', // Set the background color for your header
  },
  menuButton: {
    // Style your menu button
  },
  menuText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white', // Choose your color
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white', // Choose your color
  },
});

export default CustomHeader;
