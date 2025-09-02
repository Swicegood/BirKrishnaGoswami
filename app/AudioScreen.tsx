import React, { useState, useEffect, useRef, useCallback } from "react";
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
import { useNavigation } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import * as Progress from 'react-native-progress';
import AsyncStorage from '@react-native-async-storage/async-storage';
import GuageView from '../components/GuageView';
import useIsMobileWeb from '../hooks/useIsMobileWeb';
import * as Clipboard from 'expo-clipboard';
import useTrackPlayer from '../hooks/useTrackPlayer';

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
  const file = useLocalSearchParams<{ 
    url: string, 
    title: string, 
    playlist?: string, 
    currentIndex?: string,
    category?: string 
  }>();
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isFileDownloaded, setIsFileDownloaded] = useState(false);
  // State to hold the list of played songs and their positions
  const [playedSongs, setPlayedSongs] = useState<any[]>([]);
  const [orientation, setOrientation] = useState(Dimensions.get('window').width > Dimensions.get('window').height ? 'LANDSCAPE' : 'PORTRAIT');
  const [width, setWidth] = useState(Dimensions.get('window').width);
  const isMobileWeb = useIsMobileWeb();
  const lastStorageUpdateRef = useRef(0);

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
  } = useTrackPlayer(() => {
    console.log('Track loaded successfully');
  });

  const onSetWidth = (width: number) => {
    console.log('QuoteScreen width: ', width);
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
      handleOrientationChange();
    } else {
      setOrientation(orientation);
    }
  };

  const shareAudioLink = async (url: string) => {
    try {
      const result = await Share.share({
        message: 'Check out this cool video on YouTube!',
        url: url  // Replace VIDEO_ID with the actual ID
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // Shared with activity type of result.activityType
          console.log('Shared with', result.activityType);
        } else {
          // Shared
          console.log('Shared successfully!');
        }
      } else if (result.action === Share.dismissedAction) {
        // Dismissed
        console.log('Share dismissed');
      }
    } catch (error) {
      console.error('Error sharing YouTube video:', error);
    }
  };


  const mailAudioLink = async (url: string) => {
    if (navigator.share) {
      // Web Share API is supported
      try {
        await navigator.share({
          title: 'Check out this audio file',
          text: 'I thought you might be interested in this audio file.',
          url: url
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Web Share API is not supported, fallback to clipboard
      try {
        await Clipboard.setStringAsync(url);
        Alert.alert(
          'Link Copied',
          "The audio link has been copied to your clipboard. You can now paste it wherever you'd like to share it.",
          [{ text: 'OK' }]
        );
      } catch (error) {
        console.error('Failed to copy text: ', error);
        Alert.alert('Error', 'Failed to copy the link. Please try again.');
      }
    }
  };


  const shareAudioFile = async (fileUri: string) => {
    console.log('Sharing audio file:', fileUri);
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
          console.log('Shared with', result.activityType);
        } else {
          // Shared
          console.log('Shared successfully!');
        }
      } else if (result.action === Share.dismissedAction) {
        // Dismissed
        console.log('Share dismissed');
      }
    } catch (error) {
      console.error('Error sharing audio file:', error);
    }
  };


  const muteSound = async () => {
    try {
      setIsMuted(!isMuted);
      // Note: TrackPlayer doesn't have volume control in this implementation
      // You can add volume control if needed
    } catch (error) {
      console.error(error);
    }
  };

  const getStoredPostion = (file: any) => {
    const playedSong = playedSongs.find((playedSong) => playedSong.song.title === file.title);
    return playedSong ? playedSong.position : 0;
  };


  useEffect(() => {
    const songUrl = file.url;
    // Load the track using TrackPlayer
    if (songUrl) {
      loadTrack(songUrl, file.title, true, 0);
    }
  }, [file.url, file.title]);

  // Initialize playlist from parameters or fetch from category
  useEffect(() => {
    const initializePlaylist = async () => {
      if (file.playlist) {
        // Use provided playlist
        const playlistData = JSON.parse(file.playlist);
        const startIndex = parseInt(file.currentIndex || '0');
        await loadPlaylist(playlistData, startIndex);
      } else if (file.category) {
        // Fetch all files from the same category
        try {
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
          
          // Sort alphabetically by title for consistent ordering
          categoryFiles.sort((a: any, b: any) => a.title.localeCompare(b.title));
          
          // Find current track index
          const currentIdx = categoryFiles.findIndex((track: any) => track.url === file.url);
          const startIndex = currentIdx >= 0 ? currentIdx : 0;
          
          await loadPlaylist(categoryFiles, startIndex);
          
          console.log('Playlist initialized:', {
            totalTracks: categoryFiles.length,
            currentIndex: startIndex,
            currentTrack: file.title,
            category: file.category,
            tracks: categoryFiles.map((t: any) => t.title)
          });
        } catch (error) {
          console.error('Error fetching playlist:', error);
        }
      }
    };

    initializePlaylist();
  }, [file.playlist, file.currentIndex, file.category, file.url, loadPlaylist]);



  // Track loading is now handled by the useTrackPlayer hook

  const fileRef = useRef(file);
  const playlistRef = useRef(playlist);
  const currentIndexRef = useRef(currentIndex);

  useEffect(() => {
    fileRef.current = file;
    playlistRef.current = playlist;
    currentIndexRef.current = currentIndex;
  }, [file, playlist, currentIndex]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        if (soundRef.current) {
          console.log('Unloading sound', fileRef.current.title);
          const unloadSound = async () => {
            try {
              const status = await soundRef.current.getStatusAsync();
              console.log('status:', status);
              const newSong = { song: fileRef.current, position: status.positionMillis };

              // Retrieve the current playedSongs from AsyncStorage
              const jsonValue = await AsyncStorage.getItem('@playedSongs');
              let playedSongs = jsonValue != null ? JSON.parse(jsonValue) : [];

              // Append the new song
              playedSongs.push(newSong);

              // Store the updated playedSongs back to AsyncStorage
              await AsyncStorage.setItem('@playedSongs', JSON.stringify(playedSongs));

              console.log('New played songs:', playedSongs);
            } catch (error) {
              console.error('Error unloading sound:', error);
            }
            await soundRef.current.unloadAsync();
          };
          unloadSound();
        }
      };
    }, []) // Empty dependency array
  );

  useEffect(() => {
    console.log('Played songs:', playedSongs);
  }, [playedSongs]);

  useEffect(() => {
    const restorePosition = async () => {
      if (isFirstLoad) {
        const position = getStoredPostion(file);
        if (position) {
          setPosition(position);
          if (sound) {
            await sound.setPositionAsync(position);
            setIsFirstLoad(false);
          }
        }
      }
    };
    restorePosition();
  }, [file]);


  useEffect(() => {
    const loadPlayedSongs = async () => {
      try {
        const jsonValue = await AsyncStorage.getItem('@playedSongs');
        if (jsonValue !== null) {
          const newPlayedSongs = JSON.parse(jsonValue);
          if (JSON.stringify(newPlayedSongs) !== JSON.stringify(playedSongs)) {
            setPlayedSongs(newPlayedSongs);
          }
        }
      } catch (e) {
        // error reading value
        console.log(e);
      }
    };

    loadPlayedSongs();
  }, []);

  const updateState = throttle(async (status: any) => {
    setPosition(status.positionMillis);
    setLastPosition(status.positionMillis);
    
    // Log only important events
    if (status.didJustFinish) {
      console.log('didJustFinish detected in updateState');
    }
    
    // Check if track just finished
    if (status.didJustFinish && playlist.length > 0 && currentIndex < playlist.length - 1) {
      console.log('Track finished, auto-advancing to next track');
      handleTrackCompletion();
      return;
    }
    
    // Alternative approach: Check if we're very close to the end
    if (status.isLoaded && status.durationMillis && status.positionMillis) {
      const remainingTime = status.durationMillis - status.positionMillis;
      if (remainingTime <= 1000 && remainingTime > 0 && playlist.length > 0 && currentIndex < playlist.length - 1) {
        console.log('Track nearly finished (< 1s remaining), auto-advancing to next track');
        handleTrackCompletion();
        return;
      }
    }
    
    // Fallback: Check if position hasn't changed and we're near the end
    if (status.isLoaded && status.durationMillis && status.positionMillis) {
      const progressPercent = (status.positionMillis / status.durationMillis) * 100;
      if (progressPercent > 98 && !isPlaying && playlist.length > 0 && currentIndex < playlist.length - 1) {
        console.log('Track appears completed (>98% and not playing), auto-advancing');
        handleTrackCompletion();
        return;
      }
    }
    
    // Compare to the value in our ref instead of state
    const lastUpdate = lastStorageUpdateRef.current;
    if (Math.abs(status.positionMillis - lastUpdate) >= 30000) {
      try {
        const jsonValue = await AsyncStorage.getItem('@playedSongs');
        let playedSongs = jsonValue ? JSON.parse(jsonValue) : [];
        
        // Update or add the current song
        const songIndex = playedSongs.findIndex(
          (song) => song.song.title === file.title
        );
        
        const newSong = { song: file, position: status.positionMillis };
        
        if (songIndex !== -1) {
          playedSongs[songIndex] = newSong;
        } else {
          playedSongs.push(newSong);
        }
        
        await AsyncStorage.setItem('@playedSongs', JSON.stringify(playedSongs));

        // 3. Update the ref immediately
        lastStorageUpdateRef.current = status.positionMillis;

        console.log('Position saved to storage:', status.positionMillis);
      } catch (error) {
        console.error('Error saving position to storage:', error);
      }
    }
  }, 1000);

  useEffect(() => {
    // Set up periodic check for track completion as a fallback
    const interval = setInterval(async () => {
      if (playlist.length > 0 && currentIndex < playlist.length - 1) {
        try {
          const status = await sound.getStatusAsync();
          if (status.isLoaded && status.durationMillis && status.positionMillis) {
            const remainingTime = status.durationMillis - status.positionMillis;
            const progressPercent = (status.positionMillis / status.durationMillis) * 100;
            
            // Check if track is essentially complete
            if ((remainingTime <= 500 || progressPercent > 99) && status.positionMillis > 0) {
              console.log('Periodic check detected track completion, auto-advancing');
              handleTrackCompletion();
            }
          }
        } catch (error) {
          console.log('Error in periodic completion check:', error);
        }
      }
    }, 2000); // Check every 2 seconds

    // Cleanup function
    return () => {
      clearInterval(interval);
      if (sound) {
        sound.setOnPlaybackStatusUpdate(null);
      }
      updateState.cancel(); // Cancel any scheduled execution of updateState when the component unmounts
    };
  }, [playlist, currentIndex]); // Removed 'sound' from dependency array


  const handleTrackCompletion = async () => {
    if (playlist.length > 0 && currentIndex < playlist.length - 1) {
      goToNextTrack();
    }
  };





  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };




  const getImageHeight = () => {
    if (isTablet() || Platform.OS === 'web') {
      if (orientation === 'LANDSCAPE') {
        if (isMobileWeb) {
          return width * 0.1;
        }
        return width * 0.3;
      }
      return width * 0.4;
    }
    return orientation === 'LANDSCAPE' ? 160 : 260;
  }

  const getImageWidth = () => {
    if (isTablet() || Platform.OS === 'web') {
      return getImageHeight() * 4 / 3;
    }
    return width;
  }

  if (isLoading) {
    return (
      <View style={styles.musicContainer}>
        <ActivityIndicator size="large" color="#ED4D4E" />
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
                    <TouchableOpacity onPress={() => file.url && mailAudioLink(file.url)}>
                      <Entypo name="share" size={26} color="orange" fontWeight='bold' />
                    </TouchableOpacity>
                  ) : (
                    Platform.OS === 'web' ? (
                      <TouchableOpacity onPress={() => file.url && mailAudioLink(file.url)}>
                        <Entypo name="share" size={26} color="orange" fontWeight='bold' />
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity onPress={() => file.url && shareAudioLink(file.url)}>
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
              <Text style={styles.title}>{file.title.toUpperCase().replace('_', ' ')}</Text>
              {playlist.length > 1 && (
                <Text style={styles.trackIndicator}>
                  Track {currentIndex + 1} of {playlist.length}
                </Text>
              )}
              <Slider
                style={styles.slider}
                thumbTintColor="#FFFFFF" // Color of the knob
                minimumTrackTintColor="#FFF" // Color of the used track
                maximumTrackTintColor="#808080" // Color of the unused track
                value={position}
                maximumValue={duration}
                onSlidingComplete={async (value) => {
                  if (sound) {
                    await sound.setPositionAsync(value);
                  }
                }}
              />
              <View style={styles.timeContainer}>
                <Text style={styles.title}>{formatTime(position)}</Text>
                <Text style={styles.title}>{formatTime(duration)}</Text>
              </View>
              <View style={styles.buttonsContainer}>
                <TouchableOpacity
                  style={styles.muteButton}
                  onPress={muteSound}
                  disabled={!sound}
                >
                  <Icon name={isMuted ? "volume-off" : "volume-up"} size={40} color="#FFF" />
                </TouchableOpacity>
                {playlist.length > 1 && currentIndex > 0 && (
                  <TouchableOpacity
                    style={styles.trackNavButton}
                    onPress={goToPreviousTrack}
                    disabled={!sound}
                  >
                    <Icon name="skip-previous" size={40} color="#FFF" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.seekBackwardButton}
                  onPress={seekBackward}
                  disabled={!sound}
                >
                  <ReplayIcon />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.button}
                  onPress={togglePlayback}
                  disabled={!sound}
                >
                  <Icon name={isPlaying ? "pause" : "play-arrow"} size={40} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.seekForwardButton}
                  onPress={seekForward}
                  disabled={!sound}
                >
                  <ForwardIcon />
                </TouchableOpacity>
                {playlist.length > 1 && currentIndex < playlist.length - 1 && (
                  <TouchableOpacity
                    style={styles.trackNavButton}
                    onPress={goToNextTrack}
                    disabled={!sound}
                  >
                    <Icon name="skip-next" size={40} color="#FFF" />
                  </TouchableOpacity>
                )}
                {Platform.OS !== 'android' && (
                  Platform.OS === 'web' ? (
                    <TouchableOpacity
                      style={styles.downloadButton}
                      onPress={async () => {
                        if (isFileDownloaded) {
                          Alert.alert('Downloaded', 'This file is already downloaded');
                          return;
                        }
                        try {
                          setDownloadProgress(0);
                          // Fetch the file through the proxy
                          const response = await fetch(PROXY_URL + url);
                          const contentLength = response.headers.get('Content-Length');
                          const total = parseInt(contentLength, 10);
                          let loaded = 0;

                          const reader = response.body.getReader();
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
                          link.download = `${file.title}.mp3`;

                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);

                          window.URL.revokeObjectURL(blobUrl);

                          setIsFileDownloaded(true);
                          setDownloadProgress(1);
                        } catch (error) {
                          console.error('Download failed:', error);
                          Alert.alert('Download Failed', 'There was an error downloading the file.');
                          setDownloadProgress(0);
                        }
                      }}
                      disabled={!sound}
                    >
                      <Icon name="get-app" size={40} color="#FFF" />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.downloadButton}
                      onPress={async () => {
                        if (isFileDownloaded) {
                          Alert.alert('Downloaded', 'This file is already downloaded');
                          shareAudioFile(`${FileSystem.cacheDirectory}${file.title}.mp3`);
                          return;
                        }
                        // Check if external storage is available and accessible
                        const fileUri = `${FileSystem.cacheDirectory}${file.title}.mp3`;

                        const downloadResumable = FileSystem.createDownloadResumable(
                          url,
                          fileUri,
                          {},
                          (downloadProgress) => {
                            const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
                            console.log(`Download progress: ${progress * 100}%`);
                            setDownloadProgress(progress);
                          }
                        );

                        try {
                          const { uri } = await downloadResumable.downloadAsync();
                          console.log('Finished downloading to ', uri);
                          Alert.alert('Download Complete', `Finished downloading to ${uri}`);
                          setIsFileDownloaded(true);
                        } catch (e) {
                          console.error(e);
                        }
                      }}
                      disabled={!sound}
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
    color: '#CCCCCC',
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
});

export default AudioScreen;