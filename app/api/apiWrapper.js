import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';


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

async function getAllFiles(docId, cacheKey) {
  try {
    const docRef = doc(db, 'files-urls', docId);
    const docSnapshot = await getDoc(docRef);

    if (docSnapshot.exists()) {
      return fetchAndCacheFiles(cacheKey, docSnapshot.data().url);
    } else {
      console.log("No such document!");
    }
  } catch (error) {
    console.log("Error getting document:", error);
  }
}

export async function getListenedPositions() {
  try {
    const jsonValue = await AsyncStorage.getItem("@playedSongs");
    if (!jsonValue) {
      return {};
    }
    const playedSongs = JSON.parse(jsonValue); 
    const positions = {};

    // Convert playedSongs array to a map { [url]: last position }
    for (const entry of playedSongs) {
      // Make sure we have an actual URL
      if (entry?.song?.url) {
        positions[entry.song.url] = entry.position;
      }
    }

    return positions;
  } catch (error) {
    console.error("Error retrieving listened positions:", error);
    return {};
  }
}

export async function getUpdatedFiles() {
  const files = (await getAllFiles('audioFilesList', 'mp3Files')).map(url => ({ url }));
      const renamesList = await getAllFiles('renamesList', 'renames');
      const renames = { 
        // Take the first half of the list and map it to the second half
        ...Object.fromEntries(renamesList.slice(0, renamesList.length / 2).map((value, index) => [value, renamesList[renamesList.length / 2 + index]])),
      };
      const updatedFiles = files.map(file => {
        const newUrl = renames?.[file.url] || null;
        return {
          ...file,
          fakeUrl: newUrl,
        };
  });
  return updatedFiles;
}

export { getAllFiles };