import React from 'react';
import { FlatList, Image, TouchableOpacity, Text } from 'react-native';
import { Link, useLocalSearchParams } from 'expo-router';
import placeholderImage from '../assets/images/placeholder-podq8jasdkjc0jdfrw96hbgsm3dx9f5s9dtnqlglf4.png'; // replace with your placeholder image path


const GalleryComponent = () => {
  const { imageChunk } = useLocalSearchParams<{ imageChunk: string }>();
  
  // Split the string into an array of strings
  const images = imageChunk.split(',');

  console.log("images4", images[4]); 

  return (
    <FlatList
      data={images}
      numColumns={4}
      keyExtractor={(item, index) => index.toString()}
      renderItem={({ item, index }) => (
        <Link href={{pathname: "./PhotosScreen", params: {imagesSlice: images}}} asChild>
          <TouchableOpacity style={{ padding: 2}}>
            <Image defaultSource={placeholderImage} source={{uri: item}} style={{ width: 100, height: 100 }} />
          </TouchableOpacity>
        </Link>
      )}
    />
  );
};
export default GalleryComponent;