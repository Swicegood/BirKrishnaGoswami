import React from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { View, Image, Dimensions } from 'react-native';

export default function TabLayout() {
  return (
    <View style={{ flex: 1 }}>
    <Image source={require('../../assets/images/Memories.png')} style={{ width: Dimensions.get("screen").width, height: 150, resizeMode: 'cover'}}/>
    <View style={{ flex: 1 }}>
    <Tabs screenOptions={{ tabBarActiveTintColor: 'red' }}>
      <Tabs.Screen 
        name="VPOfferingsScreen" 
        options={{
          title: 'Vyasa Puja Offerings',
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="book" color={color} />,
          headerShown: false,
        }} 
      />
      <Tabs.Screen 
        name="SPPlaylistScreen" 
        options={{
          title: 'Playlist',
          tabBarIcon: () => false,
          headerShown: false,
        }} 
      />
    </Tabs>
    </View>
    </View>
  );
}