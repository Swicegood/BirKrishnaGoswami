
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries  
import { httpsCallable } from 'firebase/functions';
import React, { useEffect, useState } from 'react';
import YoutubePlayer from 'react-native-youtube-iframe';
import {
  Image, Text, Dimensions, StyleSheet, Share, Pressable,
  TouchableOpacity, ActivityIndicator
} from 'react-native';
import { View } from '../components/Themed';
import * as ScreenOrientation from 'expo-screen-orientation';
import { functions } from './api/firebase';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Entypo from '@expo/vector-icons/Entypo';


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
  const navigation = useNavigation();
  const [video, setVideo] = useState<GetYouTubeVideosResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [videoHeight, setVideoHeight] = useState(Dimensions.get('window').width * 9 / 16); // initialize with a number
  const [videoWidth, setVideoWidth] = useState(Dimensions.get('window').width); // initialize with a number

  const NAVBAR_HEIGHT = 56;

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
      <>
      <SafeAreaView style={styles.safeArea} edges={['right', 'top', 'left']}>
        <View style={styles.header}>
          {navigation.canGoBack() && (
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.leftItem}>
              <FontAwesome name="angle-left" size={32} color="white" />
            </TouchableOpacity>
          )}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>LIVE STREAMING</Text>
          </View>
          <View style={styles.rightItem}>
            <View style={styles.circle}>
              <TouchableOpacity onPress={() => shareYouTubeVideo('https://www.youtube.com/watch?v=' + video)}>
                <Entypo name="share" size={26} color="#ED4D4E" fontWeight='bold' />
              </TouchableOpacity>
            </View>
          </View>
        </View>

      </SafeAreaView>
          <Image source={require('../assets/images/video-monetiztion-not-available.jpg')} style={{ width: Dimensions.get('window').width, height: 200 }} />
          <View style={styles.subTextContainer}>
            <Text style={styles.subText}>Live Streaming is not available right now!</Text>
            <Text style={styles.subText}> Please try again later. </Text>
          </View>
      </>
    );
  }

  console.log("live video video", video);

  return (
    <>
      <View style={styles.header}>
        {navigation.canGoBack() && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.leftItem}>
            <FontAwesome name="angle-left" size={32} color="white" />
          </TouchableOpacity>
        )}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>LIVE STREAMING</Text>
        </View>
        <View style={styles.rightItem}>
          <View style={styles.circle}>
            <TouchableOpacity onPress={() => shareYouTubeVideo('https://www.youtube.com/watch?v=' + video)}>
              <Entypo name="share" size={26} color="#ED4D4E" fontWeight='bold' />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <View style={styles.textContainer}>
        <View style={styles.centeredContent}>
          <YoutubePlayer
            height={videoHeight} // Await the getVideoHeight() function to get the actual height value
            width={videoWidth}
            play={true}
            videoId={video}
            onReady={() => setIsLoading(false)}
          />
          {isLoading && <ActivityIndicator size="large" color="#ED4D4E" />}
        </View>
      </View>
    </>
  );
};

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

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#993D39', // Use the same color as your header
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    backgroundColor: '#ED4D4E', // Set the background color for your header
  },
  titleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent', // Choose your color
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  leftItem: {
    zIndex: 1,
    fontSize: 28,
    color: 'white',
  },
  rightItem: {
    backgroundColor: 'transparent',
  },
  subText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black', // Choose your color
    textAlign: 'center',
    margin: 10,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle: {
    width: 30, // Or whatever size you want
    height: 30, // Should be the same as width
    borderRadius: 15, // Half of your width and height
    backgroundColor: 'white', // Or whatever color you want
    justifyContent: 'center', // Center the child items vertically
    alignItems: 'center', // Center the child items horizontally
  },
  subTextContainer: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.60,
    shadowRadius: 20,
    elevation: 5,
  },


});

export default LiveScreen;

