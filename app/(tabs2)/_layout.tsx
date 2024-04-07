import React from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { View, Image, Dimensions } from 'react-native';

export default function TabLayout() {
  return (
    <View style={{ flex: 1 }}>
    <Image source={require('../../assets/images/placeholder_355_200.png')} style={{ width: Dimensions.get("screen").width, alignSelf: 'center' }} />
    <View style={{ flex: 1 }}>
    <Tabs screenOptions={{ tabBarActiveTintColor: 'red' }}>
      <Tabs.Screen 
        name="VPOfferingsScreen" 
        options={{
          title: 'Vyasa Puja Offerings',
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="book" color={color} />,
        }} 
      />
      <Tabs.Screen 
        name="SPPlaylistScreen" 
        options={{
          title: 'Playlist',
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="youtube" color={color} />,
        }} 
      />
    </Tabs>
    </View>
    </View>
  );
}