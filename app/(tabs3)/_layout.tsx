import React from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { Entypo } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { View, Image, Dimensions } from 'react-native';

export default function TabLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Image source={require('../../assets/images/Vyasa_Puja.png')} style={{ width: Dimensions.get("screen").width, height: 160, resizeMode: 'cover' }} />
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