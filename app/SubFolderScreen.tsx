import React, { useRef, useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import { Link, useLocalSearchParams, useFocusEffect, router} from 'expo-router';
import { useNavigationState } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomHeaderMain from '../components/CustomHeaderMain';



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
    const categories: string[] = [];
    console.log("buildCategoryList", hierarchy[0], parent);
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
    const [parent, setParent] = useState<string | null>(null); // Add parent state
    const previousRoute = useNavigationState(state => state.routes[state.index]?.name);
    const justVisitedFilesScreen = useRef(false);
    const [hierarchy, setHierarchy] = useState<string | null>(null);
    const { hierarchy: localHierarchy, category } = useLocalSearchParams<{ category: string; hierarchy: string }>();
    // Get the category from the previous screen
    const [deserializedHierarchy, setDeserializedHierarchy] = useState<Record<string, any> | null>(null);
    
 
    useFocusEffect(
      useCallback(() => {
        let deserializedHierarchy: Record<string, any>;
        try {
          if (hierarchy === null) {
          deserializedHierarchy = JSON.parse(localHierarchy);
          } else {
            deserializedHierarchy = JSON.parse(hierarchy);
          }
        } catch (error) {
          // hierarchy is not a valid JSON string, render FilesScreen instead
          console.log("Hierarchy Failed");
          setIsFileScreen(true); 
          return;
        }
        if (deserializedHierarchy === null) {
          console.log("Hierarchy is null");
          setIsFileScreen(true);
          return;
        }
        let subcategories: SubCategory[] = [];

        console.log("parent", parent);

        if (parent !== null) {
          subcategories = buildCategoryList(deserializedHierarchy, parent).map((subcategory, index): SubCategory => ({
            title: subcategory,
            key: index.toString(), // Convert index to string if key is expected to be a string
            image: placeholderImage,
            parents: deserializedHierarchy[index], // Add logic for getting parents if needed
          }));
        } else {
          subcategories = buildCategoryList(deserializedHierarchy, category).map((subcategory, index): SubCategory => ({
            title: subcategory,
            key: index.toString(), // Convert index to string if key is expected to be a string
            image: placeholderImage,
            parents: deserializedHierarchy[index], // Add logic for getting parents if needed
          }));
        }
        const uniqueSubcategories = subcategories.reduce((unique, subcategory) => {
          if (unique.findIndex(item => item.title === subcategory.title) === -1) {
            unique.push(subcategory);
          }
          return unique;
        }, [] as SubCategory[]);
    
        setSubCategories(uniqueSubcategories);
        setDeserializedHierarchy(deserializedHierarchy);
        console.log("SubFolderScreenUniqSubCat", uniqueSubcategories);
        console.log("SubFolderScreenPreviousRoute", previousRoute);
        if(uniqueSubcategories.length === 0) {
          if (justVisitedFilesScreen.current) {
            justVisitedFilesScreen.current = false;
            router.back();
          } else {
            console.log("FIlESCREEN", category);
            if (hierarchy !== null) {
              AsyncStorage.setItem('hierarchy', hierarchy); // Store hierarchy
            } // Store hierarchy
  
            router.push(`./FilesScreen?category=${category}`);
          }
        }else {
          if (category !== null) {
            AsyncStorage.setItem('parent', category); // Store category
          }
        }
      }, [category, parent, hierarchy, localHierarchy])
    );
    
    useEffect(() => {
      if (previousRoute === 'FilesScreen') {
        justVisitedFilesScreen.current = true;
        // Retrieve hierarchy from AsyncStorage when navigating back from FilesScreen
        AsyncStorage.getItem('hierarchy').then(storedHierarchy => {
          if (storedHierarchy) {
            setHierarchy(storedHierarchy);
          }
        });
        AsyncStorage.getItem('parent').then(storedParent => {
          if (storedParent) {
            setParent(storedParent);
          }
        });
        console.log("FilesScreen was PrevRoute");
      } else {
        // Use hierarchy from useLocalSearchParams otherwise
        setHierarchy(localHierarchy);
        console.log("SubFolderScreenCat", category);
      }
    }, [previousRoute, localHierarchy]); // Add localHierarchy and category to the dependencies


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
    <>
    <CustomHeaderMain title={category} />
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
    </>
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