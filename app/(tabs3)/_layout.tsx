import React, { useState } from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { Entypo } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { View, Image, Dimensions } from 'react-native';
import MeasureView from '../api/MeasureView';


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
          <Image source={require('../../assets/images/Vyasa_Puja.png')} style={{ width: width, height: 160, resizeMode: 'cover' }} />
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
          <Image source={require('../../assets/images/Vyasa_Puja.png')} style={{ width: width * 0.8, height: 220, resizeMode: 'cover' }} />
          </View>
        ))}
      </MeasureView>
      <View style={{ flex: 1 }}>
        <Tabs screenOptions={{ tabBarActiveTintColor: 'red' }}>
          <Tabs.Screen
            name="VPBooksScreen"
            options={{
              title: 'EBooks',
              tabBarIcon: ({ color }) => <FontAwesome size={28} name="book" color={color} />,
              headerShown: false,
            }}
          />
          <Tabs.Screen
            name="VPPlaylistScreen"
            options={{
              title: 'Playlist',
              tabBarIcon: ({ color }) => <Entypo size={28} name="youtube" color={color} />,
              headerShown: false,
            }}
          />
        </Tabs>
      </View>
    </View>
  );
}