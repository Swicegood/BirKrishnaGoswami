
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries  
import { initializeApp, getApp } from 'firebase/app';
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';
import { getAnalytics } from "firebase/analytics";
import VideoItem from '../components/VideoItem'; // Import the PlaylistItem component
import { useLocalSearchParams, Link } from 'expo-router'; 
import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, TextInput, Button } from 'react-native';

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
    channelId: string;
    searchTerm: string;
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
  

  const SearchYoutubeVideosScreen = () => {
    const [videos, setVideos] = useState([]);
    const [searchTerm, setSearchTerm] = useState(''); // State to hold the search term
  
    const functions = getFunctions(getApp());
  
    // Function to fetch videos based on search term
    const fetchVideos = async () => {
      setVideos([]); // Clear the videos state
      const getSearchYouTubeVideos = httpsCallable<GetYouTubeVideosRequest, GetYouTubeVideosResponse>(functions, 'getSearchYouTubeVideos');
      const request: GetYouTubeVideosRequest = { channelId: 'UCLiuTwQ-ap30PbKzprrN2Hg', searchTerm }; // Use state for searchTerm

        getSearchYouTubeVideos(request)
        .then((result: { data: GetYouTubeVideosResponse }) => {
          // Use the interface for the response
          const response: GetYouTubeVideosResponse = result.data;
          const videos = response.items; // Change this line
          console.log("videos", videos[4]);
          videos.forEach(video => {
            const title = video.snippet.title;
            const thumbnailUrl = video.snippet.thumbnails.default.url; // or 'medium' or 'high'
            const dateModified = video.snippet.publishTime;
            const id = video.id.videoId;
            setVideos(videos => [...videos, { id, title, thumbnailUrl, dateModified }]);
          });
        })
        .catch((error: FirebaseFunctionError) => {
          console.error("Error calling the function: ", error.message);
        });
    };
  
    useEffect(() => {
        const fetchVideos = async () => {
          const getSearchYouTubeVideos = httpsCallable<GetYouTubeVideosRequest, GetYouTubeVideosResponse>(functions, 'getSearchYouTubeVideos');
      
          // Use the interface for the request
          const request: GetYouTubeVideosRequest = { channelId: 'UCLiuTwQ-ap30PbKzprrN2Hg', searchTerm: '' };
      
          getSearchYouTubeVideos(request)
            .then((result: { data: GetYouTubeVideosResponse }) => {
              // Use the interface for the response
              const response: GetYouTubeVideosResponse = result.data;
              const videos = response.items; // Change this line
              console.log("videos", videos[4]);
              videos.forEach(video => {
                const title = video.snippet.title;
                const thumbnailUrl = video.snippet.thumbnails.default.url; // or 'medium' or 'high'
                const dateModified = video.snippet.publishTime;
                const id = video.id.videoId;
                setVideos(videos => [...videos, { id, title, thumbnailUrl, dateModified }]);
              });
            })
            .catch((error: FirebaseFunctionError) => {
              console.error("Error calling the function: ", error.message);
            });
        };
      
        fetchVideos();
      }, []); // Empty dependency array means this effect runs once on mount
  
    return (
      <View style={styles.container}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search YouTube Videos"
          value={searchTerm}
          onChangeText={setSearchTerm} // Update searchTerm state on input change
        />
        <Button
          title="Search"
          onPress={fetchVideos} // Fetch videos on button press
        />
        <FlatList
          data={videos}
          renderItem={({ item }) => <VideoItem title={item.title} lastModified={item.dateModified} thumbnail={item.thumbnailUrl} id={item.id} />} // Pass video item props to VideoItem
          keyExtractor={item => item.id}
        />
      </View>
    );
  };
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
    },
    searchInput: {
      margin: 10,
      padding: 10,
      borderColor: 'gray',
      borderWidth: 1,
    },
  });
  
  export default SearchYoutubeVideosScreen;