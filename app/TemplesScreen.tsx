import React, { useState, useEffect } from 'react';
import { Dimensions, FlatList, Image, TouchableOpacity, View } from 'react-native';
import { Link } from 'expo-router';
import { getAllTempleFiles } from './api/apiWrapper';
import placeholderImage from '../assets/images/placeholder-podq8jasdkjc0jdfrw96hbgsm3dx9f5s9dtnqlglf4.png'; // replace with your placeholder image path


  
const screenWidth = Dimensions.get('window').width;


const GalleryComponent = () => {
  const [initialImage] = useState(0);

const [images, setImages] = useState<string[]>([]);
  useEffect(() => {
    getAllTempleFiles().then((data) => {
      setImages(data);
    });
  }, []);

  

  return (
    <FlatList
      data={images}
      numColumns={2}
      keyExtractor={(item, index) => index.toString()}
      renderItem={({ item, index }) => (
        <Link href={ {pathname: "./GalleryScreen", params: {imageChunk: item}} }asChild>
        <TouchableOpacity>
          <Image defaultSource={placeholderImage} source={{uri: item}} style={{ width: screenWidth / 2, height: 200}} />
        </TouchableOpacity>
        </Link>
      )}
    />
  );
};

export default GalleryComponent;