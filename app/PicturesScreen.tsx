import React, { useState, useEffect } from 'react';
import { Dimensions, FlatList, Image, TouchableOpacity } from 'react-native';
import { Link, useLocalSearchParams} from 'expo-router';
import { getAllFiles } from './api/apiWrapper';
import placeholderImage from '../assets/images/placeholder-podq8jasdkjc0jdfrw96hbgsm3dx9f5s9dtnqlglf4.png'; // replace with your placeholder image path


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

const GalleryComponent = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  console.log("id", id);
  const placeholderImages: string[] = new Array(15).fill(placeholderImage); // Create an array of 15 placeholder images // Create an array of 15 placeholder images
  const [images, setImages] = useState<string[]>(placeholderImages); // Set the initial state to the placeholder images
  const [numColumns, setNumColumns] = useState(getOrientation());

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', onChange);
    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    let isMounted = true;  // add this line
  
    getAllFiles('imageList', 'imageFiles').then((data: string[]) => {
      if (isMounted) {  // check if component is still mounted
        setImages(data.length ? data.filter(item => item.includes(id)) : placeholderImages);
      }
    });
  
    return () => {
      isMounted = false;  // set to false when component unmounts
    };
  }, []);

  function getOrientation() {
    const { width, height } = Dimensions.get('window');
    return width > height ? 4 : 2;
  }

  function onChange() {
    setNumColumns(getOrientation());
  }

  // Split images into chunks of 15
  return (
    <FlatList
      data={chunkArray(images, 15)}
      numColumns={numColumns}
      key={numColumns} // Add this line
      keyExtractor={(item, index) => index.toString()}
      renderItem={({ item }) => (
        <Link href={ {pathname: "./GalleryScreen", params: {imageChunk: item}} }asChild>
        <TouchableOpacity>
        <Image defaultSource={placeholderImage} source={{uri: String(item[0])}} style={{ width: screenWidth / 2, height: 200}} />
        </TouchableOpacity>
        </Link>
      )}
    />
  );
};

export default GalleryComponent;