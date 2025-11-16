import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Share,
  ImageBackground,
  Alert,
  Platform
} from "react-native";
import { useLocalSearchParams, router } from 'expo-router';
import { getAllFiles } from './api/apiWrapper';
import Slider from '@react-native-community/slider';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ForwardIcon from '../components/ForwardIcon';
import ReplayIcon from "../components/ReplayIcon";
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Entypo from '@expo/vector-icons/Entypo';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import * as Progress from 'react-native-progress';
import AsyncStorage from '@react-native-async-storage/async-storage';
import GuageView from '../components/GuageView';
import useIsMobileWeb from '../hooks/useIsMobileWeb';
import * as Clipboard from 'expo-clipboard';
import useTrackPlayer from '../hooks/useTrackPlayer';
import throttle from 'lodash.throttle';
import logger from '../utils/logger';

const PROXY_URL = 'https://cors-anywhere.herokuapp.com/';

const { width: screenWidth } = Dimensions.get("window");

const isTablet = () => {
  const { width, height } = Dimensions.get('window');
  const aspectRatio = width / height;
  const isLandscape = Math.min(width, height) >= 600 && (aspectRatio > 1.2 || aspectRatio < 0.9);
  console.log('isTablet: ', isLandscape);
  return isLandscape
}

const AudioScreen = () => {
  const navigation = useNavigation();
  const rawFile = useLocalSearchParams<{ 
    url: string, 
    title: string, 
    playlist?: string, 
    currentIndex?: string,
    category?: string 
  }>();
  
  // Memoize the file object to prevent unnecessary re-renders and effect triggers
  const file = useMemo(() => ({
    url: rawFile.url,
    title: rawFile.title,
    playlist: rawFile.playlist,
    currentIndex: rawFile.currentIndex,
    category: rawFile.category
  }), [
    rawFile.url, 
    rawFile.title, 
    rawFile.playlist, 
    rawFile.currentIndex, 
    rawFile.category
  ]);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isFileDownloaded, setIsFileDownloaded] = useState(false);
  // State to hold the list of played songs and their positions
  const [playedSongs, setPlayedSongs] = useState<any[]>([]);
  const [orientation, setOrientation] = useState(Dimensions.get('window').width > Dimensions.get('window').height ? 'LANDSCAPE' : 'PORTRAIT');
  const [width, setWidth] = useState(Dimensions.get('window').width);
  const [height, setHeight] = useState(Dimensions.get('window').height);
  const isMobileWeb = useIsMobileWeb();
  const lastStorageUpdateRef = useRef(0);

  // Log component initialization
  useEffect(() => {
    logger.info('AudioScreen initialized', {
      file: {
        url: file.url,
        title: file.title,
        playlist: file.playlist ? 'provided' : 'none',
        currentIndex: file.currentIndex,
        category: file.category
      },
      orientation,
      platform: Platform.OS,
      isMobileWeb,
      debugMode: logger.isDebugEnabled()
    }, 'AudioScreen');
  }, []);


  // Use the new TrackPlayer hook
  const {
    isPlaying,
    isLoading,
    currentTrack,
    playlist,
    currentIndex,
    position,
    duration,
    loadTrack,
    loadPlaylist,
    goToNextTrack,
    goToPreviousTrack,
    togglePlayback,
    seekTo,
    seekForward,
    seekBackward,
    cleanup
  } = useTrackPlayer((loaded: boolean) => {
    logger.info('Track loaded callback', { loaded }, 'AudioScreen');
    setIsFirstLoad(false);
  });

  // Log rendering state changes (reduced verbosity)
  useEffect(() => {
    // Only log significant state changes, not every render
    if (isLoading !== undefined) {
      logger.debug('AudioScreen state changed', {
        isPlaying,
        isLoading,
        currentIndex,
        playlistLength: playlist?.length || 0
      }, 'AudioScreen');
    }
  }, [isPlaying, isLoading, currentIndex, playlist?.length]);

  // Log component cleanup
  useEffect(() => {
    return () => {
      logger.info('AudioScreen component unmounting', {
        title: file.title,
        finalPosition: position,
        finalDuration: duration,
        isPlaying
      }, 'AudioScreen');
    };
  }, []);

  const onSetWidth = (width: number) => {
    logger.debug('Width changed', { width, previousWidth: width }, 'AudioScreen');
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
      logger.info('Orientation changed', {
        from: orientation,
        to: newOrientation,
        newWidth,
        newHeight,
        aspectRatio,
        previousAspectRatio
      }, 'AudioScreen');
      setOrientation(newOrientation);
    }

    setWidth(newWidth);
    setHeight(newHeight);
  }


  const onSetOrientation = (orientation: string) => {
    if (Platform.OS === 'web') {
      handleOrientationChange();
    } else {
      setOrientation(orientation);
    }
  };

  const shareAudioLink = async (url: string) => {
    logger.info('Sharing audio link', { url }, 'AudioScreen');
    try {
      const result = await Share.share({
        message: 'Check out this cool video on YouTube!',
        url: url  // Replace VIDEO_ID with the actual ID
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // Shared with activity type of result.activityType
          logger.info('Audio link shared with activity type', { activityType: result.activityType }, 'AudioScreen');
        } else {
          // Shared
          logger.info('Audio link shared successfully', {}, 'AudioScreen');
        }
      } else if (result.action === Share.dismissedAction) {
        // Dismissed
        logger.info('Audio link share dismissed', {}, 'AudioScreen');
      }
    } catch (error) {
      logger.error('Error sharing audio link', { error: error instanceof Error ? error.message : String(error), url }, 'AudioScreen');
    }
  };


  const mailAudioLink = async (url: string) => {
    logger.info('Sharing audio link via mail/web', { url, hasNavigatorShare: !!navigator.share }, 'AudioScreen');
    if (navigator.share) {
      // Web Share API is supported
      try {
        await navigator.share({
          title: 'Check out this audio file',
          text: 'I thought you might be interested in this audio file.',
          url: url
        });
        logger.info('Audio link shared via Web Share API', { url }, 'AudioScreen');
      } catch (error) {
        logger.error('Error sharing via Web Share API', { error: error instanceof Error ? error.message : String(error), url }, 'AudioScreen');
      }
    } else {
      // Web Share API is not supported, fallback to clipboard
      try {
        await Clipboard.setStringAsync(url);
        logger.info('Audio link copied to clipboard', { url }, 'AudioScreen');
        Alert.alert(
          'Link Copied',
          "The audio link has been copied to your clipboard. You can now paste it wherever you'd like to share it.",
          [{ text: 'OK' }]
        );
      } catch (error) {
        logger.error('Failed to copy audio link to clipboard', { error: error instanceof Error ? error.message : String(error), url }, 'AudioScreen');
        Alert.alert('Error', 'Failed to copy the link. Please try again.');
      }
    }
  };


  const shareAudioFile = async (fileUri: string) => {
    logger.info('Sharing audio file', { fileUri }, 'AudioScreen');
    try {
      const shareOptions = {
        title: 'Share audio file',
        message: 'Check out this cool audio file!',
        url: `file://${fileUri}`,
      };

      const result = await Share.share(shareOptions);

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // Shared with activity type of result.activityType
          logger.info('Audio file shared with activity type', { activityType: result.activityType, fileUri }, 'AudioScreen');
        } else {
          // Shared
          logger.info('Audio file shared successfully', { fileUri }, 'AudioScreen');
        }
      } else if (result.action === Share.dismissedAction) {
        // Dismissed
        logger.info('Audio file share dismissed', { fileUri }, 'AudioScreen');
      }
    } catch (error) {
      logger.error('Error sharing audio file', { error: error instanceof Error ? error.message : String(error), fileUri }, 'AudioScreen');
    }
  };


  const muteSound = async () => {
    logger.info('Mute button pressed', { currentMuteState: isMuted, newMuteState: !isMuted }, 'AudioScreen');
    try {
      setIsMuted(!isMuted);
      // Note: TrackPlayer doesn't have volume control in this implementation
      // You can add volume control if needed
    } catch (error) {
      logger.error('Error toggling mute', { error: error instanceof Error ? error.message : String(error), isMuted }, 'AudioScreen');
    }
  };

  const getStoredPosition = (url: string) => {
    logger.info('Looking for saved position', { 
      url, 
      playedSongsCount: playedSongs.length,
      playedSongs: playedSongs.map((s: any) => ({ 
        url: s.song?.url, 
        position: s.position,
        title: s.song?.title 
      }))
    }, 'AudioScreen');
    
    // If playedSongs is not loaded yet, return 0 (start from beginning)
    if (playedSongs.length === 0) {
      logger.info('PlayedSongs not loaded yet, starting from beginning', { url }, 'AudioScreen');
      return 0;
    }
    
    const playedSong = playedSongs.find((playedSong) => playedSong.song.url === url);
    if (playedSong && playedSong.position > 0) {
      // Convert from milliseconds to seconds for TrackPlayer
      const positionInSeconds = playedSong.position / 1000;
      logger.info('Found saved position for track', { 
        url, 
        positionMs: playedSong.position, 
        positionSeconds: positionInSeconds 
      }, 'AudioScreen');
      return positionInSeconds;
    }
    
    logger.info('No saved position found for track', { 
      url, 
      foundSong: !!playedSong,
      songPosition: playedSong?.position || 0
    }, 'AudioScreen');
    return 0;
  };



  // Initialize playlist from parameters or fetch from category
  useEffect(() => {
    const initializePlaylist = async () => {
      logger.info('Initializing playlist', { 
        hasPlaylist: !!file.playlist, 
        hasCategory: !!file.category,
        currentIndex: file.currentIndex,
        playedSongsLoaded: playedSongs.length,
        platform: Platform.OS,
        hasUrl: !!file.url,
        hasTitle: !!file.title
      }, 'AudioScreen');
      
      if (file.playlist) {
        // Use provided playlist
        const playlistData = JSON.parse(file.playlist);
        const startIndex = parseInt(file.currentIndex || '0');
        logger.info('Loading provided playlist', { 
          trackCount: playlistData.length, 
          startIndex 
        }, 'AudioScreen');
        const savedPosition = getStoredPosition(file.url);
        await loadPlaylist(playlistData, startIndex, savedPosition);
      } else if (file.category) {
        // Fetch all files from the same category
        try {
          logger.info('Fetching files for category', { category: file.category }, 'AudioScreen');
          const allFiles = (await getAllFiles('audioFilesList', 'mp3Files')).map((url: string) => {
            const segments = url.split('/');
            const filename = segments[segments.length - 1];
            const title = filename.split('.')[0];
            return {
              title: title.replaceAll("_", " "),
              url: url,
            };
          });

          // Filter files by category (same logic as FilesScreen)
          const categorizedFiles = allFiles.map((fileItem: any) => {
            const urlParts = fileItem.url.split('/');
            const folder = urlParts[urlParts.length - 2];
            return { ...fileItem, category: folder };
          });

          const categoryFiles = categorizedFiles.filter((fileItem: any) => fileItem.category === file.category);
          
          // Don't sort - keep the same order as FilesScreen (database order)
          // This ensures consistent play order between FilesScreen and AudioScreen
          
          // Find current track index
          const currentIdx = categoryFiles.findIndex((track: any) => track.url === file.url);
          const startIndex = currentIdx >= 0 ? currentIdx : 0;
          
          logger.info('Track index calculation', {
            selectedUrl: file.url,
            selectedTitle: file.title,
            foundIndex: currentIdx,
            startIndex: startIndex,
            totalTracks: categoryFiles.length,
            allTracks: categoryFiles.map((t: any, idx: number) => ({ index: idx, title: t.title, url: t.url }))
          }, 'AudioScreen');
          
          const savedPosition = getStoredPosition(file.url);
          await loadPlaylist(categoryFiles, startIndex, savedPosition);
          
          logger.info('Playlist initialized from category', {
            totalTracks: categoryFiles.length,
            currentIndex: startIndex,
            currentTrack: file.title,
            category: file.category,
            tracks: categoryFiles.map((t: any) => t.title)
          }, 'AudioScreen');
        } catch (error) {
          logger.error('Error fetching playlist from category', { 
            error: error instanceof Error ? error.message : String(error), 
            category: file.category 
          }, 'AudioScreen');
        }
      } else if (file.url && file.title) {
        // Single track mode - no playlist, no category (e.g., from DayScreen)
        logger.info('Loading single track (no playlist/category)', { 
          url: file.url, 
          title: file.title 
        }, 'AudioScreen');
        
        try {
          const savedPosition = getStoredPosition(file.url);
          await loadTrack(file.url, file.title, true, savedPosition);
          logger.info('Single track loaded successfully', { 
            title: file.title, 
            savedPosition 
          }, 'AudioScreen');
        } catch (error) {
          logger.error('Error loading single track', { 
            error: error instanceof Error ? error.message : String(error),
            url: file.url,
            title: file.title
          }, 'AudioScreen');
        }
      } else {
        logger.warn('No valid parameters provided for track loading', {
          hasUrl: !!file.url,
          hasTitle: !!file.title,
          hasPlaylist: !!file.playlist,
          hasCategory: !!file.category
        }, 'AudioScreen');
      }
    };

    // Don't wait for playedSongs to load - initialize immediately
    initializePlaylist();
  }, [file.url, file.title, file.playlist, file.currentIndex, file.category]);



  // Track loading is now handled by the useTrackPlayer hook

  const fileRef = useRef(file);
  const playlistRef = useRef(playlist);
  const currentIndexRef = useRef(currentIndex);

  useEffect(() => {
    fileRef.current = file;
    playlistRef.current = playlist;
    currentIndexRef.current = currentIndex;
  }, [file, playlist, currentIndex]);



  useEffect(() => {
    console.log('Played songs:', playedSongs);
  }, [playedSongs]);

  // useEffect(() => {
  //   const restorePosition = async () => {
  //     if (isFirstLoad) {
  //       const position = getStoredPostion(file);
  //       if (position) {
  //         setPosition(position);
  //         if (sound) {
  //           await sound.setPositionAsync(position);
  //           setIsFirstLoad(false);
  //         }
  //       }
  //     }
  //   };
  //   restorePosition();
  // }, [file]);


  useEffect(() => {
    const loadPlayedSongs = async () => {
      logger.info('Loading played songs from storage', {}, 'AudioScreen');
      try {
        const jsonValue = await AsyncStorage.getItem('@playedSongs');
        if (jsonValue !== null) {
          const newPlayedSongs = JSON.parse(jsonValue);
          if (JSON.stringify(newPlayedSongs) !== JSON.stringify(playedSongs)) {
            logger.info('Played songs loaded from storage', { 
              songCount: newPlayedSongs.length,
              songs: newPlayedSongs.map((s: any) => ({ 
                title: s.song?.title, 
                url: s.song?.url, 
                position: s.position 
              }))
            }, 'AudioScreen');
            setPlayedSongs(newPlayedSongs);
          }
        } else {
          logger.info('No played songs found in storage', {}, 'AudioScreen');
        }
      } catch (e) {
        logger.error('Error loading played songs from storage', { 
          error: e instanceof Error ? e.message : String(e) 
        }, 'AudioScreen');
      }
    };

    loadPlayedSongs();
  }, []);

  const updateState = throttle(async (currentPosition: number, forceSave = false) => {
    logger.info('updateState called', { 
      currentPosition, 
      hasCurrentTrack: !!currentTrack,
      currentTrackTitle: (currentTrack as any)?.title,
      currentTrackUrl: (currentTrack as any)?.url,
      forceSave
    }, 'AudioScreen');
    
    // Only save if we have a current track and position > 0
    if (!currentTrack || currentPosition <= 0) {
      logger.info('Skipping save - no current track or position <= 0', { 
        hasCurrentTrack: !!currentTrack,
        currentPosition 
      }, 'AudioScreen');
      return;
    }

    // Convert position from seconds to milliseconds for compatibility with old data format
    const positionMillis = Math.floor(currentPosition * 1000);
    
    // Compare to the value in our ref instead of state
    const lastUpdate = lastStorageUpdateRef.current;
    const timeSinceLastUpdate = Math.abs(positionMillis - lastUpdate);
    
    // Save immediately if forced, or if it's the first save (position > 0 but lastUpdate is 0), or every 10 seconds
    const shouldSave = forceSave || (lastUpdate === 0 && positionMillis > 0) || timeSinceLastUpdate >= 10000;
    
    logger.info('Checking if should save position', { 
      positionMillis, 
      lastUpdate, 
      timeSinceLastUpdate,
      shouldSave,
      isFirstSave: lastUpdate === 0 && positionMillis > 0
    }, 'AudioScreen');
    
    if (shouldSave) { // Save immediately on first play, then every 10 seconds
      try {
        const jsonValue = await AsyncStorage.getItem('@playedSongs');
        let playedSongs = jsonValue ? JSON.parse(jsonValue) : [];
        
        logger.info('Retrieved played songs from storage', { 
          existingCount: playedSongs.length,
          existingSongs: playedSongs.map((s: any) => ({ title: s.song?.title, url: s.song?.url }))
        }, 'AudioScreen');
        
        // Create song object in the same format as the old implementation
        const songData = {
          title: (currentTrack as any)?.title || file.title,
          url: (currentTrack as any)?.url || file.url
        };
        
        logger.info('Song data to save', songData, 'AudioScreen');
        
        // Update or add the current song
        const songIndex = playedSongs.findIndex(
          (song: any) => song.song.url === songData.url
        );
        
        const newSong = { song: songData, position: positionMillis };
        
        if (songIndex !== -1) {
          playedSongs[songIndex] = newSong;
          logger.info('Updated song position in storage', { 
            title: songData.title, 
            position: positionMillis,
            songIndex,
            oldPosition: playedSongs[songIndex]?.position
          }, 'AudioScreen');
        } else {
          playedSongs.push(newSong);
          logger.info('Added new song position to storage', { 
            title: songData.title, 
            position: positionMillis,
            newTotalCount: playedSongs.length
          }, 'AudioScreen');
        }
        
        await AsyncStorage.setItem('@playedSongs', JSON.stringify(playedSongs));

        // Update the ref immediately
        lastStorageUpdateRef.current = positionMillis;

        logger.info('Position successfully saved to storage', { 
          position: positionMillis, 
          title: songData.title,
          totalSongsInStorage: playedSongs.length
        }, 'AudioScreen');
      } catch (error) {
        logger.error('Error saving position to storage', { 
          error: error instanceof Error ? error.message : String(error),
          position: positionMillis,
          title: (currentTrack as any)?.title || file.title
        }, 'AudioScreen');
      }
    } else {
      logger.info('Skipping save - not enough time elapsed', { 
        timeSinceLastUpdate,
        required: 30000
      }, 'AudioScreen');
    }
  }, 1000);

  // Save track position data when position changes
  useEffect(() => {
    logger.info('Position change effect triggered', { 
      position, 
      hasCurrentTrack: !!currentTrack,
      currentTrackTitle: (currentTrack as any)?.title,
      currentTrackUrl: (currentTrack as any)?.url
    }, 'AudioScreen');
    
    if (position > 0 && currentTrack) {
      logger.info('Calling updateState from position change effect', { position }, 'AudioScreen');
      updateState(position);
    } else {
      logger.info('Not calling updateState', { 
        position, 
        hasCurrentTrack: !!currentTrack,
        reason: !currentTrack ? 'no current track' : 'position <= 0'
      }, 'AudioScreen');
    }
  }, [position, currentTrack]);

  // Save position when track changes
  useEffect(() => {
    logger.info('Track change effect triggered', { 
      hasCurrentTrack: !!currentTrack,
      currentTrackTitle: (currentTrack as any)?.title,
      currentTrackUrl: (currentTrack as any)?.url,
      position
    }, 'AudioScreen');
    
    // Save position when currentTrack changes (track switch)
    if (position > 0 && currentTrack) {
      logger.info('Calling updateState from track change effect', { position }, 'AudioScreen');
      updateState(position);
    }
  }, [currentTrack]); // Only depend on currentTrack, not position

  // Save final position when component unmounts
  useEffect(() => {
    return () => {
      logger.info('Component unmount effect triggered', { 
        position, 
        hasCurrentTrack: !!currentTrack,
        currentTrackTitle: (currentTrack as any)?.title
      }, 'AudioScreen');
      
      if (position > 0 && currentTrack) {
        logger.info('Saving final position on unmount', { position }, 'AudioScreen');
        // Save immediately on unmount
        updateState.cancel(); // Cancel any pending throttled calls
        updateState(position, true); // Force save on unmount
      }
    };
  }, [position, currentTrack]);

  // Handle navigation away (back button) - stop playback and save position
  // Using a different approach - detect when the back button is pressed
  useEffect(() => {
    const handleBackPress = () => {
      logger.info('Back button pressed - stopping playback and saving position', {
        position,
        hasCurrentTrack: !!currentTrack,
        currentTrackTitle: (currentTrack as any)?.title
      }, 'AudioScreen');
      
      if (position > 0 && currentTrack) {
        // Force save position immediately
        updateState.cancel(); // Cancel any pending throttled calls
        updateState(position, true);
      }
      
      // Stop playback when navigating away
      if (isPlaying) {
        logger.info('Stopping playback due to back button press', {}, 'AudioScreen');
        togglePlayback(); // This will pause the track
      }
    };

    // Add back button listener
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      // Prevent default behavior of leaving the screen
      e.preventDefault();
      
      // Handle the back press
      handleBackPress();
      
      // Allow navigation to continue
      navigation.dispatch(e.data.action);
    });

    return unsubscribe;
  }, [navigation, position, currentTrack, isPlaying]);

  const handleTrackCompletion = async () => {
    if (playlist?.length > 0 && currentIndex < playlist.length - 1) {
      logger.info('Handling track completion - auto-advancing', { 
        currentIndex, 
        playlistLength: playlist?.length || 0
      }, 'AudioScreen');
      goToNextTrack();
    } else {
      logger.info('Track completed but no next track available', { 
        currentIndex, 
        playlistLength: playlist?.length || 0
      }, 'AudioScreen');
    }
  };

  const doGoToNextTrack = async () => {
    logger.info('User requested next track', { 
      currentIndex, 
      playlistLength: playlist?.length || 0
    }, 'AudioScreen');
    await goToNextTrack();
    // No need to navigate - the useTrackPlayer hook handles track changes
    // and the UI will update automatically through state changes
  };
  
  const doGoToPreviousTrack = async () => {
    logger.info('User requested previous track', { 
      currentIndex, 
      playlistLength: playlist?.length || 0
    }, 'AudioScreen');
    await goToPreviousTrack();
    // No need to navigate - the useTrackPlayer hook handles track changes
    // and the UI will update automatically through state changes
  };

  const formatTime = (seconds: number) => {
    const totalSeconds = Math.floor(seconds);
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;

    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };




  const getImageHeight = () => {
    const isTabletDevice = isTablet();
    let height;
    
    if (isTabletDevice || Platform.OS === 'web') {
      if (orientation === 'LANDSCAPE') {
        if (isMobileWeb) {
          height = width * 0.1;
        } else {
          height = width * 0.3;
        }
      } else {
        height = width * 0.4;
      }
    } else {
      height = orientation === 'LANDSCAPE' ? 160 : 260;
    }
    
    logger.debug('Calculated image height', {
      height,
      width,
      orientation,
      isTablet: isTabletDevice,
      platform: Platform.OS,
      isMobileWeb
    }, 'AudioScreen');
    
    return height;
  }

  const getImageWidth = () => {
    const imageWidth = (isTablet() || Platform.OS === 'web') ? getImageHeight() * 4 / 3 : width;
    
    logger.debug('Calculated image width', {
      width: imageWidth,
      height: getImageHeight(),
      isTablet: isTablet(),
      platform: Platform.OS
    }, 'AudioScreen');
    
    return imageWidth;
  }

  // Loading timeout fallback for all platforms
  useEffect(() => {
    if (isLoading) {
      const loadingTimeout = setTimeout(() => {
        if (isLoading) {
          logger.error('Loading timeout - forcing UI to show', {
            title: file.title,
            url: file.url,
            platform: Platform.OS,
            timeout: Platform.OS === 'android' ? '20 seconds' : '15 seconds'
          }, 'AudioScreen');
          
          // Force the loading to complete after timeout
          setIsFirstLoad(false);
        }
      }, Platform.OS === 'android' ? 20000 : 15000); // 20 seconds for Android, 15 for others
      
      return () => clearTimeout(loadingTimeout);
    }
  }, [isLoading, file.title, file.url]);

  if (isLoading) {
    return (
      <View style={styles.musicContainer}>
        <ActivityIndicator size="large" color="#ED4D4E" />
        <Text style={styles.loadingText}>
          Loading audio... {Platform.OS === 'android' ? 'If this takes too long, try restarting the app.' : 'Please wait...'}
        </Text>
      </View>
    );
  }

  // Fallback UI for when track fails to load completely
  if (!currentTrack && !isLoading && file.url) {
    return (
      <View style={styles.musicContainer}>
        {/* Back Button */}
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => {
            logger.info('Back button pressed from fallback UI', {}, 'AudioScreen');
            router.back();
          }}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{file.title}</Text>
        <Text style={styles.loadingText}>
          Audio failed to load. Tap to retry.
        </Text>
        
        <View style={styles.fallbackControls}>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              logger.info('Retrying track load from fallback UI', {
                title: file.title,
                url: file.url
              }, 'AudioScreen');
              loadTrack(file.url, file.title, true, 0);
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>

          {/* Next Track Button */}
          {playlist && playlist.length > 0 && currentIndex < playlist.length - 1 && (
            <TouchableOpacity 
              style={styles.nextButton}
              onPress={() => {
                logger.info('Next track button pressed from fallback UI', {
                  currentIndex: currentIndex,
                  nextIndex: currentIndex + 1
                }, 'AudioScreen');
                goToNextTrack();
              }}
            >
              <Text style={styles.nextButtonText}>Next Track →</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <GuageView onSetOrientation={onSetOrientation} onSetWidth={onSetWidth}>
      <ImageBackground
        source={orientation === 'PORTRAIT'
          ? require('../assets/images/1798742_10202693562240691_5596557541863920908_njpg.png')
          : require('../assets/images/1798742_10202693562240691_5596557541863920908_nx1280jpg.jpg')}
        style={orientation === 'PORTRAIT' ? { width: width, height: height } : Platform.OS === 'web' ? { width: width, height: height } : { width: '100%', height: '100%' }}
      >
        <View style={styles.musicContainer}>

          <View style={styles.overlay}>
            <View style={styles.header}>
              {navigation.canGoBack() && (
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.leftItem}>
                  <FontAwesome name="angle-left" size={32} color="white" hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }} />
                </TouchableOpacity>
              )}

              <View style={styles.rightItem}>
                <View style={styles.circle}>
                  {isMobileWeb ? (
                    <TouchableOpacity onPress={() => {
                      const url = (currentTrack as any)?.url || file.url;
                      if (url) mailAudioLink(url);
                    }}>
                      <Entypo name="share" size={26} color="orange" fontWeight='bold' />
                    </TouchableOpacity>
                  ) : (
                    Platform.OS === 'web' ? (
                      <TouchableOpacity onPress={() => {
                        const url = (currentTrack as any)?.url || file.url;
                        if (url) mailAudioLink(url);
                      }}>
                        <Entypo name="share" size={26} color="orange" fontWeight='bold' />
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity onPress={() => {
                        const url = (currentTrack as any)?.url || file.url;
                        if (url) shareAudioLink(url);
                      }}>
                        <Entypo name="share" size={26} color="orange" fontWeight='bold' />
                      </TouchableOpacity>
                    )
                  )}
                </View>
              </View>
            </View>
            <View style={styles.content}>
              <View style={{ flex: 1 }} />
              {downloadProgress > 0 && downloadProgress < 1 && (
                <Progress.Bar progress={downloadProgress} width={200} />
              )}
              <Text style={styles.title}>{((currentTrack as any)?.title || file.title || '').toUpperCase().replace('_', ' ')}</Text>
              {playlist?.length > 1 && (
                <Text style={styles.trackIndicator}>
                  Track {currentIndex + 1} of {playlist?.length || 0}
                </Text>
              )}
              {Platform.OS === 'web' ? (
                // Basic web slider to avoid findDOMNode usage from community slider on React 19
                <input
                  type="range"
                  min={0}
                  max={Math.max(Number(duration) || 0, 0)}
                  value={Math.max(Math.min(Number(position) || 0, Number(duration) || 0), 0)}
                  onChange={() => {}}
                  onMouseUp={async (e: any) => {
                    const value = Number(e.target?.value ?? 0);
                    logger.info('User seeking to position (web input)', { from: position, to: value }, 'AudioScreen');
                    await seekTo(value);
                    if (value > 0 && currentTrack) {
                      updateState(value);
                    }
                  }}
                  style={{ width: '90%' }}
                />
              ) : (
                <Slider
                  style={styles.slider}
                  thumbTintColor="#FFFFFF"
                  minimumTrackTintColor="#FFF"
                  maximumTrackTintColor="#808080"
                  value={position}
                  maximumValue={duration}
                  onSlidingComplete={async (value) => {
                    logger.info('User seeking to position', { 
                      from: position, 
                      to: value, 
                      title: (currentTrack as any)?.title || file.title || 'Unknown' 
                    }, 'AudioScreen');
                    await seekTo(value);
                    if (value > 0 && currentTrack) {
                      logger.info('Saving position after slider seek', { value }, 'AudioScreen');
                      updateState(value);
                    }
                  }}
                />
              )}
              <View style={styles.timeContainer}>
                <Text style={styles.title}>{formatTime(position)}</Text>
                <Text style={styles.title}>{formatTime(duration)}</Text>
              </View>
              <View style={styles.buttonsContainer}>
                <TouchableOpacity
                  style={styles.muteButton}
                  onPress={muteSound}
                  disabled={isLoading}
                >
                  <Icon name={isMuted ? "volume-off" : "volume-up"} size={40} color="#FFF" />
                </TouchableOpacity>
                {playlist?.length > 1 && currentIndex > 0 && (
                  <TouchableOpacity
                    style={styles.trackNavButton}
                    onPress={doGoToPreviousTrack}
                    disabled={isLoading}
                  >
                    <Icon name="skip-previous" size={40} color="#FFF" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.seekBackwardButton}
                  onPress={async () => {
                    await seekBackward();
                    // Save position after seeking backward
                    if (position > 0 && currentTrack) {
                      logger.info('Saving position after seek backward', { position }, 'AudioScreen');
                      updateState(position);
                    }
                  }}
                  disabled={isLoading}
                >
                  <ReplayIcon />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.button}
                  onPress={togglePlayback}
                  disabled={isLoading}
                >
                  <Icon name={isPlaying ? "pause" : "play-arrow"} size={40} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.seekForwardButton}
                  onPress={async () => {
                    await seekForward();
                    // Save position after seeking forward
                    if (position > 0 && currentTrack) {
                      logger.info('Saving position after seek forward', { position }, 'AudioScreen');
                      updateState(position);
                    }
                  }}
                  disabled={isLoading}
                >
                  <ForwardIcon />
                </TouchableOpacity>
                {playlist?.length > 1 && currentIndex < (playlist?.length || 1) - 1 && (
                  <TouchableOpacity
                    style={styles.trackNavButton}
                    onPress={doGoToNextTrack}
                    disabled={isLoading}
                  >
                    <Icon name="skip-next" size={40} color="#FFF" />
                  </TouchableOpacity>
                )}
                {Platform.OS !== 'android' && (
                  Platform.OS === 'web' ? (
                    <TouchableOpacity
                      style={styles.downloadButton}
                      onPress={async () => {
                        const currentTitle = (currentTrack as any)?.title || file.title || 'Unknown';
                        const currentUrl = (currentTrack as any)?.url || file.url || '';
                        if (isFileDownloaded) {
                          logger.info('Download attempted but file already downloaded', { title: currentTitle }, 'AudioScreen');
                          Alert.alert('Downloaded', 'This file is already downloaded');
                          return;
                        }
                        logger.info('Starting web download', { url: currentUrl, title: currentTitle }, 'AudioScreen');
                        try {
                          setDownloadProgress(0);
                          // Fetch the file through the proxy
                          const response = await fetch(PROXY_URL + currentUrl);
                          const contentLength = response.headers.get('Content-Length');
                          const total = parseInt(contentLength || '0', 10);
                          let loaded = 0;

                          logger.info('Web download started', { 
                            totalSize: total, 
                            url: currentUrl 
                          }, 'AudioScreen');

                          const reader = response.body!.getReader();
                          const chunks = [];

                          while (true) {
                            const { done, value } = await reader.read();
                            if (done) break;
                            chunks.push(value);
                            loaded += value.length;
                            setDownloadProgress(loaded / total);
                          }

                          const blob = new Blob(chunks, { type: 'audio/mpeg' });
                          const blobUrl = window.URL.createObjectURL(blob);

                          const link = document.createElement('a');
                          link.href = blobUrl;
                          link.download = `${currentTitle}.mp3`;

                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);

                          window.URL.revokeObjectURL(blobUrl);

                          logger.info('Web download completed successfully', { 
                            title: currentTitle, 
                            totalSize: total 
                          }, 'AudioScreen');
                          setIsFileDownloaded(true);
                          setDownloadProgress(1);
                        } catch (error) {
                          logger.error('Web download failed', { 
                            error: error instanceof Error ? error.message : String(error), 
                            url: currentUrl, 
                            title: currentTitle 
                          }, 'AudioScreen');
                          Alert.alert('Download Failed', 'There was an error downloading the file.');
                          setDownloadProgress(0);
                        }
                      }}
                      disabled={isLoading}
                    >
                      <Icon name="get-app" size={40} color="#FFF" />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.downloadButton}
                      onPress={async () => {
                        const currentTitle = (currentTrack as any)?.title || file.title || 'Unknown';
                        const currentUrl = (currentTrack as any)?.url || file.url || '';
                        if (isFileDownloaded) {
                          logger.info('Download attempted but file already downloaded', { title: currentTitle }, 'AudioScreen');
                          Alert.alert('Downloaded', 'This file is already downloaded');
                          shareAudioFile(`${FileSystem.cacheDirectory}${currentTitle}.mp3`);
                          return;
                        }
                        logger.info('Starting native download', { url: currentUrl, title: currentTitle }, 'AudioScreen');
                        // Check if external storage is available and accessible
                        const fileUri = `${FileSystem.cacheDirectory}${currentTitle}.mp3`;

                        const downloadResumable = FileSystem.createDownloadResumable(
                          currentUrl,
                          fileUri,
                          {},
                          (downloadProgress) => {
                            const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
                            logger.debug('Native download progress', { 
                              progress: progress * 100, 
                              bytesWritten: downloadProgress.totalBytesWritten,
                              totalBytes: downloadProgress.totalBytesExpectedToWrite
                            }, 'AudioScreen');
                            setDownloadProgress(progress);
                          }
                        );

                        try {
                          const result = await downloadResumable.downloadAsync();
                          if (result?.uri) {
                            logger.info('Native download completed successfully', { 
                              uri: result.uri, 
                              title: currentTitle 
                            }, 'AudioScreen');
                            Alert.alert('Download Complete', `Finished downloading to ${result.uri}`);
                            setIsFileDownloaded(true);
                          }
                        } catch (e) {
                          logger.error('Native download failed', { 
                            error: e instanceof Error ? e.message : String(e), 
                            url: currentUrl, 
                            title: currentTitle 
                          }, 'AudioScreen');
                        }
                      }}
                      disabled={isLoading}
                    >
                      <Icon name="get-app" size={40} color="#FFF" />
                    </TouchableOpacity>
                  )
                )}
              </View>
            </View>
          </View>
        </View>
      </ImageBackground>
    </GuageView >
  );
};


const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: 'transparent', // Use the same color as your header
  },
  musicContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 0, // Add some margin to separate the title and the button
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0)', // Dark overlay for better text visibility
  },
  content: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 30,
    marginRight: 20,
  },
  trackIndicator: {
    fontSize: 14,
    color: 'brown',
    marginBottom: 20,
    textAlign: 'center',
  },
  slider: {
    width: screenWidth * 0.9, // Set the width as needed
    height: 40, // Set the height as needed
    marginBottom: 20, // Set the margin as needed
  },
  songTitle: {
    position: "absolute",
    fontSize: 24,
    fontWeight: "bold",
    width: screenWidth * 2, // Change paddingHorizontal to width and multiply by 2
    textAlign: "center",
    zIndex: 1,
    top: -70, // Adjust the position to be above the button
    left: 0,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: screenWidth * 0.9, // Set the width to be the same as the slider's width
    bottom: 30,
  },
  button: {
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  buttonText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  buttonsContainer: {
    bottom: 50,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    width: screenWidth,
  },
  muteButton: {
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  downloadButton: {
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  seekBackwardButton: {
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  seekForwardButton: {
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  trackNavButton: {
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    marginTop: 60, // Add some margin to separate the title and the button
    backgroundColor: 'transparent', // Set the background color for your header
  },
  titleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent', // Choose your color
  },
  rightItem: {
    backgroundColor: 'transparent',
  },
  leftItem: {
    zIndex: 1,
  },
  circle: {
    width: 30, // Or whatever size you want
    height: 30, // Should be the same as width
    borderRadius: 15, // Half of your width and height
    backgroundColor: 'white', // Or whatever color you want
    justifyContent: 'center', // Center the child items vertically
    alignItems: 'center', // Center the child items horizontally
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    zIndex: 1000,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  fallbackControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    gap: 15,
  },
  retryButton: {
    backgroundColor: '#ED4D4E',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  nextButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default AudioScreen;