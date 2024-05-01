import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { FlatList, SafeAreaView, Dimensions, ActivityIndicator } from 'react-native';
import { Link } from 'expo-router';
import { getAllFiles } from '../app/api/apiWrapper';

// Assuming you have a placeholder image, replace 'placeholder.jpg' with your image path
const placeholderImage = require('../assets/images/placeholder_portrait.png');

export const HierarchyContext = React.createContext<Record<string, any> | null>(null);

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
  const hierarchicalParts = parts.slice(5, -1);  // from the third to the last

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
  
  return hierarchy;
}

// Function to recursively build a list of categories from the nested dictionary
function buildCategoryList(hierarchy: Record<string, any>, level: number): string[] {
  const categories: string[] = [];

  const traverse = (node: Record<string, any>, currentLevel: number) => {
    for (const [key, value] of Object.entries(node)) {
      if (currentLevel === level) {
        categories.push(key);
      }
      traverse(value, currentLevel + 1);
    }
  };

  traverse(hierarchy, 0);

  return categories;
}

const FolderScreen = () => {
  const [folders, setFolders] = useState<string[]>([]);
  const [hierarchy, setHierarchy] = useState<Record<string, any>[]>([]);// Correct the spelling here
  const [deserializedHierarchy, setDeserializedHierarchy] = useState<Record<string, any> | null>(null);
  const [isLoading, setIsLoading] = useState(true);


  const data = new Array(folders.length).fill(null).map((_, index) => ({
    key: String(index),
    category: folders[index] || 'Loading...', // Replace with folders[index]
    image: placeholderImage,
  }));

  useEffect(() => {
    (async () => {
      const files: File[] = (await getAllFiles('audioFilesList', 'mp3Files')).map(url => ({ url }));
      const hierarchy = files.map(file => {
        const hierarchyFromUrl = extractHierarchyFromUrl(file.url);
        return hierarchyFromUrl;
      });
      console.log("Hierarchy", hierarchy[40]);
      setHierarchy(hierarchy);
      setDeserializedHierarchy(hierarchy);
      const categories = buildCategoryList(hierarchy, 1);
      const uniqueCategories = Array.from(new Set(categories));
      setFolders(uniqueCategories);
      setIsLoading(false);
    })();
  }, []);

  const renderItem = ({ item }: { item: { key: string, category: string, image: any } }) => (

    <View style={styles.itemContainer}>
     <Link href={{ pathname: "SubFolderScreen",
        params: { category: item.category, hierarchy: JSON.stringify(hierarchy) }}} asChild>
      <TouchableOpacity>
        <Image source={item.image} style={styles.image} resizeMode="cover" />
      </TouchableOpacity>
      </Link>
        <Text style={styles.itemText}>{item.category.replaceAll('_', ' ')}</Text>
    </View>
  );

if (isLoading){
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#ED4D4E" />
    </View>)
}

  return (
    <HierarchyContext.Provider value={deserializedHierarchy}>
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
    </HierarchyContext.Provider>
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