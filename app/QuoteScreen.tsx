import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, Dimensions } from 'react-native';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';

function formatDate(dateString) {
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

  useEffect(() => {
    const fetchQuote = async () => {
      const db = getFirestore();
      const q = query(collection(db, 'thought-of-the-days'), where('date', '==', '02/25/24')); // Replace with dynamic date if needed
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        // Assuming doc.data() returns an object with text, date, and category
        setQuote(doc.data().totd);
        setDate(doc.data().date);
      });
    };

    fetchQuote();
  }, []);

  const handleNextQuote = () => {
    // Logic to fetch and display the next quote with date one day earlier
  };

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
