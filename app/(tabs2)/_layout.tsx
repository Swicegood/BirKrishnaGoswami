import React, { useState } from 'react';
import { Entypo } from '@expo/vector-icons';
import { FontAwesome } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { View, Image, Dimensions, Platform } from 'react-native';
import MeasureView from '../api/MeasureView';

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

  const onSetOrientation = (orientation) => {
    setOrientation(orientation);
  };

  const onSetWidth = (width) => {
    setWidth(width);
  }
  return (
    <View style={{ flex: 1 }}>
      <MeasureView onSetOrientation={onSetOrientation} onSetWidth={onSetWidth}>
        {(orientation === 'PORTRAIT' ? (
          <Image source={require('../../assets/images/Memories.png')} style={{ width: width, height: isTablet() ? 200 : 160, resizeMode: 'cover' }} />
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
          <Image source={require('../../assets/images/Memories.png')} style={{ width: width * 0.8, height: Platform.OS == 'web' ? 240 :220, resizeMode: 'contain' }} />
          </View>
        ))}
      </MeasureView>
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