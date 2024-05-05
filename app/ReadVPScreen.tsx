import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Dimensions
} from 'react-native';
import { collection, query, orderBy, limit, getDocs, where, Query, QuerySnapshot } from "firebase/firestore";
import { useLocalSearchParams } from 'expo-router';
import { db } from './api/firebase';
import RenderHTML from 'react-native-render-html';

const contentWidth = Dimensions.get('window').width;

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
  const { offeringDate } = useLocalSearchParams<{ offeringDate: string }>();
  const [text, setText] = useState('');
  const [date, setDate] = useState('');
  const [currentDoc, setCurrentDoc] = useState(null);
  const [atFirstDoc, setAtFirstDoc] = useState(true);
  const [atLastDoc, setAtLastDoc] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {

    const q = query(
      collection(db, 'offerings'),
      where('date', '==', offeringDate),
      limit(1)
    );
    const querySnapShot = getDocs(q);
    querySnapShot.then((snapshot) => {
      if (snapshot.docs.length > 0) {
        const post = snapshot.docs[0];
        const newText = post?.data().text;
        const newDate = post?.data().date;
    
        if (newText !== text) {
          setText(newText);
        }
    
        if (newDate !== date) {
          setDate(newDate);
        }
    
        setCurrentDoc(post);
      }
    });

    setIsLoading(false);
  }, []);

  const handleNextText = async () => {
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
      let nextdoc = null;
      let newText = text;
      let newDate = date;
      
      try {
        const nextQuerySnapshot = await getDocs(nextQuery);
        // rest of your code

      nextQuerySnapshot.forEach((doc) => {
        newText = doc.data().text;
        newDate = doc.data().date;
        console.log("nextDate", newDate);
        nextdoc = doc;
      });
      
      if (newText !== text) {
        setText(newText);
      }
      
      if (newDate !== date) {
        setDate(newDate);
      }
      
      if (nextdoc) {
        setCurrentDoc(nextdoc);
      }
    } catch (error) {
      console.error("Failed to get documents:", error);
      // handle the error as needed
    }
      // Check if the current document is the last one
    try{
      const nextNextQuery = query(
        collection(db, 'offerings'),
        where('date', '<', currentDoc.data().date),
        orderBy('date', 'desc'),
      );

      const querySnapshot = await getDocs(nextNextQuery)

      if (querySnapshot.docs.length < 1) {
        setAtLastDoc(true);
      } else {
        setAtLastDoc(false);
      }
    } catch (error) {
      console.error("Failed to get documents:", error);
      // handle the error as needed
    }
  }
  };

  const handlePreviousText = async () => {
    setAtLastDoc(false);
    if (currentDoc) {
      const currentDate = currentDoc.data().date;
      console.log("currentTimestamp", currentDate);
      const prevQuery = query(
        collection(db, 'offerings'),
        where('date', '>', currentDate),
        orderBy('date', 'asc'),
        limit(1)
      );
      const prevQuerySnapshot = await getDocs(prevQuery);

      prevQuerySnapshot.forEach((doc) => {
        const newData = doc.data();
        const newText = newData.text;
        const newDate = newData.date;
      
        if (newText !== text) {
          setText(newText);
        }
      
        if (newDate !== date) {
          setDate(newDate);
        }
      
        console.log("currentDoc", newDate);
      });

      if (prevQuerySnapshot.docs[0]) {
        setCurrentDoc(prevQuerySnapshot.docs[0]);
      }

      const nextPrevQuery = query(
        collection(db, 'offerings'),
        where('date', '>', currentDoc.data().date),
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
    return <ActivityIndicator size="large" color="#ED4D4E" />;
  }
if (currentDoc){
  console.log("CurrentDoc", currentDoc.data().date);
}
  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.date}>{date}</Text>
          <RenderHTML
            contentWidth={contentWidth}
            source={{ html: text }}
            baseStyle={{ fontFamily: 'UbuntuRegular', fontSize: 20 }}
          />
        </View>
      </ScrollView>
      <View style={{ paddingTop: 10, padding: 30, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flex: !atFirstDoc ? 0 : 0 }}>
          {!atFirstDoc && (
            <TouchableOpacity style={styles.nextButton} onPress={handlePreviousText}>
              <Text style={styles.nextButtonText}>{'<'} NEXT</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={{ flex: !atLastDoc ? 0 : 0 }}>
          {!atLastDoc && (
            <TouchableOpacity style={styles.nextButton} onPress={handleNextText}>
              <Text style={styles.nextButtonText}>PREV. {'>'}</Text>
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
    fontFamily: 'UbuntuRegular',
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
