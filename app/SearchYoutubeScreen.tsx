
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries  
import { httpsCallable } from 'firebase/functions';
import VideoItem from '../components/VideoItem'; // Import the PlaylistItem component
import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, TextInput, Image, Text, ActivityIndicator } from 'react-native';
import { functions } from './api/firebase';
import { AntDesign } from '@expo/vector-icons';


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


interface Video {
  id: string;
  title: string;
  thumbnailUrl: string;
  dateModified: string;
}

// Then, when initializing the state:

const SearchYoutubeVideosScreen = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [searchTerm, setSearchTerm] = useState(''); // State to hold the search term
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Function to fetch videos based on search term
  const fetchVideos = async () => {
    setIsLoading(true);
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
        setIsLoading(false);
      })
      .catch((error: FirebaseFunctionError) => {
        console.error("Error calling the function: ", error.message);
      });
    setHasSearched(true);
  };

  useEffect(() => {
    setVideos([]); // Clear the videos state
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
          setIsLoading(false);
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

  return (
    !videos || videos.length === 0 ? (
      <View style={styles.noVideosContainer}>
        <Image source={require('../assets/images/no_videos.png')} style={styles.noVideosImage} />
      </View>
    ) : (
      <View style={styles.container}>
        <View style={{height: 60}}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search any topic"
            value={searchTerm}
            onChangeText={setSearchTerm} // Update searchTerm state on input change
          />
          <View style={styles.searchButton}>
            <AntDesign
              name="search1" size={40} color="gray"
              onPress={fetchVideos} // Fetch videos on button press
            />
          </View>
        </View>
        <View style={styles.containerList}>
          <FlatList
            data={videos}
            renderItem={({ item }) => <VideoItem title={item.title} lastModified={item.dateModified} thumbnail={item.thumbnailUrl} id={item.id} />} // Pass video item props to VideoItem
            keyExtractor={item => item.id}
            ListEmptyComponent={hasSearched ? <Text style={styles.text}>No videos found</Text> : null}
            ListFooterComponent={<View style={{ height: 100 }} />} // Add this line

          />
        </View>
      </View>
    )
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  containerList: {
    backgroundColor: '#fff',
    padding: -10,
  },
  searchInput: {
    margin: 10,
    padding: 10,
    height: 50,
    marginBottom: -15,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
  },
  searchButton: {
    position: 'absolute',
    right: 20,
    top: 16,
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  noVideosContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#edefef',
  },
  noVideosImage: {
    width: '100%',
    height: 600, // Adjust as needed
    resizeMode: 'cover',
  },
  noVideosText: {
    marginTop: 10,
    fontSize: 16,
  },
});

export default SearchYoutubeVideosScreen;