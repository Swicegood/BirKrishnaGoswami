import React, { useState } from 'react';
import { Entypo } from '@expo/vector-icons';
import { FontAwesome } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { View, Image, Dimensions, Platform } from 'react-native';
import GuageView from '../../components/GuageView';

const isTablet = () => {
  const { width, height } = Dimensions.get('window');
  const aspectRatio = width / height;
  const isLandscape = Math.min(width, height) >= 600 && (aspectRatio > 1.2 || aspectRatio < 0.9);
  console.log('isTablet: ', isLandscape);
  return isLandscape;
};

export default function TabLayout() {
  const [orientation, setOrientation] = useState(Dimensions.get('window').width > Dimensions.get('window').height ? 'LANDSCAPE' : 'PORTRAIT');
  const [width, setWidth] = useState(Dimensions.get('window').width);

const [height, setHeight] = useState(Dimensions.get('window').height);
  const ORIENTATION_THRESHOLD = 0.1; // 10% threshold



  const handleOrientationChange = () => {
    const newWidth = Dimensions.get('window').width;
    const newHeight = Dimensions.get('window').height;
    const aspectRatio = newWidth / newHeight;
    const previousAspectRatio = width / height;

    // Only change orientation if the aspect ratio change is significant
    if (Math.abs(aspectRatio - previousAspectRatio) > ORIENTATION_THRESHOLD) {
      const newOrientation = newWidth > newHeight ? 'LANDSCAPE' : 'PORTRAIT';
      setOrientation(newOrientation);
    }

    setWidth(newWidth);
    setHeight(newHeight);
    console.log('HandleOrientation Called :', orientation);
  }


  const onSetOrientation = (orientation: string) => {
    if (Platform.OS === 'web') {
      handleOrientationChange(orientation);
    } else {
      setOrientation(orientation);
    }
  };

  const onSetWidth = (width) => {
    setWidth(width);
  }

  const getImageWidth = () => {
    if (isTablet() || Platform.OS === 'web') {
      if (orientation === 'LANDSCAPE') {
        return width * 0.6;
      }
      return width;
    }
    if (orientation === 'LANDSCAPE') {
      return width * 0.33;
    }
    return width;
  }

  const getImageHeight = () => {
    if (isTablet() || Platform.OS === 'web') {
      return getImageWidth() * .346;
    }
    if (orientation === 'LANDSCAPE') {
      return getImageWidth() * .346;
    }
    return 160;
  }

  return (
    <View style={{ flex: 1 }}>
      <GuageView onSetOrientation={onSetOrientation} onSetWidth={onSetWidth}>
      {(orientation === 'PORTRAIT' ? (
          <Image source={require('../../assets/images/Memories.png')} style={{ width: getImageWidth(), height: getImageHeight(), resizeMode: 'cover' }} />
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ backgroundColor: '#E53935', width: (width - getImageWidth()) / 2, height: getImageHeight() }} />
            <Image source={require('../../assets/images/Memories.png')} style={{ width: getImageWidth(), height: getImageHeight(), resizeMode: 'cover' }} />
            <View style={{ backgroundColor: '#E53935', width: (width - getImageWidth()) / 2, height: getImageHeight() }} />
          </View>
        ))}
      </GuageView>
    <View style={{ flex: 1 }}>
    <Tabs screenOptions={{ tabBarActiveTintColor: 'red' }}>
      <Tabs.Screen 
        name="VPOfferingsScreen" 
        options={{
          title: 'Offerings',
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="book" color={color} />,
          headerShown: false,
        }} 
      />
      <Tabs.Screen 
        name="SPPlaylistScreen" 
        options={{
          title: 'Playlist',
          tabBarIcon: ({color}) => <Entypo size={28} name="youtube" color={color} />,
          headerShown: false,
        }} 
      />
    </Tabs>
    </View>
    </View>
  );
}