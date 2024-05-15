import React from 'react';
import { Entypo } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import CustomHeaderMain from '../../components/CustomHeaderMain';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: 'red' }}>
      <Tabs.Screen 
        name="RecentUploads" 
        options={{
          title: "Recent Uploads",
          tabBarIcon: ({ color }) => <Entypo size={28} name="youtube" color={color} />,
          header: () => <CustomHeaderMain title="RECENT UPLOADS" />,
          }} />
      <Tabs.Screen 
        name="RecentVideosScreen" 
        options={{
          title: "Playlists",
          tabBarIcon: ({ color }) => <Entypo size={28} name="youtube" color={color} />,
          header: () => <CustomHeaderMain title="PLAYLISTS" />,
          }} />
    </Tabs>
  );
}