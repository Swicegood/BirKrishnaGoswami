import React, { useState, useEffect } from 'react';
import { FlatList, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Link, useLocalSearchParams } from 'expo-router';
import placeholderImage from '../assets/images/placeholder-podq8jasdkjc0jdfrw96hbgsm3dx9f5s9dtnqlglf4.png'; // replace with your placeholder image path

const GalleryComponent = () => {
  const { imageChunk } = useLocalSearchParams<{ imageChunk: string }>();
  
  // Split the string into an array of strings
  const images:<string[]> = imageChunk.split(',');

  const [numColumns, setNumColumns] = useState(getOrientation());

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', onChange);
    return () => {
      subscription.remove();
    };
  }, []);

  function getOrientation() {
    const { width, height } = Dimensions.get('window');
    return width > height ? 8 : 4;
  }

  function onChange() {
    setNumColumns(getOrientation());
  }

  const originalImage = (imageUrl: string) => {
    const originalUrl = imageUrl.replace('300w', 'original');
    return originalUrl;
  };

  return (
    <FlatList
      data={images}
      numColumns={numColumns}
      key={numColumns} // Add this line
      keyExtractor={(item, index) => index.toString()}
      contentContainerStyle={{ justifyContent: 'center' }}
      renderItem={({ item }) => (
        <Link href={{pathname: "./PhotosScreen", params: {imagesSlice: originalImage(imageChunk)}}} asChild>
          <TouchableOpacity style={{ padding: 2}}>
            <Image defaultSource={placeholderImage} source={{uri: item}} style={{ width: 100, height: 100 }} />
          </TouchableOpacity>
        </Link>
      )}
    />
  );
};

export default GalleryComponent;