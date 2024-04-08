import React, { useEffect, useState } from 'react';
import { Link } from 'expo-router';
import { initializeApp } from 'firebase/app';
import { collection, getFirestore, query, getDocs } from "firebase/firestore";
import { View, Text, TouchableOpacity, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

// TODO: Replace the following with your app's Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyD8JpSB_tK2CBj1tC6f434-vezZ2x0bRbk",
  authDomain: "birkrishnagoswami-b7360.firebaseapp.com",
  projectId: "birkrishnagoswami-b7360",
  storageBucket: "birkrishnagoswami-b7360.appspot.com",
  messagingSenderId: "790459013032",
  appId: "1:790459013032:web:d33b61fc48a0178cf82f9d",
  measurementId: "G-7GVXDMLLSY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);



const YearScreen = () => {
  const [data, setData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const db = getFirestore();  


useEffect(() => {
  const fetchData = async () => {
    const q = query(collection(db, 'audio-tracks'));
    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs.reduce((acc, doc) => {
      if (doc.data().date) {
        const date = doc.data().date.toDate(); // Convert Firestore Timestamp to JavaScript Date
        const year = date.getFullYear();
        const monthNames = ["1  Jan", "2  Feb", "3  Mar", "4  Apr", "5  May", "6 Jun", "7 Jul", "8 Aug", "9 Sep", "10 Oct", "11 Nov", "12 Dec"];
        const month = monthNames[date.getMonth()];
        if (!acc[year]) acc[year] = {};
        if (!acc[year][month]) acc[year][month] = [];
        acc[year][month].push(doc.data().url);
      } else {
        if (!acc['Unknown']) acc['Unknown'] = {};
        if (!acc['Unknown']['Unknown']) acc['Unknown']['Unknown'] = [];
        acc['Unknown']['Unknown'].push(doc.data().url);
      }
      return acc;
    }, {});
    setData(data);
    setIsLoading(false);
    Object.keys(data).forEach(year => {
      console.log("Year: ", year, "Length: ", Object.keys(data[year]).length);
    });
  };
  fetchData();
}, []);
  
  if (isLoading) {
    return (
      <View style={styles.musicContainer}>
        <ActivityIndicator size="large" color="#C68446" />
      </View>
    );
  }

  return (
    <ScrollView>
    <View>
      {Object.keys(data).sort((a, b) => a === 'Unknown' ? 1 : b === 'Unknown' ? -1 : a - b).map((year) => (
        <View style={styles.container}>
  <Link href={{ pathname: './MonthScreen', params: { year: year, dataString: JSON.stringify(data[year]) } }} asChild>
    <TouchableOpacity style={styles.playButton}>
      {/* Replace with your play icon */}
      <Image source={require('../assets/images/folder.png')} style={styles.playIcon} />
    </TouchableOpacity>
  </Link>
  <View style={styles.textContainer}>
    <Text style={styles.titleText} numberOfLines={3} ellipsizeMode='tail'>{year}</Text>
  </View>
  <Text style={styles.countText}>{data[year]?.length}</Text>
</View>
      ))}
    </View>
    </ScrollView>
  );
      }
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 10,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc', // Adjust color as needed
    backgroundColor: 'white',
  },
  countText: {
    position: 'absolute',
    right: 10,
  },
  playButton: {
    marginRight: 30,
    // Add your styles for the button, such as size, backgroundColor, etc.
  },
  playIcon: {
    width: 70, // Adjust size as needed
    height: 70, // Adjust size as needed
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  titleText: {
    fontSize: 14,
    fontWeight: 'bold',
    // Adjust style as needed
  },
  dateText: {
    fontSize: 14,
    color: 'grey',
    // Adjust style as needed
  },
});

export default YearScreen;