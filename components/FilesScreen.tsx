import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { getAllFiles } from '../app/api/apiWrapper';
import { RouteProp } from '@react-navigation/native';

// Define your route parameters
type RootStackParamList = {
  FilesScreen: { folder: string };
  // Add other screens here as needed
};

type routeProp = RouteProp<RootStackParamList, 'FilesScreen'>;

// ...


interface File {
  category: string;
  title: string;
  url: string;
}

const FilesScreen = () => {
  const [files, setFiles] = useState<File[]>([]);
  const route = useRoute<routeProp>();
  
  useEffect(() => {
    (async () => {
      const allFiles: File[] = await getAllFiles();
      const folderFiles = allFiles.filter(file => file.category === route.params.folder);
      setFiles(folderFiles);
    })();
  }, [route.params.folder]);

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