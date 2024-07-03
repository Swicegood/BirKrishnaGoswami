import React, { useState, useEffect } from 'react';
import {
  Dimensions, FlatList, Image, TouchableOpacity, StyleSheet,
  Platform, Text, ScrollView, View
} from 'react-native';
import { Link } from 'expo-router';
import placeholderImage from '../assets/images/placeholder-podq8jasdkjc0jdfrw96hbgsm3dx9f5s9dtnqlglf4.png'; // replace with your placeholder image path
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from './api/firebase';
import MeasureView from './api/MeasureView';


const screenWidth = Dimensions.get('window').width;

type ImageItem = {
  url: string;
  id: string;
  description: string;
};

const isTablet = () => {
  const { width, height } = Dimensions.get('window');
  const aspectRatio = width / height;
  return Math.min(width, height) >= 600 && (aspectRatio > 1.2 || aspectRatio < 0.9);
}


const GalleryComponent = () => {


  // Create an array of 15 placeholder ImageItem objects
  const placeholderImages: ImageItem[] = new Array(15).fill({
    url: null,
    description: '',
    id: '',
  });

  // Set the initial state to the placeholder ImageItem objects
  const [images, setImages] = useState<ImageItem[]>(placeholderImages);

  const [orientation, setOrientation] = useState(Dimensions.get('window').width > Dimensions.get('window').height ? 'LANDSCAPE' : 'PORTRAIT');
  const [width, setWidth] = useState(Dimensions.get('window').width);
  const [height, setHeight] = useState(Dimensions.get('window').height);
  const aspectRatio = width / height;
  const [numColumns, setNumColumns] = useState(2);


  useEffect(() => {
    const newImages: ImageItem[] = [];
    const q = query(collection(db, 'bkgpics'), orderBy('id'));

    getDocs(q)
      .then((snapshot) => {
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          // Check if an image with the same id already exists in the newImages array
          if (!newImages.some((image) => image.id === data.id)) {
            newImages.push({
              url: data.url,
              description: data.description,
              id: data.id
            });
          }
        });
        setImages(newImages);
      })
      .catch((error) => console.log('Error getting documents: ', error));

  }
    , []);

  const onSetWidth = (width: number) => {
    setWidth(width);
  }

  const onSetOrientation = (orientation: string) => {
    if ((Platform.OS === 'android' && !isTablet()) || Platform.OS === 'web') {
      setOrientation(orientation === 'LANDSCAPE' ? 'PORTRAIT' : 'LANDSCAPE');
    } else {
      setOrientation(orientation);
    }
    return;
    setOrientation(orientation);
  }

  useEffect(() => {
    setNumColumns(orientation === 'LANDSCAPE' || Platform.OS === 'web' ? 4 : isTablet() ? 3 : 2);
  }, [orientation]);

  const renderContent = () => (
      <FlatList
        data={images}
        numColumns={numColumns}
        key={numColumns}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item, index }) => (
          <Link href={{ pathname: "./PicturesScreen", params: { id: item.id } }} asChild>
            <TouchableOpacity style={{ padding: 20, borderRadius: 10 }}>
              <Image source={item.url ? { uri: item.url } : placeholderImage} style={{ width: isTablet() || Platform.OS === 'web' ? (width / numColumns) - 40 : (screenWidth / 2) - 40, height: isTablet() || Platform.OS == 'web' ? 280 : 170, borderRadius: 10 }} />
              <Text style={[styles.text, { flexShrink: 1 }]}>{item.description}</Text>
            </TouchableOpacity>
          </Link>
        )}
      />
  );

  return (
    <MeasureView onSetOrientation={onSetOrientation} onSetWidth={onSetWidth}>
      {Platform.OS === 'web' ? (
        <ScrollView style={{ height: '100vh', paddingBottom: 100 }}>
          <View style={{ minHeight: '100%' }}>
            {renderContent()}
          </View>
        </ScrollView>
      ) : (
        renderContent()
      )}
    </MeasureView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },

});

export default GalleryComponent;