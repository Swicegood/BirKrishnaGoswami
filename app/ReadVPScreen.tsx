import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator } from 'react-native';
import { collection, getFirestore, query, orderBy, limit, getDocs, where } from "firebase/firestore";
import { useLocalSearchParams } from 'expo-router';

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

const ReadVPNowScreen = () => {
  const { offering } = useLocalSearchParams<{ offering: string }>();
  const post = JSON.parse(offering);
  const [text, setText] = useState('');
  const [date, setDate] = useState('');
  const [currentDoc, setCurrentDoc] = useState(null);
  const [atFirstDoc, setAtFirstDoc] = useState(true);
  const [atLastDoc, setAtLastDoc] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setCurrentDoc(post);
    setText(post.text);
    setDate(post.date);
    setIsLoading(false);
  }, []);

  const handleNextText = async () => {
    const db = getFirestore();
    setAtFirstDoc(false);
    if (currentDoc) {
      const currentDate = currentDoc.data().date;
      console.log("currentDate", currentDate);
      const nextQuery = query(
        collection(db, 'offerings'), 
        where('date', '<', currentDate), 
        orderBy('date', 'desc'), 
        limit(1)
      );
      const nextQuerySnapshot = await getDocs(nextQuery);
  
      nextQuerySnapshot.forEach((doc) => {
        // Assuming doc.data() returns an object with text, date, and category
        setText(doc.data().text);
        setDate(doc.data().date);
        console.log("currentDoc", doc.data().date);
      });
  
      if (nextQuerySnapshot.docs[0]) {
        setCurrentDoc(nextQuerySnapshot.docs[0]);
      }
  
      // Check if the current document is the last one

      const nextNextQuery = query(
        collection(db, 'offerings'),
        where('date', '>', currentDoc.data().date),  
        orderBy('date', 'desc'), 
      );
 
      const querySnapshot = await getDocs(nextNextQuery)

      if (querySnapshot.docs.length < 1) {
        setAtLastDoc(true);
      } else {
        setAtLastDoc(false);
      }
    }
  };
  
    const handlePreviousText = async () => {
      const db = getFirestore();
      setAtLastDoc(false);
      if (currentDoc) {
        const currentTimestamp = currentDoc.data().processed;
        console.log("currentTimestamp", currentTimestamp);
        const prevQuery = query(
          collection(db, 'offerings'), 
          where('date', '>', currentTimestamp), 
          orderBy('date', 'asc'), 
          limit(1)
        );
        const prevQuerySnapshot = await getDocs(prevQuery);
    
        prevQuerySnapshot.forEach((doc) => {
          // Assuming doc.data() returns an object with text, date, and title
          setText(doc.data().text);
          setDate(doc.data().date);
          console.log("currentDoc", doc.data().processed);
        });
    
        if (prevQuerySnapshot.docs[0]) {
          setCurrentDoc(prevQuerySnapshot.docs[0]);
        }
    
        const nextPrevQuery = query(
          collection(db, 'offerings'),
          where('date', '<', currentDoc.data().date),  
          orderBy('date', 'desc'), 
        );
   
        const querySnapshot = await getDocs(nextPrevQuery)
  
        if (querySnapshot.docs.length < 1) {
          setAtFirstDoc(true);
        } else {
          setAtFirstDoc(false);
        }
      }
    };
    
    if (isLoading) {
      return <ActivityIndicator size="large" color="#0000ff" />;
    }

    return (
      <View style={{ flex: 1 }}>
        <ScrollView style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.date}>{date}</Text>
            <Text style={styles.textText}>{text}</Text>
          </View>
        </ScrollView>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'  }}>
          <View style={{ flex: !atFirstDoc ? 0 : 0 }}>
            {!atFirstDoc && (
              <TouchableOpacity style={styles.nextButton} onPress={handlePreviousText}>
                <Text style={styles.nextButtonText}>{'<'} PREVIOUS</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={{ flex: !atLastDoc ? 0 : 0 }}>
            {!atLastDoc && (
              <TouchableOpacity style={styles.nextButton} onPress={handleNextText}>
                <Text style={styles.nextButtonText}>NEXT {'>'}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
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

export default ReadVPNowScreen;
