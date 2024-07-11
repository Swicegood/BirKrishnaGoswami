import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, FlatList, Dimensions, ActivityIndicator, Image, Platform } from 'react-native';
import { Link, useLocalSearchParams } from 'expo-router';
import CustomHeaderMain from '../components/CustomHeaderMain';
import GuageView from '../components/GuageView';
import useIsMobileWeb from '../hooks/useIsMobileWeb';

const placeholderImage = require('../assets/images/placeholder_portrait.png');

interface SubCategory {
  key: string;
  title: string;
  image: any;
  parents: any;
}

const images = {
  "01_-_Purva_Campu": require('../assets/images/Gopal_Champu.jpg'),
  "02_-_Uttara_Campu": require('../assets/images/Gopal_Champu.jpg'),
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
  Adi_Lila: require('../assets/images/Adi_Lila.jpg'),
  Madhya_Lila: require('../assets/images/Madhya_Lila.jpg'),
  Antya_Lila: require('../assets/images/Antya_Lila.jpg'),
  "Empathic_Communications_2012_": require('../assets/images/Empathic_Communication.jpg'),
  "Empathic_Communications_2018_": require('../assets/images/Empathic_Communication.jpg'),
  "Empathic_Communications_2021_": require('../assets/images/Empathic_Communication.jpg'),
  "July_2013": require('../assets/images/Health.png'),
  "June_2013": require('../assets/images/Health.png'),
  "Disciple_Course_01_": require('../assets/images/Disciple_Course.png'),
  "Disciple_Course_02_": require('../assets/images/Disciple_Course.png'),
  "Disciple_Course_03_": require('../assets/images/Disciple_Course.png'),
  "Nectar_of_Instruction_2014_": require('../assets/images/Nectar_of_Instruction.png'),
  "Nectar_of_Instruction_2022_": require('../assets/images/Nectar_of_Instruction.png'),
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

const isTablet = () => {
  const { width, height } = Dimensions.get('window');
  const aspectRatio = width / height;
  return Math.min(width, height) >= 600 && (aspectRatio > 1.2 || aspectRatio < 0.9);
};

const SubSubFolderScreen = () => {
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
    console.log('SubSubFolderScreen width: ', width);
    setWidth(width);
  };

  const ORIENTATION_THRESHOLD = 0.1; // 10% threshold



  const handleOrientationChange = () => {
    const newWidth = Dimensions.get('window').width;
    const newHeight = Dimensions.get('window').height;
    const aspectRatio = newWidth / newHeight;
    const previousAspectRatio = width / height;

    // Only change orientation if the aspect ratio change is significant
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
    setIsLoading(false);
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

  const renderItem = ({ item }: { item: SubCategory }) => {
    const { itemWidth, itemHeight } = getItemDimensions();
    return (
      <View style={[styles.itemContainer, { width: itemWidth, height: itemHeight }, Platform.OS === 'web' && (isMobileWeb ? orientation === 'LANDSCAPE' ? { marginBottom: 20 } : { marginBottom: 0 } : { marginBottom: 150 })]}>
        <Link
          href={{
            pathname: buildCategoryList(deserializedHierarchy, item.title).length === 0 ? "FilesScreen" : "Subx3FolderScreen",
            params: { category: item.title, hierarchy: JSON.stringify(deserializedHierarchy) }
          }}
          asChild
        >
          <TouchableOpacity>
            <View style={(Platform.OS === 'web') ? {} : styles.imageView}>
              {(Platform.OS === 'web' ? (
                <Image source={images[item.title] || item.image} style={{...styles.image, width: isMobileWeb && orientation === 'LANDSCAPE' ? width / 6 : width / 5}} resizeMode="contain" />
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
            scrollEnabled={Platform.OS !== 'web'}
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
});

export default SubSubFolderScreen;