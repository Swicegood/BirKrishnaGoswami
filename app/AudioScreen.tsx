import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio, InterruptionModeIOS } from "expo-av";
import { getAllFiles, getRandomFile, getPreviousFile, getNextFile } from './api/apiWrapper';
import { debounce } from 'lodash';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';


const { width: screenWidth } = Dimensions.get("window");

const AudioScreen = () => {
  const file = useLocalSearchParams<{ url: string, title: string }>();
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState(null);
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);  
  const isLoadingNewFile = useRef(false);
  const [playState, setPlayState] = useState('idle');
  const [playNext, setPlayNext] = useState(false);
  const [isSoundLoading, setIsSoundLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const muteSound = async () => {
    if (!sound) {
      return;
    }
  
    try {
      setIsMuted(!isMuted);
      await sound.setVolumeAsync(isMuted ? 1 : 0);
    } catch (error) {
      console.error(error);
    }
  };

  const seekBackward = async () => {
    if (sound) {
      const playbackStatus = await sound.getStatusAsync();
      const newPosition = Math.max(playbackStatus.positionMillis - 15000, 0);
      await sound.setPositionAsync(newPosition);
    }
  };

  const seekForward = async () => {
    if (sound) {
      const playbackStatus = await sound.getStatusAsync();
      const newPosition = Math.min(
        playbackStatus.positionMillis + 30000,
        playbackStatus.durationMillis
      );
      await sound.setPositionAsync(newPosition);
    }
  };


  const loadFile = async (fileUrl: string) => {
    try {
      if (playState === 'loading' || isSoundLoading) return;
  
      setPlayState('loading');
      setIsSoundLoading(true);
  
      if (sound) {
        await sound.unloadAsync();
      }
  
      setUrl(fileUrl); // Set the url to the new fileUrl
    } catch (error) {
      console.error(error);
      // Handle the error as needed, e.g., set an error state or show a message to the user
    }
  };


  const debouncedLoadPreviousFile = useRef(debounce(async () => {
    if (isLoadingNewFile.current) return;
    isLoadingNewFile.current = true;
   
    const previousFile = await getPreviousFile();
    if (previousFile !== 0) {
      await loadFile(previousFile);
    }

    isLoadingNewFile.current = false;
  }, 1000));
  
 
  const debouncedLoadNextFile = useRef(debounce(async () => {
    if (isLoadingNewFile.current) return;
    isLoadingNewFile.current = true;
    const nextFile = await getNextFile();
    console.log("nextfile", nextFile)
    await loadFile(nextFile);

    isLoadingNewFile.current = false;
  }, 1000));


// Initial song loading
useEffect(() => {
  const loadLastSong = async () => {
    let songUrl = null;
    let lastPosition = 0;

    songUrl = file.url;

    if (songUrl) {
      setUrl(songUrl);
    } 
  };

  loadLastSong();
}, []);

// Song changing
useEffect(() => {
  if (!url) {
    return;
  }

  const loadSound = async () => {
 
    setIsSoundLoading(true);
  
    let songUrl = url;
    let lastPosition = 0;

    // Try to get the last song and position from AsyncStorage
    try {
      if (isFirstLoad) {
        const lastSongPosition = await AsyncStorage.getItem('lastSongPosition');
        if (lastSongPosition) {
          lastPosition = Number(lastSongPosition);
        }
        setIsFirstLoad(false); // Set isFirstLoad to false after using it
      }
    } catch (error) {
      console.error('Failed to load the last song and position from AsyncStorage:', error);
    }

    if (sound) {
      await sound.unloadAsync();
    }

    try {
      await Audio.setAudioModeAsync({
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: true,
        allowsRecordingIOS: true,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        playsInSilentModeIOS: true,
      });
    } catch (error) {
      console.log('Error setting audio mode:', error);
    }
  
    const { sound: newSound, status } = await Audio.Sound.createAsync(
      { uri: songUrl },
      { shouldPlay: true, staysActiveInBackground: true, positionMillis: lastPosition }
    );

    setSound(newSound);
    setIsPlaying(true);
    setPlayState('playing');
    setIsLoading(false);
  
    newSound.setOnPlaybackStatusUpdate(async (playbackStatus) => {
      if (playbackStatus.didJustFinish) {
        setPlayNext(true);
      }
  
      try {
        await AsyncStorage.setItem('lastSongUrl', songUrl);
        await AsyncStorage.setItem('lastSongPosition', playbackStatus.positionMillis.toString());
      } catch (error) {
        console.error('Failed to save the current song and position to AsyncStorage:', error);
      }
    });
  
    setIsSoundLoading(false);
  };
  
  loadSound();

}, [url]);

useFocusEffect(
  useCallback(() => {
    // This function runs when the screen comes into focus.
    // If you need to do something when the screen comes into focus, do it here.

    return () => {
      // This function runs when the screen goes out of focus.
      // Unload the sound here.
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]) // Include `sound` in the dependency array if it could change over time.
);

// ...


useEffect(() => {
  if (playNext) {
    debouncedLoadNextFile.current();
    setPlayNext(false);
  }
}, [playNext]);






  
  const togglePlayback = async () => {
    if (isPlaying) {
      await sound.pauseAsync();
      setIsPlaying(false);
    } else {
      await sound.playAsync();
      setIsPlaying(true);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.musicContainer}>
        <ActivityIndicator size="large" color="#C68446" />
      </View>
    );
  }
  
  return (
    <View style={styles.musicContainer}>
        <Image
        source={require('../assets/images/sample.png')} // Replace with your image path
        style={styles.backgroundImage}
      />
      <View style={styles.overlay}>
      <View style={styles.content}>
      <View style={{ flex: 1 }} /> 
      <Text style={styles.title}>{file.title.toUpperCase()}</Text>
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={styles.muteButton}
          onPress={muteSound}
          disabled={!sound}
        >
          <Text style={styles.buttonText}>Mute</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.seekBackwardButton}
          onPress={seekBackward}
          disabled={!sound}
        >
          <Text style={styles.buttonText}>-15s</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={togglePlayback}
          disabled={!sound}
        >
          <Text style={styles.buttonText}>{isPlaying ? "Pause" : "Play"}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.seekForwardButton}
          onPress={seekForward}
          disabled={!sound}
        >
          <Text style={styles.buttonText}>+30s</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.downloadButton}
          onPress={togglePlayback}
          disabled={!sound}
        >
          <Text style={styles.buttonText}>DL</Text>
        </TouchableOpacity>
      </View>
      </View>
      </View>
    </View>
  );
};


const styles = StyleSheet.create({
    musicContainer: {
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
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Dark overlay for better text visibility
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
        marginBottom: 60,
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
    button: {
      backgroundColor: "#C68446",
      justifyContent: "center",
      alignItems: "center",
      padding: 10,
      borderRadius: 50,
      width: 80,
      height: 80,
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
        backgroundColor: "#C68446",
        justifyContent: "center",
        alignItems: "center",
        padding: 5,
        borderRadius: 50,
        width: 60,
        height: 60,
        position: "relative",
    },
    downloadButton: {
        backgroundColor: "#C68446",
        justifyContent: "center",
        alignItems: "center",
        padding: 5,
        borderRadius: 50,
        width: 60,
        height: 60,
        position: "relative",
    },
    seekBackwardButton: {
      backgroundColor: "#C68446",
      justifyContent: "center",
      alignItems: "center",
      padding: 5,
      borderRadius: 50,
      width: 60,
      height: 60,
      position: "relative",
    },
    seekForwardButton: {
      backgroundColor: "#C68446",
      justifyContent: "center",
      alignItems: "center",
      padding: 5,
      borderRadius: 50,
      width: 60,
      height: 60,
      position: "relative",
    },
  
  });
  
export default AudioScreen;