import { View, Dimensions } from 'react-native';
import ImageGallery from 'react-native-image-gallery';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, Text } from 'react-native';

const placeholderImage = { source: require('../assets/images/placeholder-podq8jasdkjc0jdfrw96hbgsm3dx9f5s9dtnqlglf4.png'), dimensions: { width: 600, height: 600 } };const PhotosScreen = () => {
  const { imagesSlice } = useLocalSearchParams<{ imagesSlice: string }>();
  const [images, setImages] = useState([]);

  useEffect(() => {
    // Split the string into an array of strings
    const imageUrls = imagesSlice.split(',');

    // Initialize images with placeholder
    setImages(imageUrls.map(() => placeholderImage));

    // Fetch dimensions for all images
    const imagePromises = imageUrls.map((url) =>
      new Promise((resolve, reject) => {
        Image.getSize(
          url,
          (width, height) => resolve({ source: { uri: url, dimensions: { width, height } } }),
          reject
        );
      })
    );

    Promise.all(imagePromises)
      .then((imagesWithDimensions) => {
        setImages(imagesWithDimensions);
      })
      .catch((error) => {
        console.error('Error fetching image dimensions:', error);
      });
  }, [imagesSlice]);

  console.log("images4", images[4]);

  return (
    <View style={{ flex: 1 }}>
      <ImageGallery
        style={{ flex: 1, backgroundColor: 'black', width: Dimensions.get('window').width, height: 300}}
        images={images}
        // additional props
      />
    </View>
  );
};

export default PhotosScreen;