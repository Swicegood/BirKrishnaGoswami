import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, FlatList, Dimensions, Platform, TouchableOpacity, Text, ScrollView } from 'react-native';
import VideoItem from '../components/VideoItem';
import { Link } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
import { httpsCallable } from 'firebase/functions';
import { functions } from './api/firebase';
import * as ScreenOrientation from 'expo-screen-orientation';
import mockPlaylistData from '../components/mockPlaylistData';
import MeasureView from './api/MeasureView';

const NAVBAR_HEIGHT = Platform.OS === 'ios' ? 44 : 56;

interface GetYouTubeVideosRequest {
  playlistId: string;
  nextPageToken?: string;
}

interface Video {
  id: string;
  title: string;
  thumbnailUrl: string;
  dateModified: string;
}

interface GetYouTubeVideosResponse {
  videos: Video[];
  nextPageToken: string;
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

const PlaylistScreen = ({ id: propId }: { id?: string }) => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const final_id = propId || id;
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [videoHeight, setVideoHeight] = useState<number>(0);
  const [videoWidth, setVideoWidth] = useState<number>(0);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [isLastPage, setIsLastPage] = useState(false);
  const [pageAlreadyLoaded, setPageAlreadyLoaded] = useState(false);
  const [orientation, setOrientation] = useState(Dimensions.get('window').width > Dimensions.get('window').height ? 'LANDSCAPE' : 'PORTRAIT');
  const [width, setWidth] = useState(Dimensions.get('window').width);

  const USE_MOCK_DATA = false;

  const onSetWidth = (width: number) => {
    console.log('PlaylistScreen width: ', width);
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
    const fetchDimensions = async () => {
      const height = await getVideoHeight();
      const width = await getVideoWidth();
      setVideoHeight(height);
      setVideoWidth(width);
    };

    fetchDimensions();
  }, []);

  useEffect(() => {
    setVideos([]);
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    setIsLoading(true);

    if (USE_MOCK_DATA) {
      const mockVideos = mockPlaylistData.items.map(item => ({
        id: item.contentDetails.videoId,
        title: item.snippet.title,
        thumbnailUrl: item.snippet.thumbnails.medium.url,
        dateModified: item.snippet.publishedAt
      }));
      setVideos(mockVideos);
      setIsLoading(false);
      setNextPageToken(null);
      setIsLastPage(true);
    } else {
      // Use real API call (your existing code)
      const getYouTubePlaylistVideos = httpsCallable<GetYouTubeVideosRequest, GetYouTubeVideosResponse>(functions, 'getYouTubePlaylistVideos');
      const request: GetYouTubeVideosRequest = { playlistId: final_id };

      try {
        const result = await getYouTubePlaylistVideos(request);
        const response: GetYouTubeVideosResponse = result.data;
        let vids = response.items;

        const nextPageToken = response.nextPageToken;
        setNextPageToken(nextPageToken);

        vids.forEach(video => {
          const title = video.snippet.title;
          const thumbnailUrl = video.snippet.thumbnails.default.url;
          const dateModified = video.contentDetails.videoPublishedAt;
          const id = video.contentDetails.videoId;
          setVideos(vids => [...vids, { id, title, thumbnailUrl, dateModified }]);
        });

        setIsLoading(false);
      } catch (error: any) {
        console.error("Error calling the function: ", error.message);
        setIsLoading(false);
      }
    }
  };

  const loadMoreVideos = async () => {
    if (!nextPageToken) {
      setIsLastPage(true);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);

    if (USE_MOCK_DATA) {
      // For mock data, we'll just set isLastPage to true
      setIsLastPage(true);
      setIsLoading(false);
    } else {
      // Your existing loadMoreVideos logic for real API calls
      const getYouTubePlaylistVideos = httpsCallable<GetYouTubeVideosRequest, GetYouTubeVideosResponse>(functions, 'getYouTubePlaylistVideos');
      const request: GetYouTubeVideosRequest = { playlistId: final_id, nextPageToken: nextPageToken };

      try {
        const result = await getYouTubePlaylistVideos(request);
        const response: GetYouTubeVideosResponse = result.data;
        let vids = response.items;

        const nextPageToken = response.nextPageToken;
        setNextPageToken(nextPageToken);
        if (!nextPageToken) {
          setIsLastPage(true);
        }

        vids.forEach(video => {
          const title = video.snippet.title;
          const thumbnailUrl = video.snippet.thumbnails.default.url;
          const dateModified = video.contentDetails.videoPublishedAt;
          const id = video.contentDetails.videoId;
          setVideos(vids => [...vids, { id, title, thumbnailUrl, dateModified }]);
        });

        setIsLoading(false);
      } catch (error: any) {
        console.error("Error calling the function: ", error.message);
        setIsLoading(false);
      }
    }
    setPageAlreadyLoaded(true);
  };

  async function getVideoHeight() {
    try {
      const orientation = await ScreenOrientation.getOrientationAsync();
      const screenWidth = Dimensions.get('window').width;
      const screenHeight = Dimensions.get('window').height;
  
      if (orientation === ScreenOrientation.Orientation.PORTRAIT_UP || orientation === ScreenOrientation.Orientation.PORTRAIT_DOWN) {
        return screenWidth * 9 / 16;
      } else {
        return screenHeight - NAVBAR_HEIGHT;
      }
    } catch (error) {
      console.error('Failed to get video height:', error);
      return 0;
    }
  }
  
  async function getVideoWidth() {
    try {
      const orientation = await ScreenOrientation.getOrientationAsync();
      const screenWidth = Dimensions.get('window').width;
      const screenHeight = Dimensions.get('window').height;
  
      if (orientation === ScreenOrientation.Orientation.PORTRAIT_UP || orientation === ScreenOrientation.Orientation.PORTRAIT_DOWN) {
        return screenWidth;
      } else {
        return (screenHeight - NAVBAR_HEIGHT) * 16 / 9;
      }
    } catch (error) {
      console.error('Failed to get video width:', error);
      return 0;
    }
  }

  const renderItem = ({ item }: { item: Video }) => (
    <Link href={{ pathname: '/YoutubePlayer', params: { id: item.id } }} asChild>
      <TouchableOpacity style={{ paddingTop: 10 }}>
        <VideoItem
          title={item.title}
          lastModified={item.dateModified}
          thumbnail={item.thumbnailUrl}
          id={item.id}
          imageStyle={(isTablet() || Platform.OS === 'web')
            ? { width: width / 4, height: width * 1.5 / 10 }
            : (orientation === 'LANDSCAPE')
              ? { width: width / 5 }
              : { width: width / 2.2 }}
        />
      </TouchableOpacity>
    </Link>
  );

  const renderHeader = () => (
    <View style={{ height: 0, width: videoWidth }}>
      {/* Render your header content here */}
    </View>
  );

  const renderFooter = () => {
    if (isLastPage) {
      return (
        <View>
          <Text style={{ textAlign: 'center', marginTop: 10 }}>No more videos to load</Text>
          <View style={{ height: 50, width: videoWidth }} />
        </View>
      );
    }
    if (pageAlreadyLoaded) {
      return (
        <View>
          <Text style={{ textAlign: 'center', marginTop: 10 }}>Loading...</Text>
          <View style={{ height: 50, width: videoWidth }} />
        </View>
      );
    } else {
      return (
        <View>
          <TouchableOpacity onPress={loadMoreVideos}>
            <Text style={styles.text}>SHOW MORE</Text>
          </TouchableOpacity>
          <View style={{ height: 50, width: videoWidth }} />
        </View>
      );
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#ED4D4E" />
      </View>
    );
  }

  const ListComponent = Platform.OS === 'web' ? ScrollView : View;

  return (
    <MeasureView onSetOrientation={onSetOrientation} onSetWidth={onSetWidth}>
      <ListComponent style={[styles.container, Platform.OS === 'web' && styles.webContainer]}>
        <FlatList
          data={videos}
          renderItem={renderItem}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          keyExtractor={item => item.id}
          numColumns={1}
          contentContainerStyle={styles.flatListContent}
          ListEmptyComponent={<Text style={styles.noResultsText}>No videos found</Text>}
          scrollEnabled={Platform.OS !== 'web'}
        />
      </ListComponent>
    </MeasureView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
  },
  webContainer: {
    height: 'calc(100vh - 70px)',
    overflowY: 'auto' as 'auto',
    paddingBottom: 240,
  },
  flatListContent: {
    paddingHorizontal: 10,
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'maroon',
    textAlign: 'center',
    fontFamily: 'UbuntuRegular',
    marginTop: 10,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default PlaylistScreen;