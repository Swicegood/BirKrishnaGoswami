import { View, Dimensions } from 'react-native';
import ImageGallery from 'react-native-image-gallery';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, Text } from 'react-native';

const PhotosScreen = () => {
  let { imagesSlice } = useLocalSearchParams<{ imagesSlice: string }>();
  const [images, setImages] = useState([]);

  useEffect(() => {
    // Split the string into an array of strings
    let imageUrls = imagesSlice.split(',');

    // Fetch dimensions for all images
    let imagePromises = imageUrls.map((url) =>
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

  // return (
  //   <Text>Photos</Text>
  // );
  
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
