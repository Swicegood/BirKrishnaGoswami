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
  const [numColumns, setNumColumns] = useState(getOrientation());
  const placeholderImages = new Array(15).fill(placeholderImage); // Create an array of 15 placeholder images
  const [images, setImages] = useState(placeholderImages); // Set the initial state to the placeholder images

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', onChange);
    return () => {
      subscription.remove();
    };
  }, []);

  function getOrientation() {
    const { width, height } = Dimensions.get('window');
    return width > height ? 4 : 2;
  }

  function onChange() {
    setNumColumns(getOrientation());
  }

useEffect(() => {
    getAllDeityFiles().then((data) => {
      setImages(data.length ? data : placeholderImages); // If data is fetched, set images to data. Otherwise, keep the placeholder images.
    });
  }
, []);

  useEffect(() => {
    getAllDeityFiles().then((data) => {
      setImages(data);
    });
  }, []);

 
  return (
    <FlatList
      data={chunkArray(images, 15)}
      numColumns={numColumns}
      key={numColumns} // Add this line
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