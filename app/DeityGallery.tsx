import React, { useState, useEffect } from 'react';
import { Dimensions, FlatList, Image, TouchableOpacity, Platform
  , ScrollView, View
 } from 'react-native';
import { Link } from 'expo-router';
import { getAllFiles } from './api/apiWrapper';
import placeholderImage from '../assets/images/placeholder-podq8jasdkjc0jdfrw96hbgsm3dx9f5s9dtnqlglf4.png'; // replace with your placeholder image path
import GuageView from '../components/GuageView';
import useIsMobileWeb from '../hooks/useIsMobileWeb';

const ORIENTATION_THRESHOLD = 0.1; // 10% threshold

// Function to split array into chunks
const chunkArray = (myArray: string[], chunk_size: number): string[][] => {
  let index = 0;
  const arrayLength = myArray.length;
  const tempArray = [];

  for (index = 0; index < arrayLength; index += chunk_size) {
    const myChunk = myArray.slice(index, index + chunk_size);
    tempArray.push(myChunk);
  }

  return tempArray;
}

const screenWidth = Dimensions.get('window').width;

const isTablet = () => {
  const { width, height } = Dimensions.get('window');
  const aspectRatio = width / height;
  const isLandscape = Math.min(width, height) >= 600 && (aspectRatio > 1.2 || aspectRatio < 0.9);
  console.log('isTablet: ', isLandscape);
  return isLandscape
}

const GalleryComponent = () => {
  const [initialImage] = useState(0);
  const [numColumns, setNumColumns] = useState(getOrientation());
  const placeholderImages = new Array(15).fill(placeholderImage); // Create an array of 15 placeholder images
  const [images, setImages] = useState(placeholderImages); // Set the initial state to the placeholder images
  const [height, setHeight] = useState(Dimensions.get('window').height);
  const [width, setWidth] = useState(Dimensions.get('window').width);
  const [orientation, setOrientation] = useState(Dimensions.get('window').width > Dimensions.get('window').height ? 'LANDSCAPE' : 'PORTRAIT');
  const isMobileWeb = useIsMobileWeb();

  const onSetWidth = (width: number) => {
    console.log('width: ', width);
    setWidth(width);
  }

  const handleOrientationChange = () => {
    const newWidth = Dimensions.get('window').width;
    const newHeight = Dimensions.get('window').height;
    const aspectRatio = newWidth / newHeight;
    const previousAspectRatio = width / height;

    // Only change orientation if the aspect ratio change is significant
    if (Math.abs(aspectRatio - previousAspectRatio) > ORIENTATION_THRESHOLD) {
      const newOrientation = newWidth > newHeight ? 'LANDSCAPE' : 'PORTRAIT';
      setOrientation(newOrientation);
    }

    setWidth(newWidth);
    setHeight(newHeight);
    console.log('HandleOrientation Called :', orientation);
  }


  const onSetOrientation = (orientation: string) => {
    if (Platform.OS === 'web') {
      handleOrientationChange(orientation);
    } else {
      setOrientation(orientation);
    }
  };

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', onChange);
    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    setNumColumns(orientation === 'LANDSCAPE' ? 4 : isTablet() ? 3 : 2);
  }, [orientation]);

  function getOrientation() {
    const { width, height } = Dimensions.get('window');
    return width > height ? 4 : 2;
  }

  function onChange() {
    setNumColumns(getOrientation());
  }

  useEffect(() => {
    getAllFiles('deityList', 'deities').then((data) => {
      setImages(data.length ? data : placeholderImages); // If data is fetched, set images to data. Otherwise, keep the placeholder images.
    });
  }
    , []);

  useEffect(() => {
    getAllFiles('deityList', 'deities').then((data) => {
      setImages(data);
    });
  }, []);

  const renderContent = () => (
    <FlatList
      data={chunkArray(images, 15)}
      numColumns={numColumns}
      key={numColumns}
      keyExtractor={(item, index) => index.toString()}
      renderItem={({ item, index }) => (
        <Link href={{ pathname: "./GalleryScreen", params: { imageChunk: item } }} asChild>
          <TouchableOpacity>
            <Image
              defaultSource={placeholderImage}
              source={{ uri: String(item[0]) }}
              style={{ width: width / numColumns, height: 200 }}
            />
          </TouchableOpacity>
        </Link>
      )}
    />
  );

  return (
    <GuageView onSetOrientation={onSetOrientation} onSetWidth={onSetWidth}>
      {Platform.OS === 'web' ? (
        <ScrollView style={{ height: '100vh' }}>
          <View style={{ minHeight: '100%' }}>
            {renderContent()}
          </View>
        </ScrollView>
      ) : (
        renderContent()
      )}
    </GuageView>
  );
};

export default GalleryComponent;