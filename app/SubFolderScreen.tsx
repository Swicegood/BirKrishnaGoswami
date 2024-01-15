import React, { Children, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList, SafeAreaView, Dimensions } from 'react-native';
import { Link, useLocalSearchParams} from 'expo-router';


// Assuming you have a placeholder image, replace 'placeholder.jpg' with your image path
const placeholderImage = require('../assets/images/placeholder_portrait.png');



// Calculate the width of the screen
const { width } = Dimensions.get('window');
const itemWidth = (width - 32) / 2; // Assuming we want 16px padding on both sides


interface SubCategory {
    key: string;
    title: string;
    image: any;
    children: SubCategory[];
  }

  function buildCategoryList(hierarchy: Record<string, any>, parent: string): string[] {
    let categories: string[] = [];
  
    const traverse = (node: Record<string, any>, currentParent: string) => {
      if (currentParent === parent) {
        categories.push(...Object.keys(node));
      } else {
        for (const [key, value] of Object.entries(node)) {
          traverse(value, key);
        }
      }
    };
  
    traverse(hierarchy, '');
  
    return categories;
  }

const SubFolderScreen = () => {
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);

  // Get the category from the previous screen
  const { category, hierarchy } = useLocalSearchParams<{ category: string; hierarchy: string }>();
  const deserializedHierarchy = JSON.parse(hierarchy);
  console.log(deserializedHierarchy[40]);

  useEffect(() => {
    const subcategories = buildCategoryList(deserializedHierarchy, category).map((subcategory): SubCategory => ({
      title: subcategory,
      key: '',
      image: placeholderImage,
      children: [],      
    }));
  
    const uniqueSubcategories = subcategories.reduce((unique, subcategory) => {
      if (unique.findIndex(item => item.title === subcategory.title) === -1) {
        unique.push(subcategory);
      }
      return unique;
    }, [] as SubCategory[]);
  
    setSubCategories(uniqueSubcategories);
  }, []);

  
  const renderItem = ({ item }: { item:  SubCategory }) => (
    <View style={styles.itemContainer}>
      <Link href={{ pathname: "SubFolderScreen",
        params: { category: item.title, categories: hierarchy }
        }} asChild>
      <TouchableOpacity>
        <Image source={item.image} style={styles.image} resizeMode="cover" />
      </TouchableOpacity>
      </Link>
        <Text style={styles.itemText}>{item.title.replaceAll('_', ' ')}</Text>
    </View>
  );



  return (

    <SafeAreaView style={styles.safeArea}>

      <View>
      <FlatList
        data={subCategories}
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

export default SubFolderScreen;