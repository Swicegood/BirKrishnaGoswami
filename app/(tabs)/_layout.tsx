import React from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import CustomHeaderMain from '../../components/CustomHeaderMain';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: 'red' }}>
      <Tabs.Screen 
        name="RecentUploads" 
        options={{
          title: "Recent Uploads",
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="youtube" color={color} />,
          header: () => <CustomHeaderMain title="RECENT UPLOADS" />,
          }} />
      <Tabs.Screen 
        name="RecentVideosScreen" 
        options={{
          title: "Playlists",
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="youtube" color={color} />,
          header: () => <CustomHeaderMain title="PLAYLISTS" />,
          }} />
    </Tabs>
  );
}