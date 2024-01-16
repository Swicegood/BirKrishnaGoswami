import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { getAllFiles } from '../app/api/apiWrapper';
import { Link, useLocalSearchParams } from 'expo-router';


interface File {
  category: string;
  title: string;
  url: string;
}

const FilesScreen = () => {
  const [files, setFiles] = useState<File[]>([]);
  const folder = useLocalSearchParams<{ category: string }>();
  
  useEffect(() => {
    (async () => {
      const allFiles: File[] = (await getAllFiles()).map(url => ({
        category: '', // Will be populated later
        title: '', // Add logic for getting title if needed
        url: url,
      })); // Get all files returns urls, put each into a file object.url
  
      // Populate file.category with the name of the immediate parent folder derived from each url
      const categorizedFiles = allFiles.map(file => {
        const urlParts = file.url.split('/');
        const parentFolder = urlParts[urlParts.length - 2]; // Get the second last element
        return { ...file, category: parentFolder };
      });
  
      // Filter files to only include those that belong to the current folder
      const folderFiles = categorizedFiles.filter(file => file.category === folder.category);
      setFiles(folderFiles);
      console.log("FileSccreen folder");
    })();
  }, [folder.category]);

  const handlePress = (file: File) => {
    // Handle file press
  };

  return (
    <View>
      <FlatList
        data={files}
        keyExtractor={(item) => item.url}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handlePress(item)}>
            <Text>{item.title}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

export default FilesScreen;