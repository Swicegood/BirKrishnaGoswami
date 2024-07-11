import { httpsCallable } from 'firebase/functions';
import VideoItem from '../components/VideoItem';
import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, TextInput, Image, Text, ActivityIndicator, Dimensions, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { functions } from './api/firebase';
import { AntDesign } from '@expo/vector-icons';
import { Link } from 'expo-router';
import GuageView from '../components/GuageView';
import mockYoutubeData from '../components/mockYoutubeData';
import useIsMobileWeb from '../hooks/useIsMobileWeb';

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
  const [height, setHeight] = useState(Dimensions.get('window').height);
  const isMobileWeb = useIsMobileWeb();

  console.log('isMobileWeb: ', isMobileWeb);
  const USE_MOCK_DATA = false; // Set this to false when you want to use real API calls


  const onSetWidth = (width: number) => {
    console.log('SearchYouTubeScreen width: ', width);
    setWidth(width);
  };

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

  const renderVideoItem = (item: Video) => (
    <Link key={item.id} href={{ pathname: '/YoutubePlayer', params: { id: item.id } }} asChild>
      <TouchableOpacity style={{ paddingTop: 10 }}>
        <VideoItem
          title={item.title}
          lastModified={item.dateModified}
          thumbnail={item.thumbnailUrl}
          id={item.id}
          imageStyle={
            width / 4 > 150
            ? { width: width / 4, height: (width / 4) * 0.5625 }
            : { width: width / 2 - 20, height: ((width / 2 - 20) * 0.5625) }
          }
        />
      </TouchableOpacity>
    </Link>
  );

  const ListComponent = Platform.OS === 'web' ? ScrollView : View;

  return (
    <GuageView onSetOrientation={onSetOrientation} onSetWidth={onSetWidth} flex={1}>
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
        ) : isMobileWeb ? (
            <ScrollView
              contentContainerStyle={styles.scrollViewContent}
              showsVerticalScrollIndicator={false}
            >
              {videos.length === 0 ? (
                <Text style={styles.noResultsText}>No videos found</Text>
              ) : (
                videos.map(renderVideoItem)
              )}
              <View style={{ height: 120 }} />
            </ScrollView>
          ) : (
            <ListComponent style={[styles.container, Platform.OS === 'web' && styles.webContainer]}>
            <FlatList
              data={videos}
              renderItem={({ item }) => renderVideoItem(item)}
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
    </GuageView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    flex: 1,
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
  scrollViewContent: {
    paddingHorizontal: 10,
  },
  webContainer: {
    height: 'calc(100vh - 70px)',
    overflowY: 'auto' as 'auto',
    paddingBottom: 120,
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