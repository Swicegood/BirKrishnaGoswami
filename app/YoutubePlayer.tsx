import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import GuageView from '../components/GuageView';
import { useLocalSearchParams } from 'expo-router';
import useIsMobileWeb from '../hooks/useIsMobileWeb';

const NAVBAR_HEIGHT = Platform.OS === 'ios' ? 44 : 56;

interface VideoItemProps {
  id: string;
  title: string;
  lastModified: string;
}

const ORIENTATION_THRESHOLD = 0.1; // 10% threshold

const isTablet = () => {
  const { width, height } = Dimensions.get('window');
  const aspectRatio = width / height;
  const isLandscape = Math.min(width, height) >= 600 && (aspectRatio > 1.2 || aspectRatio < 0.9);
  console.log('isTablet: ', isLandscape);
  return isLandscape;
};

const VideoPlayerItem = () => {
  console.log("VideoPlayerItem");
  const { id } = useLocalSearchParams<{ id: string }>(); // Get the video ID from the URL
  const [videoHeight, setVideoHeight] = useState(Dimensions.get('window').width * 9 / 16); // initialize with a number
  const [videoWidth, setVideoWidth] = useState(Dimensions.get('window').width); // initialize with a number
  const [orientation, setOrientation] = useState(Dimensions.get('window').width > Dimensions.get('window').height ? 'LANDSCAPE' : 'PORTRAIT');
  const [width, setWidth] = useState(Dimensions.get('window').width);
  const [height, setHeight] = useState(Dimensions.get('window').height);
  const isMobileWeb = useIsMobileWeb();


  const NAVBAR_HEIGHT = Platform.OS === 'ios' ? 80 : 56;

  const handleOrientationChange = () => {
    const newWidth = Dimensions.get('window').width;
    const newHeight = Dimensions.get('window').height;
    const aspectRatio = newWidth / newHeight;
    const previousAspectRatio = width / height;

    // Only change orientation if the aspect ratio change is significant
    if (Math.abs(aspectRatio - previousAspectRatio) > ORIENTATION_THRESHOLD) {
      const newOrientation = newWidth > newHeight ? 'LANDSCAPE' : 'PORTRAIT';
      setOrientation(newOrientation);
    }

    setWidth(newWidth);
    setHeight(newHeight);
    getVideoHeight();
    getVideoWidth();
    console.log('HandleOrientation Called :', orientation);
  }


  const onSetOrientation = useCallback((orientation: string) => {
    if (Platform.OS === 'android' && !isTablet()) {
      setOrientation(orientation === 'LANDSCAPE' ? 'PORTRAIT' : 'LANDSCAPE');
    } else if (Platform.OS === 'web') {
      handleOrientationChange(orientation);
    } else {
      setOrientation(orientation);
    }
    console.log('onSetOrientation called :', orientation);
  }, [setOrientation]);

  const onSetWidth = (newWidth) => {
    console.log('onSetWidth called :', newWidth);
    setWidth(newWidth);
  };

  async function getVideoHeight() {
    if (orientation === 'PORTRAIT') {
      // In portrait mode, set height based on screen width and aspect ratio
      setVideoHeight(width * 5 / 8);
    } else {
      // In landscape mode, set height to screen height
      setVideoHeight(width * 5 / 8);
    }
  }

  async function getVideoWidth() {
    if (orientation === 'PORTRAIT') {
      // In portrait mode, set height based on screen width and aspect ratio
      setVideoWidth(width);
    } else {
      // In landscape mode, set height to screen height
      setVideoWidth(((width * 9 / 16) - NAVBAR_HEIGHT) * 16 / 9);
    }
  }

  console.log("id", id);
  console.log("videoWidth", (orientation === 'LANDSCAPE' ? (((width * 9 / 16) - NAVBAR_HEIGHT) * 16 / 9) : width), "VideoHeight", videoHeight)

  return (
    <View style={{flex: (orientation === 'PORTRAIT') ? 1 : undefined, justifyContent: 'center'}}>
    <GuageView onSetOrientation={onSetOrientation} onSetWidth={onSetWidth}>
      <View style={styles.centeredContent}>
        <YoutubePlayer
          height={videoHeight}
          width={videoWidth}
          play={true}
          videoId={id}
        />
      </View>
      </GuageView>
    </View>
  );

};
const styles = StyleSheet.create({
  textContainer: {
    flex: 1,
  },
  centeredContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default VideoPlayerItem;