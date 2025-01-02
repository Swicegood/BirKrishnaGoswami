import React, { useEffect, useState } from 'react';
import { getAllFiles } from '../app/api/apiWrapper';
import { Link, useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList, ActivityIndicator, Alert, Platform } from 'react-native';
import { getDocs, query, where, collection } from 'firebase/firestore';
import { db } from './api/firebase';
import CustomHeaderMain from '../components/CustomHeaderMain';
import { getListenedPositions } from '../app/api/apiWrapper';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface File {
  category: string;
  parentFolder?: string;
  title: string;
  url: string;
  fakeUrl: string | null;
  date: string;
  hasListenedTrack: boolean;
}




const FilesScreen = () => {
  const [files, setFiles] = useState<File[]>([]);
  const { category } = useLocalSearchParams<{ category: string }>();
  const [isLoading, setIsLoading] = useState(true);
  console.log("FileSccreenCat", category);
  useEffect(() => {
    (async () => {
      const allFiles: File[] = (await getAllFiles('audioFilesList', 'mp3Files')).map((url: string) => {
        const segments = url.split('/');
        const filename = segments[segments.length - 1]; // Get the last segment of the URL
        const title = filename.split('.')[0]; // Remove the file extension

        // Get today's date
        const today = new Date();
        const date = today.toISOString().split('T')[0]; // Convert to YYYY-MM-DD format

        return {
          category: '', // Will be populated later
          title: title.replaceAll("_", " "),
          url: url,
          date: date, // Add today's date
        };
      });

      const listenedMap = await getListenedPositions();

      const renamesList = await getAllFiles('renamesList', 'renames');
      const renames: Record<string, string> = { 
        // Take the first half of the list and map it to the second half
        ...Object.fromEntries(renamesList.slice(0, renamesList.length / 2).map((value, index) => [value, renamesList[renamesList.length / 2 + index]])),
        // Take the second half of the list and map it to the first half
        ...Object.fromEntries(renamesList.slice(renamesList.length / 2).map((value, index) => [value, renamesList[index]])),
      };
      allFiles.forEach(file => {
        const newUrl = renames[file.url] || null;
        file.fakeUrl = newUrl;
        // Mark hasListenedTrack if position > 0
        const position = listenedMap[file.fakeUrl || file.url] ?? 0;
        const hasListenedTrack = position > 0;
        file.hasListenedTrack = hasListenedTrack;
      }
      );

      // Populate file.category with the name of the immediate parent folder derived from each url
      const categorizedFiles = allFiles.map(file => {
        const urlParts = file.fakeUrl? file.fakeUrl.split('/') : file.url.split('/');
        const folder = urlParts[urlParts.length - 2]; // Get second last element
        if (urlParts.length < 3) {
          return { ...file, category: folder };
        }
        const parentFolder = urlParts[urlParts.length - 3]; // Get the third last element
        return { ...file, category: folder, parentFolder };
      });

      // add dates from matched urls from firestore

      // Filter files to only include those that belong to the current folder
      const folderFiles = categorizedFiles.filter(file => {
        // If category ends with "_"
        if (category.endsWith('_')) {
          const parts = category.split('_');
          const lastPart = parts[parts.length - 2];
          const firstPart = parts.slice(0, -2).join('_');

          // Accept the file if the last part of category before "_" === file.category
          // and the whole first part up until the second to last "_" === file.parentFolder
          return lastPart === file.category && firstPart === file.parentFolder;
        }

        // Otherwise, accept the file if file.category === category
        return file.category === category;
      });

      const folderFilesWithDate = await Promise.all(folderFiles.map(async file => {
        let docData;
        const q = query(collection(db, "audio-tracks"), where("url", "==", file.url));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          docData = querySnapshot.docs[0].data();
        }
        const friendlyDate = docData?.freindly_date;

        // Mark hasListenedTrack if position > 0
        const position = listenedMap[file.fakeUrl || file.url] ?? 0;
        const hasListenedTrack = position > 0;

        return { ...file, date: friendlyDate, hasListenedTrack };
      }));
      setFiles(folderFilesWithDate);
      isLoading && setIsLoading(false);
    })();
  }, []);

  const onPress = (file: File) => {
    // Handle file press
  };

  // 1) Reset position on long press
  const handleResetPosition = async (file: File) => {
    if (Platform.OS === 'web') {
      // For web, use window.confirm
      if (window.confirm('You are about to mark this track "unplayed." Your bookmark will be erased. Are you sure?')) {
        try {
          const jsonValue = await AsyncStorage.getItem("@playedSongs");
          if (!jsonValue) return;

          const playedSongs = JSON.parse(jsonValue);

          for (const entry of playedSongs) {
            if (entry?.song?.url === (file.fakeUrl || file.url)) {
              entry.position = 0;
            }
          }

          await AsyncStorage.setItem("@playedSongs", JSON.stringify(playedSongs));

          setFiles(prevFiles => prevFiles.map(f => {
            if (f.url === file.url) {
              return { ...f, hasListenedTrack: false };
            }
            return f;
          }));
        } catch (error) {
          console.error("Error resetting position:", error);
        }
      }
    } else {
      // For native platforms, use Alert
      Alert.alert(
        "Reset Track Progress",
        'You are about to mark this track "unplayed." Your bookmark will be erased. Are you sure?',
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Yes, Reset",
            onPress: async () => {
              try {
                const jsonValue = await AsyncStorage.getItem("@playedSongs");
                if (!jsonValue) return;

                const playedSongs = JSON.parse(jsonValue);

                for (const entry of playedSongs) {
                  if (entry?.song?.url === (file.fakeUrl || file.url)) {
                    entry.position = 0;
                  }
                }

                await AsyncStorage.setItem("@playedSongs", JSON.stringify(playedSongs));

                setFiles(prevFiles => prevFiles.map(f => {
                  if (f.url === file.url) {
                    return { ...f, hasListenedTrack: false };
                  }
                  return f;
                }));
              } catch (error) {
                console.error("Error resetting position:", error);
              }
            }
          }
        ]
      );
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#ED4D4E" />
      </View>
    );
  }
  const renderItem = ({ item }: { item: File & { hasListenedTrack?: boolean } }) => (
    <View style={styles.container}>
      <Link href={{ pathname: "AudioScreen", params: { url: item.url, title: item.title } }} asChild>
        <TouchableOpacity style={styles.playButton}>
          <Image source={require('../assets/images/vecteezy_jogar-design-de-sinal-de-icone-de-botao_10148443.png')} style={styles.playIcon} />
        </TouchableOpacity>
      </Link>
      <View style={styles.textContainer}>
        <Text style={styles.titleText} numberOfLines={3} ellipsizeMode='tail'>
          {item.title}
        </Text>
        <Text>
        </Text>
        <Text style={styles.dateText}>{item.date}</Text>
      </View>
      {item.hasListenedTrack && (
        <TouchableOpacity 
          style={styles.greenDot} 
          onPress={Platform.OS === 'web' ? () => handleResetPosition(item) : undefined}
          onLongPress={Platform.OS !== 'web' ? () => handleResetPosition(item) : undefined}
        />
      )}
    </View>
  );

  return (
    <>
      <CustomHeaderMain title={category} />
      <View>
        <FlatList
          data={files}
          keyExtractor={(item) => item.url}
          renderItem={renderItem}
        />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 10,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    position: 'relative',
  },
  playButton: {
    marginRight: 30,
    // Add your styles for the button, such as size, backgroundColor, etc.
  },
  playIcon: {
    width: 30, // Adjust size as needed
    height: 30, // Adjust size as needed
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  titleText: {
    fontSize: 14,
    fontWeight: 'bold',
    // Adjust style as needed
  },
  dateText: {
    fontSize: 14,
    color: 'grey',
    // Adjust style as needed
  },
  greenDot: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'lime',
    zIndex: 1,
  },
});


export default FilesScreen;