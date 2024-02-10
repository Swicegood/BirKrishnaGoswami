import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Image } from 'react-native';


const fiiesListurl = "http://atourcity.com/bkgoswami.com/wp/wp-content/uploads/all_files.txt"
const imageListurl = "http://atourcity.com/bkgoswami.com/wp/wp-content/uploads/all_images.txt"
const deityListurl = "http://atourcity.com/bkgoswami.com/wp/wp-content/uploads/all_deities.txt"


async function fetchFilesList(filesListUrl) {
  const proxyUrl = '';
  const response = await fetch(proxyUrl + filesListUrl);
  const txt = await response.text();

  // Split the text into lines and remove any empty lines or lines starting with '#'
  const files = txt.split('\n').filter(file => file.trim() !== '' && !file.trim().startsWith('#'));


  return files;
}


async function cacheFiles(files) {
  const expiration = files.length < 500
    ? Date.now() - 1 // Set the cache as already expired
    : Date.now() + 7 * 24 * 60 * 60 * 1000; // One week in the future

  const data = {
    files,
    expiration,
  };

  await AsyncStorage.setItem('mp3Files', JSON.stringify(data));
}

async function cacheImageFiles(files) {
  const expiration = files.length < 500
    ? Date.now() - 1 // Set the cache as already expired
    : Date.now() + 7 * 24 * 60 * 60 * 1000; // One week in the future

  const data = {
    files,
    expiration,
  };

  await AsyncStorage.setItem('imageFiles', JSON.stringify(data));
}

async function loadCachedFiles() {
  const rawData = await AsyncStorage.getItem('imageFiles');

  if (rawData) {
    const data = JSON.parse(rawData);
    if (Date.now() < data.expiration) {
      return data.files;
    }
  }

  // Fetch the list of files and cache them
  const files = await fetchFilesList(fiiesListurl);
  await cacheFiles(files);
  return files;
}

async function loadCachedImageFiles() {
  const rawData = await AsyncStorage.getItem('imageFiles');

  if (rawData) {
    const data = JSON.parse(rawData);
    if (Date.now() < data.expiration) {
      return data.files;
    }
  }

  // Fetch the list of files and cache them
  const files = await fetchFilesList(imageListurl);
  await cacheImageFiles(files);
  return files;
}



async function getAllFiles() {
  try
  {
  const files = await loadCachedFiles();
  return files;
  } catch (error) {
    console.error('Error in  getAllFiles:', error);
  }
}


async function getAllImageFiles() {
  try
  {
  const files = await loadCachedImageFiles();
  return files;
  } catch (error) {
    console.error('Error in  getAllFiles:', error);
  }
}

async function getPlayedFiles() {
  const rawData = await AsyncStorage.getItem('playedFiles');
  return rawData ? JSON.parse(rawData) : [];
}

// ... Other code ...

async function setPlayedFile(file, index) {
  const playedFiles = await getPlayedFiles();

  if (typeof index === "number") {
    playedFiles[index] = file;
  } else {
    playedFiles.push(file);
  }

  await AsyncStorage.setItem('playedFiles', JSON.stringify(playedFiles));
}

async function getCurrentIndex() {
  const rawData = await AsyncStorage.getItem('currentIndex');
  return rawData ? JSON.parse(rawData) : 0;
}

async function setCurrentIndex(index) {
  await AsyncStorage.setItem('currentIndex', JSON.stringify(index));
}

async function getRandomFile() {
  try{
  const files = await getAllFiles();
  const playedFiles = await getPlayedFiles();

  // Filter out the played files
  const unplayedFiles = files.filter(file => !playedFiles.includes(file));

  if (unplayedFiles.length === 0) {
    // All files have been played, reset the played files list
    await AsyncStorage.removeItem('playedFiles');
    return getRandomFile(); // Retry with an empty played files list
  }
  
  const randomIndex = Math.floor(Math.random() * unplayedFiles.length);
  const randomFile = unplayedFiles[randomIndex];
  const currentIndex = playedFiles.length;
  await setPlayedFile(randomFile, currentIndex);
  await setCurrentIndex(currentIndex);
  return randomFile;
} catch (error) {
  console.error('Error in getRandomFile:', error);
}
}




async function getPreviousFile() {
  try
  {
  const currentIndex = await getCurrentIndex();

  if (currentIndex <= 0) {
    return 0; // There is no previous file
  }

  const newIndex = currentIndex - 1;
  await setCurrentIndex(newIndex);
  const playedFiles = await getPlayedFiles();
  console.log("Previous file :", playedFiles[newIndex])
  return playedFiles[newIndex];
} catch (error) {
  console.error('Error in getpreviousFile:', error);
}
}

async function getNextFile() {
  try{
  const playedFiles = await getPlayedFiles();
  const currentIndex = await getCurrentIndex();
  const allFiles = await getAllFiles();

  if (currentIndex === allFiles.length - 1) {
    // If there is no next file, return random
    return getRandomFile();
  }

  const newIndex = currentIndex + 1;
  if (playedFiles[newIndex]) {
    // If the next file has already been played
    await setCurrentIndex(newIndex);
    return playedFiles[newIndex];
  } else {
    // If the next file has not been played
    const nextFile = allFiles[newIndex];
    await setPlayedFile(nextFile, newIndex);
    await setCurrentIndex(newIndex);
    return nextFile;
  }
} catch (error) {
  console.error('Error in geteNextFile:', error);
}
}


// Function to cache deity files
async function cacheDeityFiles(deities) {
  try {
    await AsyncStorage.setItem('deities', JSON.stringify(deities));
  } catch (error) {
    console.error('Error caching deity files:', error);
  }
}

// Function to load cached deity files
async function loadCachedDeityFiles() {
  try {
    const deities = await AsyncStorage.getItem('deities');
    return deities ? JSON.parse(deities) : [];
  } catch (error) {
    console.error('Error loading cached deity files:', error);
    return [];
  }
}

// Function to get all deity files
// Function to fetch deity image dimensions
function fetchDeityImageDimensions(deity) {
  return new Promise((resolve, reject) => {
    Image.getSize(
      deity.imageUrl,
      (width, height) => resolve({ ...deity, imageDimensions: { width, height } }),
      (error) => {
        console.error(`Failed to get size of image at ${deity.imageUrl}:`, error);
        resolve(deity);  // Resolve with the original deity object without dimensions
      }
    );
  });
}

async function getAllDeityFiles() {
  let deities = await loadCachedDeityFiles();

  if (deities.length === 0) {
    const response = await fetch(deityListurl);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.text();

    // Process the text data according to its format
    // For example, if the data is a list of URLs separated by newlines:
    deities = data.split('\n');

    // Remove deities whose imageUrl does not contain "1024"
    deities = deities.filter((deity) => deity.includes('1024'));

    //const imagePromises = deities.map(fetchDeityImageDimensions);

    //deities = await Promise.all(imagePromises);
    await cacheDeityFiles(deities);
  }

  return deities;
}

export { getAllFiles, getRandomFile, getPreviousFile, getNextFile, getAllImageFiles, getAllDeityFiles };