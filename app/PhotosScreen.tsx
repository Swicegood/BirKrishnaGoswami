import { View, Dimensions } from 'react-native';
import ImageGallery from 'react-native-image-gallery';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, Text } from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';

const placeholderImage = { source: require('../assets/images/placeholder-podq8jasdkjc0jdfrw96hbgsm3dx9f5s9dtnqlglf4.png'), dimensions: { width: 600, height: 600 } };const PhotosScreen = () => {
  const { imagesSlice } = useLocalSearchParams<{ imagesSlice: string }>();
  const [images, setImages] = useState([]);
  const [imageHeight, setImageHeight] = useState(0);
  const [imageWidth, setImageWidth] = useState(0);

  useEffect(() => {
    getImageHeight().then(setImageHeight); // set the initial height when the component mounts
    getImageWidth().then(setImageWidth); // set the initial width when the component mounts

    ScreenOrientation.addOrientationChangeListener(handleOrientationChange);

    return () => {
      ScreenOrientation.removeOrientationChangeListener(handleOrientationChange);
    };
  }, []);


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

  function handleOrientationChange() {
    getImageHeight().then(setImageHeight);
    getImageWidth().then(setImageWidth);
  }

  async function getImageHeight() {
    const orientation = await ScreenOrientation.getOrientationAsync();
    const screenWidth = Dimensions.get('window').width;
    const screenHeight = Dimensions.get('window').height;

    if (orientation === ScreenOrientation.Orientation.PORTRAIT_UP || orientation === ScreenOrientation.Orientation.PORTRAIT_DOWN) {
      // In portrait mode, set height based on screen width and aspect ratio
      return screenWidth * 9 / 16;
    } else {
      // In landscape mode, set height to screen height
      return screenHeight;
    }
  }

  async function getImageWidth() {
    const orientation = await ScreenOrientation.getOrientationAsync();
    const screenWidth = Dimensions.get('window').width;
    const screenHeight = Dimensions.get('window').height;

    if (orientation === ScreenOrientation.Orientation.PORTRAIT_UP || orientation === ScreenOrientation.Orientation.PORTRAIT_DOWN) {
      // In portrait mode, set height based on screen width and aspect ratio
      return screenWidth;
    } else {
      // In landscape mode, set height to screen height
      return screenHeight;
    }
  }

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