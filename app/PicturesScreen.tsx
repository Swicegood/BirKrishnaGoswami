import React, { useState, useEffect } from 'react';
import { Dimensions, FlatList, Image, TouchableOpacity, Platform, ScrollView, View } from 'react-native';
import { Link, useLocalSearchParams } from 'expo-router';
import { getAllFiles } from './api/apiWrapper';
import placeholderImage from '../assets/images/placeholder-podq8jasdkjc0jdfrw96hbgsm3dx9f5s9dtnqlglf4.png';
import GuageView from '../components/GuageView';

// Function to split array into chunks
const chunkArray = (myArray: string[], chunk_size: number): string[][] => {
  let index = 0;
  const arrayLength = myArray.length;
  const tempArray: string[][] = [];
  
  for (index = 0; index < arrayLength; index += chunk_size) {
    const myChunk = myArray.slice(index, index+chunk_size);
    tempArray.push(myChunk);
  }

  return tempArray;
}

const screenWidth = Dimensions.get('window').width;

const isTablet = () => {
  const { width, height } = Dimensions.get('window');
  const aspectRatio = width / height;
  return Math.min(width, height) >= 600 && (aspectRatio > 1.2 || aspectRatio < 0.9);
};

const PicturesScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const placeholderImages: string[] = new Array(15).fill(placeholderImage);
  const [images, setImages] = useState<string[]>(placeholderImages);
  const [numColumns, setNumColumns] = useState(getOrientation());
  const [width, setWidth] = useState(Dimensions.get('window').width);
  const [orientation, setOrientation] = useState(Dimensions.get('window').width > Dimensions.get('window').height ? 'LANDSCAPE' : 'PORTRAIT');

  const onSetWidth = (width: number) => {
    setWidth(width);
  };

  const onSetOrientation = (orientation: string) => {
    if (Platform.OS === 'web') {
      setOrientation(orientation === 'LANDSCAPE' ? 'PORTRAIT' : 'LANDSCAPE');
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
    setNumColumns(orientation === 'LANDSCAPE' || Platform.OS === 'web' ? 4 : isTablet() ? 3 : 2);
  }, [orientation]);

  function getOrientation() {
    const { width, height } = Dimensions.get('window');
    return width > height ? 4 : 2;
  }

  function onChange() {
    setNumColumns(getOrientation());
  }

  useEffect(() => {
    let isMounted = true;

    getAllFiles('imageList', 'imageFiles').then((data: string[]) => {
      if (isMounted) {
        setImages(data.length ? data.filter(item => item.includes(id)) : placeholderImages);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [id]);

  const renderContent = () => (
    <FlatList
      data={chunkArray(images, 15)}
      numColumns={numColumns}
      key={numColumns}
      keyExtractor={(item, index) => index.toString()}
      renderItem={({ item }) => (
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

export default PicturesScreen;