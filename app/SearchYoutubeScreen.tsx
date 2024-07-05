import { httpsCallable } from 'firebase/functions';
import VideoItem from '../components/VideoItem';
import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, TextInput, Image, Text, ActivityIndicator, Dimensions, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { functions } from './api/firebase';
import { AntDesign } from '@expo/vector-icons';
import { Link } from 'expo-router';
import MeasureView from './api/MeasureView';
import mockYoutubeData from '../components/mockYoutubeData';

interface GetYouTubeVideosRequest {
  channelId: string;
  searchTerm: string;
}

interface Video {
  id: string;
  title: string;
  thumbnailUrl: string;
  dateModified: string;
}

interface GetYouTubeVideosResponse {
  videos: Video[];
}

interface FirebaseFunctionError {
  code: string;
  message: string;
  details?: any;
}

const isTablet = () => {
  const { width, height } = Dimensions.get('window');
  const aspectRatio = width / height;
  return Math.min(width, height) >= 600 && (aspectRatio > 1.2 || aspectRatio < 0.9);
};

const SearchYoutubeVideosScreen = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [orientation, setOrientation] = useState(Dimensions.get('window').width > Dimensions.get('window').height ? 'LANDSCAPE' : 'PORTRAIT');
  const [width, setWidth] = useState(Dimensions.get('window').width);
  const USE_MOCK_DATA = false; // Set this to false when you want to use real API calls


  const onSetWidth = (width: number) => {
    console.log('SearchYouTubeScreen width: ', width);
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

  const fetchVideos = async () => {
    setIsLoading(true);
    setVideos([]);

    if (USE_MOCK_DATA) {
      // Use mock data
      const mockVideos = mockYoutubeData.items.map(item => ({
        id: item.id.videoId,
        title: item.snippet.title,
        thumbnailUrl: item.snippet.thumbnails.medium.url,
        dateModified: item.snippet.publishTime
      }));
      setVideos(mockVideos);
      setIsLoading(false);
      setHasSearched(true);
    } else {
      // Use real API call (your existing code)
      const getSearchYouTubeVideos = httpsCallable<GetYouTubeVideosRequest, GetYouTubeVideosResponse>(functions, 'getSearchYouTubeVideos');
      const request: GetYouTubeVideosRequest = { channelId: 'UCLiuTwQ-ap30PbKzprrN2Hg', searchTerm };

      try {
        const result = await getSearchYouTubeVideos(request);
        const response: GetYouTubeVideosResponse = result.data;
        const videos = response.items;

        const formattedVideos = videos.map(video => ({
          id: video.id.videoId,
          title: video.snippet.title,
          thumbnailUrl: video.snippet.thumbnails.default.url,
          dateModified: video.snippet.publishTime
        }));

        setVideos(formattedVideos);
        setIsLoading(false);
        setHasSearched(true);
      } catch (error) {
        console.error("Error calling the function: ", error.message);
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const renderItem = ({ item }: { item: Video }) => (
    <Link href={{ pathname: './YoutubePlayer', params: { id: item.id } }} asChild>
      <TouchableOpacity style={{ paddingTop: 10 }}>
        <VideoItem title={item.title} lastModified={item.dateModified}
          thumbnail={item.thumbnailUrl} id={item.id} imageStyle={(isTablet() || Platform.OS === 'web') ? { width: width / 4, height: width * 1.5 / 10 } : (orientation === 'LANDSCAPE') ? { width: width / 5 } : { width: width / 2.2 }} />
      </TouchableOpacity>
    </Link>
  );

  const ListComponent = Platform.OS === 'web' ? ScrollView : View;

  return (
    <MeasureView onSetOrientation={onSetOrientation} onSetWidth={onSetWidth}>
      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search any topic"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          <TouchableOpacity style={styles.searchButton} onPress={fetchVideos}>
            <AntDesign name="search1" size={40} color="gray" />
          </TouchableOpacity>
        </View>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ED4D4E" />
          </View>
        ) : videos.length === 0 && hasSearched ? (
          <View style={styles.noVideosContainer}>
            <Image source={require('../assets/images/no_videos.png')} style={styles.noVideosImage} />
          </View>
        ) : (
          <ListComponent style={[styles.listContainer, Platform.OS === 'web' && styles.webListContainer]}>
            <FlatList
              data={videos}
              renderItem={renderItem}
              keyExtractor={item => item.id}
              numColumns={1}
              contentContainerStyle={styles.flatListContent}
              ListEmptyComponent={hasSearched ? <Text style={styles.noResultsText}>No videos found</Text> : null}
              ListFooterComponent={<View style={{ height: 100 }} />}
              scrollEnabled={Platform.OS !== 'web'}
            />
          </ListComponent>
        )}
      </View>
    </MeasureView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  searchInput: {
    flex: 1,
    height: 50,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 10,
    marginRight: 10,
  },
  searchButton: {
    padding: 10,
  },
  listContainer: {
    paddingBottom: 180,
  },
  webListContainer: {
    height: 'calc(100vh - 70px)',
    overflowY: 'auto' as 'auto',
  },
  flatListContent: {
    paddingHorizontal: 10,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  noVideosContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#edefef',
  },
  noVideosImage: {
    width: '100%',
    height: 600,
    resizeMode: 'cover',
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default SearchYoutubeVideosScreen;