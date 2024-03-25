
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries  
import { initializeApp, getApp } from 'firebase/app';
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';
import { getAnalytics } from "firebase/analytics";
import { View, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import VideoItem from '../components/VideoItem'; // Import the PlaylistItem component
import React, { useEffect, useState } from 'react';
import { useLocalSearchParams, Link } from 'expo-router'; 

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


interface GetYouTubeVideosRequest {
    playlistId: string;
  }
  
  interface Videolist {
    id: string;
    title: string;
    // Add other playlist properties as needed
  }
  
  interface GetYouTubeVideosResponse {
    videos: Videolist[];
  }


interface FirebaseFunctionError {
    code: string;
    message: string;
    details?: any; // The details can vary depending on the error
  }
  

const PlaylistScreen = () => {
const { id } = useLocalSearchParams(); // Get the playlist ID from the URL
const [playlists, setVideos] = useState([]);
const [isLoading, setIsLoading] = useState(true);
const functions = getFunctions(getApp());


useEffect(() => {
  setVideos([]); // Clear the videos stateß
  const fetchVideos = async () => {
    const getYouTubePlaylistVideos = httpsCallable<GetYouTubeVideosRequest, GetYouTubeVideosResponse>(functions, 'getYouTubeVideos');

    // Use the interface for the request
    const request: GetYouTubeVideosRequest = { playlistId: id };

    getYouTubePlaylistVideos(request)
      .then((result: { data: GetYouTubeVideosResponse }) => {
        // Use the interface for the response
        const response: GetYouTubeVideosResponse = result.data;
        const videos = response.items; // Change this line
        console.log("videos", videos[4]);
        videos.forEach(video => {
          const title = video.snippet.title;
          const thumbnailUrl = video.snippet.thumbnails.default.url; // or 'medium' or 'high'
          const dateModified = video.contentDetails.videoPublishedAt;
          const id = video.contentDetails.videoId;
          setVideos(videos => [...videos, { id, title, thumbnailUrl, dateModified }]);
          setIsLoading(false);
        });
      })
      .catch((error: FirebaseFunctionError) => {
        console.error("Error calling the function: ", error.message);
      });
  };

  fetchVideos();
}, []);

  const renderItem = ({ item }) => (
    <VideoItem title={item.title} lastModified={item.dateModified} thumbnail={item.thumbnailUrl} id={item.id} />
  );

  if (isLoading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
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

 export default PlaylistScreen;