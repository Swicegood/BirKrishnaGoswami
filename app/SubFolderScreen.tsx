import React, { Children, useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList, SafeAreaView, Dimensions } from 'react-native';
import { Link, useLocalSearchParams, router} from 'expo-router';
import FilesScreen from './FilesScreen';


// Assuming you have a placeholder image, replace 'placeholder.jpg' with your image path
const placeholderImage = require('../assets/images/placeholder_portrait.png');



// Calculate the width of the screen
const { width } = Dimensions.get('window');
const itemWidth = (width - 32) / 2; // Assuming we want 16px padding on both sides


interface SubCategory {
    key: string;
    title: string;
    image: any;
    parents: any;
  }

  function buildCategoryList(hierarchy: Record<string, any>, parent: string): string[] {
    let categories: string[] = [];
    console.log("buildCategoryList", hierarchy[-1], parent);
    const traverse = (node: Record<string, any> | null, currentParent: string) => {
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
    const [isFileScreen, setIsFileScreen] = useState(false);
    // Get the category from the previous screen
    const { category, hierarchy } = useLocalSearchParams<{ category: string; hierarchy: string }>();
    const [deserializedHierarchy, setDeserializedHierarchy] = useState<Record<string, any> | null>(null);
    console.log("SubFolderScreenCat", category);

    useEffect(() => {
        let deserializedHierarchy: Record<string, any>;
        try {
        deserializedHierarchy = JSON.parse(hierarchy);
        }
        catch (error) {
        // hierarchy is not a valid JSON string, render FilesScreen instead
        console.log("Hieracrchy Failed");
            setIsFileScreen(true); 
            return;
            }
        if (deserializedHierarchy === null) {
            console.log("Hierarchy is null");
            setIsFileScreen(true);
            return;
        }
      const subcategories = buildCategoryList(deserializedHierarchy, category).map((subcategory, index): SubCategory => ({
        title: subcategory,
        key: index.toString(), // Convert index to string if key is expected to be a string
        image: placeholderImage,
        parents: deserializedHierarchy[index], // Add logic for getting parents if needed
      }));
       const uniqueSubcategories = subcategories.reduce((unique, subcategory) => {
        if (unique.findIndex(item => item.title === subcategory.title) === -1) {
            unique.push(subcategory);
        }
        return unique;
        }, [] as SubCategory[]);
  
    setSubCategories(uniqueSubcategories);
    setDeserializedHierarchy(deserializedHierarchy);
    console.log("SubFolderScreenUniqSubCat", uniqueSubcategories);
    if(uniqueSubcategories.length === 0) { // Check the flag here
        console.log("FIlESCREEN", category);
        router.push(`./FilesScreen?category=${category}`);
      }
  }, [category]);



  const renderItem = ({ item }: { item: SubCategory }) => (
    <View style={styles.itemContainer}>
      <Link
        href={{
          pathname: "SubFolderScreen",
          params: {
            category: item.title,
            hierarchy: JSON.stringify(deserializedHierarchy) // Serialize the hierarchy here
          }
        }}
        asChild
      >
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