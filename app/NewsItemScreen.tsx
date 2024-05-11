import React from 'react';
import {
  View, Text, StyleSheet,
  ScrollView, Image, Dimensions
} from 'react-native';
import Swiper from 'react-native-swiper';
import { useLocalSearchParams, Link } from 'expo-router';
import YouTubePlayer from './YoutubePlayer'



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

  console.log("newsItem", parsedNewsItem);

  return (
    <Swiper loop={false}>
      <ScrollView style={styles.container}>
        <Image source={{ uri: parsedNewsItem.url }} style={{ width: Dimensions.get("screen").width, height: 200, alignSelf: 'center' }} />
        <Text style={styles.date}>{formatDate(parsedNewsItem.date)}</Text>
        <Text style={styles.title}>{parsedNewsItem.headline.toUpperCase()}</Text>
        <Text style={styles.blogEntryText}>{parsedNewsItem.text}</Text>
        <Link href={{ pathname: './YoutubePlayer', params: { id: parsedNewsItem.youTubeId } }} style={styles.category}>
          <Text>Category: {parsedNewsItem.category}</Text>
        </Link>
      </ScrollView>
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
  },
  blogEntryText: {
    fontSize: 20,
    margin: 10,
  },
  category: {
    fontSize: 16,
    color: 'blue',
    marginLeft: 10,
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

export default NewsItemScreen;
