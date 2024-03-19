import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity,
   ActivityIndicator, FlatList, SafeAreaView, Dimensions } from 'react-native';
import { collection, getFirestore, query, orderBy, getDocs } from "firebase/firestore";
import placeholderImage from '../assets/images/placeholder-podq8jasdkjc0jdfrw96hbgsm3dx9f5s9dtnqlglf4.png'; // replace with your placeholder image path
import { Link } from 'expo-router';
import { setParams } from 'expo-router/src/global-state/routing';

const itemWidth = Dimensions.get('screen').width / 2 - 20; // Width of the item 
const itemHeight = itemWidth * 1.5; // Height of the item

const PurchaseScreen = () => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBooks = async () => {
      const db = getFirestore();
      const q = query(collection(db, 'ebooks'), orderBy('renderorder', 'asc'));
      const querySnapshot = await getDocs(q);
      setData(querySnapshot.docs.map((doc) => {
        return { ...doc.data(), key: doc.id };  // Add the key property to the object
      }));
      setIsLoading(false);
    }
  
    fetchBooks();
  }, []);

  if (isLoading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  const BookItem = ({ item }) => {
    const [isImageLoaded, setIsImageLoaded] = useState(false);

    return (
      <View style={styles.itemContainer}>
        <Link href={{ pathname: "./PdfViewScreen", params: { url: item.contenturl }   }} asChild>
          <TouchableOpacity>
            <Image
              source={isImageLoaded ? { uri: item.imgurl } : placeholderImage}
              style={styles.image}
              onLoad={() => setIsImageLoaded(true)}
            />
          </TouchableOpacity>
        </Link>
        <Text style={styles.itemText}>{item.title}</Text>
        <Link href={{ pathname: "./PdfViewScreen", params: { url: item.contenturl }  }} asChild>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>READ NOW</Text>
          </TouchableOpacity>
        </Link>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View>
        <FlatList
          data={data}
          renderItem={({ item }) => <BookItem item={item} />}
          keyExtractor={(item) => item.key}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.contentContainer}
        />
      </View>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  item: {
    width: itemWidth,
    marginBottom: 20,
    alignItems: 'center', // Center children horizontally
    justifyContent: 'center', // Center children vertically
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
    aspectRatio: 1/1.5, // Your images are square
    borderRadius: 10, // Optional: if you want rounded corners
  },
  itemText: {
    marginTop: 8,
    textAlign: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  button: {
    backgroundColor: '#ED4D4E',
    color: '#fff',
    borderRadius: 8,
    textAlign: 'center',
    paddingVertical: 20,
    marginTop: 10,
    width: itemWidth-16,
    alignItems: 'center',
  },
});

export default PurchaseScreen;