import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList, SafeAreaView, Dimensions } from 'react-native';
import { useNavigation, useRouter } from 'expo-router';
import { getAllFiles } from '../app/api/apiWrapper';

// Assuming you have a placeholder image, replace 'placeholder.jpg' with your image path
const placeholderImage = require('../assets/images/placeholder_portrait.png');



// Calculate the width of the screen
const { width } = Dimensions.get('window');
const itemWidth = (width - 32) / 2; // Assuming we want 16px padding on both sides


interface File {
  category: string;
  title: string;
  url: string;
  image: string;
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
  // Data for the grid
  const data = new Array(15).fill(null).map((_, index) => ({
    key: String(index),
    category: folders[index] || 'Loading...', // Replace with folders[index]
    image: placeholderImage,
  }));

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

  const renderItem = ({ item }: { item: { key: string, category: string, image: any } }) => (
    <View style={styles.itemContainer}>
      <TouchableOpacity onPress={() => handlePress(item.category)}>
      <Image source={item.image} style={styles.image} resizeMode="cover" />
      </TouchableOpacity>
      <Text style={styles.itemText}>{item.category.replaceAll('_', ' ')}</Text>
    </View>
  );

  const handlePress = (folder: string) => {
    router.setParams( { name: 'FileScreen', folder })
  };

  return (

    <SafeAreaView style={styles.safeArea}>

      <View>
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.key}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.contentContainer}
      />
    </View>
    </SafeAreaView>
  );
};



const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  contentContainer: {
    alignItems: 'center',
  },
  itemContainer: {
    width: itemWidth,
    marginBottom: 16, // Space between rows
  },
  image: {
    width: '100%',
    height: undefined,
    aspectRatio: 1, // Your images are square
    borderRadius: 10, // Optional: if you want rounded corners
  },
  itemText: {
    marginTop: 8,
    textAlign: 'center',
  },
});

export default FolderScreen;