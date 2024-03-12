import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, Dimensions } from 'react-native';
import { collection, getFirestore, query, orderBy, limit, getDocs, where } from "firebase/firestore";
function formatDate(dateString) {
  if (!dateString || dateString.split('/').length !== 3) {
    return '';
  }
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dateParts = dateString.split('/');
  const date = new Date(`20${dateParts[2]}`, dateParts[0] - 1, dateParts[1]);

  const month = months[date.getMonth()];
  const day = String(date.getDate()).padStart(2, '0');

  return `${month} ${day}`;
}

const TravelScreen = () => {
  const [text, setText] = useState('');
  const [date, setDate] = useState('');
  const [currentDoc, setCurrentDoc] = useState(null);


  useEffect(() => {
    const fetchText = async () => {
      const db = getFirestore();
      const q = query(collection(db, 'travel-schedule'), orderBy('date', 'desc'), limit(1));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        // Assuming doc.data() returns an object with text, date, and category
        setText(doc.data().text);
        setDate(doc.data().date);
      
        // Store the current document in the state variable
        setCurrentDoc(doc);
      });
    };

    fetchText();
  }, []);

  const handleNextText = async () => {
    const db = getFirestore();
    if (currentDoc) {
      const currentTimestamp = currentDoc.data().processed;
      console.log("currentTimestamp", currentTimestamp);
      const nextQuery = query(
        collection(db, 'travel-schedule'), 
        where('processed', '<', currentTimestamp), 
        orderBy('processed', 'desc'), 
        limit(1)
      );
      const nextQuerySnapshot = await getDocs(nextQuery);
  
      nextQuerySnapshot.forEach((doc) => {
        // Assuming doc.data() returns an object with text, date, and category
        setText(doc.data().text);
        setDate(doc.data().date);

      console.log("currentDoc", doc.data().processed);
      });

      setCurrentDoc(nextQuerySnapshot.docs[0]);
      }
    }
  


  return (
    <ScrollView style={styles.container}>

      <Image source={require('../../assets/images/placeholder_355_200.png')} style={{ width: Dimensions.get("screen").width, alignSelf: 'center' }} />
      <View style={styles.content}>
        <Text style={styles.date}>{formatDate(date)}</Text>
        <Text style={styles.textText}>{text}</Text>
      </View>
      <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'flex-end' }}>
      <TouchableOpacity style={styles.nextButton} onPress={handleNextText}>
        <Text style={styles.nextButtonText}>NEXT {'>'}</Text>
      </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: '#E53935',
    padding: 10,
  },
  headerText: {
    color: 'white',
    fontSize: 24,
    textAlign: 'center',
  },
  content: {
    margin: 20,
  },
  date: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#E53935',
  },
  textText: {
    fontSize: 20,
    marginTop: 10,
  },
  category: {
    fontSize: 16,
    color: 'blue',
    marginTop: 10,
  },
  nextButton: {
    backgroundColor: 'transparent',
    borderColor: '#E53935',
    borderWidth: 2,
    borderRadius: 10, // Adjust the border radius value as needed
    color: '#E53935',
  },
  nextButtonText: {
    color: '#E53935',
    padding: 10,
  },
  
});

export default TravelScreen;
