import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, 
  ScrollView, Dimensions, ActivityIndicator, FlatList } from 'react-native';
import { collection, getFirestore, query, orderBy, getDocs} from "firebase/firestore";
import { Link } from 'expo-router';

const itemWidth = Dimensions.get('screen').width / 3; // Width of the item 

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
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBlogEntries = async () => {
      try {
        const db = getFirestore();
        const q = query(collection(db, 'offerings'), orderBy('date', 'desc'));
        const querySnapshot = await getDocs(q);
        const posts = querySnapshot.docs.map(doc => doc.data());
        setPosts(posts);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching blog entries:', error);
      }
    };
  
    fetchBlogEntries();
  }, []);

  if (isLoading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  return (
    
    <ScrollView style={styles.container}>
     <FlatList 

            data={posts}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <View style={styles.content}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.date}>{formatDate(item.date)} | {item.location}</Text>
                </View>
                <Link href={{ pathname: "./PdfViewScreen", params: { url: item.contenturl } }} asChild>
                  <TouchableOpacity style={styles.button}>
                    <Text style={styles.buttonText}>READ NOW</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            )}
      />
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
    flexDirection: 'row',
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc', // Adjust color as needed
  },
  date: {
    fontSize: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
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
  buttonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: 'white',
  },
  button: {
    backgroundColor: '#ED4D4E',
    color: '#fff',
    borderRadius: 8,
    textAlign: 'center',
    paddingVertical: 10,
    marginTop: 10,
    width: itemWidth-16,
    height: 40,
    alignItems: 'center',
  },
  
});

export default BlogScreen;
