
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries  
import { initializeApp, getApp } from 'firebase/app';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { View, FlatList, StyleSheet, ActivityIndicator, Platform, Dimensions} from 'react-native';
import VideoItem from '../components/VideoItem'; // Import the PlaylistItem component
import React, { useEffect, useState } from 'react';
import { useLocalSearchParams, Link } from 'expo-router'; 

const NAVBAR_HEIGHT = Platform.OS === 'ios' ? 44 : 56;

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
  
  interface PlaylistScreenProps {
    id?: string;
  }
  
const PlaylistScreen = ({ id: propId }: PlaylistScreenProps) => {
  const { id } = useLocalSearchParams<{ id: string }>();// Get the playlist ID from the URL
  const final_id = propId || id; // Use the prop id if provided, otherwise use the search param id
  const [videos, setVideos] = useState<{ id: string; title: string; thumbnailUrl: string; dateModified: string; }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const functions = getFunctions(getApp());
  const [videoHeight, setVideoHeight] = useState<number>(0);
  const [videoWidth, setVideoWidth] = useState<number>(0);
  
  useEffect(() => {
    const fetchDimensions = async () => {
      const height = await getVideoHeight();
      const width = await getVideoWidth();
      setVideoHeight(height);
      setVideoWidth(width);
    };
  
    fetchDimensions();
  }, []);
  

useEffect(() => {
  setVideos([]); // Clear the videos stateß
  const fetchVideos = async () => {
    const getYouTubePlaylistVideos = httpsCallable<GetYouTubeVideosRequest, GetYouTubeVideosResponse>(functions, 'getYouTubePlaylistVideos');

    // Use the interface for the request
    const request: GetYouTubeVideosRequest = { playlistId: final_id };

    getYouTubePlaylistVideos(request)
    .then((result: { data: GetYouTubeVideosResponse }) => {
      // Use the interface for the response
      const response: GetYouTubeVideosResponse = result.data;
      let vids = response.items; // Change this line
    
      // Sort videos by date, newest first
      vids = vids.sort((a, b) => new Date(b.contentDetails.videoPublishedAt).getTime() - new Date(a.contentDetails.videoPublishedAt).getTime());
    
      console.log("videos", videos[4]);
      vids.forEach(video => {
        const title = video.snippet.title;
        const thumbnailUrl = video.snippet.thumbnails.default.url; // or 'medium' or 'high'
        const dateModified = video.contentDetails.videoPublishedAt;
        const id = video.contentDetails.videoId;
        setVideos(vids => [...vids, { id, title, thumbnailUrl, dateModified }]);
        setIsLoading(false);
      });
    })
      .catch((error: FirebaseFunctionError) => {
        console.error("Error calling the function: ", error.message);
      });
  };

  fetchVideos();
}, []);



async function getVideoHeight() {
  const orientation = await ScreenOrientation.getOrientationAsync();
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  if (orientation === ScreenOrientation.Orientation.PORTRAIT_UP || orientation === ScreenOrientation.Orientation.PORTRAIT_DOWN) {
    // In portrait mode, set height based on screen width and aspect ratio
    return screenWidth * 9 / 16;
  } else {
    // In landscape mode, set height to screen height
    return screenHeight - NAVBAR_HEIGHT;
  }
}

async function getVideoWidth() {
  const orientation = await ScreenOrientation.getOrientationAsync();
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  if (orientation === ScreenOrientation.Orientation.PORTRAIT_UP || orientation === ScreenOrientation.Orientation.PORTRAIT_DOWN) {
    // In portrait mode, set height based on screen width and aspect ratio
    return screenWidth;
  } else {
    // In landscape mode, set height to screen height
    return (screenHeight - NAVBAR_HEIGHT )* 16 / 9;
  }
}

  const renderItem = ({ item }) => (
    <VideoItem title={item.title} lastModified={item.dateModified} thumbnail={item.thumbnailUrl} id={item.id} />
  );

  const renderHeader = () => {
    const videoHeight = getVideoHeight();
    const videoWidth = getVideoWidth();
  
    return (
      <View style={{ height: videoHeight, width: videoWidth }}>
        {/* Render your header content here */}
      </View>
    );
  };
  
  const renderFooter = () => {
    const videoHeight = getVideoHeight();
    const videoWidth = getVideoWidth();
  
    return (
      <View style={{ height: videoHeight, width: videoWidth }}>
        {/* Render your footer content here */}
      </View>
    );
  };

  if (isLoading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={videos}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
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