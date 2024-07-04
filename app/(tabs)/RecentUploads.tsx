import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, Dimensions, Platform, ScrollView, TouchableOpacity, Text } from 'react-native';
import VideoItem from '../../components/VideoItem';
import { Link } from 'expo-router';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../api/firebase';
import MeasureView from '../api/MeasureView';
import mockYoutubeData from '../../components/mockYoutubeData';

interface GetYouTubeVideosRequest {
  channelId: string;
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

const RecentUploadsScreen = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [orientation, setOrientation] = useState(Dimensions.get('window').width > Dimensions.get('window').height ? 'LANDSCAPE' : 'PORTRAIT');
  const [width, setWidth] = useState(Dimensions.get('window').width);

  const USE_MOCK_DATA = true; // Set this to false when you want to use real API calls

  const onSetWidth = (width: number) => {
    console.log('RecentUploadsScreen width: ', width);
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
    } else {
      // Use real API call
      const getYouTubeChannelVideos = httpsCallable<GetYouTubeVideosRequest, GetYouTubeVideosResponse>(functions, 'getYouTubeChannelVideos');
      const request: GetYouTubeVideosRequest = { channelId: 'UCLiuTwQ-ap30PbKzprrN2Hg' };

      try {
        const result = await getYouTubeChannelVideos(request);
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
      } catch (error: any) {
        console.error("Error calling the function: ", error.message);
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

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
          keyExtractor={item => item.id}
          numColumns={1}
          contentContainerStyle={styles.flatListContent}
          ListEmptyComponent={<Text style={styles.noResultsText}>No videos found</Text>}
          ListFooterComponent={<View style={{ height: 20 }} />}
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
    paddingBottom: 120,
  },
  flatListContent: {
    paddingHorizontal: 10,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default RecentUploadsScreen;