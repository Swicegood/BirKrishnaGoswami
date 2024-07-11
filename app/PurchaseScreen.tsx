import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Image, TouchableOpacity,
  ActivityIndicator, FlatList, Linking, Dimensions, Platform, ScrollView
} from 'react-native';
import { collection, query, getDocs } from "firebase/firestore";
import { db } from './api/firebase';
import placeholderImage from '../assets/images/placeholder-podq8jasdkjc0jdfrw96hbgsm3dx9f5s9dtnqlglf4.png';
import { Link } from 'expo-router';
import GuageView from '../components/GuageView';

interface Book {
  key: string;
  title: string;
  imgurl: string;
  buyurl: string;
}

const isTablet = () => {
  const { width, height } = Dimensions.get('window');
  const aspectRatio = width / height;
  return Math.min(width, height) >= 600 && (aspectRatio > 1.2 || aspectRatio < 0.9);
};

const PurchaseScreen = () => {
  const [data, setData] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [orientation, setOrientation] = useState(Dimensions.get('window').width > Dimensions.get('window').height ? 'LANDSCAPE' : 'PORTRAIT');
  const [width, setWidth] = useState(Dimensions.get('window').width);

  const onSetWidth = (width: number) => {
    console.log('PurchaseScreen width: ', width);
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
      const q = query(collection(db, 'books'));
      const querySnapshot = await getDocs(q);
      const books = querySnapshot.docs.map((doc) => ({
        ...doc.data(),
        key: doc.id
      })) as Book[];
      setData(books);
      setIsLoading(false);
    }

    fetchBooks();
  }, []);

  const getItemDimensions = () => {
    let itemWidth, itemHeight;
    if (Platform.OS === 'web') {
      itemWidth = width / 4;
      //itemHeight = width / 3;
    } else if (isTablet()) {
      itemWidth = orientation === 'LANDSCAPE' ? width / 4 : width / 3;
      itemHeight = orientation === 'LANDSCAPE' ? width / 2 : width / 2;
    } else {
      itemWidth = orientation === 'LANDSCAPE' ? width / 4 : width / 2 - 20;
      itemHeight = orientation === 'LANDSCAPE' ? width / 3 : width * 0.75;
    }
    return { itemWidth, itemHeight };
  };

  const renderItem = ({ item }: { item: Book }) => {
    const { itemWidth, itemHeight } = getItemDimensions();
    return (
      <View style={[styles.itemContainer, { width: itemWidth, height: itemHeight }]}>
        {(Platform.OS === 'web') ? (
          <React.Fragment>
            <Image
              source={{ uri: item.imgurl } || placeholderImage}
              style={styles.image}
            />
            <Text style={styles.itemText}>{item.title}</Text>
            <TouchableOpacity style={styles.button} onPress={() => Linking.openURL(item.buyurl)}>
              <Text style={styles.buttonText}>PURCHASE BOOK</Text>
            </TouchableOpacity>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <Link href={{ pathname: item.buyurl }} asChild>
              <TouchableOpacity>
                <Image
                  source={{ uri: item.imgurl || placeholderImage }}
                  style={styles.image}
                />
              </TouchableOpacity>
            </Link>
            <Text style={styles.itemText}>{item.title}</Text>
            <Link href={{ pathname: item.buyurl }} asChild>
              <TouchableOpacity style={styles.button}>
                <Text style={styles.buttonText}>PURCHASE BOOK</Text>
              </TouchableOpacity>
            </Link>
          </React.Fragment>
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

  const ListComponent = Platform.OS === 'web' ? ScrollView : View;

  return (
    <GuageView onSetOrientation={onSetOrientation} onSetWidth={onSetWidth}>
      <ListComponent style={[styles.container, (Platform.OS === 'web' || isTablet()) && styles.webContainer]}>
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={(item) => item.key}
          numColumns={Platform.OS === 'web' ? 3 : (orientation === 'LANDSCAPE' ? 3 : 2)}
          key={Platform.OS === 'web' ? 3 : (orientation === 'LANDSCAPE' ? 3 : 2)}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.contentContainer}
          ListFooterComponent={<View style={{ height: 120 }} />}
          scrollEnabled={Platform.OS !== 'web'}
        />
      </ListComponent>
    </GuageView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
  },
  webContainer: {
    height: 'calc(100vh - 70px)',
    overflowY: 'auto' as 'auto',
    paddingTop: 20,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  contentContainer: {
    height: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemContainer: {
    marginBottom: 40,
    alignItems: 'center',
    paddingRight: 10,
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

export default PurchaseScreen;