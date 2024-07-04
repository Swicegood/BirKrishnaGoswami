import React, { useEffect, useState } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, FlatList, Dimensions, ActivityIndicator, Image, Platform, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { getAllFiles } from '../app/api/apiWrapper';
import MeasureView from './api/MeasureView';

const placeholderImage = require('../assets/images/placeholder_portrait.png');

export const HierarchyContext = React.createContext<Record<string, any> | null>(null);

interface File {
  category: string;
  title: string;
  url: string;
  image: string;
}

const images = {
  Srimad_Bhagavatam: require('../assets/images/Srimad_Bhagavatam.png'),
  Bhajans: require('../assets/images/Bhajans.png'),
  Audio_Books: require('../assets/images/Audio_Books.png'),
  Course: require('../assets/images/Course.png'),
  Bhagavad_Gita: require('../assets/images/Bhagavad_Gita.png'),
  Chaitanya_Charitamrita: require('../assets/images/Chaitanya_Charitamrita.png'),
  Nectar_of_Devotion: require('../assets/images/Nectar_of_Devotion.png'),
  Nectar_of_Instruction: require('../assets/images/Nectar_of_Instruction.png'),
  Question_and_Answer: require('../assets/images/Question_and_Answer.png'),
  Krishna_Book: require('../assets/images/Krishna_Book.png'),
  Festivals: require('../assets/images/Festivals.png'),
  Various: require('../assets/images/Various.png'),
  Ramayan: require('../assets/images/Ramayan.jpg'),
  Seminar: require('../assets/images/Seminar.png'),
  Brhad_Bhagavatmrita: require('../assets/images/Brihad_Bhagavatamrita.jpg'),
  // Add more categories as needed...
};

function extractHierarchyFromUrl(url: string) {
  const parts = url.split('/').filter(part => part);
  const hierarchicalParts = parts.slice(5, -1);
  const hierarchy: Record<string, any> = {};
  let currentLevel = hierarchy;

  for (const part of hierarchicalParts) {
    if (!(part in currentLevel)) {
      currentLevel[part] = {};
    }
    currentLevel = currentLevel[part];
  }

  return hierarchy;
}

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

function buildListFromParent(hierarchy: Record<string, any>, parent: string): string[] {
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

const FolderScreen = () => {
  const [folders, setFolders] = useState<string[]>([]);
  const [hierarchy, setHierarchy] = useState<Record<string, any>[]>([]);
  const [deserializedHierarchy, setDeserializedHierarchy] = useState<Record<string, any> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [orientation, setOrientation] = useState(Dimensions.get('window').width > Dimensions.get('window').height ? 'LANDSCAPE' : 'PORTRAIT');
  const [width, setWidth] = useState(Dimensions.get('window').width);

  const onSetWidth = (width: number) => {
    console.log('FolderScreen width: ', width);
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
    (async () => {
      const files: File[] = (await getAllFiles('audioFilesList', 'mp3Files')).map(url => ({ url }));
      const hierarchy = files.map(file => {
        const hierarchyFromUrl = extractHierarchyFromUrl(file.url);
        return disambiguate(hierarchyFromUrl);
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

  const disambiguate = (hierarchy: Record<string, any>, parentName = '') => {
    return Object.entries(hierarchy).reduce((acc, [key, value]) => {
      const isNumber = !isNaN(Number(key));
      const uniqueName = isNumber ? `${parentName}_${key}_` : key;
      if (typeof value === 'object' && value !== null) {
        acc[uniqueName] = disambiguate(value, uniqueName);
      } else {
        acc[uniqueName] = value;
      }
      return acc;
    }, {} as Record<string, any>);
  };

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

  const renderItem = ({ item }: { item: { key: string, category: string, image: any } }) => {
    const { itemWidth, itemHeight } = getItemDimensions();
    return (
      <View style={[styles.itemContainer, { width: itemWidth, height: itemHeight }]}>
        <Link
          href={{
            pathname: buildListFromParent(deserializedHierarchy, item.category).length === 0 ? "FilesScreen" : "SubFolderScreen",
            params: { category: item.category, hierarchy: JSON.stringify(hierarchy) }
          }}
          asChild
        >
          <TouchableOpacity>
            <View style={(Platform.OS === 'web') ? {} : styles.imageView}>
              {(Platform.OS === 'web' ? (
                <Image source={images[item.category] || item.image} style={{...styles.image, width: width / 5}} resizeMode="contain" />
              ) : (
                <Image source={images[item.category] || item.image} style={styles.image} resizeMode="cover" />
              ))}
            </View>
          </TouchableOpacity>
        </Link>
        <Text style={styles.itemText}>{item.category.replaceAll('_', ' ')}</Text>
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

  const data = folders.map((folder, index) => ({
    key: String(index),
    category: folder || 'Loading...',
    image: placeholderImage,
  }));

  const ListComponent = Platform.OS === 'web' ? ScrollView : View;

  return (
    <HierarchyContext.Provider value={deserializedHierarchy}>
      <MeasureView onSetOrientation={onSetOrientation} onSetWidth={onSetWidth}>
        <ListComponent style={[styles.container, Platform.OS === 'web' && styles.webContainer]}>
          <FlatList
            data={data}
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
    </HierarchyContext.Provider>
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

export default FolderScreen;