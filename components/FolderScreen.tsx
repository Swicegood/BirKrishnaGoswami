import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation, useRouter } from 'expo-router';
import { getAllFiles } from '../app/api/apiWrapper';

interface File {
  category: string;
  title: string;
  url: string;
}

const FolderScreen = () => {
  const [folders, setFolders] = useState<string[]>([]);
  const navigation = useNavigation();
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const files: File[] = await getAllFiles();
      const categories = [...new Set(files.map(file => file.category))];
      setFolders(categories);
    })();
  }, []);

  const handlePress = (folder: string) => {
    router.setParams( { name: 'FileScreen', folder })
  };

  return (
    <View>
      <FlatList
        data={folders}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handlePress(item)}>
            <Text>{item}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

export default FolderScreen;