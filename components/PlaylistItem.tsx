import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { Link } from 'expo-router'

interface PlaylistItemProps {
  title: string;
  lastModified: string;
  thumbnail: string;
  id: string;
}

const PlaylistItem: React.FC<PlaylistItemProps> = ({ title, lastModified, thumbnail, id }) => {


  return (
    <View style={styles.item}>
        <Image style={styles.image} source={{ uri: thumbnail }} />
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.lastModified}>Last Modified: {lastModified.split("T")[0]}</Text>
        <Text style={styles.lastModified}>{lastModified.split("T")[1].split(":").slice(0, -1).join(":")}</Text>
      </View>
    </View>
  );
};

  const styles = StyleSheet.create({
    item: {
      flexDirection: 'row',
      padding: 10,
      alignItems: 'center',
      marginVertical: -12,
    },
    image: {
      width: Dimensions.get('window').width / 2.1,
      height: Dimensions.get('window').height / 9,
      borderRadius: 5,
      marginRight: 10,
    },
    textContainer: {
      justifyContent: 'flex-start',
      width: Dimensions.get('window').width / 2.1,
      height: Dimensions.get('window').height / 9,
    },
    title: {
      fontSize: 16,
      fontWeight: 'bold',
      paddingBottom: 10,
      marginRight: 5,
      marginTop: 5,
    },
    lastModified: {
      fontSize: 12,
    },
  });

export default PlaylistItem;