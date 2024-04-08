import React, { useState, useEffect } from 'react';
import { Dimensions, FlatList, Image, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Link } from 'expo-router';
import placeholderImage from '../assets/images/placeholder-podq8jasdkjc0jdfrw96hbgsm3dx9f5s9dtnqlglf4.png'; // replace with your placeholder image path
import { collection, getFirestore, query, orderBy, getDocs } from "firebase/firestore";

  
const screenWidth = Dimensions.get('window').width;

type ImageItem = {
  url: string;
  id: string;
  description: string;
};


const GalleryComponent = () => {


  // Create an array of 15 placeholder ImageItem objects
  const placeholderImages: ImageItem[] = new Array(15).fill({
    url: null,
    description: '',
    id: '',
  });
  
  // Set the initial state to the placeholder ImageItem objects
  const [images, setImages] = useState<ImageItem[]>(placeholderImages);


  useEffect(() => {
    const db = getFirestore();
    
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
  
  return (
    <FlatList
      data={images}
      numColumns={2}
      keyExtractor={(item, index) => index.toString()}
      renderItem={({ item, index }) => (
        <Link href={ {pathname: "./PicturesScreen", params: {id: item.id}} }asChild>
        <TouchableOpacity style={{ padding: 20, borderRadius: 10 }}>
          <Image source={item.url ? {uri: item.url} : placeholderImage} style={{ width: (screenWidth / 2) - 40, height: 170, borderRadius: 10 }} />
          <Text style={[styles.text, { flexShrink: 1 }]}>{item.description}</Text>
        </TouchableOpacity>
        </Link>
      )}
    />
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