import React, { useState, useEffect, useRef } from 'react';
import { Dimensions, FlatList, Image, TouchableOpacity, StyleSheet,
  Platform, Text } from 'react-native';
import { Link } from 'expo-router';
import placeholderImage from '../assets/images/placeholder-podq8jasdkjc0jdfrw96hbgsm3dx9f5s9dtnqlglf4.png'; // replace with your placeholder image path
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from './api/firebase';

const screenWidth = Dimensions.get('window').width;


const GalleryComponent = () => {
  const placeholderImages = new Array(15).fill(placeholderImage); // Create an array of 15 placeholder images
  const [images, setImages] = useState(placeholderImages); // Set the initial state to the placeholder images
  // Create a ref to track the mounted status
  const isMounted = useRef(true);


  type ImageItem = {
    url: string;
    description: string;
    location: string;
  };

  const [initialImage] = useState(0);


  useEffect(() => {
    const newImages = [];
    const q = query(collection(db, 'temples'), orderBy('location'));

    getDocs(q)
      .then((snapshot) => {
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          newImages.push({
            url: data.url,
            description: data.description,
            location: data.location,
            date: data.date,
          });
        });
        // Only call setImages if the component is still mounted
        if (isMounted.current) {
          setImages(newImages);
        }
      })
      .catch((error) => console.log('Error getting documents: ', error));

    // Clean up function to set isMounted to false when the component unmounts
    return () => {
      isMounted.current = false;
    };
  }, []);

  return (
    <FlatList
      data={images}
      numColumns={2}
      keyExtractor={(item, index) => index.toString()}
      renderItem={({ item, index }) => {
        if (Platform.OS === 'web') {
          return (<Link href={{ pathname: "./CustomImageGalleryScreen", params: { captionsSlice: item.description+'\n'+(item.location ? item.location.replace(/,/g, '') : ''), imagesSlice: item.url } }} asChild>
            <TouchableOpacity style={{ padding: 20, borderRadius: 10 }}>
              <Image defaultSource={placeholderImage} source={{ uri: item.url }} style={{ width: (screenWidth / 2) - 40, height: 170, borderRadius: 10 }} />
              <Text style={styles.text} >{item.location}</Text>
              <Text style={[styles.text, { flexShrink: 1 }]}>{item.description}</Text>
            </TouchableOpacity>
          </Link>
          );
        }
        return (<Link href={{ pathname: "./PhotosScreen", params: { captionsSlice: item.description+'\n'+(item.location ? item.location.replace(/,/g, '') : ''), imagesSlice: item.url } }} asChild>
            <TouchableOpacity style={{ padding: 20, borderRadius: 10 }}>
              <Image defaultSource={placeholderImage} source={{ uri: item.url }} style={{ width: (screenWidth / 2) - 40, height: 170, borderRadius: 10 }} />
              <Text style={styles.text} >{item.location}</Text>
              <Text style={[styles.text, { flexShrink: 1 }]}>{item.description}</Text>
            </TouchableOpacity>
          </Link>
        );
      }}
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