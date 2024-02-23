import React, { useState, useEffect } from 'react';
import { Dimensions, FlatList, Image, TouchableOpacity, View } from 'react-native';
import { Link } from 'expo-router';
import { getAllDeityFiles } from './api/apiWrapper';
import placeholderImage from '../assets/images/placeholder-podq8jasdkjc0jdfrw96hbgsm3dx9f5s9dtnqlglf4.png'; // replace with your placeholder image path


// Function to split array into chunks
const chunkArray = (myArray, chunk_size) => {
    let index = 0;
    const arrayLength = myArray.length;
    const tempArray = [];
    
    for (index = 0; index < arrayLength; index += chunk_size) {
      const myChunk = myArray.slice(index, index+chunk_size);
      tempArray.push(myChunk);
    }
  
    return tempArray;
  };
  
const screenWidth = Dimensions.get('window').width;


const GalleryComponent = () => {
  const [initialImage] = useState(0);
  const [images, setImages] = useState([]);

  useEffect(() => {
    getAllDeityFiles().then((data) => {
      setImages(data);
    });
  }, []);

  // Split images into chunks of 15
  const imageChunks = chunkArray(images, 2);

  console.log("imageChunks", imageChunks[1]);
  return (
    <FlatList
      data={imageChunks}
      numColumns={2}
      keyExtractor={(item, index) => index.toString()}
      renderItem={({ item, index }) => (
        <Link href={ {pathname: "./GalleryScreen", params: {imageChunk: item}} }asChild>
          <TouchableOpacity>
            <Image 
              defaultSource={placeholderImage} // placeholder image
              source={{ uri: item[0]}}
              style={{ width: screenWidth / 2, height: 200 }} 
            />
            {console.log("item", item[0])}
          </TouchableOpacity>
        </Link>
      )}
    />
  );
};

export default GalleryComponent;