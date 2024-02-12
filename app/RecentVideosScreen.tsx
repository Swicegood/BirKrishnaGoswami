
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries  
import { initializeApp, getApp } from 'firebase/app';
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';
import { getAnalytics } from "firebase/analytics";
import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import PlaylistItem from '../components/PlaylistItem'; // Import the PlaylistItem component

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


const functions = getFunctions(getApp());
connectFunctionsEmulator(functions, "127.0.0.1", 5001);
const getYouTubePlaylists = httpsCallable<GetYouTubePlaylistsRequest, GetYouTubePlaylistsResponse>(functions, 'getYouTubePlaylists');

// Use the interface for the request
const request: GetYouTubePlaylistsRequest = { channelId: 'UCLiuTwQ-ap30PbKzprrN2Hg' };

// getYouTubePlaylists(request)
//   .then((result: { data: GetYouTubePlaylistsResponse }) => {
//     // Use the interface for the response
//     const response: GetYouTubePlaylistsResponse = result.data;
//     console.log("YouTube", response);
//     //const playlists = response;
//   })
//   .catch((error: FirebaseFunctionError) => {
//     console.error("Error calling the function: ", error.message);
//   });

  const playlists = [
    {
      id: '1',
      title: 'Playlist 1',
      lastModified: 'Last modified: 2021-01-01',
      thumbnail: 'https://www.youtube.com/watch?v=3JZ_D3ELwOQ',
    },
    {
      id: '2',
      title: 'Playlist 2',
      lastModified: 'Last modified: 2021-01-02',
      thumbnail: 'https://placekitten.com/200/200',
    },
    {
      id: '3',
      title: 'Playlist 3',
      lastModified: 'Last modified: 2021-01-03',
      thumbnail: 'https://placekitten.com/200/200',
    },
    {
      id: '4',
      title: 'Playlist 4',
      lastModified: 'Last modified: 2021-01-04',
      thumbnail: 'https://placekitten.com/200/200',
    },
  ];

  const renderItem = ({ item }) => (
    <PlaylistItem title={item.title} lastModified={item.lastModified} thumbnail={item.thumbnail} />
  );

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