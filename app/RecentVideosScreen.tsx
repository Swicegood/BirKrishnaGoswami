
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries  
import { initializeApp, getApp } from 'firebase/app';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAnalytics } from "firebase/analytics";
import { View, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import PlaylistItem from '../components/PlaylistItem'; // Import the PlaylistItem component
import React, { useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router'

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD8JpSB_tK2CBj1tC6f434-vezZ2x0bRbk",
  authDomain: "birkrishnagoswami-b7360.firebaseapp.com",
  projectId: "birkrishnagoswami-b7360",
  storageBucket: "birkrishnagoswami-b7360.appspot.com",
  messagingSenderId: "790459013032",
  appId: "1:790459013032:web:d33b61fc48a0178cf82f9d",
  measurementId: "G-7GVXDMLLSY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);


interface GetYouTubePlaylistsRequest {
    channelId: string;
  }
  
  interface Playlist {
    id: string;
    title: string;
    // Add other playlist properties as needed
  }
  
  interface GetYouTubePlaylistsResponse {
    playlists: Playlist[];
  }


interface FirebaseFunctionError {
    code: string;
    message: string;
    details?: any; // The details can vary depending on the error
  }
  

const RecentVideoScreen = () => {
const [playlists, setPlaylists] = useState([]);
const functions = getFunctions(getApp());
const [isLoading, setIsLoading] = useState(true);

const fetchPlaylists = async () => {
  const getYouTubePlaylists = httpsCallable<GetYouTubePlaylistsRequest, GetYouTubePlaylistsResponse>(functions, 'getYouTubePlaylists');
  // Use the interface for the request
  const request: GetYouTubePlaylistsRequest = { channelId: 'UCLiuTwQ-ap30PbKzprrN2Hg' };

  getYouTubePlaylists(request)
    .then((result: { data: GetYouTubePlaylistsResponse }) => {
      // Use the interface for the response
      const response: GetYouTubePlaylistsResponse = result.data;
      const playlists = response.items; // Change this line
      playlists.forEach(playlist => {
        const title = playlist.snippet.title;
        const thumbnailUrl = playlist.snippet.thumbnails.default.url; // or 'medium' or 'high'
        const dateModified = playlist.snippet.publishedAt;
        const id = playlist.id;
        setPlaylists(playlists => [...playlists, { id, title, thumbnailUrl, dateModified }]);
        setIsLoading(false);
      });
    })
    .catch((error: FirebaseFunctionError) => {
      console.error("Error calling the function: ", error.message);
    });
};

useEffect(() => {
  if (playlists.length === 0) {
    fetchPlaylists();
    setIsLoading(false);
  }
}, []);

useFocusEffect(
  React.useCallback(() => {
    // Reset the playlists state when the screen comes into focus
    setIsLoading(true);
    setPlaylists([]);

    // Fetch the playlists
    fetchPlaylists();
  }, [])
);

  const renderItem = ({ item }) => (
    <PlaylistItem title={item.title} lastModified={item.dateModified} thumbnail={item.thumbnailUrl} id={item.id} />
  );

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={playlists}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        // If you want to add a header or footer, you can use ListHeaderComponent and ListFooterComponent props
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

 export default RecentVideoScreen;