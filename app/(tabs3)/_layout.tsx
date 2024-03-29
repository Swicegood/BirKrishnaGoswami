import React from 'react';
import { Image, View, Dimensions } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import Playlist from './PlaylistScreen'; // Replace with the actual path to the RecentUploads component
import VPOfferings from './VPOfferingsScreen'; // Replace with the actual path to the RecentVideosScreen component

const Tab = createMaterialTopTabNavigator();

export default function TabLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Image source={require('../../assets/images/placeholder_355_200.png')} style={{ width: Dimensions.get("screen").width, alignSelf: 'center' }} />
      <View style={{ flex: 1 }}>
        <Tab.Navigator tabBarPosition="top">
          <Tab.Screen
            name="VPOfferingsScreen"
            component={VPOfferings}
            options={{
              title: 'EBooks',
            }}
          />
          <Tab.Screen
            name="PlaylistScreen"
            component={Playlist}
            options={{
              title: 'Playlist',
            }}
          />
        </Tab.Navigator>
      </View>
    </View>
  );
}