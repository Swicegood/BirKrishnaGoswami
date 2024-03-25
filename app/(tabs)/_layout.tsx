import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: 'blue' }} tabBarPosition='top'>
      <Tabs.Screen
        name="RecentUploads"
        options={{
          title: 'Recent Uploads',
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="youtube" color={color} />,
        }}
      />  
      <Tabs.Screen
        name="RecentVideosScreen"
        options={{
          title: 'Playlists',
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="youtube" color={color} />,
        }}
      />
    </Tabs>
  );
}