import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, FlatList, Dimensions, Platform, TouchableOpacity, Text, ScrollView } from 'react-native';
import VideoItem from '../components/VideoItem';
import { Link } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
import { httpsCallable } from 'firebase/functions';
import { functions } from './api/firebase';
import GuageView from '../components/GuageView';
import * as ScreenOrientation from 'expo-screen-orientation';
import mockPlaylistData from '../components/mockPlaylistData';
import useIsMobileWeb from '../hooks/useIsMobileWeb'; // Adjust the import path as needed

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
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);

  const [isLastPage, setIsLastPage] = useState(false);
  const [pageAlreadyLoaded, setPageAlreadyLoaded] = useState(false);
  const [orientation, setOrientation] = useState(Dimensions.get('window').width > Dimensions.get('window').height ? 'LANDSCAPE' : 'PORTRAIT');
  const [width, setWidth] = useState(Dimensions.get('window').width);
  const [height, setHeight] = useState(Dimensions.get('window').height);
  const isMobileWeb = useIsMobileWeb();

  const USE_MOCK_DATA = false;

  const onSetWidth = (width: number) => {
    console.log('PlaylistScreen width: ', width);
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

  const renderFooter = () => {
    if (isLastPage) {
      return <Text style={styles.footerText}>No more videos to load</Text>;
    }
    if (pageAlreadyLoaded) {
      return <ActivityIndicator size="large" color="#ED4D4E" />;
    }
    return (
      <TouchableOpacity onPress={loadMoreVideos}>
        <Text style={styles.showMoreText}>SHOW MORE</Text>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ED4D4E" />
      </View>
    );
  }
  const ListComponent = Platform.OS === 'web' ? ScrollView : View;

  return (
    <GuageView onSetOrientation={onSetOrientation} onSetWidth={onSetWidth} flex={1}>
        {isMobileWeb ? (
          <ScrollView
            contentContainerStyle={styles.scrollViewContent}
            showsVerticalScrollIndicator={false}
          >
            {videos.length === 0 ? (
              <Text style={styles.noResultsText}>No videos found</Text>
            ) : (
              <>
                {videos.map(renderVideoItem)}
                {renderFooter()}
              </>
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
            ListEmptyComponent={<Text style={styles.noResultsText}>No videos found</Text>}
            ListFooterComponent={renderFooter}
            scrollEnabled={Platform.OS !== 'web'}
          />
          </ListComponent>
        )}
    </GuageView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollViewContent: {
    paddingHorizontal: 10,
    paddingBottom: 120,
  },
  webContainer: {
    height: 'calc(100vh - 70px)',
    overflowY: 'auto' as 'auto',
    paddingBottom: 120,
  },
  flatListContent: {
    paddingHorizontal: 10,
    paddingBottom: 120,
  },
  showMoreText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'maroon',
    textAlign: 'center',
    fontFamily: 'UbuntuRegular',
    marginTop: 10,
    marginBottom: 20,
  },
  footerText: {
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default PlaylistScreen;