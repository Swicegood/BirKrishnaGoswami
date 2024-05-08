import React, { useRef, useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import { Link, useLocalSearchParams, useFocusEffect, router } from 'expo-router';
import { useNavigationState } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomHeaderMain from '../components/CustomHeaderMain';

// Assuming you have a placeholder image, replace 'placeholder.jpg' with your image path
const placeholderImage = require('../assets/images/placeholder_portrait.png');

// Calculate the width of the screen
const { width } = Dimensions.get('window');
const itemWidth = (width - 32) / 2; // Assuming we want 16px padding on both sides
const itemHeight = Dimensions.get('window').height / 3;

interface SubCategory {
  key: string;
  title: string;
  image: any;
  parents: any;
}

const images = {
  Srimad_Bhagavatam: require('../assets/images/Srimad_Bhagavatam.png'),
  "Canto-01": require('../assets/images/Canto-01.jpg'),
  "Canto-02": require('../assets/images/Canto-02.jpg'),
  "Canto-03": require('../assets/images/Canto-03.jpg'),
  "Canto-04": require('../assets/images/Canto-04.jpg'),
  "Canto-05": require('../assets/images/Canto-05.jpg'),
  "Canto-06": require('../assets/images/Canto-06.jpg'),
  "Canto-07": require('../assets/images/Canto-07.jpg'),
  "Canto-08": require('../assets/images/Canto-08.jpg'),
  "Canto-09": require('../assets/images/Canto-09.jpg'),
  "Canto-10": require('../assets/images/Canto-10.jpg'),
  "Canto-11": require('../assets/images/Canto-11.jpg'),
  "Canto-12": require('../assets/images/Canto-12.jpg'),
  Brhad_Bhagavatamrita: require('../assets/images/Brihad_Bhagavatamrita.jpg'),
  Bhagavad_Gita: require('../assets/images/Bhagavad_Gita.png'),
  "Chapter-01": require('../assets/images/Bhagavad_Gita.png'),
  "Chapter-02": require('../assets/images/Bhagavad_Gita.png'),
  "Chapter-03": require('../assets/images/Bhagavad_Gita.png'),
  "Chapter-04": require('../assets/images/Bhagavad_Gita.png'),
  "Chapter-05": require('../assets/images/Bhagavad_Gita.png'),
  "Chapter-06": require('../assets/images/Bhagavad_Gita.png'),
  "Chapter-07": require('../assets/images/Bhagavad_Gita.png'),
  "Chapter-08": require('../assets/images/Bhagavad_Gita.png'),
  "Chapter-09": require('../assets/images/Bhagavad_Gita.png'),
  "Chapter-10": require('../assets/images/Bhagavad_Gita.png'),
  "Chapter-11": require('../assets/images/Bhagavad_Gita.png'),
  "Chapter-12": require('../assets/images/Bhagavad_Gita.png'),
  "Chapter-13": require('../assets/images/Bhagavad_Gita.png'),
  "Chapter-14": require('../assets/images/Bhagavad_Gita.png'),
  "Chapter-15": require('../assets/images/Bhagavad_Gita.png'),
  "Chapter-16": require('../assets/images/Bhagavad_Gita.png'),
  "Chapter-17": require('../assets/images/Bhagavad_Gita.png'),
  Others: require('../assets/images/Bhagavad_Gita.png'),
  Health: require('../assets/images/Health.png'),
  Ananda_Vrindavan_Campu: require('../assets/images/Ananda_Vrindavan_Campu.png'),
  Dana_Keli_Cintamani: require('../assets/images/Dana_Keli_Cintamani.png'),
  Vidagdha_Madhava: require('../assets/images/Vidagdha_Madhava.jpg'),
  Lalita_Madhava: require('../assets/images/Lalita_Madhava.jpg'),
  Gopal_Champu: require('../assets/images/Gopal_Champu.jpg'),
  "01_-_Purva_Campu": require('../assets/images/Gopal_Champu.jpg'),
  "02_-_Uttara_Campu": require('../assets/images/Gopal_Champu.jpg'),
  Mukta_Carita: require('../assets/images/Mukta_Carita.jpg'),
  Krishnanika_Kaumudi: require('../assets/images/Krishnanika_Kaumudi.jpg'),
  Vilapa_Kusumanjali: require('../assets/images/Vilapa_Kusumanjali.jpg'),
  Connecting_to_Krishna: require('../assets/images/Devotional_Service.png'),
  Chaitanya_Charitamrita: require('../assets/images/Chaitanya_Charitamrita.png'),
  Adi_Lila: require('../assets/images/Adi_Lila.jpg'),
  Madhya_Lila: require('../assets/images/Madhya_Lila.jpg'),
  Antya_Lila: require('../assets/images/Antya_Lila.jpg'),
  Nectar_of_Devotion: require('../assets/images/Nectar_of_Devotion.png'),
  "2014": require('../assets/images/Nectar_of_Instruction.png'),
  "2022": require('../assets/images/Nectar_of_Instruction.png'),
  Gita: require('../assets/images/Bhagavad_Gita.png'),
  Festivals: require('../assets/images/Festivals.png'),
  Lord_Rama_Pastimes: require('../assets/images/Ramayan.jpg'),
  Rama_Katha: require('../assets/images/Ramayan.jpg'),
  How_to_Execute_Devotional_Service: require('../assets/images/Devotional_Service.png'),
  How_to_be_connected_to_Krishna_Consciousness: require('../assets/images/Devotional_Service.png'),
  The_Nine_Process_of_Bhakti: require('../assets/images/Devotional_Service.png'),
  Empathic_Communications: require('../assets/images/Empathic_Communication.jpg'),
  Realizing_our_Empathic_Nature: require('../assets/images/Empathic_Communication.jpg'),
  Brahma_Samhita: require('../assets/images/Brahma_Samhita.png'),
  Madhurya_Kadambini_Part_01: require('../assets/images/Madhurya_Kadambini_Part_01.jpg'),
  "2013": require('../assets/images/Ramayan.jpg'),
  "2019": require('../assets/images/Ramayan.jpg'),
  "2020": require('../assets/images/Ramayan.jpg'),
  "2021": require('../assets/images/Ramayan.jpg'),

  // Add more categories as needed...
};

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
  const previousToPreviousRoute = useNavigationState(state => state.routes[state.index - 1]?.name);
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
      if (uniqueSubcategories.length === 0) {
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
      } else {
        if (category !== null) {
          AsyncStorage.setItem('parent', category); // Store category
        }
      }
    }, [category, parent, hierarchy, localHierarchy])
  );

  useEffect(() => {
    console.log("PrevousToPrevRoute", previousToPreviousRoute);
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
          console.log("Setting Parent", storedParent);
          setParent(storedParent);
        }
      });
      console.log("FilesScreen was PrevRoute");
    } else {
      // Use hierarchy from useLocalSearchParams otherwise
      setHierarchy(localHierarchy);
      console.log("SubFolderScreenCat", category);
    }

  }, [localHierarchy, previousRoute, previousToPreviousRoute]);

  useEffect(() => {

    if (previousToPreviousRoute === 'FolderScreen') {
      console.log("PrevToPrevRoute", previousToPreviousRoute);
      console.log("Setting Parent to null");
      justVisitedFilesScreen.current = false;
      setParent(null)
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
        <View style={styles.imageView}>
          <Image source={images[item.title] || item.image} style={styles.image} resizeMode="cover" />
          </View>
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
          ListFooterComponent={<View style={{ height: 120 }} />} // Add this line
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
    height: itemHeight,
    borderWidth: .25, // This sets the width of the border
    borderColor: 'lightgray', // This sets the color of the border
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  image: {
    width: '50%',
    height: undefined,
    aspectRatio: .673, // Your images are square
  },
  imageView: {
    width: '100%',
    shadowColor: "#000",
    shadowOffset: {
      width: -10,
      height: 10,
    },
    shadowOpacity: 0.7,
    shadowRadius: 10,
    elevation: 20,
  },
  itemText: {
    position: 'absolute',
    bottom: 10,
    fontFamily: 'OblikBold',
    color: 'maroon',
  },
});

export default SubFolderScreen;