import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import RecentUploads from './RecentUploads'; // Replace with the actual path to the RecentUploads component
import RecentVideosScreen from './RecentVideosScreen'; // Replace with the actual path to the RecentVideosScreen component

const Tab = createMaterialTopTabNavigator();

export default function TabLayout() {
  return (
    <Tab.Navigator tabBarPosition="top">
      <Tab.Screen
        name="RecentUploads"
        component={RecentUploads} // Add this line
        options={{
          title: 'Recent Uploads',
        }}
      />
      <Tab.Screen
        name="RecentVideosScreen"
        component={RecentVideosScreen} // Add this line
        options={{
          title: 'Playlists',
        }}
      />
    </Tab.Navigator>
  );
}