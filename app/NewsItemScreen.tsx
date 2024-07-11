import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet,
  ScrollView, Image, Dimensions, SafeAreaView, Platform
} from 'react-native';
import { useLocalSearchParams, Link } from 'expo-router';
import GuageView from '../components/GuageView';

const ORIENTATION_THRESHOLD = 0.1; // 10% threshold

const isTablet = () => {
  const { width, height } = Dimensions.get('window');
  const aspectRatio = width / height;
  const isLandscape = Math.min(width, height) >= 600 && (aspectRatio > 1.2 || aspectRatio < 0.9);
  console.log('isTablet: ', isLandscape);
  return isLandscape
};

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

const NewsItemScreen = () => {
  const { newsItem } = useLocalSearchParams<{ newsItem: string }>();
  const parsedNewsItem = JSON.parse(newsItem);

  const [orientation, setOrientation] = useState(Dimensions.get('window').width > Dimensions.get('window').height ? 'LANDSCAPE' : 'PORTRAIT');
  const [width, setWidth] = useState(Dimensions.get('window').width);

  const onSetWidth = (width: number) => {
    console.log('NewsItemScreen width: ', width);
    setWidth(width);
  };

 const onSetOrientation = (orientation: string) => {
if (Platform.OS === 'web') {
handleOrientationChange(orientation);
} else {
setOrientation(orientation);
}
};

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

  useEffect(() => {
    if (Platform.OS === 'web') {
      // Apply styles to force scrollbars on web
      document.body.style.overflow = 'auto';
      document.documentElement.style.overflow = 'auto';
    }
  }, []);

  const scrollViewStyle = Platform.OS === 'web' 
    ? { height: '100vh', overflowY: 'scroll' as 'scroll' }
    : styles.scrollViewStyle;

  return (
    <SafeAreaView style={styles.safeArea}>
      <GuageView onSetOrientation={onSetOrientation} onSetWidth={onSetWidth}>
        {orientation === 'PORTRAIT' ? (
          <ScrollView style={scrollViewStyle}>
            <Image 
              source={{ uri: parsedNewsItem.url }} 
              style={{ 
                width: width, 
                height: width * 0.6, 
                resizeMode: (Platform.OS === 'web' || isTablet()) ? 'contain' : 'cover'
              }} 
            />
            <View style={styles.content}>
              <Text style={styles.date}>{formatDate(parsedNewsItem.date)}</Text>
              <Text style={styles.title}>{parsedNewsItem.headline.toUpperCase()}</Text>
              <Text style={styles.bodyText}>{parsedNewsItem.text}</Text>
              <Link href={{ pathname: './YoutubePlayer', params: { id: parsedNewsItem.youTubeId } }} style={styles.category}>
                <Text>Category: {parsedNewsItem.category}</Text>
              </Link>
            </View>
          </ScrollView>
        ) : (
          <ScrollView style={scrollViewStyle} contentContainerStyle={styles.landscapeContainer}>
            <View style={styles.landscapeImageContainer}>
              <Image 
                source={{ uri: parsedNewsItem.url }} 
                style={{ 
                  width: width * 0.5, 
                  height: '60%',
                  resizeMode: (Platform.OS === 'web' || isTablet()) ? 'contain' : 'cover'
                }} 
              />
            </View>
            <View style={styles.landscapeContent}>
              <Text style={styles.date}>{formatDate(parsedNewsItem.date)}</Text>
              <Text style={styles.title}>{parsedNewsItem.headline.toUpperCase()}</Text>
              <Text style={styles.bodyText}>{parsedNewsItem.text}</Text>
              <Link href={{ pathname: './YoutubePlayer', params: { id: parsedNewsItem.youTubeId } }} style={styles.category}>
                <Text>Category: {parsedNewsItem.category}</Text>
              </Link>
            </View>
          </ScrollView>
        )}
      </GuageView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollViewStyle: {},
  content: {
    padding: 16,
  },
  date: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#E53935',
    marginTop: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
  },
  bodyText: {
    fontSize: 20,
    marginTop: 10,
    fontFamily: 'OblikBold',
    color: '#454545'
  },
  category: {
    fontSize: 16,
    color: 'blue',
    marginTop: 10,
  },
  landscapeContainer: {
    flexDirection: 'row',
    height: '100%',
  },
  landscapeImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  landscapeContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
});

export default NewsItemScreen;