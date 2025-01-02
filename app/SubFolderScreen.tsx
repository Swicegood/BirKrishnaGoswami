import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, FlatList, Dimensions, ActivityIndicator, Image, Platform } from 'react-native';
import { Link, useLocalSearchParams } from 'expo-router';
import CustomHeaderMain from '../components/CustomHeaderMain';
import GuageView from '../components/GuageView';
import useIsMobileWeb from '../hooks/useIsMobileWeb';
import { getListenedPositions, getUpdatedFiles } from '../app/api/apiWrapper';

const placeholderImage = require('../assets/images/placeholder_portrait.png');

interface SubCategory {
  key: string;
  title: string;
  image: any;
  parents: any;
  hasListenedTrack?: boolean;
}

interface File {
  url: string;
  fakeUrl?: string;
}

const images: Record<string, any> = {
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
  BKG_and_Sita_CD: require('../assets/images/Guitar.jpg'),
  Goloka_Album_I: require('../assets/images/Guitar.jpg'),
  Goloka_Album_II: require('../assets/images/Guitar.jpg'),
  Gopinath: require('../assets/images/Guitar.jpg'),
  Govinda_Gopal: require('../assets/images/Guitar.jpg'),
  Laugh: require('../assets/images/Laugh.png'),
  Morning_Program: require('../assets/images/Bhajans.png'),
  "NZ_2013": require('../assets/images/Bhajans.png'),
  Various_Bhajans: require('../assets/images/Bhajans.png'),
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
  Dasa_Mula_Tattva: require('../assets/images/Dasa_Mula_Tattva.png'),
  Dana_Keli_Kaumudi: require('../assets/images/Dana_Keli_Kaumudi.png'),
};


function buildCategoryList(hierarchy: Record<string, any>, parent: string): string[] {
  const categories: string[] = [];
  const traverse = (node: Record<string, any> | null, currentParent: string) => {
    if (!node) return;

    if (currentParent === parent) {
      categories.push(...Object.keys(node));
    } else {
      Object.entries(node).forEach(([key, value]) => {
        if (value && typeof value === 'object') {
          traverse(value, key);
        }
      });
    }
  };

  traverse(hierarchy, '');
  return categories;
}

const isTablet = () => {
  const { width, height } = Dimensions.get('window');
  const aspectRatio = width / height;
  return Math.min(width, height) >= 600 && (aspectRatio > 1.2 || aspectRatio < 0.9);
};

function checkIfSubcategoryListened(
  subcategory: string,
  listenedMap: Record<string, number>,
  updatedFiles: File[]
): boolean {
  // Create a mapping of real URLs to fake URLs
  const urlMapping = updatedFiles.reduce((acc, file) => {
    acc[file.url] = file.fakeUrl;
    return acc;
  }, {} as Record<string, string>);

  for (const [url, position] of Object.entries(listenedMap)) {
    if (position > 0) {
      // Find corresponding fake URL
      const fakeUrl = urlMapping[url];
      // Parse the fake URL to extract subcategory
      const parts = (fakeUrl || url).split('/').filter(Boolean);
      const extracted = parts[6]; // Assuming subcategory is at index 6
      if (extracted === subcategory) {
        return true;
      }

    }
  }
  return false;
}

const SubFolderScreen = () => {
  const { hierarchy: localHierarchy, category } = useLocalSearchParams<{ category: string; hierarchy: string }>();
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [deserializedHierarchy, setDeserializedHierarchy] = useState<Record<string, any> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [orientation, setOrientation] = useState(Dimensions.get('window').width > Dimensions.get('window').height ? 'LANDSCAPE' : 'PORTRAIT');
  const [width, setWidth] = useState(Dimensions.get('window').width);
  const [height, setHeight] = useState(Dimensions.get('window').height);
  const isMobileWeb = useIsMobileWeb();
  const [numColumns, setNumColumns] = useState(2);

  const onSetWidth = (width: number) => {
    console.log('SubFolderScreen width: ', width);
    setWidth(width);
  };
  const ORIENTATION_THRESHOLD = 0.1; // 10% threshold



  const handleOrientationChange = () => {
    const newWidth = Dimensions.get('window').width;
    const newHeight = Dimensions.get('window').height;
    const aspectRatio = newWidth / newHeight;
    const previousAspectRatio = width / height;

    if (Math.abs(aspectRatio - previousAspectRatio) > ORIENTATION_THRESHOLD) {
      const newOrientation = newWidth > newHeight ? 'LANDSCAPE' : 'PORTRAIT';
      setOrientation(newOrientation);
    }

    setWidth(newWidth);
    setHeight(newHeight);
  };

  const onSetOrientation = (orientation: string) => {
    if (Platform.OS === 'web') {
      handleOrientationChange();
    } else {
      setOrientation(orientation);
    }
  };

  useEffect(() => {
    const initializeScreen = async () => {
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

      const listenedMap = await getListenedPositions();
      const updatedFiles = await getUpdatedFiles();


      let subcategories: SubCategory[] = [];
      if (category !== null && deserializedHierarchy !== null) {
        subcategories = buildCategoryList(deserializedHierarchy, category).map((subcategory, index) => ({
          title: subcategory,
          key: index.toString(),
          image: placeholderImage,
          parents: deserializedHierarchy[index],
          hasListenedTrack: checkIfSubcategoryListened(subcategory, listenedMap, updatedFiles),
        }));
      }

      const uniqueSubcategories = subcategories.reduce((unique, subcategory) => {
        if (unique.findIndex(item => item.title === subcategory.title) === -1) {
          unique.push(subcategory);
        }
        return unique;
      }, [] as SubCategory[]);
      setSubCategories(uniqueSubcategories);
      setIsLoading(false);
    };

    initializeScreen();
  }, [localHierarchy]);

  useEffect(() => {
    setNumColumns(orientation === 'LANDSCAPE' ? 4 : isTablet() ? 3 : 2);
  }, [orientation]);

  const getItemDimensions = () => {
    let itemWidth, itemHeight;
    if (Platform.OS === 'web' && !isMobileWeb) {
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

  const renderItem = ({ item }: { item: SubCategory & { hasListenedTrack?: boolean } }) => {
    const { itemWidth, itemHeight } = getItemDimensions();
    return (
      <View style={[styles.itemContainer, { width: itemWidth, height: itemHeight }, Platform.OS === 'web' && (isMobileWeb ? orientation === 'LANDSCAPE' ? { marginBottom: 20 } : { marginBottom: 0 } : { marginBottom: 150 })]}>
        <Link
          href={{
            pathname: buildCategoryList(deserializedHierarchy, item.title).length === 0 ? "FilesScreen" : "SubSubFolderScreen",
            params: { category: item.title, hierarchy: JSON.stringify(deserializedHierarchy) }
          }}
          asChild
        >
          <TouchableOpacity>
            <View style={(Platform.OS === 'web') ? {} : styles.imageView}>
              {(Platform.OS === 'web' ? (
                <Image source={images[item.title] || item.image} style={{ ...styles.image, width: isMobileWeb && orientation === 'LANDSCAPE' ? width / 6 : width / 5 }} resizeMode="contain" />
              ) : (
                <Image source={images[item.title] || item.image} style={styles.image} resizeMode="cover" />
              ))}
              {item.hasListenedTrack && (
                <View style={styles.greenDot} />
              )}
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

  return (
    <>
      <CustomHeaderMain title={category} />
      <GuageView onSetOrientation={onSetOrientation} onSetWidth={onSetWidth}>
        <View style={[styles.container, Platform.OS === 'web' && styles.webContainer]}>
          <FlatList
            data={subCategories}
            renderItem={renderItem}
            keyExtractor={(item) => item.key}
            numColumns={numColumns}
            key={numColumns}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={styles.contentContainer}
            ListFooterComponent={<View style={{ height: 20 }} />}
          />
        </View>
      </GuageView>
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
    paddingBottom: 100,
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
  greenDot: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'lime', // neon green
    zIndex: 1,
  },
});

export default SubFolderScreen;