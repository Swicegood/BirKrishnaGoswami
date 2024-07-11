import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Image, TouchableOpacity,
  ActivityIndicator, Dimensions, Platform, ScrollView, FlatList
} from 'react-native';
import { Link, useLocalSearchParams, useFocusEffect, router } from 'expo-router';
import CustomHeaderMain from '../components/CustomHeaderMain';
import GuageView from '../components/GuageView';

const placeholderImage = require('../assets/images/placeholder_portrait.png');

interface SubCategory {
  key: string;
  title: string;
  image: any;
  parents: any;
}

const images = {
  Croatia: require('../assets/images/Health.png'),
  Serbian_Camp: require('../assets/images/Health.png'),
  // Add more specific images if needed
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
  return Math.min(width, height) >= 600 && (aspectRatio > 1.6 || aspectRatio < 0.64);
};

const Subx3FolderScreen = () => {
  const { hierarchy: localHierarchy, category } = useLocalSearchParams<{ category: string; hierarchy: string }>();
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [deserializedHierarchy, setDeserializedHierarchy] = useState<Record<string, any> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [orientation, setOrientation] = useState(Dimensions.get('window').width > Dimensions.get('window').height ? 'LANDSCAPE' : 'PORTRAIT');
  const [width, setWidth] = useState(Dimensions.get('window').width);

  const onSetWidth = (width: number) => {
    console.log('Subx3FolderScreen width: ', width);
    setWidth(width);
  };

const [height, setHeight] = useState(Dimensions.get('window').height);
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
    console.log('HandleOrientation Called :', orientation);
  }


  const onSetOrientation = (orientation: string) => {
    if (Platform.OS === 'web') {
      handleOrientationChange(orientation);
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
    console.log("Subx3FolderScreenUniqSubCat", uniqueSubcategories);
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
            pathname: "FilesScreen",
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
      <GuageView onSetOrientation={onSetOrientation} onSetWidth={onSetWidth}>
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

export default Subx3FolderScreen;