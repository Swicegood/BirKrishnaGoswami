import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView,
   Image, Dimensions, ActivityIndicator } from 'react-native';
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

const QuoteScreen = () => {
  const [quote, setQuote] = useState('');
  const [date, setDate] = useState('');
  const [currentDoc, setCurrentDoc] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchQuote = async () => {
      const db = getFirestore();
      const q = query(collection(db, 'thought-of-the-days'), orderBy('date', 'desc'), limit(1));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        // Assuming doc.data() returns an object with text, date, and category
        setQuote(doc.data().totd);
        setDate(doc.data().date);
      
        // Store the current document in the state variable
        setCurrentDoc(doc);
      });
      setIsLoading(false);
    };

    fetchQuote();
  }, []);

  const handleNextQuote = async () => {
    const db = getFirestore();
    if (currentDoc) {
      const currentTimestamp = currentDoc.data().processed;
      console.log("currentTimestamp", currentTimestamp);
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
          setQuote(doc.data().totd);
          setDate(doc.data().date);

        console.log("currentDoc", doc.data().processed);
        });

        setCurrentDoc(querySnapshot.docs[0]);
        setIsLoading(false);
      }
    }
  };

  if (isLoading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  return (
    <ScrollView style={styles.container}>

      <Image source={require('../assets/images/placeholder_355_200.png')} style={{ width: Dimensions.get("screen").width, alignSelf: 'center' }} />
      <View style={styles.content}>
        <Text style={styles.date}>{formatDate(date)}</Text>
        <Text style={styles.quoteText}>{quote}</Text>
      </View>
      <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'flex-end' }}>
      <TouchableOpacity style={styles.nextButton} onPress={handleNextQuote}>
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
  quoteText: {
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

export default QuoteScreen;
