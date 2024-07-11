
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries  
import { httpsCallable } from 'firebase/functions';
import { View, FlatList, StyleSheet, ActivityIndicator, Dimensions, Platform, ScrollView, TouchableOpacity, Text } from 'react-native';
import PlaylistItem from '../../components/PlaylistItem'; // Import the PlaylistItem component
import React, { useState, useEffect } from 'react';
import { useFocusEffect, Link } from 'expo-router'
import { functions } from '../api/firebase';
import GuageView from '../../components/GuageView';



interface GetYouTubePlaylistsRequest {
  channelId: string;
}

interface Playlist {
  id: string;
  title: string;
  thumbnailUrl: string;
  dateModified: string;
  // Add other playlist properties as needed
}

interface GetYouTubePlaylistsResponse {
  playlists: Playlist[];
}


interface FirebaseFunctionError {
  code: string;
  message: string;
  details?: any; // The details can vary depending on the error
}

const isTablet = () => {
  const { width, height } = Dimensions.get('window');
  const aspectRatio = width / height;
  return Math.min(width, height) >= 600 && (aspectRatio > 1.2 || aspectRatio < 0.9);
};

const RecentVideoScreen = () => {
  const [playlists, setPlaylists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [orientation, setOrientation] = useState(Dimensions.get('window').width > Dimensions.get('window').height ? 'LANDSCAPE' : 'PORTRAIT');
  const [width, setWidth] = useState(Dimensions.get('window').width);
  const onSetWidth = (width: number) => {
    console.log('RecentVideoScreen width: ', width);
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
  const fetchPlaylists = async () => {

    const getYouTubePlaylists = httpsCallable<GetYouTubePlaylistsRequest, GetYouTubePlaylistsResponse>(functions, 'getYouTubePlaylists');
    // Use the interface for the request
    const request: GetYouTubePlaylistsRequest = { channelId: 'UCLiuTwQ-ap30PbKzprrN2Hg' };

    getYouTubePlaylists(request)
      .then((result: { data: GetYouTubePlaylistsResponse }) => {
        // Use the interface for the response
        const response: GetYouTubePlaylistsResponse = result.data;
        const playlists = response.items; // Change this line
        setPlaylists([]); // Clear the playlists array

        playlists.forEach(playlist => {
          const title = playlist.snippet.title;
          const thumbnailUrl = playlist.snippet.thumbnails.default?.url; // or 'medium' or 'high'
          const dateModified = playlist.snippet.publishedAt;
          const id = playlist.id;

          if (thumbnailUrl && !thumbnailUrl.includes('no_thumbnail')) {
            setPlaylists(playlists => [...playlists, { id, title, thumbnailUrl, dateModified }]);
          }

          setIsLoading(false);
        });
      })
      .catch((error: FirebaseFunctionError) => {
        console.error("Error calling the function: ", error.message);
      });
  };

  useEffect(() => {
    if (playlists.length === 0) {
      fetchPlaylists();
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      // Reset the playlists state when the screen comes into focus
      setIsLoading(true);
      setPlaylists([]);

      // Fetch the playlists
      fetchPlaylists();
    }, [])
  );

  const renderItem = ({ item }: { item: Playlist }) => (

    <Link href={{ pathname: '../PlaylistScreen', params: { id: item.id } }} asChild>

      <TouchableOpacity style={{ paddingTop: 10 }}>
        <PlaylistItem title={item.title} lastModified={item.dateModified} thumbnail={item.thumbnailUrl} id={item.id} imageStyle={(isTablet() || Platform.OS === 'web')
          ? { width: width / 4, height: width * 1.5 / 10 }
          : (orientation === 'LANDSCAPE')
            ? { width: width / 5 }
            : { width: width / 2.2 }} />
      </TouchableOpacity>
    </Link >
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
    <GuageView onSetOrientation={onSetOrientation} onSetWidth={onSetWidth}>
      <ListComponent style={[styles.container, Platform.OS === 'web' && styles.webContainer]}>
        <FlatList
          data={playlists}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          numColumns={1}
          contentContainerStyle={styles.flatListContent}
          ListEmptyComponent={<Text style={styles.noResultsText}>No playlists found</Text>}
          ListFooterComponent={<View style={{ height: 20 }} />} // Add this line
          scrollEnabled={Platform.OS !== 'web'}
        />
      </ListComponent>
    </GuageView>
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

export default RecentVideoScreen;