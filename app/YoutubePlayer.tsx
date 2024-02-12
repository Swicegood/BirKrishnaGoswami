import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import { useLocalSearchParams } from 'expo-router';

interface VideoItemProps {
  id: string;
  title: string;
  lastModified: string;
}

const VideoPlayerItem = () => {
  const { id } = useLocalSearchParams<VideoItemProps>();
  return (
    <View style={styles.textContainer}>
      <YoutubePlayer
        height={300} // Adjust based on your needs
        play={false} // If you want the video to start playing as soon as it loads, set this to true
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