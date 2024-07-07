import React, { useState, useEffect } from 'react';
import {
  Image, Text, StyleSheet, Share, Pressable,
  TouchableOpacity, ActivityIndicator, SafeAreaView, Platform, Dimensions, View
} from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import * as ScreenOrientation from 'expo-screen-orientation';
import { functions } from './api/firebase';
import { useNavigation } from 'expo-router';
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

const isTablet = () => {
  const { width, height } = Dimensions.get('window');
  const aspectRatio = width / height;
  const isLandscape = Math.min(width, height) >= 600 && (aspectRatio > 1.2 || aspectRatio < 0.9);
  console.log('isTablet: ', isLandscape);
  return isLandscape;
};

const LiveScreen = () => {
  const navigation = useNavigation();
  const [video, setVideo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [orientation, setOrientation] = useState(Dimensions.get('window').width > Dimensions.get('window').height ? 'LANDSCAPE' : 'PORTRAIT');
  const [width, setWidth] = useState(Dimensions.get('window').width);
  const [height, setHeight] = useState(Dimensions.get('window').height);

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
      const request: GetYouTubeVideosRequest = { channelId: 'UCLiuTwQ-ap30PbKzprrN2Hg' };
      try {
        const result = await getLiveVideo(request);
        const response: GetYouTubeVideosResponse = result.data;
        console.log("live videos", response);
        setVideo(response.video.id);
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

  const getVideoHeight = () => {
    return orientation === 'PORTRAIT' ? width * 9 / 16 : height;
  };

  const getVideoWidth = () => {
    return orientation === 'PORTRAIT' ? width : height * 16 / 9;
  };

  const shareYouTubeVideo = async (url) => {
    try {
      const result = await Share.share({
        message: 'Check out this cool video on YouTube!',
        url: url
      });
    } catch (error) {
      console.error('Error sharing YouTube video:', error);
    }
  };

  if (error || !video) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        <View style={styles.header}>
          {navigation.canGoBack() && (
            <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{top: 20, bottom: 20, left: 20, right: 20}} style={styles.leftItem}>
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
        <View style={styles.container}>
          <Image source={require('../assets/images/video-monetiztion-not-available.jpg')} style={{ width: width, height: 200 }} />
          <View style={styles.subTextContainer}>
            <Text style={styles.subText}>Live Streaming is not available right now!</Text>
            <Text style={styles.subText}> Please try again later. </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <MeasureView onSetOrientation={onSetOrientation} onSetWidth={onSetWidth}>
        <View style={styles.header}>
          {navigation.canGoBack() && (
            <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{top: 20, bottom: 20, left: 20, right: 20}} style={styles.leftItem}>
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
        <View style={styles.playerContainer}>
          <YoutubePlayer
            height={getVideoHeight()}
            width={getVideoWidth()}
            play={true}
            videoId={video}
            onReady={() => setIsLoading(false)}
          />
          {isLoading && <ActivityIndicator size="large" color="#ED4D4E" />}
        </View>
      </MeasureView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#993D39',
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
  playerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
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