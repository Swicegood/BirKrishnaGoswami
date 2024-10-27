import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Image, TouchableOpacity,
  ActivityIndicator, FlatList, Dimensions, Platform, Linking
} from 'react-native';
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import placeholderImage from '../assets/images/placeholder-podq8jasdkjc0jdfrw96hbgsm3dx9f5s9dtnqlglf4.png';
import { Link } from 'expo-router';
import { db } from './api/firebase';
import GuageView from '../components/GuageView';
import useIsMobileWeb from '../hooks/useIsMobileWeb';

interface EBooksScreenProps {
  vponly?: boolean;
}

interface EBook {
  title: string;
  imgurl: string;
  contenturl: string;
  renderorder: number;
  key: string;
}

const isTablet = () => {
  const { width, height } = Dimensions.get('window');
  const aspectRatio = width / height;
  return Math.min(width, height) >= 600 && (aspectRatio > 1.2 || aspectRatio < 0.9);
};

const EBooksScreen = ({ vponly = false }: EBooksScreenProps) => {
  const [data, setData] = useState<EBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [orientation, setOrientation] = useState(Dimensions.get('window').width > Dimensions.get('window').height ? 'LANDSCAPE' : 'PORTRAIT');
  const [width, setWidth] = useState(Dimensions.get('window').width);
  const [loadedImages, setLoadedImages] = useState<{ [key: string]: boolean }>({});
  const isMobileWeb = useIsMobileWeb();
  const [numColumns, setNumColumns] = useState(2);


  const onSetWidth = (width: number) => {
    console.log('EBooksScreen width: ', width);
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
    const fetchBooks = async () => {
      const q = query(collection(db, 'ebooks'), orderBy('renderorder', 'asc'));
      const querySnapshot = await getDocs(q);
      const result = querySnapshot.docs
        .map((doc) => {
          const data = doc.data();
          if (!vponly || (vponly && data.renderorder > 50)) {
            let modifiedUrl = data.imgurl.replace('.png', '.jpg');
            return { ...data, imgurl: modifiedUrl, key: doc.id };
          }
          return null;
        })
        .filter(item => item !== null);
      setData(result as EBook[]);
      setIsLoading(false);
    }

    fetchBooks();
  }, [vponly]);

  useEffect(() => {
    setNumColumns(orientation === 'LANDSCAPE' ? 4 : isTablet() ? 3 : 2);
  }, [orientation]);


  const getItemDimensions = () => {
    let itemWidth, itemHeight;
    if (Platform.OS === 'web' && !isMobileWeb) {
      itemWidth = width / 4;
      itemHeight = width / 3;
    } else if (isTablet()) {
      itemWidth = orientation === 'LANDSCAPE' ? width / 4 : width / 3;
      itemHeight = orientation === 'LANDSCAPE' ? width / 2 : width / 2;
    } else {
      itemWidth = orientation === 'LANDSCAPE' ? width / 4 : width / 2 - 20;
      itemHeight = orientation === 'LANDSCAPE' ? width / 3 : width * 0.75;
    }
    return { itemWidth, itemHeight };
  };

  const handleImageLoad = (key: string) => {
    setLoadedImages(prev => ({ ...prev, [key]: true }));
  };

  const renderItem = ({ item }: { item: EBook }) => {
    const { itemWidth, itemHeight } = getItemDimensions();
    const isImageLoaded = loadedImages[item.key];

    return (
      <View style={[styles.itemContainer, { width: itemWidth, height: itemHeight }, Platform.OS === 'web' && { marginBottom: 150 }]}>
        {Platform.OS === 'web' ? (
          <React.Fragment>
            <Image
              source={isImageLoaded ? { uri: item.imgurl } : placeholderImage}
              style={styles.image}
              onLoad={() => handleImageLoad(item.key)}
            />
            <Text style={styles.itemText}>{item.title}</Text>
            <TouchableOpacity style={styles.button} onPress={() => Linking.openURL(item.contenturl)}>
              <Text style={styles.buttonText}>READ NOW</Text>
            </TouchableOpacity>
          </React.Fragment>
        ) : (
          <>
            <TouchableOpacity>
              <Image
                source={isImageLoaded ? { uri: item.imgurl } : placeholderImage}
                style={styles.image}
                onLoad={() => handleImageLoad(item.key)}
              />
            </TouchableOpacity>
            <Text style={styles.itemText}>{item.title}</Text>
            <Link
              href={{
                pathname: "/PdfViewScreen",
                params: { url: item.contenturl, key: Date.now() }
              }}
              asChild
            >
              <TouchableOpacity style={styles.button}>
                <Text style={styles.buttonText}>READ NOW</Text>
              </TouchableOpacity>
            </Link>
          </>
        )}
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
    <GuageView onSetOrientation={onSetOrientation} onSetWidth={onSetWidth}>
      <View style={[styles.container, Platform.OS === 'web' && styles.webContainer]}>
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={(item) => item.key}
          numColumns={numColumns}
          key={numColumns}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.contentContainer}
          removeClippedSubviews={true}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={5}
        />
      </View>
    </GuageView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
  },
  webContainer: {
    height: 'calc(100vh - 70px)',
    overflow: 'auto',
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  contentContainer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  itemContainer: {
    marginBottom: 80,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  image: {
    width: '100%',
    height: undefined,
    aspectRatio: 1 / 1.5,
    borderRadius: 10,
  },
  itemText: {
    marginTop: 8,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#ED4D4E',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 10,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default EBooksScreen;