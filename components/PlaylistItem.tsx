import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';

const PlaylistItem = ({ title, lastModified, thumbnail }) => {
  return (
    <View style={styles.item}>
      {/* You would replace require with your dynamic image based on the playlist */}
      <Image style={styles.image} source={{ uri: thumbnail }} />
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.lastModified}>{lastModified}</Text>
      </View>
    </View>
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
    color: 'gray',
  },
});

export default PlaylistItem;