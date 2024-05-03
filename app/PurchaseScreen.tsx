import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, 
  ActivityIndicator, FlatList, SafeAreaView, Dimensions } from 'react-native';
import { collection, query, getDocs } from "firebase/firestore";
import { db } from './api/firebase';
// Assuming you have a placeholder image, replace 'placeholder.jpg' with your image path
import placeholderImage from '../assets/images/placeholder-podq8jasdkjc0jdfrw96hbgsm3dx9f5s9dtnqlglf4.png'; // replace with your placeholder image path
import { Link } from 'expo-router';


const itemWidth = Dimensions.get('screen').width / 2 - 20; // Width of the item 
const itemHeight = itemWidth * 1.5; // Height of the item

const PurchaseScreen = () => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    const fetchBooks = async () => {
      const q = query(collection(db, 'books'));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        // doc.data() returns an object with title, blurb, imageurl, and purchaseurl

      });
      setData(querySnapshot.docs.map((doc) => {
        return { ...doc.data(), key: doc.id };  // Add the key property to the object
      }));
      setIsLoading(false);
    }
  
    fetchBooks();
  }, []);

const renderItem = ({ item }) => {
    return (
      <View style={styles.itemContainer}>
        <Link href={ {pathname: item.buyurl }}asChild>
        <TouchableOpacity>
        <Image
          source={{ uri: item.imgurl || placeholderImage }}
          style={styles.image}
        />
        </TouchableOpacity>
        </Link>
        <Text style={styles.itemText}>{item.title}</Text>
        <Link href={ {pathname: item.buyurl }}asChild>
        <TouchableOpacity
          style={styles.button}
        >
          <Text style={styles.buttonText}>PURCHASE BOOK</Text>
        </TouchableOpacity>
        </Link>
      </View>
    );
  }

 if (isLoading) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#ED4D4E" />
    </View>
  )
  }

  return (
        <View>
          <FlatList
            data={data}
            renderItem={renderItem}
            keyExtractor={(item) => item.key}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={styles.contentContainer}
          />
        </View>
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
  columnWrapper: {
    justifyContent: 'space-between',
  },
  contentContainer: {
    alignItems: 'center',
  },
  itemContainer: {
    width: itemWidth,
    marginBottom: 16, // Space between rows
    padding: 8,
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
});

export default PurchaseScreen;