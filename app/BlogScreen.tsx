import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet,
  ScrollView, Image, Dimensions, ActivityIndicator,
  TouchableOpacity, Platform
} from 'react-native';
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import Swiper from 'react-native-swiper';
import { db } from './api/firebase';
import RenderHTML from 'react-native-render-html';
import MeasureView from './api/MeasureView';

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

const isTablet = () => {
  const { width, height } = Dimensions.get('window');
  const aspectRatio = width / height;
  return Math.min(width, height) >= 600 && (aspectRatio > 1.2 || aspectRatio < 0.9);
}

const BlogScreen = () => {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [orientation, setOrientation] = useState(Dimensions.get('window').width > Dimensions.get('window').height ? 'LANDSCAPE' : 'PORTRAIT');
  const [width, setWidth] = useState(Dimensions.get('window').width);
  const [currentIndex, setCurrentIndex] = useState(0);

  const onSetWidth = (width: number) => {
    console.log('BlogScreen width: ', width);
    setWidth(width);
  };

  const onSetOrientation = (orientation: string) => {
    if ((Platform.OS === 'android' && !isTablet()) || Platform.OS === 'web') {
      if (orientation === 'LANDSCAPE') {
        setOrientation('PORTRAIT');
      } else {
        setOrientation('LANDSCAPE');
      }
      return;
    }
    setOrientation(orientation);
  };

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
      </View>
    )
  }

  const renderBlogPost = (post, index) => (
    <ScrollView style={styles.container} key={index}>
      <MeasureView onSetWidth={onSetWidth} onSetOrientation={onSetOrientation}>
        <Image
          source={require('../assets/images/Blog_Puppets.png')}
          style={{
            width: width,
            height: (isTablet() || Platform.OS === 'web') ? 300 : orientation === 'LANDSCAPE' ? 160 : 250,
            resizeMode: (isTablet() || Platform.OS === 'web' || orientation === 'LANDSCAPE') ? 'contain' : 'cover'
          }}
        />
      </MeasureView>
      <Text style={styles.date}>{formatDate(post.date)}</Text>
      <Text style={styles.title}>{post.title.toUpperCase()}</Text>
      <View style={styles.textContainer}>
        <RenderHTML
          contentWidth={(contentWidth * 0.9)}
          source={{ html: post.text }}
          baseStyle={{
            fontFamily: 'UbuntuRegular',
            fontSize: 20,
            ...(orientation === 'LANDSCAPE' && !isTablet() && Platform.OS !== 'web'
              ? { paddingLeft: 100, paddingRight: 100 }
              : {})
          }}
        />
      </View>
    </ScrollView>
  );

  const renderWebVersion = () => (
    <ScrollView>
      {posts.map((post, index) => (
        <View key={index} style={styles.webPostContainer}>
          {renderBlogPost(post, index)}
          {index < posts.length - 1 && <View style={styles.webDivider} />}
        </View>
      ))}
    </ScrollView>
  );

  const renderMobileVersion = () => (
    <Swiper loop={false} showsPagination={false} index={currentIndex} onIndexChanged={setCurrentIndex}>
      {posts.map((post, index) => renderBlogPost(post, index))}
    </Swiper>
  );

  return (
    <View style={{ flex: 1 }}>
      {Platform.OS === 'web' ? renderWebVersion() : renderMobileVersion()}
      {Platform.OS !== 'web' && (
        <View style={styles.navigationContainer}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
          >
            <Text style={styles.navButtonText}>Previous</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => setCurrentIndex(Math.min(posts.length - 1, currentIndex + 1))}
            disabled={currentIndex === posts.length - 1}
          >
            <Text style={styles.navButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  textContainer: {
    padding: 20,
  },
  webPostContainer: {
    marginBottom: 40,
  },
  webDivider: {
    height: 1,
    backgroundColor: '#E53935',
    marginVertical: 20,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
  },
  navButton: {
    padding: 10,
    backgroundColor: '#E53935',
    borderRadius: 5,
  },
  navButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default BlogScreen;