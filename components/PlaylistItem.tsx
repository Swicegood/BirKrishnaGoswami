import React, { useEffect, useState} from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { Link } from 'expo-router'

const screenwidth = Dimensions.get('window').width;
const screenheight = Dimensions.get('window').height;

const PlaylistItem = ({ title, lastModified, thumbnail, id }) => {
  const [itemWidth, setItemWidth] = useState(screenwidth / 2); // replace 0 with your initial width value

  useEffect(() => {
    // Any code here will run when the component mounts

    return () => {
      // Any code here will run when the component unmounts
      setItemWidth(screenwidth / 2);
    };
  }, []);

  const styles = StyleSheet.create({
    item: {
      flexDirection: 'row',
      padding: 10,
      alignItems: 'center',
    },
    image: {
      width: itemWidth,
      height: screenheight / 8,
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

  return (
    <View style={styles.item}>
      {/* You would replace require with your dynamic image based on the playlist */}
      <Link href={{pathname:'./PlaylistScreen', params: {id: id}}}> {/* This is the link to the PlaylistScreen */}
        <Image style={styles.image} source={{ uri: thumbnail }} />
      </Link>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.lastModified}>Last Modified: {lastModified.split("T")[0]}</Text>
        <Text style={styles.lastModified}>{lastModified.split("T")[1]}</Text>
      </View>
    </View>
  );
};

export default PlaylistItem;