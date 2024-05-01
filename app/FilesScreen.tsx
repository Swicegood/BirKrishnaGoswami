import React, { useEffect, useState } from 'react';
import { getAllFiles } from '../app/api/apiWrapper';
import { Link, useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList } from 'react-native';
import { getDocs, query, where, collection } from 'firebase/firestore';
import { db } from './api/firebase';
import CustomHeaderMain from '../components/CustomHeaderMain';

interface File {
  category: string;
  title: string;
  url: string;
  date: string;
}




const FilesScreen = () => {
  const [files, setFiles] = useState<File[]>([]);
  const { category } = useLocalSearchParams<{ category: string }>();
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
          title: title.replaceAll("_"," "),
          url: url,
          date: date, // Add today's date
        };
      });
  
      // Populate file.category with the name of the immediate parent folder derived from each url
      const categorizedFiles = allFiles.map(file => {
        const urlParts = file.url.split('/');
        const parentFolder = urlParts[urlParts.length - 2]; // Get the second last element
        return { ...file, category: parentFolder };
      });
  
      // add dates from matched urls from firestore

      // Filter files to only include those that belong to the current folder
      const folderFiles = categorizedFiles.filter(file => file.category === category);
      const folderFilesWithDate = await Promise.all(folderFiles.map(async file => {
        let docData;
        const q = query(collection(db, "audio-tracks"), where("url", "==", file.url));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          docData = querySnapshot.docs[0].data();
        }
        return { ...file, date: docData?.freindly_date };
      }));
      setFiles(folderFilesWithDate);
  

    })();
  }, []);

  const onPress = (file: File) => {
    // Handle file press
  };

  const renderItem = ({ item }: { item: File }) => (
    <View style={styles.container}>
    <Link href={{ pathname: "AudioScreen", params: { url: item.url, title: item.title } }} asChild>
    <TouchableOpacity style={styles.playButton}>
      {/* Replace with your play icon */}
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
    borderBottomColor: '#ccc', // Adjust color as needed
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
});


export default FilesScreen;