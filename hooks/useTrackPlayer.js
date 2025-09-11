import { useState, useEffect, useRef, useCallback } from 'react';
import { AppState } from 'react-native';
import TrackPlayer, { State, Event, useTrackPlayerEvents, useProgress } from 'react-native-track-player';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import logger from '../utils/logger';

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
  const lastTrackStartTime = useRef(0);
  const trackLoadMutex = useRef(false);
  const progressIntervalRef = useRef(null);
  
  const { position, duration } = useProgress();

  // Log hook initialization
  useEffect(() => {
    logger.info('useTrackPlayer hook initialized', {
      hasOnTrackLoaded: !!onTrackLoaded,
      initialAppState: appState.current
    }, 'useTrackPlayer');
  }, []);

  const ensureAudioSessionActive = async () => {
    logger.info('Ensuring audio session is active', {}, 'useTrackPlayer');
    try {
      await Audio.setAudioModeAsync({
        staysActiveInBackground: true,
        interruptionModeIOS: InterruptionModeIOS.DuckOthers,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
        playThroughEarpieceAndroid: false,
      });
      logger.info('Audio session reactivated successfully', {}, 'useTrackPlayer');
    } catch (error) {
      logger.error('Error reactivating audio session', { 
        error: error instanceof Error ? error.message : String(error) 
      }, 'useTrackPlayer');
    }
  };

  const startPlaybackWatchdog = () => {
    logger.info('Starting playback watchdog', {}, 'useTrackPlayer');
    
    // Clear any existing progress interval
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    
    return setInterval(async () => {
      try {
        const playerState = await TrackPlayer.getState();
        
        // Check for stopped state which indicates track completion
        if (playerState === State.Stopped) {
          logger.info('Watchdog detected track stopped, attempting to advance', {
            state: playerState,
            appState: appState.current
          }, 'useTrackPlayer');
          await goToNextTrack();
          return;
        }
        
        if (playerState === State.Playing) {
          const currentTrackIndex = await TrackPlayer.getCurrentTrack();
          if (currentTrackIndex !== null) {
            const track = await TrackPlayer.getTrack(currentTrackIndex);
            if (track) {
              const position = await TrackPlayer.getPosition();
              const duration = await TrackPlayer.getDuration();
              
              // Check if track has ended (more lenient threshold)
              // Only advance if we're actually near the end AND have played for at least 10 seconds
              // AND at least 30 seconds have passed since the track started
              const remainingTime = duration - position;
              const timeSinceStart = Date.now() - lastTrackStartTime.current;
              if (duration > 0 && remainingTime <= 2 && position > 10 && timeSinceStart > 30000) {
                logger.info('Watchdog detected track near end, advancing to next', {
                  track: track.title,
                  position,
                  duration,
                  remaining: remainingTime,
                  timeSinceStart
                }, 'useTrackPlayer');
                await goToNextTrack();
              }
            }
          }
        }
      } catch (error) {
        logger.error('Watchdog error', { 
          error: error instanceof Error ? error.message : String(error) 
        }, 'useTrackPlayer');
      }
    }, 3000); // Increased interval to 3 seconds
  };

  useEffect(() => {
    const setupAudioAndWatchdog = async () => {
      logger.info('Setting up audio session and watchdog', {}, 'useTrackPlayer');
      await ensureAudioSessionActive();
      
      // Start the watchdog
      watchdogIntervalRef.current = startPlaybackWatchdog();
    };

    setupAudioAndWatchdog();

    // Clean up function
    return () => {
      logger.info('Cleaning up useTrackPlayer watchdog', {}, 'useTrackPlayer');
      if (watchdogIntervalRef.current) {
        clearInterval(watchdogIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      logger.info('App state changed', { 
        from: appState.current, 
        to: nextAppState 
      }, 'useTrackPlayer');
      
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to the foreground
        logger.info('App moved to foreground, restarting watchdog', {}, 'useTrackPlayer');
        if (watchdogIntervalRef.current) {
          clearInterval(watchdogIntervalRef.current);
        }
        watchdogIntervalRef.current = startPlaybackWatchdog();
      } else if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
        // App is going to background - keep watchdog running for auto-advance
        logger.info('App moved to background, keeping watchdog running for auto-advance', {}, 'useTrackPlayer');
      }
      appState.current = nextAppState;
      setAppStateVisible(nextAppState);
    });

    return () => {
      logger.info('Removing app state listener', {}, 'useTrackPlayer');
      subscription.remove();
    };
  }, []);

  useTrackPlayerEvents([Event.PlaybackTrackChanged, Event.PlaybackState, Event.PlaybackError], async (event) => {
    logger.debug('TrackPlayer event received', { 
      type: event.type, 
      state: event.state,
      nextTrack: event.nextTrack,
      error: event.error
    }, 'useTrackPlayer');
    
    if (event.type === Event.PlaybackError) {
      logger.error('Playback error occurred', { 
        error: event.error 
      }, 'useTrackPlayer');
      await goToNextTrack();
    } else if (event.type === Event.PlaybackTrackChanged && event.nextTrack !== null) {
      const track = await TrackPlayer.getTrack(event.nextTrack);
      if (track) {
        logger.info('Track changed', { 
          track: track.title,
          trackIndex: event.nextTrack
        }, 'useTrackPlayer');
        setCurrentTrack(track);
        onTrackLoaded?.(true);
      }
    } else if (event.type === Event.PlaybackState) {
      const wasPlaying = isPlaying;
      const nowPlaying = event.state === State.Playing;
      setIsPlaying(nowPlaying);
      
      // Only log significant state changes
      if (wasPlaying !== nowPlaying) {
        logger.info('Playback state changed', { 
          from: wasPlaying ? 'playing' : 'paused',
          to: nowPlaying ? 'playing' : 'paused'
        }, 'useTrackPlayer');
      }
      
      if (event.state === State.Stopped) {
        logger.info('Track stopped', {}, 'useTrackPlayer');
      }
    }
  });

  const loadTrack = async (trackUrl, trackTitle, shouldPlay = true, startPosition = 0) => {
    // Preload Mutex Pattern - prevent multiple simultaneous track loads
    if (trackLoadMutex.current) {
      logger.warn('Track load mutex locked, skipping load request', { 
        trackTitle, 
        trackUrl,
        currentMutex: trackLoadMutex.current
      }, 'useTrackPlayer');
      return;
    }

    if (isLoadingNewFile.current) {
      logger.warn('Already loading a file, skipping load request', { 
        trackTitle, 
        trackUrl 
      }, 'useTrackPlayer');
      return;
    }

    // Check if we're already loading the same track
    if (currentTrack && currentTrack.url === trackUrl && isLoading) {
      logger.warn('Same track already loading, skipping duplicate request', { 
        trackTitle, 
        trackUrl 
      }, 'useTrackPlayer');
      return;
    }

    logger.info('Loading track', { 
      trackTitle, 
      trackUrl, 
      shouldPlay, 
      startPosition,
      currentPlaylistIndex: currentIndex,
      playlistLength: playlist.length
    }, 'useTrackPlayer');

    // Acquire mutex
    trackLoadMutex.current = true;
    isLoadingNewFile.current = true;
    setIsLoading(true);

    try {
      await TrackPlayer.reset();
      await TrackPlayer.add({
        id: '1',
        url: trackUrl,
        title: trackTitle,
        artist: 'BKG Audio',
        album: 'Spiritual Discourses',
        genre: 'Spiritual',
        duration: 0, // Will be updated when track loads
      });

      if (shouldPlay) {
        await TrackPlayer.play();
        setIsPlaying(true);
        lastTrackStartTime.current = Date.now();
        logger.info('Track loaded and started playing', { trackTitle }, 'useTrackPlayer');
      } else {
        logger.info('Track loaded but not playing', { trackTitle }, 'useTrackPlayer');
      }

      if (startPosition > 0) {
        await TrackPlayer.seekTo(startPosition);
        logger.info('Track seeked to start position', { 
          trackTitle, 
          startPosition 
        }, 'useTrackPlayer');
      }

      setCurrentTrack({ url: trackUrl, title: trackTitle });
      setIsLoading(false);
    } catch (error) {
      logger.error('Error loading track', { 
        error: error instanceof Error ? error.message : String(error),
        trackTitle,
        trackUrl
      }, 'useTrackPlayer');
      setIsLoading(false);
    } finally {
      // Release mutex
      trackLoadMutex.current = false;
      isLoadingNewFile.current = false;
    }
  };

  const loadPlaylist = useCallback(async (playlistData, startIndex = 0, savedPosition = 0) => {
    // Check if we're already loading the same playlist
    const playlistKey = JSON.stringify(playlistData) + startIndex;
    if (isLoadingNewFile.current) {
      logger.warn('Already loading playlist, skipping duplicate request', { 
        trackCount: playlistData.length, 
        startIndex 
      }, 'useTrackPlayer');
      return;
    }

    logger.info('Loading playlist', { 
      trackCount: playlistData.length, 
      startIndex,
      startTrack: playlistData[startIndex]?.title,
      startTrackUrl: playlistData[startIndex]?.url,
      savedPosition
    }, 'useTrackPlayer');
    
    // Clear any existing stored state to prevent interference
    try {
      await AsyncStorage.removeItem('currentPlaylist');
      await AsyncStorage.removeItem('currentIndex');
      logger.debug('Cleared existing stored playlist state', {}, 'useTrackPlayer');
    } catch (error) {
      logger.error('Error clearing stored playlist state', { 
        error: error instanceof Error ? error.message : String(error) 
      }, 'useTrackPlayer');
    }
    
    setPlaylist(playlistData);
    setCurrentIndex(startIndex);
    
    // Store playlist in AsyncStorage for background service
    try {
      await AsyncStorage.setItem('currentPlaylist', JSON.stringify(playlistData));
      await AsyncStorage.setItem('currentIndex', startIndex.toString());
      logger.debug('Playlist stored in AsyncStorage', { 
        trackCount: playlistData.length, 
        startIndex 
      }, 'useTrackPlayer');
    } catch (error) {
      logger.error('Error storing playlist in AsyncStorage', { 
        error: error instanceof Error ? error.message : String(error) 
      }, 'useTrackPlayer');
    }
    
    if (playlistData[startIndex]) {
      const track = playlistData[startIndex];
      await loadTrack(track.url, track.title, true, savedPosition);
    } else {
      logger.warn('No track found at start index', { 
        startIndex, 
        playlistLength: playlistData.length 
      }, 'useTrackPlayer');
    }
  }, []);

  const goToNextTrack = async () => {
    // Track Transition Protection - prevent multiple simultaneous transitions
    if (isTransitioning.current) {
      logger.warn('Track transition already in progress, skipping duplicate request', {
        currentTransition: isTransitioning.current
      }, 'useTrackPlayer');
      return;
    }

    // Try to get playlist from AsyncStorage if local state is empty (background scenario)
    let currentPlaylist = playlist;
    let currentIdx = currentIndex;
    
    if (currentPlaylist.length === 0) {
      try {
        const storedPlaylist = await AsyncStorage.getItem('currentPlaylist');
        const storedIndex = await AsyncStorage.getItem('currentIndex');
        
        if (storedPlaylist && storedIndex) {
          currentPlaylist = JSON.parse(storedPlaylist);
          currentIdx = parseInt(storedIndex, 10);
          logger.info('Retrieved playlist from storage for auto-advance', {
            playlistLength: currentPlaylist.length,
            currentIndex: currentIdx
          }, 'useTrackPlayer');
        }
      } catch (error) {
        logger.error('Error retrieving playlist from storage', {
          error: error instanceof Error ? error.message : String(error)
        }, 'useTrackPlayer');
      }
    }
    
    if (currentPlaylist.length > 0 && currentIdx < currentPlaylist.length - 1) {
      const nextIndex = currentIdx + 1;
      const nextTrack = currentPlaylist[nextIndex];
      
      // Enhanced getNextFile Robustness - validate next track
      if (!nextTrack || !nextTrack.url || !nextTrack.title) {
        logger.error('Invalid next track found, cannot advance', {
          nextIndex,
          nextTrack,
          playlistLength: currentPlaylist.length
        }, 'useTrackPlayer');
        return;
      }
      
      logger.info('Advancing to next track', { 
        from: currentIdx, 
        to: nextIndex, 
        nextTrack: nextTrack.title,
        playlistLength: currentPlaylist.length
      }, 'useTrackPlayer');
      
      // Set transition flag and manual navigation flag to prevent interference
      isTransitioning.current = true;
      global.setManualNavigation?.(true);
      
      try {
        await loadTrack(nextTrack.url, nextTrack.title, true, 0);
        setCurrentIndex(nextIndex);
        await AsyncStorage.setItem('currentIndex', nextIndex.toString());
        logger.info('Successfully advanced to next track', { 
          newIndex: nextIndex, 
          track: nextTrack.title 
        }, 'useTrackPlayer');
      } catch (error) {
        logger.error('Error advancing to next track', { 
          error: error instanceof Error ? error.message : String(error),
          nextIndex,
          nextTrack: nextTrack.title
        }, 'useTrackPlayer');
      } finally {
        // Clear transition flag and manual navigation flag after delay
        isTransitioning.current = false;
        setTimeout(() => {
          global.setManualNavigation?.(false);
        }, 3000);
      }
    } else {
      logger.info('Cannot advance to next track', { 
        currentIndex: currentIdx, 
        playlistLength: currentPlaylist.length,
        hasStoredPlaylist: currentPlaylist.length > 0
      }, 'useTrackPlayer');
    }
  };

  const goToPreviousTrack = async () => {
    if (playlist.length > 0 && currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      const prevTrack = playlist[prevIndex];
      
      logger.info('Going to previous track', { 
        from: currentIndex, 
        to: prevIndex, 
        prevTrack: prevTrack.title 
      }, 'useTrackPlayer');
      
      // Set manual navigation flag to prevent interference
      global.setManualNavigation?.(true);
      
      try {
        await loadTrack(prevTrack.url, prevTrack.title, true, 0);
        setCurrentIndex(prevIndex);
        await AsyncStorage.setItem('currentIndex', prevIndex.toString());
        logger.info('Successfully went to previous track', { 
          newIndex: prevIndex, 
          track: prevTrack.title 
        }, 'useTrackPlayer');
      } catch (error) {
        logger.error('Error going to previous track', { 
          error: error instanceof Error ? error.message : String(error),
          prevIndex,
          prevTrack: prevTrack.title
        }, 'useTrackPlayer');
      } finally {
        // Clear transition flag and manual navigation flag after delay
        isTransitioning.current = false;
        setTimeout(() => {
          global.setManualNavigation?.(false);
        }, 3000);
      }
    } else {
      logger.info('Cannot go to previous track', { 
        currentIndex, 
        playlistLength: playlist.length 
      }, 'useTrackPlayer');
    }
  };

  const togglePlayback = async () => {
    logger.info('Toggling playback', { 
      currentState: isPlaying ? 'playing' : 'paused' 
    }, 'useTrackPlayer');
    
    try {
      if (isPlaying) {
        await TrackPlayer.pause();
        setIsPlaying(false);
        logger.info('Playback paused', {}, 'useTrackPlayer');
      } else {
        await TrackPlayer.play();
        setIsPlaying(true);
        logger.info('Playback started', {}, 'useTrackPlayer');
      }
    } catch (error) {
      logger.error('Error toggling playback', { 
        error: error instanceof Error ? error.message : String(error),
        wasPlaying: isPlaying
      }, 'useTrackPlayer');
    }
  };

  const seekTo = async (position) => {
    logger.info('Seeking to position', { position }, 'useTrackPlayer');
    try {
      await TrackPlayer.seekTo(position);
      logger.info('Seek completed', { position }, 'useTrackPlayer');
    } catch (error) {
      logger.error('Error seeking to position', { 
        error: error instanceof Error ? error.message : String(error),
        position
      }, 'useTrackPlayer');
    }
  };

  const seekForward = async (seconds = 30) => {
    logger.info('Seeking forward', { seconds }, 'useTrackPlayer');
    try {
      const currentPosition = await TrackPlayer.getPosition();
      const newPosition = Math.min(currentPosition + seconds, duration);
      await TrackPlayer.seekTo(newPosition);
      logger.info('Seek forward completed', { 
        from: currentPosition, 
        to: newPosition, 
        seconds 
      }, 'useTrackPlayer');
    } catch (error) {
      logger.error('Error seeking forward', { 
        error: error instanceof Error ? error.message : String(error),
        seconds
      }, 'useTrackPlayer');
    }
  };

  const seekBackward = async (seconds = 15) => {
    logger.info('Seeking backward', { seconds }, 'useTrackPlayer');
    try {
      const currentPosition = await TrackPlayer.getPosition();
      const newPosition = Math.max(currentPosition - seconds, 0);
      await TrackPlayer.seekTo(newPosition);
      logger.info('Seek backward completed', { 
        from: currentPosition, 
        to: newPosition, 
        seconds 
      }, 'useTrackPlayer');
    } catch (error) {
      logger.error('Error seeking backward', { 
        error: error instanceof Error ? error.message : String(error),
        seconds
      }, 'useTrackPlayer');
    }
  };

  const stopPlayback = async () => {
    logger.info('Stopping playback', {}, 'useTrackPlayer');
    try {
      await TrackPlayer.stop();
      setIsPlaying(false);
      logger.info('Playback stopped', {}, 'useTrackPlayer');
    } catch (error) {
      logger.error('Error stopping playback', { 
        error: error instanceof Error ? error.message : String(error) 
      }, 'useTrackPlayer');
    }
  };

  const cleanup = async () => {
    logger.info('Cleaning up TrackPlayer', {}, 'useTrackPlayer');
    try {
      // Clear all intervals
      if (watchdogIntervalRef.current) {
        clearInterval(watchdogIntervalRef.current);
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      
      // Reset all flags
      trackLoadMutex.current = false;
      isTransitioning.current = false;
      isLoadingNewFile.current = false;
      
      await TrackPlayer.destroy();
      logger.info('TrackPlayer cleanup completed', {}, 'useTrackPlayer');
    } catch (error) {
      logger.error('Error cleaning up TrackPlayer', { 
        error: error instanceof Error ? error.message : String(error) 
      }, 'useTrackPlayer');
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
