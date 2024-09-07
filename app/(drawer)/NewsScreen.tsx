import React, { useState, useEffect } from 'react';
import { Dimensions, FlatList, Image, TouchableOpacity, StyleSheet, Text, Platform } from 'react-native';
import { Link } from 'expo-router';
import placeholderImage from '../../assets/images/placeholder-podq8jasdkjc0jdfrw96hbgsm3dx9f5s9dtnqlglf4.png'; // replace with your placeholder image path
import { collection, query, orderBy, limit, getDocs, where, addDoc } from "firebase/firestore";
import { db } from '../api/firebase';
import { useFocusEffect } from '@react-navigation/native';
  
const screenWidth = Dimensions.get('window').width;


const GalleryComponent = () => {
  const placeholderImages = new Array(15).fill(placeholderImage); // Create an array of 15 placeholder images
  const [images, setImages] = useState(placeholderImages); // Set the initial state to the placeholder images

  type ImageItem = {
    url: string;
    description: string;
    location: string;
  };
  
  const [initialImage] = useState(0);

  useFocusEffect(
    React.useCallback(() => {
      const unsubscribe = () => {
        // Push a new entry onto the history stack when the screen comes into focus
        if (Platform.OS === 'web') {
          window.history.pushState(null, '');
        }
      };

      unsubscribe();
      return () => unsubscribe();
    }, [])
  );

  useEffect(() => {
    const newImages = [];
    const q = query(collection(db, 'news'), orderBy('date'));
  
    getDocs(q)
      .then((snapshot) => {
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          newImages.push({
            url: data.imageurl,
            headline: data.headline,
            text: data.text,
            date: data.date,
            youTubeId: data.youTubeId,
            category: data.category,
          });
        });
        setImages(newImages);
      })
      .catch((error) => console.log('Error getting documents: ', error));
  }, []);
  
  return (
    <FlatList
      data={images}
      numColumns={2}
      keyExtractor={(item, index) => index.toString()}
      renderItem={({ item, index }) => (
        <Link href={{ pathname: "../NewsItemScreen", params: { newsItem: JSON.stringify(item) } }} asChild>
        <TouchableOpacity style={{ padding: 20, borderRadius: 10 }}>
          <Image defaultSource={placeholderImage} source={{uri: item.url}} style={{ width: (screenWidth / 2) - 40, height: 170, borderRadius: 10 }} />  
          <Text style={styles.text} >{item.location}</Text>
          <Text style={[styles.text, { flexShrink: 1 }]}>{item.headline}</Text>
          <Text style={styles.text}>{item.date}</Text>
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