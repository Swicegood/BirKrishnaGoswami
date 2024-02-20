import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';import YoutubePlayer from 'react-native-youtube-iframe';
import { useLocalSearchParams } from 'expo-router';


interface VideoItemProps {
  id: string;
  title: string;
  lastModified: string;
}

const VideoPlayerItem = () => {
  const { id } = useLocalSearchParams<VideoItemProps>();
  const [videoHeight, setVideoHeight] = useState(Dimensions.get('window').width * 9 / 16); // initialize with a number

  useEffect(() => {
    getVideoHeight().then(setVideoHeight); // set the initial height when the component mounts

    ScreenOrientation.addOrientationChangeListener(handleOrientationChange);

    return () => {
      ScreenOrientation.removeOrientationChangeListener(handleOrientationChange);
    };
  }, []);

  function handleOrientationChange() {
    getVideoHeight().then(setVideoHeight);
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
      return screenHeight;
    }
  }

  return (
    <View style={styles.textContainer}>
      <YoutubePlayer
        height={videoHeight} // Await the getVideoHeight() function to get the actual height value
        play={true}
        videoId={id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },

});

export default VideoPlayerItem;