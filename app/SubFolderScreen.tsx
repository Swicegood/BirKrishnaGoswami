import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Image, TouchableOpacity,
  ActivityIndicator, Dimensions, Platform, ScrollView, FlatList
} from 'react-native';
import { Link, useLocalSearchParams, useFocusEffect, router } from 'expo-router';
import { useNavigationState } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomHeaderMain from '../components/CustomHeaderMain';
import MeasureView from './api/MeasureView';

const placeholderImage = require('../assets/images/placeholder_portrait.png');

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
  Nectar_of_Instruction: require('../assets/images/Nectar_of_Instruction.png'),
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
  "Ramayan_2013_": require('../assets/images/Ramayan.jpg'),
  "Ramayan_2019_": require('../assets/images/Ramayan.jpg'),
  "Ramayan_2020_": require('../assets/images/Ramayan.jpg'),
  "Ramayan_2021_": require('../assets/images/Ramayan.jpg'),
  "Ramayan_2022_": require('../assets/images/Ramayan.jpg'),
  Harinama_Cintamani: require('../assets/images/Harinama_Cintamani.jpg'),
  Manah_Siksa: require('../assets/images/Manah_Siksa.jpg'),
  "Srimati_Radharani's_Pastimes": require('../assets/images/Srimati_Radharanis_Pastimes.jpg'),
  Vraja_Mandal_Parikrama: require('../assets/images/Vraja_Mandal_Parikrama.png'),
  Etiquette: require('../assets/images/Etiquette.jpg'),
  The_Qualities_of_Vaishnavas: require('../assets/images/The_Qualities_of_Vaishnavas.png'),
  Disciple_Course: require('../assets/images/Disciple_Course.png'),
  Raising_Children_or_Brahmacaris: require('../assets/images/Raising_Children_or_Brahmacaris.png'),
  Jaiva_Dharma: require('../assets/images/Jaiva_Dharma.png'),
  Ramananda_Samvada: require('../assets/images/Ramananda_Samvada.png'),
  Camatkara_Candrika: require('../assets/images/Camatkara_Candrika.png'),
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

const isTablet = () => {
  const { width, height } = Dimensions.get('window');
  const aspectRatio = width / height;
  return Math.min(width, height) >= 600 && (aspectRatio > 1.6 || aspectRatio < 0.64);
};

const SubFolderScreen = () => {
  const { hierarchy: localHierarchy, category } = useLocalSearchParams<{ category: string; hierarchy: string }>();
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [deserializedHierarchy, setDeserializedHierarchy] = useState<Record<string, any> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [orientation, setOrientation] = useState(Dimensions.get('window').width > Dimensions.get('window').height ? 'LANDSCAPE' : 'PORTRAIT');
  const [width, setWidth] = useState(Dimensions.get('window').width);

  const onSetWidth = (width: number) => {
    console.log('SubFolderScreen width: ', width);
    setWidth(width);
  };

  const onSetOrientation = (orientation: string) => {
    if ((Platform.OS === 'android' && !isTablet()) || Platform.OS === 'web') {
      if (orientation === 'LANDSCAPE') {
        setOrientation('PORTRAIT');
      } else {
        setOrientation('LANDSCAPE');
      }
      return;
    }
    setOrientation(orientation);
  };

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
    setIsLoading(false);
  }, [localHierarchy]);

  const getItemDimensions = () => {
    let itemWidth, itemHeight;
    if (Platform.OS === 'web') {
      itemWidth = width / 4;
      itemHeight = width / 2;
    } else if (isTablet()) {
      itemWidth = width / 4;
      itemHeight = width / 3;
    } else {
      itemWidth = orientation === 'LANDSCAPE' ? width / 4 : width / 2;
      itemHeight = orientation === 'LANDSCAPE' ? width / 3 : width * .75;
    }
    return { itemWidth, itemHeight };
  };

  const renderItem = ({ item }: { item: SubCategory }) => {
    const { itemWidth, itemHeight } = getItemDimensions();
    return (
      <View style={[styles.itemContainer, { width: itemWidth, height: itemHeight }]}>
        <Link
          href={{
            pathname: buildCategoryList(deserializedHierarchy, item.title).length === 0 ? "FilesScreen" : "SubSubFolderScreen",
            params: {
              category: item.title,
              hierarchy: JSON.stringify(deserializedHierarchy)
            }
          }}
          asChild
        >
          <TouchableOpacity>
            <View style={(Platform.OS === 'web') ? {} : styles.imageView}>
              {(Platform.OS === 'web' ? (
                <Image source={images[item.title] || item.image} style={{...styles.image, width: width / 5}} resizeMode="contain" />
              ) : (
                <Image source={images[item.title] || item.image} style={styles.image} resizeMode="cover" />
              ))}
            </View>
          </TouchableOpacity>
        </Link>
        <Text style={styles.itemText}>{item.title.replaceAll('_', ' ')}</Text>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#ED4D4E" />
      </View>
    );
  }

  const ListComponent = Platform.OS === 'web' ? ScrollView : View;

  return (
    <>
      <CustomHeaderMain title={category} />
      <MeasureView onSetOrientation={onSetOrientation} onSetWidth={onSetWidth}>
        <ListComponent style={[styles.container, Platform.OS === 'web' && styles.webContainer]}>
          <FlatList
            data={subCategories}
            renderItem={renderItem}
            keyExtractor={(item) => item.key}
            numColumns={Platform.OS === 'web' ? 4 : (isTablet() || orientation === 'LANDSCAPE' ? 4 : 2)}
            key={Platform.OS === 'web' ? 4 : (isTablet() || orientation === 'LANDSCAPE' ? 4 : 2)}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={styles.contentContainer}
            ListFooterComponent={<View style={{ height: 20 }} />}
            scrollEnabled={Platform.OS !== 'web'}
          />
        </ListComponent>
      </MeasureView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
  },
  webContainer: {
    height: '100vh',
    overflowY: 'auto' as 'auto',
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  contentContainer: {
    alignItems: 'center',
  },
  itemContainer: {
    borderWidth: 0.25,
    borderColor: 'lightgray',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    paddingTop: 120,
    paddingBottom: 120,
    paddingLeft: 15,
    paddingRight: 15,
  },
  image: {
    width: '50%',
    height: undefined,
    aspectRatio: 0.673,
  },
  imageView: {
    width: '100%',
    backgroundColor: '#fff',
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
    textAlign: 'center',
  },
});

export default SubFolderScreen;