import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { Link } from 'expo-router'

interface PlaylistItemProps {
  title: string;
  lastModified: string;
  thumbnail: string;
  id: string;
  containerStyle?: ViewStyle;
  imageStyle?: ImageStyle;
  textContainerStyle?: ViewStyle;
  titleStyle?: TextStyle;
  lastModifiedStyle?: TextStyle;
}

const PlaylistItem: React.FC<PlaylistItemProps> = ({ 
  title,
   lastModified,
    thumbnail, 
    id,
  containerStyle,
  imageStyle,
  textContainerStyle,
  titleStyle,
  lastModifiedStyle
}) => {
  return (
    <View style={[styles.item, containerStyle]}>
      <Image style={[styles.image, imageStyle]} source={{ uri: thumbnail }} />
      <View style={[styles.textContainer, textContainerStyle]}>
        <Text style={[styles.title, titleStyle]}>{title}</Text>
        <Text style={[styles.lastModified, lastModifiedStyle]}>Last Modified: {lastModified.split("T")[0]}</Text>
        <Text style={[styles.lastModified, lastModifiedStyle]}>{lastModified.split("T")[1].split(":").slice(0, -1).join(":")}</Text> 
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    paddingLeft: 10,
    paddingRight: 10,
    alignItems: 'center',
  },
  image: {
    width: Dimensions.get('window').width / 2.2,
    height: Dimensions.get('window').height / 9,
    borderRadius: 5,
    marginRight: 10,
  },
  textContainer: {
    justifyContent: 'flex-start',
    marginRight: 10,
    width: Dimensions.get('window').width / 2.2,
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