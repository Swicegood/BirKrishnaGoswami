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
import GuageView from '../components/GuageView';

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

const [height, setHeight] = useState(Dimensions.get('window').height);
  const ORIENTATION_THRESHOLD = 0.1; // 10% threshold



  const handleOrientationChange = () => {
    const newWidth = Dimensions.get('window').width;
    const newHeight = Dimensions.get('window').height;
    const aspectRatio = newWidth / newHeight;
    const previousAspectRatio = width / height;

    // Only change orientation if the aspect ratio change is significant
    if (Math.abs(aspectRatio - previousAspectRatio) > ORIENTATION_THRESHOLD) {
      const newOrientation = newWidth > newHeight ? 'LANDSCAPE' : 'PORTRAIT';
      setOrientation(newOrientation);
    }

    setWidth(newWidth);
    setHeight(newHeight);
    console.log('HandleOrientation Called :', orientation);
  }


  const onSetOrientation = (orientation: string) => {
    if (Platform.OS === 'web') {
      handleOrientationChange(orientation);
    } else {
      setOrientation(orientation);
    }
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
      <GuageView onSetWidth={onSetWidth} onSetOrientation={onSetOrientation}>
        <Image
          source={require('../assets/images/Blog_Puppets.png')}
          style={{
            width: width,
            height: (isTablet() || Platform.OS === 'web') ? 300 : orientation === 'LANDSCAPE' ? 160 : 250,
            resizeMode: (isTablet() || Platform.OS === 'web' || orientation === 'LANDSCAPE') ? 'contain' : 'cover'
          }}
        />
      </GuageView>
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
          <View style={{ flex: 0}}>
            {currentIndex > 0 && (
              <TouchableOpacity style={styles.nextButton} onPress={() => setCurrentIndex(currentIndex - 1)}>
                <View style={{ flexDirection: 'row' }}>
                  <Text style={{ ...styles.nextButtonText, paddingStart: 10 }}>{'<'}</Text>
                  <Text style={{ ...styles.nextButtonText, paddingEnd: 10 }}>PREV.</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
          <View style={{ flex: 0 }}>
            {currentIndex < posts.length - 1 && (
              <TouchableOpacity style={styles.nextButton} onPress={() => setCurrentIndex(currentIndex + 1)}>
                <View style={{ flexDirection: 'row' }}>
                  <Text style={{ ...styles.nextButtonText, paddingStart: 10 }}>NEXT</Text>
                  <Text style={{ ...styles.nextButtonText, paddingEnd: 10 }}>{'>'}</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
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
    alignItems: 'center',
    paddingTop: 10,
    padding: 30,
    ...(Platform.OS === 'web' ? { paddingEnd: 100, paddingStart: 100 } : {}),
  },
  nextButton: {
    backgroundColor: 'transparent',
    borderColor: '#E53935',
    borderWidth: 2,
    borderRadius: 10,
    color: '#E53935',
  },
  nextButtonText: {
    color: '#E53935',
    padding: 10,
  },
});

export default BlogScreen;