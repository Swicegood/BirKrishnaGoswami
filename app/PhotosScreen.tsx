import { View, Dimensions } from 'react-native';
import ImageGallery from 'react-native-image-gallery';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState, useRef } from 'react';
import { Image, Text } from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';

const placeholderImage = { source: require('../assets/images/placeholder-podq8jasdkjc0jdfrw96hbgsm3dx9f5s9dtnqlglf4.png'), dimensions: { width: 600, height: 600 } };

const PhotosScreen = () => {
  const { imagesSlice, captionsSlice } = useLocalSearchParams<{ imagesSlice: string, captionsSlice: string }>();
  const imageUrls = imagesSlice.split(',');
  const captions = captionsSlice ? captionsSlice.split(',') : [];
  const [images, setImages] = useState(imageUrls.map(() => placeholderImage));
  const [imageHeight, setImageHeight] = useState(0);
  const [imageWidth, setImageWidth] = useState(0);
  const isMounted = useRef(true);

  useEffect(() => {
    getImageHeight().then(setImageHeight); // set the initial height when the component mounts
    getImageWidth().then(setImageWidth); // set the initial width when the component mounts

    // Store the subscription object in a variable
    const subscription = ScreenOrientation.addOrientationChangeListener(handleOrientationChange);

    return () => {
      // Pass the subscription object to removeOrientationChangeListener
      ScreenOrientation.removeOrientationChangeListener(subscription);
    };
  }, []);

  useEffect(() => {
    // Split the string into an array of strings
    const imageUrls = imagesSlice.split(',');

    // Initialize images with placeholder
    setImages(imageUrls.map(() => placeholderImage));

    // Fetch dimensions for all images
    const imagePromises = imageUrls.map((url, index) =>
      new Promise((resolve, reject) => {
        Image.getSize(
          url,
          (width, height) => {
            if (isMounted.current) {
              resolve({ source: { uri: url, dimensions: { width, height } }, caption: captions[index] || '' });
            }
          },
          reject
        );
      })
    );

    Promise.all(imagePromises)
      .then((imagesWithDimensions) => {
        if (isMounted.current) {
          setImages(imagesWithDimensions);
        }
      })
      .catch((error) => {
        console.error('Error fetching image dimensions:', error);
      });

    // Clean up function to set isMounted to false when the component unmounts
    return () => {
      isMounted.current = false;
    };
  }, [imagesSlice]);


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

  console.log('images', images);
  return (
    <View style={{ flex: 1, backgroundColor: 'black', position: 'relative' }}>
      <ImageGallery
        style={{ width: Dimensions.get('window').width, height: 300 }}
        images={images}
      />
      <View style={{ flex: 1, alignItems: 'center', position: 'absolute', top: '80%', left: 0, right: 0 }}>
        <Text style={{ color: 'white', fontSize: 20, textAlign: 'center' }}>
          {captions[0]}
        </Text>
      </View>
    </View>
  );
};
export default PhotosScreen;