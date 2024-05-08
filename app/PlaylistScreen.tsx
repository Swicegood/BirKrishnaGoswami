
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries  
import { httpsCallable } from 'firebase/functions';
import {
  FlatList, StyleSheet, ActivityIndicator, TouchableOpacity,
  Text, Dimensions
} from 'react-native';
import VideoItem from '../components/VideoItem'; // Import the PlaylistItem component
import React, { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { functions } from './api/firebase';
import { View } from '../components/Themed';

const NAVBAR_HEIGHT = 44;

interface GetYouTubeVideosRequest {
  playlistId: string;
  nextPageToken?: string;
}

interface Videolist {
  id: string;
  title: string;
  // Add other playlist properties as needed
}

interface GetYouTubeVideosResponse {
  videos: Videolist[];
  nextPageToken: string;
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
  const [videoHeight, setVideoHeight] = useState<number>(0);
  const [videoWidth, setVideoWidth] = useState<number>(0);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [isLastPage, setIsLastPage] = useState(false);

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

          const nextPageToken = response.nextPageToken;
          setNextPageToken(nextPageToken);

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

  // Add a state variable for the next page token
  const loadMoreVideos = async () => {
    // Stop loading if there's no next page
    if (!nextPageToken) {
      setIsLastPage(true);
      return;
    }

    const getYouTubePlaylistVideos = httpsCallable<GetYouTubeVideosRequest, GetYouTubeVideosResponse>(functions, 'getYouTubePlaylistVideos');

    // Include the next page token in the request if it exists
    const request: GetYouTubeVideosRequest = { playlistId: final_id, nextPageToken: nextPageToken };

    getYouTubePlaylistVideos(request)
      .then((result: { data: GetYouTubeVideosResponse }) => {
        // Use the interface for the response
        const response: GetYouTubeVideosResponse = result.data;
        let vids = response.items; // Change this line

        const nextPageToken = response.nextPageToken;
        setNextPageToken(nextPageToken);
        if (!nextPageToken) {
          setIsLastPage(true);
        }

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
  }

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
      return (screenHeight - NAVBAR_HEIGHT) * 16 / 9;
    }
  }

  const renderItem = ({ item }) => (
    <VideoItem title={item.title} lastModified={item.dateModified} thumbnail={item.thumbnailUrl} id={item.id} />
  );

  const renderHeader = () => {

    return (
      <View style={{ height: videoHeight, width: videoWidth }}>
        {/* Render your header content here */}
      </View>
    );
  };

  const renderFooter = () => {

    if (isLastPage) {
      return (
        <View>
          <Text style={{textAlign: 'center', marginTop:10}}>No more videos to load</Text>
          <View style={{ height: 50, width: videoWidth }}>
            </View>
        </View>
      );
    }
    return (

      <View >
        <TouchableOpacity onPress={loadMoreVideos}>
          <Text style={styles.text}>SHOW MORE</Text>
        </TouchableOpacity>
        <View style={{ height: 50, width: videoWidth }}>
        </View>
      </View>

    );
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#ED4D4E" />
      </View>
    );
  }

  return (
    <View>
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
  text: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'maroon',
    textAlign: 'center',
    fontFamily: 'UbuntuRegular',
    marginTop: 10,
  },
});

export default PlaylistScreen;