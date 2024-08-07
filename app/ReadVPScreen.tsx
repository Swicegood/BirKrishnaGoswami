import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Dimensions, Platform
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
  const { offeringDate, index } = useLocalSearchParams<{ offeringDate: string, index: string }>();
  const [text, setText] = useState('');
  const [date, setDate] = useState('');
  const [currentDoc, setCurrentDoc] = useState(null);
  const [atFirstDoc, setAtFirstDoc] = useState(parseInt(index) === 0);
  const [atLastDoc, setAtLastDoc] = useState(offeringDate === '2020/08/01');
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
      try {
        if (nextdoc) {
          console.log("currentDocNextQuery", nextdoc.date);
          const nextNextQuery = query(
            collection(db, 'offerings'),
            where('date', '<', nextdoc.data().date),
            orderBy('date', 'desc'),
          );

          const querySnapshot = await getDocs(nextNextQuery)
          console.log("querySnapshot", querySnapshot.docs.length);
          if (querySnapshot.docs.length < 1) {
            setAtLastDoc(true);
          } else {
            setAtLastDoc(false);
          }
        } else {
          setAtLastDoc(true);
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

      let newText = text;
      let newDate = date;
      let prevDoc = null;

      prevQuerySnapshot.forEach((doc) => {
        const newData = doc.data();
        newText = newData.text;
        newDate = newData.date;
        prevDoc = doc;

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
      if (prevDoc) {
        console.log("currentDocPrevQuery", prevDoc.data().date);

        const nextPrevQuery = query(
          collection(db, 'offerings'),
          where('date', '>', prevDoc.data().date),
          orderBy('date', 'desc'),
        );

        const querySnapshot = await getDocs(nextPrevQuery)

        if (querySnapshot.docs.length < 1) {
          setAtFirstDoc(true);
        } else {
          setAtFirstDoc(false);
        }
      } else {
        setAtFirstDoc(true);

      }
    };

  };
    if (isLoading) {
      return <ActivityIndicator size="large" color="#ED4D4E" />;
    }
    if (currentDoc) {
      console.log("CurrentDocPrerender", currentDoc.data().date);
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
        <View style={{ paddingTop: 10, padding: 30, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', ...(Platform.OS === 'web' ? { paddingEnd: 100, paddingStart: 100 } : {}) }}>
        <View style={{ flex: !atFirstDoc ? 0 : 0 }}>
          {!atFirstDoc && (
            <TouchableOpacity style={styles.nextButton} onPress={handlePreviousText}>
              <View style={{ flexDirection: 'row' }}>
                <Text style={{ ...styles.nextButtonText, paddingStart: 10 }}>{'<'}</Text>
                <Text style={{ ...styles.nextButtonText, paddingEnd: 10 }}>PREV.</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
        <View style={{ flex: !atLastDoc ? 0 : 0 }}>
          {!atLastDoc && (
            <TouchableOpacity style={styles.nextButton} onPress={handleNextText}>
              <View style={{ flexDirection: 'row' }}>
                <Text style={{ ...styles.nextButtonText, paddingStart: 10 }}>NEXT</Text>
                <Text style={{ ...styles.nextButtonText, paddingEnd: 10 }}>{'>'}</Text>
              </View>
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
      paddingTop: 10,
      paddingBottom: 10,
    },

  });

export default ReadVPNowScreen;
