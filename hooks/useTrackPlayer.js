import { useState, useEffect, useRef, useCallback } from 'react';
import { AppState } from 'react-native';
import TrackPlayer, { State, Event, useTrackPlayerEvents, useProgress } from 'react-native-track-player';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import logger from '../utils/logger';

const DEFAULT_ARTIST = 'BKG Audio';
const DEFAULT_ALBUM = 'Spiritual Discourses';
const DEFAULT_GENRE = 'Spiritual';
const LOG_SCOPE = 'useTrackPlayer';

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
  const hasAutoPlayedOnce = useRef(false);
  const lastMetadataDurationRef = useRef(0);
  
  const buildTrackPlayerEntry = (track, index) => {
    if (!track || !track.url) {
      return null;
    }

    const normalizedDuration =
      typeof track.duration === 'number' && track.duration > 0
        ? track.duration
        : typeof track.estimatedDuration === 'number' && track.estimatedDuration > 0
          ? track.estimatedDuration
          : 1;
    
    return {
      id: track.id ?? `track-${index}-${track.url}`,
      url: track.url,
      title: track.title ?? `Track ${index + 1}`,
      artist: track.artist ?? DEFAULT_ARTIST,
      album: track.album ?? DEFAULT_ALBUM,
      genre: track.genre ?? DEFAULT_GENRE,
      duration: normalizedDuration,
      artwork: track.artwork,
    };
  };
  
  const { position, duration } = useProgress();

  // Log hook initialization
  useEffect(() => {
    logger.info('useTrackPlayer hook initialized', {
      hasOnTrackLoaded: !!onTrackLoaded,
      initialAppState: appState.current
    }, 'useTrackPlayer');
  }, []);

  const ensureAudioSessionActive = useCallback(async () => {
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
  }, []);

  const startPlaybackWatchdog = () => {
    logger.info('Starting playback watchdog', {}, 'useTrackPlayer');
    
    // Clear any existing watchdog first
    if (watchdogIntervalRef.current) {
      clearInterval(watchdogIntervalRef.current);
    }
    
    watchdogIntervalRef.current = setInterval(async () => {
      try {
        const playerState = await TrackPlayer.getState();
        if (playerState === State.Ready && !hasAutoPlayedOnce.current) {
          logger.info('Player ready but not playing, attempting to resume (first load only)', {}, 'useTrackPlayer');
          await ensureAudioSessionActive();
          await TrackPlayer.play();
          hasAutoPlayedOnce.current = true;
        } else if (playerState === State.Ready) {
          logger.info('Player ready but not auto-resuming (not first load)', {}, 'useTrackPlayer');
        }
      } catch (error) {
        logger.error('Error in playback watchdog', { 
          error: error instanceof Error ? error.message : String(error) 
        }, 'useTrackPlayer');
      }
    }, 5000); // Check every 5 seconds
    
    return watchdogIntervalRef.current;
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
    // Reset duration cache whenever the active track changes
    lastMetadataDurationRef.current = 0;
  }, [currentTrack?.id]);

  useEffect(() => {
    if (!currentTrack) {
      return;
    }
    if (typeof duration !== 'number' || duration <= 1) {
      return;
    }

    const roundedDuration = Math.round(duration);
    if (roundedDuration <= 1 || lastMetadataDurationRef.current === roundedDuration) {
      return;
    }

    lastMetadataDurationRef.current = roundedDuration;

    const trackIdentifier = (
      currentTrack.id ??
      (typeof currentIndex === 'number' ? currentIndex : currentTrack.url ?? 'current-track')
    ).toString();

    (async () => {
      try {
        await TrackPlayer.updateMetadataForTrack(trackIdentifier, {
          ...currentTrack,
          duration: roundedDuration,
        });
        logger.info('Updated now playing metadata with measured duration', {
          trackId: trackIdentifier,
          duration: roundedDuration,
        }, LOG_SCOPE);
      } catch (metadataError) {
        logger.warn('Failed to update metadata with measured duration', {
          error: metadataError instanceof Error ? metadataError.message : String(metadataError),
          trackId: trackIdentifier,
        }, LOG_SCOPE);
      }
    })();
  }, [currentTrack, currentIndex, duration]);

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

  useTrackPlayerEvents([Event.PlaybackTrackChanged, Event.PlaybackState, Event.PlaybackError, Event.PlaybackQueueEnded], async (event) => {
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
      try {
        const track = await TrackPlayer.getTrack(event.nextTrack);
        if (track) {
          logger.info('Track changed', { 
            track: track.title,
            trackIndex: event.nextTrack
          }, 'useTrackPlayer');
          setCurrentTrack(track);
          onTrackLoaded?.(true);
        }
      } catch (error) {
        logger.error('Error retrieving track after change', { 
          error: error instanceof Error ? error.message : String(error) 
        }, 'useTrackPlayer');
      }
      
      try {
        const activeIndex = await TrackPlayer.getCurrentTrack();
        if (typeof activeIndex === 'number') {
          setCurrentIndex(activeIndex);
          await AsyncStorage.setItem('currentIndex', activeIndex.toString());
        }
      } catch (error) {
        logger.error('Error updating current index after track change', { 
          error: error instanceof Error ? error.message : String(error) 
        }, 'useTrackPlayer');
      }
    } else if (event.type === Event.PlaybackQueueEnded) {
      logger.info('Playback queue ended', {
        currentIndex,
        playlistLength: playlist.length
      }, 'useTrackPlayer');
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

  const logPlaybackDiagnostics = useCallback(async (contextLabel = 'diagnostics') => {
    try {
      const [state, queue, currentIdx] = await Promise.all([
        TrackPlayer.getState(),
        TrackPlayer.getQueue(),
        TrackPlayer.getCurrentTrack(),
      ]);
      const activeTrack = typeof currentIdx === 'number'
        ? await TrackPlayer.getTrack(currentIdx)
        : null;

      logger.info('TrackPlayer diagnostics snapshot', {
        context: contextLabel,
        state,
        queueLength: queue.length,
        currentIndex: currentIdx,
        currentTrackTitle: activeTrack?.title || null,
        currentTrackDuration: activeTrack?.duration || null,
      }, LOG_SCOPE);
    } catch (diagError) {
      logger.error('Failed to capture TrackPlayer diagnostics', {
        context: contextLabel,
        error: diagError instanceof Error ? diagError.message : String(diagError),
      }, LOG_SCOPE);
    }
  }, []);

  const loadPlaylist = useCallback(async (playlistData, startIndex = 0, savedPosition = 0, shouldPlay = true) => {
    if (!Array.isArray(playlistData) || playlistData.length === 0) {
      logger.warn('Attempted to load empty playlist', {}, 'useTrackPlayer');
      return;
    }
    
    if (trackLoadMutex.current) {
      logger.warn('Track load mutex locked, skipping playlist request', { startIndex }, 'useTrackPlayer');
      return;
    }
    
    if (isLoadingNewFile.current) {
      logger.warn('Already loading audio, skipping playlist request', { startIndex }, 'useTrackPlayer');
      return;
    }
    
    logger.info('Loading playlist into TrackPlayer queue', { 
      trackCount: playlistData.length, 
      startIndex,
      startTrack: playlistData[startIndex]?.title,
      savedPosition,
      shouldPlay
    }, 'useTrackPlayer');
    
    const normalizedQueue = playlistData
      .map((track, index) => {
        const entry = buildTrackPlayerEntry(track, index);
        if (!entry) {
          logger.error('Invalid track encountered while building queue', { index, track }, 'useTrackPlayer');
        }
        return entry;
      })
      .filter(Boolean);
    
    if (normalizedQueue.length === 0) {
      logger.error('No valid tracks available to enqueue', { playlistLength: playlistData.length }, 'useTrackPlayer');
      return;
    }
    
    const safeStartIndex = Math.min(Math.max(startIndex, 0), normalizedQueue.length - 1);
    const selectedTrack = normalizedQueue[safeStartIndex];
    
    // Acquire mutex
    trackLoadMutex.current = true;
    isLoadingNewFile.current = true;
    setIsLoading(true);
    
    const loadingTimeout = setTimeout(() => {
      if (isLoadingNewFile.current) {
        logger.error('Playlist loading timeout - forcing completion', { timeout: '15 seconds' }, 'useTrackPlayer');
        setIsLoading(false);
        isLoadingNewFile.current = false;
        trackLoadMutex.current = false;
        setCurrentTrack(selectedTrack);
        onTrackLoaded?.(true);
      }
    }, 15000);
    
    try {
      setPlaylist(playlistData);
      setCurrentIndex(safeStartIndex);
      
      try {
        await AsyncStorage.setItem('currentPlaylist', JSON.stringify(playlistData));
        await AsyncStorage.setItem('currentIndex', safeStartIndex.toString());
        logger.debug('Playlist stored in AsyncStorage', { 
          trackCount: playlistData.length, 
          startIndex: safeStartIndex 
        }, 'useTrackPlayer');
      } catch (error) {
        logger.error('Error storing playlist in AsyncStorage', { 
          error: error instanceof Error ? error.message : String(error) 
        }, 'useTrackPlayer');
      }
      
      await TrackPlayer.reset();
      await TrackPlayer.add(normalizedQueue);

      try {
        const queueSnapshot = await TrackPlayer.getQueue();
        logger.info('TrackPlayer queue hydrated', {
          queueLength: queueSnapshot.length,
          firstTrack: queueSnapshot[0]?.title,
          startIndex: safeStartIndex,
          requestedTrack: selectedTrack.title,
        }, LOG_SCOPE);
      } catch (queueError) {
        logger.error('Unable to inspect TrackPlayer queue after load', {
          error: queueError instanceof Error ? queueError.message : String(queueError),
        }, LOG_SCOPE);
      }

      await TrackPlayer.skip(selectedTrack.id);
      await logPlaybackDiagnostics('post-skip');

      try {
        await TrackPlayer.updateMetadataForTrack(selectedTrack.id, selectedTrack);
        logger.info('Now playing metadata primed for first track', {
          trackId: selectedTrack.id,
          title: selectedTrack.title,
        }, LOG_SCOPE);
      } catch (metadataError) {
        logger.warn('Failed to prime lock-screen metadata for first track', {
          error: metadataError instanceof Error ? metadataError.message : String(metadataError),
          trackId: selectedTrack.id,
        }, LOG_SCOPE);
      }
      await logPlaybackDiagnostics('post-metadata');
      
      if (savedPosition > 0) {
        await TrackPlayer.seekTo(savedPosition);
        logger.info('Playlist seeked to saved position', { 
          startTrack: selectedTrack.title, 
          savedPosition 
        }, 'useTrackPlayer');
      }
      
      if (shouldPlay) {
        await ensureAudioSessionActive();
        await TrackPlayer.play();
        setIsPlaying(true);
        lastTrackStartTime.current = Date.now();
        logger.info('Playlist started playback', { 
          startTrack: selectedTrack.title, 
          startIndex: safeStartIndex 
        }, 'useTrackPlayer');
        await logPlaybackDiagnostics('post-play');
      } else {
        setIsPlaying(false);
        logger.info('Playlist loaded without playback', { startTrack: selectedTrack.title }, 'useTrackPlayer');
      }
      
      setCurrentTrack(selectedTrack);
      setIsLoading(false);
      clearTimeout(loadingTimeout);
      onTrackLoaded?.(true);
    } catch (error) {
      logger.error('Error loading playlist queue', { 
        error: error instanceof Error ? error.message : String(error),
        startIndex: safeStartIndex
      }, 'useTrackPlayer');
      clearTimeout(loadingTimeout);
      setIsLoading(false);
      setCurrentTrack(selectedTrack);
      onTrackLoaded?.(true);
    } finally {
      trackLoadMutex.current = false;
      isLoadingNewFile.current = false;
    }
  }, [ensureAudioSessionActive, onTrackLoaded]);

  const loadTrack = useCallback(async (trackUrl, trackTitle, shouldPlay = true, startPosition = 0) => {
    if (!trackUrl) {
      logger.warn('Attempted to load track without URL', { trackTitle }, LOG_SCOPE);
      return;
    }

    await loadPlaylist(
      [{
        title: trackTitle,
        url: trackUrl,
        artist: DEFAULT_ARTIST,
        album: DEFAULT_ALBUM,
        genre: DEFAULT_GENRE,
      }],
      0,
      startPosition,
      shouldPlay
    );
  }, [loadPlaylist]);

  const goToNextTrack = async () => {
    if (isTransitioning.current) {
      logger.warn('Track transition already in progress, skipping next request', {}, 'useTrackPlayer');
      return;
    }
    
    isTransitioning.current = true;
    global.setManualNavigation?.(true);
    
    try {
      await TrackPlayer.skipToNext();
      await ensureAudioSessionActive();
      await TrackPlayer.play();
      
      const nextIndex = await TrackPlayer.getCurrentTrack();
      if (typeof nextIndex === 'number') {
        setCurrentIndex(nextIndex);
        try {
          await AsyncStorage.setItem('currentIndex', nextIndex.toString());
        } catch (error) {
          logger.error('Error storing next index', { 
            error: error instanceof Error ? error.message : String(error) 
          }, 'useTrackPlayer');
        }
        
        try {
          const track = await TrackPlayer.getTrack(nextIndex);
          if (track) {
            setCurrentTrack(track);
          } else if (playlist[nextIndex]) {
            setCurrentTrack(playlist[nextIndex]);
          }
          logger.info('Successfully advanced to next track', { 
            newIndex: nextIndex, 
            trackTitle: track?.title || playlist[nextIndex]?.title 
          }, 'useTrackPlayer');
        } catch (trackError) {
          logger.error('Error retrieving next track metadata', { 
            error: trackError instanceof Error ? trackError.message : String(trackError) 
          }, 'useTrackPlayer');
        }
      }
    } catch (error) {
      logger.error('Error skipping to next track', { 
        error: error instanceof Error ? error.message : String(error) 
      }, 'useTrackPlayer');
    } finally {
      isTransitioning.current = false;
      setTimeout(() => {
        global.setManualNavigation?.(false);
      }, 3000);
    }
  };

  const goToPreviousTrack = async () => {
    if (isTransitioning.current) {
      logger.warn('Track transition already in progress, skipping previous request', {}, 'useTrackPlayer');
      return;
    }
    
    isTransitioning.current = true;
    global.setManualNavigation?.(true);
    
    try {
      await TrackPlayer.skipToPrevious();
      await ensureAudioSessionActive();
      await TrackPlayer.play();
      
      const prevIndex = await TrackPlayer.getCurrentTrack();
      if (typeof prevIndex === 'number') {
        setCurrentIndex(prevIndex);
        try {
          await AsyncStorage.setItem('currentIndex', prevIndex.toString());
        } catch (error) {
          logger.error('Error storing previous index', { 
            error: error instanceof Error ? error.message : String(error) 
          }, 'useTrackPlayer');
        }
        
        try {
          const track = await TrackPlayer.getTrack(prevIndex);
          if (track) {
            setCurrentTrack(track);
          } else if (playlist[prevIndex]) {
            setCurrentTrack(playlist[prevIndex]);
          }
          logger.info('Successfully went to previous track', { 
            newIndex: prevIndex, 
            trackTitle: track?.title || playlist[prevIndex]?.title 
          }, 'useTrackPlayer');
        } catch (trackError) {
          logger.error('Error retrieving previous track metadata', { 
            error: trackError instanceof Error ? trackError.message : String(trackError) 
          }, 'useTrackPlayer');
        }
      }
    } catch (error) {
      logger.error('Error skipping to previous track', { 
        error: error instanceof Error ? error.message : String(error) 
      }, 'useTrackPlayer');
    } finally {
      isTransitioning.current = false;
      setTimeout(() => {
        global.setManualNavigation?.(false);
      }, 3000);
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
