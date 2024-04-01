import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { Link } from 'expo-router'

interface VideoItemProps {
  title: string;
  lastModified: string;
  thumbnail: string;
  id: string;
}

const VideoItem: React.FC<VideoItemProps> = ({ title, lastModified, thumbnail, id }) => {
  return (
    <Link href={{pathname: '/YoutubePlayer', params:{id: id}}}> {/* This is the link to the PlaylistScreen */}
    <View style={styles.item}>
      {/* You would replace require with your dynamic image based on the playlist */}
      <Image style={styles.image} source={{ uri: thumbnail }} />
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.lastModified}>Last Modified: {lastModified.split("T")[0]}</Text>
        <Text style={styles.lastModified}>{lastModified.split("T")[1]}</Text>
      </View>
    </View>
    </Link>
  );
};

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    padding: 10,
    alignItems: 'center',
  },
  image: {
    width: Dimensions.get('window').width / 2,
    height: Dimensions.get('window').height / 8,
    borderRadius: 5,
    marginRight: 10,
  },
  textContainer: {
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  lastModified: {
    fontSize: 12,
  },
});

export default VideoItem;
