
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries  
import { httpsCallable } from 'firebase/functions';
import VideoItem from '../../components/VideoItem'; // Import the PlaylistItem component
import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { functions } from '../api/firebase';
import { Link } from 'expo-router';


interface GetYouTubeVideosRequest {
  channelId: string;
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


const YoutubeChannelVideosScreen = () => {
  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Function to fetch videos based on search term
  const fetchVideos = async () => {
    setIsLoading(true);
    setVideos([]); // Clear the videos state
    const getYouTubeChannelVideos = httpsCallable<GetYouTubeVideosRequest, GetYouTubeVideosResponse>(functions, 'getYouTubeChannelVideos');
    const request: GetYouTubeVideosRequest = { channelId: 'UCLiuTwQ-ap30PbKzprrN2Hg' }; // Use state for searchTerm

    getYouTubeChannelVideos(request)
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
          setIsLoading(false);
        });
      })
      .catch((error: FirebaseFunctionError) => {
        console.error("Error calling the function: ", error.message);
      });
  };

  useEffect(() => {
    setVideos([]); // Clear the videos state
    const fetchVideos = async () => {
      const getYouTubeChannelVideos = httpsCallable<GetYouTubeVideosRequest, GetYouTubeVideosResponse>(functions, 'getYouTubeChannelVideos');

      // Use the interface for the request
      const request: GetYouTubeVideosRequest = { channelId: 'UCLiuTwQ-ap30PbKzprrN2Hg' };

      getYouTubeChannelVideos(request)
        .then((result: { data: GetYouTubeVideosResponse }) => {
          // Use the interface for the response
          const response: GetYouTubeVideosResponse = result.data;
          const videos = response.items; // Change this line
          videos.forEach(video => {
            const title = video.snippet.title;
            const thumbnailUrl = video.snippet.thumbnails.default.url; // or 'medium' or 'high'
            const dateModified = video.snippet.publishTime;
            const id = video.id.videoId;
            setVideos(videos => [...videos, { id, title, thumbnailUrl, dateModified }]);
            setIsLoading(false);
          });
        })
        .catch((error: FirebaseFunctionError) => {
          console.error("Error calling the function: ", error.message);
        });
    };

    fetchVideos();
  }, []); // Empty dependency array means this effect runs once on mount

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#ED4D4E" />
      </View>)
  }

  const renderItem = ({ item }) => (
    <Link href={{ pathname: '/YoutubePlayer', params: { id: item.id } }}> {/* This is the link to the PlaylistScreen */}
      <VideoItem title={item.title} lastModified={item.dateModified} thumbnail={item.thumbnailUrl} id={item.id} />
    </Link>
  );

  return (
    <View style={styles.container}>

      <FlatList
        data={videos}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        ListFooterComponent={<View style={{ height: 20 }} />} // Add this line
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: -10,
  },
  searchInput: {
    borderColor: 'gray',
    borderWidth: 1,
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default YoutubeChannelVideosScreen;