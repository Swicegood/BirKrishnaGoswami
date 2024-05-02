import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Image, Dimensions, ActivityIndicator
} from 'react-native';
import { collection, query, orderBy, limit, getDocs, where } from "firebase/firestore";
import { db } from './api/firebase';

function formatDate(dateString) {
  if (!dateString || dateString.split('/').length !== 3) {
    return '';
  }
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dateParts = dateString.split('/');
  const date = new Date(`20${dateParts[2]}`, dateParts[0] - 1, dateParts[1]);
  const month = months[date.getMonth()];
  const day = String(date.getDate());

  return `${month} ${day}`;
}

const QuoteScreen = () => {
  const [quote, setQuote] = useState('');
  const [date, setDate] = useState('');
  const [currentDoc, setCurrentDoc] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [atFirstDoc, setAtFirstDoc] = useState(true);
  const [atLastDoc, setAtLastDoc] = useState(false);

  useEffect(() => {
    const fetchQuote = async () => {
      const q = query(collection(db, 'thought-of-the-days'), orderBy('date', 'desc'), limit(1));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        // Assuming doc.data() returns an object with text, date, and category
        setQuote((doc.data().totd).replace(/"/g, '').replace(/“/g, '').replace(/\n/g, ''));
        setDate(doc.data().date);

        // Store the current document in the state variable
        setCurrentDoc(doc);
      });
      setIsLoading(false);
    };

    fetchQuote();
  }, []);

  const handleNextQuote = async () => {
    if (currentDoc) {
      setAtFirstDoc(false);
      const currentTimestamp = currentDoc.data().processed;
      console.log("currentTimestamp", currentTimestamp.toDate().toLocaleString());
      const nextQuery = query(
        collection(db, 'thought-of-the-days'),
        where('processed', '<', currentTimestamp),
        orderBy('processed', 'desc'),
        limit(1)
      );
      const nextQuerySnapshot = await getDocs(nextQuery);

      if (!nextQuerySnapshot.empty) {
        const doc = nextQuerySnapshot.docs[0];
        const date = currentDoc.data().date;
        console.log("currentDate", date);

        // Convert the date to "MM/DD/YYYY" format
        const dateParts = date.split('/');
        const fullYearDate = `${dateParts[0]}/${dateParts[1]}/20${dateParts[2]}`;

        // Subtract one day from the current date
        const fullDateParts = fullYearDate.split('/');
        const previousDate = new Date(+fullDateParts[2], +fullDateParts[0] - 1, +fullDateParts[1]);
        previousDate.setDate(previousDate.getDate() - 1);

        // Format the new date to "MM/DD/YY"
        const previousDateString = `${String(previousDate.getMonth() + 1).padStart(2, '0')}/${String(previousDate.getDate()).padStart(2, '0')}/${String(previousDate.getFullYear()).slice(-2)}`;
        console.log("previous date", previousDateString);
        // Fetch the quote for the new date

        let querySnapshot = await getDocs(query(
          collection(db, 'thought-of-the-days'),
          where('date', '==', previousDateString),
          orderBy('processed', 'desc')
        ));

        if (querySnapshot.empty) {
          // If no documents were found for the previous date, query for the next most recent "processed" timestamp
          querySnapshot = await getDocs(query(
            collection(db, 'thought-of-the-days'),
            where('processed', '<', currentTimestamp),
            orderBy('processed', 'desc'),
            limit(1)
          ));
        }


        querySnapshot.forEach((doc) => {
          // Assuming doc.data() returns an object with text, date, and category
          setQuote((doc.data().totd).replace(/"/g, '').replace(/“/g, '').replace(/\n/g, ''));
          setDate(doc.data().date);

          console.log("currentDoc", doc.data().processed.toDate().toLocaleString());
        });

        setCurrentDoc(querySnapshot.docs[0]);
        setIsLoading(false);

      }
      // Check if the current document is the last one

      const nextNextQuery = query(
        collection(db, 'thought-of-the-days'),
        where('date', '<', currentDoc.data().date),
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

  const handlePreviousQuote = async () => {
    setAtLastDoc(false);
    if (currentDoc) {
      const currentTimestamp = currentDoc.data().processed;
      console.log("currentTimestamp", currentTimestamp.toDate().toLocaleString());
      const prevQuery = query(
        collection(db, 'thought-of-the-days'),
        where('processed', '>', currentTimestamp),
        orderBy('processed', 'asc'),
        limit(1)
      );
      const prevQuerySnapshot = await getDocs(prevQuery);

      if (prevQuerySnapshot.empty) {
        // If no documents were found for the previous date, query for the next most recent "processed" timestamp
        setAtFirstDoc(true);
      }

      if (!prevQuerySnapshot.empty) {
        const doc = prevQuerySnapshot.docs[0];
        const date = currentDoc.data().date;
        console.log("currentDate", date);

        // Convert the date to "MM/DD/YYYY" format
        const dateParts = date.split('/');
        const fullYearDate = `${dateParts[0]}/${dateParts[1]}/20${dateParts[2]}`;

        // Subtract one day from the current date
        const fullDateParts = fullYearDate.split('/');
        const previousDate = new Date(+fullDateParts[2], +fullDateParts[0] - 1, +fullDateParts[1]);
        previousDate.setDate(previousDate.getDate() + 1);

        // Format the new date to "MM/DD/YY"
        const previousDateString = `${String(previousDate.getMonth() + 1).padStart(2, '0')}/${String(previousDate.getDate()).padStart(2, '0')}/${String(previousDate.getFullYear()).slice(-2)}`;
        console.log("previous date", previousDateString);
        // Fetch the quote for the new date

        let pQuerySnapshot = await getDocs(query(
          collection(db, 'thought-of-the-days'),
          where('date', '==', previousDateString),
          orderBy('processed', 'desc')
        ));


        if (pQuerySnapshot.empty) {
          // If no documents were found for the previous date, query for the next most recent "processed" timestamp
          pQuerySnapshot = await getDocs(query(
            collection(db, 'thought-of-the-days'),
            where('processed', '>', currentTimestamp),
            orderBy('processed', 'asc'),
            limit(1)
          ));

        }

        pQuerySnapshot.forEach((doc) => {
          // Assuming doc.data() returns an object with text, date, and title
          setQuote((doc.data().totd).replace(/"/g, '').replace(/“/g, '').replace(/\n/g, ''));
          setDate(doc.data().date);
          console.log("currentDoc", doc.data().processed.toDate().toLocaleString());
        });

        if (pQuerySnapshot.docs[0]) {
          setCurrentDoc(pQuerySnapshot.docs[0]);
        }

        const nextPrevQuery = query(
          collection(db, 'thought-of-the-days'),
          where('processed', '>', currentDoc.data().processed),
        );

        const querySnapshot = await getDocs(nextPrevQuery)

        if (querySnapshot.docs.length < 1) {
          setAtFirstDoc(true);
        } else {
          setAtFirstDoc(false);
        }
      }
    }
  };


  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#ED4D4E" />
      </View>)
  }
  // Button labels PREVIOUS AND NEXT are backwards for user clarity
  return (
    <View style={{flex: 1}}>
      <View style={styles.quoteContainer}>
        <Image source={require('../assets/images/placeholder_355_240.png')} style={{ width: Dimensions.get("screen").width, alignSelf: 'center' }} />
        <View style={styles.content}>
          <Text style={styles.date}>{formatDate(date)}</Text>
          <Text style={styles.quoteText}>{quote}</Text>
        </View>
      </View>
      <View style={{  justifyContent: 'space-between'}}>

        <View style={{ padding: 40, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: !atFirstDoc ? 0 : 0 }}>
            {!atFirstDoc && (
              <TouchableOpacity style={styles.nextButton} onPress={handlePreviousQuote}>
                <Text style={styles.nextButtonText}>{'<'} NEXT</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={{ flex: !atLastDoc ? 0 : 0 }}>
            {!atLastDoc && (
              <TouchableOpacity style={styles.nextButton} onPress={handleNextQuote}>
                <Text style={styles.nextButtonText}>PREV. {'>'}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  quoteContainer: {
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
    padding: 10,
  },
  quoteText: {
    fontSize: 18,
    marginTop: 10,
    fontFamily: 'UbuntuRegular',
    marginLeft: 10,
    marginRight: 10,
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

export default QuoteScreen;
