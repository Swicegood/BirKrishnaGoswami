import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Platform, ActivityIndicator } from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';
import YoutubePlayer from 'react-native-youtube-iframe';
import { useLocalSearchParams } from 'expo-router';

const NAVBAR_HEIGHT = Platform.OS === 'ios' ? 44 : 56;

interface VideoItemProps {
  id: string;
  title: string;
  lastModified: string;
}

const VideoPlayerItem = () => {
  const { id } = useLocalSearchParams<VideoItemProps>();
  const [videoHeight, setVideoHeight] = useState(Dimensions.get('window').width * 9 / 16); // initialize with a number
  const [videoWidth, setVideoWidth] = useState(Dimensions.get('window').width); // initialize with a number
  const [isLoading, setIsLoading] = useState(true);

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
      return (screenHeight - NAVBAR_HEIGHT )* 16 / 9;
    }
  }



  return (
    <View style={styles.textContainer}>
      <View style={styles.centeredContent}>
      <YoutubePlayer
        height={videoHeight} // Await the getVideoHeight() function to get the actual height value
        width={videoWidth}
        play={true}
        videoId={id}
        onReady={() => setIsLoading(false)}
      />
      {isLoading && <ActivityIndicator size="large" color="#0000ff" />}
      </View>
    </View>
  );

};
  const styles = StyleSheet.create({
    textContainer: {
      flex: 1,
    },
    centeredContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
  
  export default VideoPlayerItem;