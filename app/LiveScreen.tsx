import React, { useState, useEffect } from 'react';
import {
  Image, Text, StyleSheet, Share, Pressable,
  TouchableOpacity, ActivityIndicator, Platform, Dimensions, View
} from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import * as ScreenOrientation from 'expo-screen-orientation';
import { functions } from './api/firebase';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Entypo from '@expo/vector-icons/Entypo';
import { StatusBar } from 'expo-status-bar';
import { httpsCallable } from 'firebase/functions';
import MeasureView from './api/MeasureView';

interface GetYouTubeVideosRequest {
  channelId: string;
}

interface Video {
  id: string;
  title: string;
}

interface GetYouTubeVideosResponse {
  video: Video;
}


interface FirebaseFunctionError {
  code: string;
  message: string;
  details?: any; // The details can vary depending on the error
}


const isTablet = () => {
  const { width, height } = Dimensions.get('window');
  const aspectRatio = width / height;
  const isLandscape = Math.min(width, height) >= 600 && (aspectRatio > 1.2 || aspectRatio < 0.9);
  console.log('isTablet: ', isLandscape);
  return isLandscape;
};

const LiveScreen = () => {
  const navigation = useNavigation();
  const [video, setVideo] = useState<GetYouTubeVideosResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [videoHeight, setVideoHeight] = useState(Dimensions.get('window').width * 9 / 16); // initialize with a number
  const [videoWidth, setVideoWidth] = useState(Dimensions.get('window').width); // initialize with a number

  const NAVBAR_HEIGHT = 56;

  const [orientation, setOrientation] = useState(Dimensions.get('window').width > Dimensions.get('window').height ? 'LANDSCAPE' : 'PORTRAIT');
  const [width, setWidth] = useState(Dimensions.get('window').width);
  const [height, setHeight] = useState(Dimensions.get('window').height);

 let subscription;

  useEffect(() => {
    
    if (! isTablet()) {
    getVideoHeight().then(setVideoHeight); // set the initial height when the component mounts
    getVideoWidth().then(setVideoWidth); // set the initial width when the component mounts
    }
    subscription = ScreenOrientation.addOrientationChangeListener(handleOrientationChange);

    return () => {
      if (subscription) {
        ScreenOrientation.removeOrientationChangeListener(subscription);
      }
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



  const onSetWidth = (width: number) => {
    console.log('LiveScreen width: ', width);
    setWidth(width);
  };

  const onSetOrientation = (newOrientation: string) => {
    if ((Platform.OS === 'android' && !isTablet()) || Platform.OS === 'web') {
      if (newOrientation === 'LANDSCAPE') {
        setOrientation('PORTRAIT');
      } else {
        setOrientation('LANDSCAPE');
      }
      return;
    }
    setOrientation(newOrientation);
        setHeight(Dimensions.get('window').height);
  };


  useEffect(() => {
    if (Platform.OS === 'web') {
      document.body.style.overflow = 'auto';
      document.documentElement.style.overflow = 'auto';
    }
  }, []);

  useEffect(() => {
    const fetchVideos = async () => {
      const getLiveVideo = httpsCallable<GetYouTubeVideosRequest, GetYouTubeVideosResponse>(functions, 'getLiveVideo');
      const request: GetYouTubeVideosRequest = { channelId: 'UCioh9Wq_z825232pIKsGZyA' };
      try {
        const result = await getLiveVideo(request);
        const response: GetYouTubeVideosResponse = result.data;
        console.log("live videos", response);
        setVideo(response);
      } catch (error) {
        console.error("Error calling the function: ", error.message);
        if (error.message === "not-found") {
          console.log("No live video found");
          setError("No live video found");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideos();
  }, []);


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



  if (error || !video) {
    return (
      <>
        <StatusBar style="light" />
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <MeasureView onSetOrientation={onSetOrientation} onSetWidth={onSetWidth}>
            <View style={{ backgroundColor: 'white', height: Dimensions.get('window').height }}>
              <View style={styles.header}>
                {navigation.canGoBack() && (
                  <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }} style={styles.leftItem}>
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
              <Image source={require('../assets/images/video-monetiztion-not-available.jpg')} style={{ width: width, height: (isTablet() || orientation === 'LANDSCAPE') ? 300 : 200 }} />
              <View style={styles.subTextContainer}>
                <Text style={styles.subText}>Live Streaming is not available right now!</Text>
                <Text style={styles.subText}> Please try again later. </Text>
              </View>
            </View>
          </MeasureView>
        </SafeAreaView >
      </>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['right', 'top', 'left']}>
      <View style={styles.header}>
        {navigation.canGoBack() && (
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }} style={styles.leftItem}>
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
      <View style={styles.centeredContent}>
        <MeasureView onSetOrientation={onSetOrientation} onSetWidth={onSetWidth} style={styles.textContainer}>

          <YoutubePlayer
            height={videoHeight}
            width={videoWidth}
            play={true}
            videoId={video}
            onReady={() => setIsLoading(false)}
          />
          {isLoading && <ActivityIndicator size="large" color="#ED4D4E" />}
        </MeasureView>
      </View>

    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#993D39', // Use the same color as your header
    height: 60
  },
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    backgroundColor: '#ED4D4E',
  },
  titleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
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
    color: 'black',
    textAlign: 'center',
    margin: 10,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  playerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },

  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
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

