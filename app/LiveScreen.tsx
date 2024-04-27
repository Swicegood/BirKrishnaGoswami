
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries  
import { httpsCallable } from 'firebase/functions';
import React, { useEffect, useState } from 'react';
import YoutubePlayer from 'react-native-youtube-iframe';
import {
  Image, Text, Dimensions, StyleSheet, Share, Button,
  TouchableOpacity, ActivityIndicator
} from 'react-native';
import { View } from '../components/Themed';
import * as ScreenOrientation from 'expo-screen-orientation';
import { functions } from './api/firebase';

interface GetYouTubeVideosRequest {
  channelId: string;
}

interface Video {
  id: string;
  title: string;
  // Add other playlist properties as needed
}

interface GetYouTubeVideosResponse {
  video: Video;
}


interface FirebaseFunctionError {
  code: string;
  message: string;
  details?: any; // The details can vary depending on the error
}



const LiveScreen = () => {
  const [video, setVideo] = useState<GetYouTubeVideosResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [videoHeight, setVideoHeight] = useState(Dimensions.get('window').width * 9 / 16); // initialize with a number
  const [videoWidth, setVideoWidth] = useState(Dimensions.get('window').width); // initialize with a number

  useEffect(() => {
    getVideoHeight().then(setVideoHeight); // set the initial height when the component mounts
    getVideoWidth().then(setVideoWidth); // set the initial width when the component mounts

    ScreenOrientation.addOrientationChangeListener(handleOrientationChange);

    return () => {
      ScreenOrientation.removeOrientationChangeListener(handleOrientationChange);
    };
  }, []);

  function handleOrientationChange() {
    getVideoHeight().then(setVideoHeight);
    getVideoWidth().then(setVideoWidth);
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


  useEffect(() => {
    const fetchVideos = async () => {
      const getLiveVideo = httpsCallable<GetYouTubeVideosRequest, GetYouTubeVideosResponse>(functions, 'getLiveVideo');

      // Use the interface for the request
      const request: GetYouTubeVideosRequest = { channelId: 'UCLiuTwQ-ap30PbKzprrN2Hg' };
      try {
        const result = await getLiveVideo(request);
        // Use the interface for the response
        const response: GetYouTubeVideosResponse = result.data;
        console.log("live videos", response);
        setVideo(response);
      } catch (error) {
        console.error("Error calling the function: ", error.message);
        if (error.message === "not-found") {
          console.log("No live video found");
          setError("No live video found");
        }
      }
    };

    fetchVideos();
  }, []);

  if (error || !video) {
    return (
      <View>
        <Image source={require('../assets/images/placeholder_355_200.png')} style={{ width: Dimensions.get('window').width, height: 200 }} />
        <Text>Live Streaming is not available right now!</Text>
        <Text> Please try again later. </Text>
      </View>
    );
  }

  console.log("live video video", video);

  return (
    <View style={styles.textContainer}>
      <View style={styles.centeredContent}>
        <YoutubePlayer
          height={videoHeight} // Await the getVideoHeight() function to get the actual height value
          width={videoWidth}
          play={true}
          videoId={video}
          onReady={() => setIsLoading(false)}
        />
        <TouchableOpacity onPress={() => shareYouTubeVideo('https://www.youtube.com/watch?v='+video)}>
          <Text>Share YouTube Video</Text>
        </TouchableOpacity>
        {isLoading && <ActivityIndicator size="large" color="#0000ff" />}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});


const shareYouTubeVideo = async (url) => {
  try {
    const result = await Share.share({
      message: 'Check out this cool video on YouTube!',
      url: url  // Replace VIDEO_ID with the actual ID
    });

    if (result.action === Share.sharedAction) {
      if (result.activityType) {
        // Shared with activity type of result.activityType
        console.log('Shared with', result.activityType);
      } else {
        // Shared
        console.log('Shared successfully!');
      }
    } else if (result.action === Share.dismissedAction) {
      // Dismissed
      console.log('Share dismissed');
    }
  } catch (error) {
    console.error('Error sharing YouTube video:', error);
  }
};


export default LiveScreen;

