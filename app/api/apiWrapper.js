import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'react-native';

const urls = {
  filesList: "https://atourcity.com/bkgoswami.com/wp/wp-content/uploads/all_files.txt",
  imageList: "https://atourcity.com/bkgoswami.com/wp/wp-content/uploads/all_images.txt",
  deityList: "https://atourcity.com/bkgoswami.com/wp/wp-content/uploads/deities300w.txt",
}

async function fetchFilesList(filesListUrl) {
  const proxyUrl = '';
  const response = await fetch(proxyUrl + filesListUrl);
  const txt = await response.text();

  // Split the text into lines and remove any empty lines or lines starting with '#'
  const files = txt.split('\n').filter(file => file.trim() !== '' && !file.trim().startsWith('#'));

  return files;
}

async function cacheFiles(files, key) {
  const expiration = files.length < 500
    ? Date.now() - 1 // Set the cache as already expired
    : Date.now() + 7 * 24 * 60 * 60 * 1000; // One week in the future

  const data = {
    files,
    expiration,
  };

  await AsyncStorage.setItem(key, JSON.stringify(data));
}

async function fetchAndCacheFiles(key, url) {
  const rawData = await AsyncStorage.getItem(key);

  if (rawData) {
    const data = JSON.parse(rawData);
    if (Date.now() < data.expiration) {
      return data.files;
    }
  }

  // Fetch the list of files and cache them
  const files = await fetchFilesList(url);
  await cacheFiles(files, key);
  return files;
}

async function getAllFiles() {
  return fetchAndCacheFiles('mp3Files', urls.filesList);
}

async function getAllImageFiles() {
  return fetchAndCacheFiles('imageFiles', urls.imageList);
}

// ... Other code ...

async function getAllDeityFiles() {
  return fetchAndCacheFiles('deities', urls.deityList);
}


export { getAllFiles, getAllImageFiles, getAllDeityFiles };