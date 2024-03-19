import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, 
  ScrollView, Image, Dimensions, ActivityIndicator } from 'react-native';
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
  const [isLoading, setIsLoading] = useState(true);


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
        setIsLoading(false);
      });
    };

    fetchBlogEntry();
  }, []);

  const handleNextText = async () => {
    const db = getFirestore();
    if (currentDoc) {
      const currentTimestamp = currentDoc.data().date;
      console.log("currentTimestamp", currentTimestamp);
      const nextQuery = query(
        collection(db, 'blog'), 
        where('date', '<', currentTimestamp), 
        orderBy('date', 'desc'), 
        limit(1)
      );
      const nextQuerySnapshot = await getDocs(nextQuery);
  
      nextQuerySnapshot.forEach((doc) => {
        // Assuming doc.data() returns an object with text, date, and title
        setText(doc.data().text);
        setDate(doc.data().date);
        setTitle(doc.data().title);
        console.log("currentDoc", doc.data().date);
      });
  
      setCurrentDoc(nextQuerySnapshot.docs[0]);
    }
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

const handlePreviousText = async () => {
  const db = getFirestore();
  if (currentDoc) {
    const currentTimestamp = currentDoc.data().date;
    console.log("currentTimestamp", currentTimestamp);
    const nextQuery = query(
      collection(db, 'blog'), 
      where('date', '>', currentTimestamp), 
      orderBy('date', 'asc'), 
      limit(1)
    );
    const nextQuerySnapshot = await getDocs(nextQuery);

    nextQuerySnapshot.forEach((doc) => {
      // Assuming doc.data() returns an object with text, date, and title
      setText(doc.data().text);
      setDate(doc.data().date);
      setTitle(doc.data().title);
      console.log("currentDoc", doc.data().date);
    });

    setCurrentDoc(nextQuerySnapshot.docs[0]);
  }
  scrollViewRef.current?.scrollTo({ y: 0, animated: true });
};

if (isLoading) {
  return <ActivityIndicator size="large" color="#0000ff" />;
}

  return (
    <ScrollView ref={scrollViewRef} style={styles.container}>
      <Image source={require('../assets/images/placeholder_355_200.png')} style={{ width: Dimensions.get("screen").width, alignSelf: 'center' }} />
      <View style={styles.content}>
        <Text style={styles.date}>{formatDate(date)}</Text>
        <Text style={styles.title}>{title.toUpperCase()}</Text>
        <Text style={styles.blogEntryText}>{text}</Text>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'  }}>
      <TouchableOpacity style={styles.nextButton} onPress={handlePreviousText}>
        <Text style={styles.nextButtonText}>{'<'} PREVIOUS</Text>
      </TouchableOpacity>
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
