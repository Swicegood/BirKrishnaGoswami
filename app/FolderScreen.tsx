import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation, useRouter } from 'expo-router';
import { getAllFiles } from '../app/api/apiWrapper';

interface File {
  category: string;
  title: string;
  url: string;
}

function extractHierarchyFromUrl(url: string) {
  // Split the URL by slashes and filter out empty strings
  const parts = url.split('/').filter(part => part);

  // Assume the domain and protocol are not part of the hierarchy
  // Skip 'http:', '', 'audio.iskcondesiretree.com', and the first two sections
  // Also ignore the last part as it is the actual file
  const hierarchicalParts = parts.slice(5, -1);  // from the third to the second last

  // Build a nested dictionary from the hierarchical parts
  const hierarchy: Record<string, any> = {};
  let currentLevel = hierarchy;

  // For each part, if it's not already a key in the current level of the hierarchy, add it
  for (const part of hierarchicalParts) {
    if (!(part in currentLevel)) {
      currentLevel[part] = {};
    }
    currentLevel = currentLevel[part];
  }

  // Function to recursively build a list of categories from the nested dictionary
  function buildCategoryList(hierarchyDict: Record<string, any>, depth = 0) {
    const categories: any[] = [];
    for (const [key, subdict] of Object.entries(hierarchyDict)) {
      const category = { name: key, subcategories: buildCategoryList(subdict, depth + 1) };
      categories.push(category);
    }
    return depth > 0 ? categories : categories[0];  // Only return the top category
  }

  // Get the list of categories with their subcategories
  const categories = buildCategoryList(hierarchy);

  return categories;
}

const FolderScreen = () => {
  const [folders, setFolders] = useState<string[]>([]);
  const navigation = useNavigation();
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const files: File[] = await getAllFiles();
      console.log(files[40]);
      const categories = files.map(file => extractHierarchyFromUrl(file).name);
      console.log(categories[50]);
      const uniqueCategories = Array.from(new Set(categories));
      setFolders(uniqueCategories);
    })();
  }, []);

  const handlePress = (folder: string) => {
    router.setParams( { name: 'FileScreen', folder })
  };

  return (
    <View>
      <FlatList
        data={folders}
        keyExtractor={(item, index) => item + index}
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