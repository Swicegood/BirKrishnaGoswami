import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Share,
  ImageBackground
} from "react-native";
import { Audio, InterruptionModeIOS } from "expo-av";
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import Slider from '@react-native-community/slider';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ForwardIcon from '../components/ForwardIcon';
import ReplayIcon from "../components/ReplayIcon";
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Entypo from '@expo/vector-icons/Entypo';
import { useNavigation } from '@react-navigation/native';


const { width: screenWidth } = Dimensions.get("window");

const AudioScreen = () => {
  const navigation = useNavigation();
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
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  const shareAudioLink = async (url) => {
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


  useEffect(() => {
    const songUrl = file.url;
    setUrl(file.url);
  }, []);



  // Song changing
  useEffect(() => {
    if (!url) {
      return;
    }
    const loadSound = async () => {

      setIsSoundLoading(true);

      const songUrl = url;
      const lastPosition = 0;


      try {
        await Audio.setAudioModeAsync({
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
          allowsRecordingIOS: false,
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
      setDuration(status.durationMillis);
      setIsLoading(false);
      updateState


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



  useEffect(() => {
    if (sound) {
      sound.setOnPlaybackStatusUpdate(updateState);
    }

    return () => {
      if (sound) {
        sound.setOnPlaybackStatusUpdate(null);
      }
    };
  }, [sound]);

  const updateState = (status) => {
    setPosition(status.positionMillis);
    // ...
  };


  const formatTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };


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
        <ActivityIndicator size="large" color="#ED4D4E" />
      </View>
    );
  }

  return (
    <ImageBackground
      source={require('../assets/images/1798742_10202693562240691_5596557541863920908_njpg.png')} // Replace with your image path
      style={styles.backgroundImage}
    >

        <View style={styles.musicContainer}>

          <View style={styles.overlay}>
            <View style={styles.header}>
              {navigation.canGoBack() && (
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.leftItem}>
                  <FontAwesome name="angle-left" size={32} color="white" />
                </TouchableOpacity>
              )}

              <View style={styles.rightItem}>
                <View style={styles.circle}>
                  <TouchableOpacity onPress={() => shareAudioLink(file.url)}>
                    <Entypo name="share" size={26} color="orange" fontWeight='bold' />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            <View style={styles.content}>
              <View style={{ flex: 1 }} />
              <Text style={styles.title}>{file.title.toUpperCase().replace('_', ' ')}</Text>
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
                <TouchableOpacity
                  style={styles.downloadButton}
                  onPress={togglePlayback}
                  disabled={!sound}
                >
                  <Icon name="get-app" size={40} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
    </ImageBackground>
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
  },
  slider: {
    width: screenWidth * 0.9, // Set the width as needed
    height: 40, // Set the height as needed
    thumbTouchSize: { height: 10, width: 10, backgroundColor: '#000000' },
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