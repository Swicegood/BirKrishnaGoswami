import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet,
  ScrollView, Image, Dimensions, ActivityIndicator
} from 'react-native';
import { collection, query, orderBy, limit, getDocs, where } from "firebase/firestore";
import Swiper from 'react-native-swiper';
import { db } from './api/firebase';
import RenderHTML from 'react-native-render-html';

const contentWidth = Dimensions.get('window').width;

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
        const q = query(collection(db, 'blog'), orderBy('date', 'desc'));
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
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#ED4D4E" />
      </View>)
  }

  return (
    <Swiper loop={false}>
      {posts.map((post, index) => (
        <>
          <Image source={require('../assets/images/Blog_Puppets.png')} style={{ width: Dimensions.get("screen").width, height: 250, resizeMode: 'cover'}} />
        <ScrollView style={styles.container} key={index}>
          <Text style={styles.date}>{formatDate(post.date)}</Text>
          <Text style={styles.title}>{post.title.toUpperCase()}</Text>
          <View style={{padding: 20}}>
          <RenderHTML
            contentWidth={(contentWidth * 0.9)}
            source={{ html: post.text }}
            baseStyle={{ fontFamily: 'UbuntuRegular', fontSize: 20 }}
          />
          </View>
        </ScrollView>
        </>
      ))}
    </Swiper>

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
    paddingTop: 10,
  },
  title: {
    fontSize: 20,
    textAlign: 'center',
    marginTop: 10,
    fontFamily: 'OblikBold',
    color: '#3f3f3f',
  },
  blogEntryText: {
    fontSize: 20,
    marginTop: 10,
    marginBottom: 20,
    marginLeft: 20,
    marginRight: 20,
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

export default BlogScreen;
