import { useState, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import TrackPlayer, { State, Event, useTrackPlayerEvents, useProgress } from 'react-native-track-player';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';

const useTrackPlayer = (onTrackLoaded) => {
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [playlist, setPlaylist] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const appState = useRef(AppState.currentState);
  const [appStateVisible, setAppStateVisible] = useState(appState.current);
  const isLoadingNewFile = useRef(false);
  const watchdogIntervalRef = useRef(null);
  const isTransitioning = useRef(false);
  
  const { position, duration } = useProgress();

  const ensureAudioSessionActive = async () => {
    try {
      await Audio.setAudioModeAsync({
        staysActiveInBackground: true,
        interruptionModeIOS: InterruptionModeIOS.DuckOthers,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
        playThroughEarpieceAndroid: false,
      });
      console.log('Audio session reactivated');
    } catch (error) {
      console.error('Error reactivating audio session:', error);
    }
  };

  const startPlaybackWatchdog = () => {
    return setInterval(async () => {
      try {
        const playerState = await TrackPlayer.getState();
        if (playerState === State.Playing) {
          const currentTrackIndex = await TrackPlayer.getCurrentTrack();
          if (currentTrackIndex !== null) {
            const track = await TrackPlayer.getTrack(currentTrackIndex);
            if (track) {
              const position = await TrackPlayer.getPosition();
              const duration = await TrackPlayer.getDuration();
              
              // Check if track has ended
              if (duration > 0 && position >= duration - 1000) {
                console.log('Track ended, advancing to next');
                await goToNextTrack();
              }
            }
          }
        }
      } catch (error) {
        console.error('Watchdog error:', error);
      }
    }, 2000);
  };

  useEffect(() => {
    const setupAudioAndWatchdog = async () => {
      await ensureAudioSessionActive();
      
      // Start the watchdog
      watchdogIntervalRef.current = startPlaybackWatchdog();
    };

    setupAudioAndWatchdog();

    // Clean up function
    return () => {
      if (watchdogIntervalRef.current) {
        clearInterval(watchdogIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to the foreground
        console.log('App moved to foreground, restarting watchdog');
        if (watchdogIntervalRef.current) {
          clearInterval(watchdogIntervalRef.current);
        }
        watchdogIntervalRef.current = startPlaybackWatchdog();
      }
      appState.current = nextAppState;
      setAppStateVisible(nextAppState);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useTrackPlayerEvents([Event.PlaybackTrackChanged, Event.PlaybackState, Event.PlaybackError], async (event) => {
    if (event.type === Event.PlaybackError) {
      console.error('Playback error:', event.error);
      await goToNextTrack();
    } else if (event.type === Event.PlaybackTrackChanged && event.nextTrack !== null) {
      const track = await TrackPlayer.getTrack(event.nextTrack);
      if (track) {
        setCurrentTrack(track);
        onTrackLoaded?.(true);
        console.log('Now playing:', track.title);
      }
    } else if (event.type === Event.PlaybackState) {
      setIsPlaying(event.state === State.Playing);
      
      if (event.state === State.Stopped) {
        console.log('Track stopped');
      }
    }
  });

  const loadTrack = async (trackUrl, trackTitle, shouldPlay = true, startPosition = 0) => {
    if (isLoadingNewFile.current) {
      console.log('Already loading a file, skipping');
      return;
    }

    isLoadingNewFile.current = true;
    setIsLoading(true);

    try {
      await TrackPlayer.reset();
      await TrackPlayer.add({
        id: '1',
        url: trackUrl,
        title: trackTitle,
      });

      if (shouldPlay) {
        await TrackPlayer.play();
        setIsPlaying(true);
      }

      if (startPosition > 0) {
        await TrackPlayer.seekTo(startPosition);
      }

      setCurrentTrack({ url: trackUrl, title: trackTitle });
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading track:', error);
      setIsLoading(false);
    } finally {
      isLoadingNewFile.current = false;
    }
  };

  const loadPlaylist = async (playlistData, startIndex = 0) => {
    setPlaylist(playlistData);
    setCurrentIndex(startIndex);
    
    // Store playlist in AsyncStorage for background service
    await AsyncStorage.setItem('currentPlaylist', JSON.stringify(playlistData));
    await AsyncStorage.setItem('currentIndex', startIndex.toString());
    
    if (playlistData[startIndex]) {
      const track = playlistData[startIndex];
      await loadTrack(track.url, track.title, true, 0);
    }
  };

  const goToNextTrack = async () => {
    if (playlist.length > 0 && currentIndex < playlist.length - 1) {
      const nextIndex = currentIndex + 1;
      const nextTrack = playlist[nextIndex];
      
      console.log('Advancing to next track:', nextTrack.title);
      
      // Set manual navigation flag to prevent interference
      global.setManualNavigation?.(true);
      
      try {
        await loadTrack(nextTrack.url, nextTrack.title, true, 0);
        setCurrentIndex(nextIndex);
        await AsyncStorage.setItem('currentIndex', nextIndex.toString());
      } catch (error) {
        console.error('Error advancing to next track:', error);
      } finally {
        // Clear manual navigation flag after delay
        setTimeout(() => {
          global.setManualNavigation?.(false);
        }, 3000);
      }
    }
  };

  const goToPreviousTrack = async () => {
    if (playlist.length > 0 && currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      const prevTrack = playlist[prevIndex];
      
      console.log('Going to previous track:', prevTrack.title);
      
      // Set manual navigation flag to prevent interference
      global.setManualNavigation?.(true);
      
      try {
        await loadTrack(prevTrack.url, prevTrack.title, true, 0);
        setCurrentIndex(prevIndex);
        await AsyncStorage.setItem('currentIndex', prevIndex.toString());
      } catch (error) {
        console.error('Error going to previous track:', error);
      } finally {
        // Clear manual navigation flag after delay
        setTimeout(() => {
          global.setManualNavigation?.(false);
        }, 3000);
      }
    }
  };

  const togglePlayback = async () => {
    try {
      if (isPlaying) {
        await TrackPlayer.pause();
        setIsPlaying(false);
      } else {
        await TrackPlayer.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error toggling playback:', error);
    }
  };

  const seekTo = async (position) => {
    try {
      await TrackPlayer.seekTo(position);
    } catch (error) {
      console.error('Error seeking:', error);
    }
  };

  const seekForward = async (seconds = 30) => {
    try {
      const currentPosition = await TrackPlayer.getPosition();
      const newPosition = Math.min(currentPosition + (seconds * 1000), duration);
      await TrackPlayer.seekTo(newPosition);
    } catch (error) {
      console.error('Error seeking forward:', error);
    }
  };

  const seekBackward = async (seconds = 15) => {
    try {
      const currentPosition = await TrackPlayer.getPosition();
      const newPosition = Math.max(currentPosition - (seconds * 1000), 0);
      await TrackPlayer.seekTo(newPosition);
    } catch (error) {
      console.error('Error seeking backward:', error);
    }
  };

  const stopPlayback = async () => {
    try {
      await TrackPlayer.stop();
      setIsPlaying(false);
    } catch (error) {
      console.error('Error stopping playback:', error);
    }
  };

  const cleanup = async () => {
    try {
      if (watchdogIntervalRef.current) {
        clearInterval(watchdogIntervalRef.current);
      }
      await TrackPlayer.destroy();
    } catch (error) {
      console.error('Error cleaning up TrackPlayer:', error);
    }
  };

  return {
    // State
    isPlaying,
    isLoading,
    currentTrack,
    playlist,
    currentIndex,
    position,
    duration,
    appStateVisible,
    
    // Actions
    loadTrack,
    loadPlaylist,
    goToNextTrack,
    goToPreviousTrack,
    togglePlayback,
    seekTo,
    seekForward,
    seekBackward,
    stopPlayback,
    cleanup,
    
    // Utilities
    ensureAudioSessionActive,
  };
};

export default useTrackPlayer;
