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
  Others: require('../assets/images/Bhagavad_Gita.png'),
  Health: require('../assets/images/Health.png'),
  Ananda_Vrindavan_Campu: require('../assets/images/Ananda_Vrindavan_Campu.png'),
  Dana_Keli_Cintamani: require('../assets/images/Dana_Keli_Cintamani.png'),
  Vidagdha_Madhava: require('../assets/images/Vidagdha_Madhava.jpg'),
  Lalita_Madhava: require('../assets/images/Lalita_Madhava.jpg'),
  Gopal_Champu: require('../assets/images/Gopal_Champu.jpg'),
  Mukta_Carita: require('../assets/images/Mukta_Carita.jpg'),
  "Nectar_of_Instruction_2014_": require('../assets/images/Nectar_of_Instruction.png'),
  "Nectar_of_Instruction_2022_": require('../assets/images/Nectar_of_Instruction.png'),
  Krishnanika_Kaumudi: require('../assets/images/Krishnanika_Kaumudi.jpg'),
  Vilapa_Kusumanjali: require('../assets/images/Vilapa_Kusumanjali.jpg'),
  Connecting_to_Krishna: require('../assets/images/Devotional_Service.png'),
  Chaitanya_Charitamrita: require('../assets/images/Chaitanya_Charitamrita.png'),
  Adi_Lila: require('../assets/images/Adi_Lila.jpg'),
  Madhya_Lila: require('../assets/images/Madhya_Lila.jpg'),
  Antya_Lila: require('../assets/images/Antya_Lila.jpg'),
  Nectar_of_Devotion: require('../assets/images/Nectar_of_Devotion.png'),
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
  Harinama_Cintamani: require('../assets/images/Harinama_Cintamani.jpg'),
  Manah_Siksa: require('../assets/images/Manah_Siksa.jpg'),
  "Srimati_Radharani's_Pastimes": require('../assets/images/Srimati_Radharanis_Pastimes.jpg'),
  Vraja_Mandal_Parikrama: require('../assets/images/Vraja_Mandal_Parikrama.png'),
  Etiquette: require('../assets/images/Etiquette.jpg'),
  The_Qualities_of_Vaishnavas: require('../assets/images/The_Qualities_of_Vaishnavas.png'),
  Disciple_Course: require('../assets/images/Disciple_Course.png'),
  Raising_Children_or_Brahmacaris: require('../assets/images/Raising_Children_or_Brahmacaris.png'),
};

function buildCategoryList(hierarchy: Record<string, any>, parent: string): string[] {
  const categories: string[] = [];
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
  const { hierarchy: localHierarchy, category } = useLocalSearchParams<{ category: string; hierarchy: string }>();
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [deserializedHierarchy, setDeserializedHierarchy] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    let deserializedHierarchy: Record<string, any> = {};
    try {
      if (localHierarchy !== null) {
        deserializedHierarchy = JSON.parse(localHierarchy);
      }
    } catch (error) {
      console.log("Hierarchy Failed");
      return;
    }
    setDeserializedHierarchy(deserializedHierarchy);
    let subcategories: SubCategory[] = [];
    if (category !== null && deserializedHierarchy !== null) {
      subcategories = buildCategoryList(deserializedHierarchy, category).map((subcategory, index): SubCategory => ({
        title: subcategory,
        key: index.toString(),
        image: placeholderImage,
        parents: deserializedHierarchy[index],
      }));
    }
    const uniqueSubcategories = subcategories.reduce((unique, subcategory) => {
      if (unique.findIndex(item => item.title === subcategory.title) === -1) {
        unique.push(subcategory);
      }
      return unique;
    }, [] as SubCategory[]);
    setSubCategories(uniqueSubcategories);
    console.log("SubFolderScreenUniqSubCat", uniqueSubcategories);

  }, [localHierarchy]);


  const renderItem = ({ item }: { item: SubCategory }) => (
<View style={styles.itemContainer}>
  <Link
    href={{
      pathname: buildCategoryList(deserializedHierarchy, item.title).length === 0 ? "FilesScreen" : "SubSubFolderScreen",
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
    backgroundColor: 'white',
    shadowColor: "#000",
    shadowOffset: {
      width: -10,
      height: 10,
    },
    shadowOpacity: 0.7,
    shadowRadius: 10,
    elevation: 15,
  },
  itemText: {
    position: 'absolute',
    bottom: 10,
    fontFamily: 'OblikBold',
    color: 'maroon',
  },
});

export default SubFolderScreen;