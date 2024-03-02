import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, Dimensions } from 'react-native';
import { collection, getFirestore, query, orderBy, limit, getDocs, where } from "firebase/firestore";

function formatDate(dateString) {
  if (!dateString || dateString.split('/').length !== 3) {
    return '';
  }

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dateParts = dateString.split('/');
  const date = new Date(`${dateParts[0]}`, dateParts[1] - 1, dateParts[2]);

  const month = months[date.getMonth()];
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();

  return `${month} ${day}, ${year}`;
}

const BlogScreen = () => {
  const [text, setText] = useState('');
  const [date, setDate] = useState('');
  const [title, setTitle] = useState('');
  const [currentDoc, setCurrentDoc] = useState(null);
  const scrollViewRef = useRef(null);


  useEffect(() => {
    const fetchBlogEntry = async () => {
      const db = getFirestore();
      const q = query(collection(db, 'blog'), orderBy('date', 'desc'), limit(1));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        // Assuming doc.data() returns an object with text, date, and category
        setText(doc.data().text);
        setDate(doc.data().date);
        setTitle(doc.data().title);
        // Store the current document in the state variable
        setCurrentDoc(doc);
      });
    };

    fetchBlogEntry();
  }, []);

  const handleNextBlogEntry = async () => {
    const db = getFirestore();
    if (currentDoc) {
      const currentTimestamp = currentDoc.data().processed;
      console.log("currentTimestamp", currentTimestamp);
      const nextQuery = query(
        collection(db, 'blog'), 
        where('processed', '<', currentTimestamp), 
        orderBy('processed', 'desc'), 
        limit(1)
      );
      const nextQuerySnapshot = await getDocs(nextQuery);
  
      if (!nextQuerySnapshot.empty) {
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
        // Fetch the BlogEntry for the new date

        let querySnapshot = await getDocs(query(
          collection(db, 'blog'), 
          where('date', '==', previousDateString), 
          orderBy('processed', 'desc')
        ));

        if (querySnapshot.empty) {
          // If no documents were found for the previous date, query for the next most recent "processed" timestamp
          querySnapshot = await getDocs(query(
            collection(db, 'blog'), 
            where('processed', '<', currentTimestamp), 
            orderBy('processed', 'desc'), 
            limit(1)
          ));
        }
        querySnapshot.forEach((doc) => {
          // Assuming doc.data() returns an object with text, date, and category
          setText(doc.data().text);
          setDate(doc.data().date);
          setTitle(doc.data().title);
        console.log("currentDoc", doc.data().processed);
        });

        setCurrentDoc(querySnapshot.docs[0]);
      }
    }
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };


  return (
    <ScrollView ref={scrollViewRef} style={styles.container}>
      <Image source={require('../assets/images/placeholder_355_200.png')} style={{ width: Dimensions.get("screen").width, alignSelf: 'center' }} />
      <View style={styles.content}>
        <Text style={styles.date}>{formatDate(date)}</Text>
        <Text style={styles.title}>{title.toUpperCase()}</Text>
        <Text style={styles.blogEntryText}>{text}</Text>
      </View>
      <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'flex-end' }}>
      <TouchableOpacity style={styles.nextButton} onPress={handleNextBlogEntry}>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
  },
  blogEntryText: {
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

export default BlogScreen;
