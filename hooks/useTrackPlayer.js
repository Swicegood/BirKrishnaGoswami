import { useState, useEffect, useRef, useCallback } from 'react';
import { AppState, Platform } from 'react-native';
import TrackPlayer, {
  Event,
  PlaybackState,
  PlayerCommand,
  useProgress,
} from '@rntp/player';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import logger from '../utils/logger';

const DEFAULT_ARTIST = 'BKG Audio';
const DEFAULT_ALBUM = 'Spiritual Discourses';
const DEFAULT_GENRE = 'Spiritual';
const LOG_SCOPE = 'useTrackPlayer';

const useTrackPlayer = (onTrackLoaded) => {
  const isWeb = Platform.OS === 'web';
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [playlist, setPlaylist] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const webAudioRef = useRef(null);
  const [webPosition, setWebPosition] = useState(0);
  const [webDuration, setWebDuration] = useState(0);
  
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
  const diagnosticsRunCounterRef = useRef(0);
  const playlistLoadCounterRef = useRef(0);
  const appStateTransitionCounterRef = useRef(0);
  const pendingPlaybackCleanupTimeoutRef = useRef(null);
  const pendingPlaybackRef = useRef(null);
  const activePlaylistLoadIdRef = useRef(null);
  const goToNextTrackRef = useRef(null);

  const logPlaybackDiagnostics = useCallback(async (contextLabel = 'diagnostics', extraFields = {}) => {
    if (isWeb) {
      logger.debug('Skipping TrackPlayer diagnostics on web', { context: contextLabel, ...extraFields }, LOG_SCOPE);
      return;
    }
    diagnosticsRunCounterRef.current += 1;
    const runId = diagnosticsRunCounterRef.current;
    try {
      const state = TrackPlayer.getPlaybackState();
      const queue = TrackPlayer.getQueue();
      const currentIdx = TrackPlayer.getActiveMediaItemIndex();
      const activeTrack = TrackPlayer.getActiveMediaItem();
      const pendingSnapshot = pendingPlaybackRef.current
        ? {
            pendingPlaylistLoadId: pendingPlaybackRef.current.playlistLoadId,
            pendingStage: pendingPlaybackRef.current.stage ?? null,
            pendingTrackTitle: pendingPlaybackRef.current.trackTitle ?? null,
            pendingAgeMs: Date.now() - (pendingPlaybackRef.current.requestedAt ?? Date.now()),
            pendingAppStateAtRequest: pendingPlaybackRef.current.appStateAtRequest ?? null,
            pendingMetadataPrimedAt: pendingPlaybackRef.current.metadataPrimedAt ?? null,
            pendingPlayRequestedAt: pendingPlaybackRef.current.playRequestedAt ?? null,
            pendingPlayResolvedAt: pendingPlaybackRef.current.playResolvedAt ?? null,
            pendingPlaybackConfirmedAt: pendingPlaybackRef.current.playbackConfirmedAt ?? null,
            pendingSavedPosition: pendingPlaybackRef.current.savedPosition ?? null,
            pendingShouldPlay: pendingPlaybackRef.current.shouldPlay ?? null,
            pendingLastKnownState: pendingPlaybackRef.current.lastKnownState ?? null,
          }
        : {};

      logger.info('TrackPlayer diagnostics snapshot', {
        context: contextLabel,
        runId,
        state,
        isPlaying: TrackPlayer.isPlaying(),
        queueLength: queue.length,
        currentIndex: currentIdx,
        currentTrackTitle: activeTrack?.title || null,
        currentTrackDuration: activeTrack?.duration || null,
        activePlaylistLoadId: activePlaylistLoadIdRef.current,
        appState: appState.current,
        ...pendingSnapshot,
        ...extraFields,
      }, LOG_SCOPE);
    } catch (diagError) {
      logger.error('Failed to capture TrackPlayer diagnostics', {
        context: contextLabel,
        runId,
        error: diagError instanceof Error ? diagError.message : String(diagError),
        ...extraFields,
      }, LOG_SCOPE);
    }
  }, []);

  const buildTrackPlayerEntry = (track, index) => {
    if (!track || !track.url) {
      return null;
    }

    const normalizedDuration =
      typeof track.duration === 'number' && track.duration > 0
        ? track.duration
        : typeof track.estimatedDuration === 'number' && track.estimatedDuration > 0
          ? track.estimatedDuration
          : undefined;
    
    return {
      mediaId: String(track.id ?? `track-${index}-${track.url}`),
      url: track.url,
      title: track.title ?? `Track ${index + 1}`,
      artist: track.artist ?? DEFAULT_ARTIST,
      albumTitle: track.album ?? track.albumTitle ?? DEFAULT_ALBUM,
      genre: track.genre ?? DEFAULT_GENRE,
      duration: normalizedDuration,
      artworkUrl: track.artwork ?? track.artworkUrl,
    };
  };
  
  const { position, duration } = useProgress();

  useEffect(() => {
    logger.info('useTrackPlayer hook initialized', {
      hasOnTrackLoaded: !!onTrackLoaded,
      initialAppState: appState.current
    }, 'useTrackPlayer');
  }, []);

  const configureRemoteCapabilities = useCallback(() => {
    if (isWeb) {
      return;
    }
    try {
      TrackPlayer.setCommands({
        capabilities: [
          PlayerCommand.PlayPause,
          PlayerCommand.Next,
          PlayerCommand.Previous,
          PlayerCommand.Seek,
        ],
      });
      logger.info('Reapplied remote capabilities', {}, LOG_SCOPE);
    } catch (error) {
      logger.error('Failed to reapply remote capabilities', {
        error: error instanceof Error ? error.message : String(error)
      }, LOG_SCOPE);
    }
  }, [isWeb]);

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

  const startPlaybackWatchdog = useCallback(() => {
    if (isWeb) {
      logger.debug('Skipping playback watchdog on web', {}, 'useTrackPlayer');
      return null;
    }
    logger.info('Starting playback watchdog', {}, 'useTrackPlayer');
    
    if (watchdogIntervalRef.current) {
      clearInterval(watchdogIntervalRef.current);
    }
    
    watchdogIntervalRef.current = setInterval(() => {
      try {
        const playerState = TrackPlayer.getPlaybackState();
        const playing = TrackPlayer.isPlaying();
        if (playerState === PlaybackState.Ready && !playing && !hasAutoPlayedOnce.current) {
          logger.info('Player ready but not playing, attempting to resume (first load only)', {}, 'useTrackPlayer');
          ensureAudioSessionActive();
          TrackPlayer.play();
          hasAutoPlayedOnce.current = true;
        } else if (playerState === PlaybackState.Ready && !playing) {
          logger.info('Player ready but not auto-resuming (not first load)', {}, 'useTrackPlayer');
        }
      } catch (error) {
        logger.error('Error in playback watchdog', { 
          error: error instanceof Error ? error.message : String(error) 
        }, 'useTrackPlayer');
      }
    }, 5000);
    
    return watchdogIntervalRef.current;
  }, [ensureAudioSessionActive, isWeb]);

  const logPendingPlaybackState = useCallback((contextLabel = 'pending-playback', extraFields = {}) => {
    const snapshot = pendingPlaybackRef.current;
    if (!snapshot) {
      logger.info('Pending playback state snapshot (none)', {
        context: contextLabel,
        currentAppState: appState.current,
        ...extraFields,
      }, LOG_SCOPE);
      return;
    }

    const ageMs = Date.now() - (snapshot.requestedAt ?? Date.now());
    logger.info('Pending playback state snapshot', {
      context: contextLabel,
      currentAppState: appState.current,
      ageMs,
      ...snapshot,
      ...extraFields,
    }, LOG_SCOPE);
  }, []);

  const clearPendingPlaybackContext = useCallback((reason = 'unspecified', extraFields = {}) => {
    if (!pendingPlaybackRef.current) {
      logger.info('No pending playback context to clear', { reason, ...extraFields }, LOG_SCOPE);
      return;
    }

    if (pendingPlaybackCleanupTimeoutRef.current) {
      clearTimeout(pendingPlaybackCleanupTimeoutRef.current);
      pendingPlaybackCleanupTimeoutRef.current = null;
    }

    logger.info('Clearing pending playback context', {
      reason,
      currentAppState: appState.current,
      playlistLoadId: pendingPlaybackRef.current.playlistLoadId,
      trackId: pendingPlaybackRef.current.trackId,
      trackTitle: pendingPlaybackRef.current.trackTitle,
      stage: pendingPlaybackRef.current.stage,
      ...extraFields,
    }, LOG_SCOPE);
    pendingPlaybackRef.current = null;
  }, []);

  useEffect(() => {
    const setupAudioAndWatchdog = async () => {
      logger.info('Setting up audio session and watchdog', {}, 'useTrackPlayer');
      await ensureAudioSessionActive();
      watchdogIntervalRef.current = startPlaybackWatchdog();
    };

    setupAudioAndWatchdog();

    return () => {
      logger.info('Cleaning up useTrackPlayer watchdog', {}, 'useTrackPlayer');
      if (watchdogIntervalRef.current) {
        clearInterval(watchdogIntervalRef.current);
      }
    };
  }, [ensureAudioSessionActive, startPlaybackWatchdog]);

  useEffect(() => {
    lastMetadataDurationRef.current = 0;
  }, [currentTrack?.mediaId, currentTrack?.id, currentTrack?.url]);

  useEffect(() => {
    if (isWeb || !currentTrack) {
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

    const trackIdentifier = typeof currentIndex === 'number' ? currentIndex : null;
    if (trackIdentifier === null) {
      logger.warn('Cannot update metadata - no valid numeric track identifier', {
        currentIndex,
        trackId: currentTrack?.mediaId ?? currentTrack?.id,
      }, LOG_SCOPE);
      return;
    }

    try {
      TrackPlayer.updateMetadata(trackIdentifier, {
        title: currentTrack?.title || 'Unknown Track',
        artist: currentTrack?.artist || DEFAULT_ARTIST,
        albumTitle: currentTrack?.albumTitle || currentTrack?.album || DEFAULT_ALBUM,
        artworkUrl: currentTrack?.artworkUrl || currentTrack?.artwork,
      });
      logger.info('Updated now playing metadata with measured duration', {
        trackIndex: trackIdentifier,
        duration: roundedDuration,
        title: currentTrack?.title,
      }, LOG_SCOPE);
    } catch (metadataError) {
      logger.warn('Failed to update metadata with measured duration', {
        error: metadataError instanceof Error ? metadataError.message : String(metadataError),
        trackIndex: trackIdentifier,
      }, LOG_SCOPE);
    }
  }, [currentTrack, currentIndex, duration, isWeb]);

  useEffect(() => {
    logPlaybackDiagnostics('hook-mounted').catch(() => {});
  }, [logPlaybackDiagnostics]);

  useEffect(() => {
    const handleAppStateChange = async (nextAppState) => {
      appStateTransitionCounterRef.current += 1;
      const transitionId = appStateTransitionCounterRef.current;
      logger.info('App state changed', { 
        from: appState.current, 
        to: nextAppState,
        transitionId,
      }, LOG_SCOPE);
      
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        logger.info('App moved to foreground, restarting watchdog', { transitionId }, LOG_SCOPE);
        if (watchdogIntervalRef.current) {
          clearInterval(watchdogIntervalRef.current);
        }
        watchdogIntervalRef.current = startPlaybackWatchdog();
        configureRemoteCapabilities();
        logPendingPlaybackState('appstate-active', { transitionId });
        logPlaybackDiagnostics('appstate-active', { transitionId }).catch(() => {});
      } else if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
        logger.info('App moved to background/inactive', { transitionId }, LOG_SCOPE);
        logPendingPlaybackState(`appstate-${nextAppState}`, { transitionId });
        logPlaybackDiagnostics(`appstate-${nextAppState}`, { transitionId }).catch(() => {});
      }
      appState.current = nextAppState;
      setAppStateVisible(nextAppState);
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      logger.info('Removing app state listener', {}, LOG_SCOPE);
      subscription.remove();
    };
  }, [logPlaybackDiagnostics, startPlaybackWatchdog, logPendingPlaybackState, configureRemoteCapabilities]);

  useEffect(() => {
    return () => {
      if (pendingPlaybackCleanupTimeoutRef.current) {
        clearTimeout(pendingPlaybackCleanupTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    configureRemoteCapabilities();
  }, [playlist?.length, configureRemoteCapabilities]);

  useEffect(() => {
    if (isWeb) {
      return;
    }

    const mediaItemSub = TrackPlayer.addEventListener(Event.MediaItemTransition, ({ item, index }) => {
      logger.debug('TrackPlayer event received', {
        type: Event.MediaItemTransition,
        index,
        title: item?.title,
        activePlaylistLoadId: activePlaylistLoadIdRef.current,
      }, 'useTrackPlayer');

      if (item) {
        logger.info('Track changed', {
          track: item.title,
          trackIndex: index,
        }, 'useTrackPlayer');
        setCurrentTrack(item);
        onTrackLoaded?.(true);
      }

      if (typeof index === 'number') {
        setCurrentIndex(index);
        AsyncStorage.setItem('currentIndex', index.toString()).catch((error) => {
          logger.error('Error updating current index after track change', {
            error: error instanceof Error ? error.message : String(error),
          }, 'useTrackPlayer');
        });
      }
    });

    const playbackStateSub = TrackPlayer.addEventListener(Event.PlaybackStateChanged, ({ state }) => {
      logger.debug('TrackPlayer event received', {
        type: Event.PlaybackStateChanged,
        state,
        activePlaylistLoadId: activePlaylistLoadIdRef.current,
      }, 'useTrackPlayer');

      if (pendingPlaybackRef.current && pendingPlaybackRef.current.playlistLoadId === activePlaylistLoadIdRef.current) {
        pendingPlaybackRef.current.lastKnownState = state;
        pendingPlaybackRef.current.lastStateAt = Date.now();
      }

      if (state === PlaybackState.Ended) {
        logger.info('Playback queue ended', {
          currentIndex,
          playlistLength: playlist.length,
        }, 'useTrackPlayer');
      }
    });

    const isPlayingSub = TrackPlayer.addEventListener(Event.IsPlayingChanged, ({ playing }) => {
      setIsPlaying((wasPlaying) => {
        if (wasPlaying !== playing) {
          logger.info('Playback state changed', {
            from: wasPlaying ? 'playing' : 'paused',
            to: playing ? 'playing' : 'paused',
          }, 'useTrackPlayer');
        }
        return playing;
      });

      if (pendingPlaybackRef.current && pendingPlaybackRef.current.playlistLoadId === activePlaylistLoadIdRef.current) {
        pendingPlaybackRef.current.lastKnownState = playing ? 'playing' : 'not-playing';
        pendingPlaybackRef.current.lastStateAt = Date.now();
        if (playing) {
          pendingPlaybackRef.current.stage = 'state-playing';
          pendingPlaybackRef.current.playbackConfirmedAt = Date.now();
          logPendingPlaybackState('state-playing', { playlistLoadId: pendingPlaybackRef.current.playlistLoadId });
        }
      }
    });

    const errorSub = TrackPlayer.addEventListener(Event.PlaybackError, async ({ code, message }) => {
      logger.error('Playback error occurred', {
        error: message,
        code,
      }, 'useTrackPlayer');
      await goToNextTrackRef.current?.();
    });

    return () => {
      mediaItemSub.remove();
      playbackStateSub.remove();
      isPlayingSub.remove();
      errorSub.remove();
    };
  }, [isWeb, onTrackLoaded, currentIndex, playlist.length, logPendingPlaybackState]);

  
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

    const playlistLoadId = ++playlistLoadCounterRef.current;

    logger.info('Loading playlist into TrackPlayer queue', { 
      trackCount: playlistData.length, 
      startIndex,
      startTrack: playlistData[startIndex]?.title,
      savedPosition,
      shouldPlay,
      playlistLoadId,
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
      logger.error('No valid tracks available to enqueue', { playlistLength: playlistData.length, playlistLoadId }, 'useTrackPlayer');
      return;
    }

    const safeStartIndex = Math.min(Math.max(startIndex, 0), normalizedQueue.length - 1);
    const selectedTrack = normalizedQueue[safeStartIndex];
    if (pendingPlaybackCleanupTimeoutRef.current) {
      clearTimeout(pendingPlaybackCleanupTimeoutRef.current);
      pendingPlaybackCleanupTimeoutRef.current = null;
    }

    activePlaylistLoadIdRef.current = playlistLoadId;
    pendingPlaybackRef.current = {
      playlistLoadId,
      trackId: selectedTrack.mediaId,
      trackTitle: selectedTrack.title,
      stage: shouldPlay ? 'initializing-playback' : 'initialized-no-play',
      requestedAt: Date.now(),
      appStateAtRequest: appState.current,
      shouldPlay, 
      savedPosition,
      metadataPrimedAt: null,
      playRequestedAt: null,
      playResolvedAt: null,
      playbackConfirmedAt: null,
      lastKnownState: null,
      lastStateAt: null,
    };
    logPendingPlaybackState('playlist-load-start', { playlistLoadId });

    trackLoadMutex.current = true;
    isLoadingNewFile.current = true;
    setIsLoading(true);

    const loadingTimeout = setTimeout(() => {
      if (isLoadingNewFile.current) {
        logger.error('Playlist loading timeout - forcing completion', { timeout: '15 seconds', playlistLoadId }, 'useTrackPlayer');
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
          startIndex: safeStartIndex,
          playlistLoadId,
        }, 'useTrackPlayer');
      } catch (error) {
        logger.error('Error storing playlist in AsyncStorage', { 
          error: error instanceof Error ? error.message : String(error) 
        }, 'useTrackPlayer');
      }

      if (isWeb) {
        try {
          if (webAudioRef.current) {
            try {
              webAudioRef.current.pause();
            } catch (_) {}
          }
          const WebAudioCtor = (typeof window !== 'undefined' && window.Audio) ? window.Audio : (typeof globalThis !== 'undefined' ? globalThis.Audio : null);
          if (!WebAudioCtor) {
            throw new Error('HTML5 Audio API not available');
          }
          const audio = new WebAudioCtor(selectedTrack.url);
          audio.preload = 'metadata';
          audio.onloadedmetadata = () => {
            const d = isFinite(audio.duration) ? audio.duration : 0;
            setWebDuration(d);
            logger.info('Web audio loaded metadata', { duration: d, playlistLoadId }, LOG_SCOPE);
          };
          audio.ontimeupdate = () => {
            setWebPosition(audio.currentTime || 0);
          };
          audio.onended = () => {
            setIsPlaying(false);
          };
          audio.onerror = (e) => {
            logger.error('Web audio error', { error: `${audio.error?.code ?? 'unknown'}`, playlistLoadId }, LOG_SCOPE);
          };
          webAudioRef.current = audio;
          if (savedPosition > 0) {
            audio.currentTime = savedPosition;
            setWebPosition(savedPosition);
            logger.info('Web audio seeked to saved position', { savedPosition, playlistLoadId }, LOG_SCOPE);
          }
          if (shouldPlay) {
            try {
              await audio.play();
              setIsPlaying(true);
              logger.info('Web audio started', { playlistLoadId }, LOG_SCOPE);
            } catch (playErr) {
              logger.error('Web audio play() failed (likely autoplay blocked)', { error: String(playErr) }, LOG_SCOPE);
              setIsPlaying(false);
            }
          } else {
            setIsPlaying(false);
          }
        } finally {
          setCurrentTrack(selectedTrack);
          setIsLoading(false);
          clearTimeout(loadingTimeout);
          onTrackLoaded?.(true);
          clearPendingPlaybackContext('web-skip-trackplayer', { playlistLoadId });
          logger.info('Web platform: completed web audio queue setup', { playlistLoadId }, LOG_SCOPE);
        }
        return;
      }

      await logPlaybackDiagnostics('pre-set-media-items', { playlistLoadId, startIndex: safeStartIndex, trackCount: normalizedQueue.length });
      TrackPlayer.setMediaItems(normalizedQueue, safeStartIndex);
      await logPlaybackDiagnostics('post-set-media-items', { playlistLoadId, queueLength: normalizedQueue.length });
      configureRemoteCapabilities();

      try {
        const queueSnapshot = TrackPlayer.getQueue();
        logger.info('TrackPlayer queue hydrated', {
          queueLength: queueSnapshot.length,
          firstTrack: queueSnapshot[0]?.title,
          startIndex: safeStartIndex,
          requestedTrack: selectedTrack.title,
          playlistLoadId,
        }, LOG_SCOPE);
      } catch (queueError) {
        logger.error('Unable to inspect TrackPlayer queue after load', {
          error: queueError instanceof Error ? queueError.message : String(queueError),
          playlistLoadId,
        }, LOG_SCOPE);
      }

      if (pendingPlaybackRef.current?.playlistLoadId === playlistLoadId) {
        pendingPlaybackRef.current.stage = 'track-selected';
      }
      logPendingPlaybackState('post-set-media-items', { playlistLoadId });
      try {
        const activeIndexAfterSkip = TrackPlayer.getActiveMediaItemIndex();
        logger.info('Verified current track after queue load', {
          requestedIndex: safeStartIndex,
          activeIndexAfterSkip,
          requestedTitle: selectedTrack.title,
          playlistLoadId,
        }, LOG_SCOPE);
      } catch {}
      await logPlaybackDiagnostics('post-skip', { playlistLoadId, selectedTrackIndex: safeStartIndex });

      try {
        const normalizedTrack = normalizedQueue[safeStartIndex];
        if (normalizedTrack) {
          TrackPlayer.updateMetadata(safeStartIndex, {
            title: normalizedTrack.title,
            artist: normalizedTrack.artist,
            albumTitle: normalizedTrack.albumTitle,
            artworkUrl: normalizedTrack.artworkUrl,
          });
          if (pendingPlaybackRef.current?.playlistLoadId === playlistLoadId) {
            pendingPlaybackRef.current.stage = 'metadata-primed';
            pendingPlaybackRef.current.metadataPrimedAt = Date.now();
          }
          logger.info('Now playing metadata primed for first track', {
            trackIndex: safeStartIndex,
            title: normalizedTrack.title,
            artist: normalizedTrack.artist,
            album: normalizedTrack.albumTitle,
            playlistLoadId,
          }, LOG_SCOPE);
        }
      } catch (metadataError) {
        logger.warn('Failed to prime lock-screen metadata for first track', {
          error: metadataError instanceof Error ? metadataError.message : String(metadataError),
          trackIndex: safeStartIndex,
          playlistLoadId,
        }, LOG_SCOPE);
        logPendingPlaybackState('metadata-primed', { playlistLoadId });
      }
      await logPlaybackDiagnostics('post-metadata', { playlistLoadId, selectedTrackIndex: safeStartIndex });
      
      if (savedPosition > 0) {
        TrackPlayer.seekTo(savedPosition);
        logger.info('Playlist seeked to saved position', { 
          startTrack: selectedTrack.title, 
          savedPosition,
          playlistLoadId,
        }, 'useTrackPlayer');
        if (pendingPlaybackRef.current?.playlistLoadId === playlistLoadId) {
          pendingPlaybackRef.current.stage = 'position-restored';
        }
        logPendingPlaybackState('position-restored', { playlistLoadId });
      }

      if (shouldPlay) {
        if (pendingPlaybackRef.current?.playlistLoadId === playlistLoadId) {
          pendingPlaybackRef.current.stage = 'play-requested';
          pendingPlaybackRef.current.playRequestedAt = Date.now();
        }
        logPendingPlaybackState('pre-play', { playlistLoadId });
        await ensureAudioSessionActive();
        TrackPlayer.play();
        if (pendingPlaybackRef.current?.playlistLoadId === playlistLoadId) {
          pendingPlaybackRef.current.stage = 'play-resolved';
          pendingPlaybackRef.current.playResolvedAt = Date.now();
        }
        setIsPlaying(true);
        lastTrackStartTime.current = Date.now();
        logger.info('Playlist started playback', { 
          startTrack: selectedTrack.title, 
          startIndex: safeStartIndex,
          playlistLoadId,
        }, 'useTrackPlayer');
        logPendingPlaybackState('post-play', { playlistLoadId });
        if (pendingPlaybackCleanupTimeoutRef.current) {
          clearTimeout(pendingPlaybackCleanupTimeoutRef.current);
        }
        pendingPlaybackCleanupTimeoutRef.current = setTimeout(() => {
          clearPendingPlaybackContext('post-play-auto-clean', { playlistLoadId });
        }, 20000);
        await logPlaybackDiagnostics('post-play', { playlistLoadId, selectedTrackId: selectedTrack.mediaId });
      } else {
        setIsPlaying(false);
        logger.info('Playlist loaded without playback', { startTrack: selectedTrack.title, playlistLoadId }, 'useTrackPlayer');
        logPendingPlaybackState('playlist-loaded-without-play', { playlistLoadId });
        clearPendingPlaybackContext('playlist-loaded-without-play', { playlistLoadId });
      }
      
      setCurrentTrack(selectedTrack);
      setIsLoading(false);
      clearTimeout(loadingTimeout);
      onTrackLoaded?.(true);
    } catch (error) {
      logger.error('Error loading playlist queue', { 
        error: error instanceof Error ? error.message : String(error),
        startIndex: safeStartIndex,
        playlistLoadId,
      }, 'useTrackPlayer');
      logPendingPlaybackState('playlist-load-error', { playlistLoadId });
      clearPendingPlaybackContext('playlist-load-error', { playlistLoadId });
      clearTimeout(loadingTimeout);
      setIsLoading(false);
      setCurrentTrack(selectedTrack);
      onTrackLoaded?.(true);
    } finally {
      trackLoadMutex.current = false;
      isLoadingNewFile.current = false;
    }
  }, [ensureAudioSessionActive, onTrackLoaded, logPlaybackDiagnostics, logPendingPlaybackState, clearPendingPlaybackContext, configureRemoteCapabilities, isWeb]);

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
    if (isWeb) {
      logger.warn('goToNextTrack is not supported on web (TrackPlayer)', {}, 'useTrackPlayer');
      return;
    }
    if (isTransitioning.current) {
      logger.warn('Track transition already in progress, skipping next request', {}, 'useTrackPlayer');
      return;
    }

    isTransitioning.current = true;
    global.setManualNavigation?.(true);
    
    try {
      TrackPlayer.skipToNext();
      await ensureAudioSessionActive();
      TrackPlayer.play();
      
      const nextIndex = TrackPlayer.getActiveMediaItemIndex();
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
          const track = TrackPlayer.getActiveMediaItem() ?? TrackPlayer.getQueue()[nextIndex];
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
  goToNextTrackRef.current = goToNextTrack;

  const goToPreviousTrack = async () => {
    if (isWeb) {
      logger.warn('goToPreviousTrack is not supported on web (TrackPlayer)', {}, 'useTrackPlayer');
      return;
    }
    if (isTransitioning.current) {
      logger.warn('Track transition already in progress, skipping previous request', {}, 'useTrackPlayer');
      return;
    }
    
    isTransitioning.current = true;
      global.setManualNavigation?.(true);
      
      try {
      const activeIndex = TrackPlayer.getActiveMediaItemIndex();
      if (typeof activeIndex === 'number' && activeIndex > 0) {
        TrackPlayer.skipToIndex(activeIndex - 1);
      } else {
        TrackPlayer.skipToPrevious();
      }
      await ensureAudioSessionActive();
      TrackPlayer.play();
      
      const prevIndex = TrackPlayer.getActiveMediaItemIndex();
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
          const track = TrackPlayer.getActiveMediaItem() ?? TrackPlayer.getQueue()[prevIndex];
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
      if (isWeb) {
        let audio = webAudioRef.current;
        if (!audio && (currentTrack?.url || playlist[currentIndex]?.url)) {
          const selected = currentTrack ?? playlist[currentIndex];
          const WebAudioCtor = (typeof window !== 'undefined' && window.Audio) ? window.Audio : (typeof globalThis !== 'undefined' ? globalThis.Audio : null);
          if (!WebAudioCtor) {
            logger.error('HTML5 Audio API not available on toggle', {}, 'useTrackPlayer');
            return;
          }
          const newAudio = new WebAudioCtor(selected.url);
          newAudio.preload = 'metadata';
          newAudio.onloadedmetadata = () => {
            const d = isFinite(newAudio.duration) ? newAudio.duration : 0;
            setWebDuration(d);
          };
          newAudio.ontimeupdate = () => {
            setWebPosition(newAudio.currentTime || 0);
          };
          newAudio.onended = () => {
            setIsPlaying(false);
          };
          newAudio.onerror = () => {};
          webAudioRef.current = newAudio;
          audio = newAudio;
          logger.info('Web audio lazily created on toggle', { hasTrack: true }, 'useTrackPlayer');
        }
        if (!audio) {
          logger.warn('togglePlayback called on web without audio element', {}, 'useTrackPlayer');
          return;
        }
        if (isPlaying) {
          audio.pause();
          setIsPlaying(false);
          logger.info('Web audio paused', {}, 'useTrackPlayer');
        } else {
          try {
            await audio.play();
            setIsPlaying(true);
            logger.info('Web audio started', {}, 'useTrackPlayer');
          } catch (err) {
            logger.error('Web audio play() failed', { error: String(err) }, 'useTrackPlayer');
          }
        }
        return;
      }
      if (isPlaying) {
        TrackPlayer.pause();
        setIsPlaying(false);
        logger.info('Playback paused', {}, 'useTrackPlayer');
      } else {
        TrackPlayer.play();
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
      if (isWeb) {
        const audio = webAudioRef.current;
        if (!audio) return;
        const newPos = Math.max(0, Math.min(Number(position) || 0, webDuration || Number.MAX_SAFE_INTEGER));
        audio.currentTime = newPos;
        setWebPosition(newPos);
        return;
      }
      TrackPlayer.seekTo(position);
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
      if (isWeb) {
        const audio = webAudioRef.current;
        if (!audio) return;
        const next = Math.min((audio.currentTime || 0) + seconds, webDuration || Number.MAX_SAFE_INTEGER);
        audio.currentTime = next;
        setWebPosition(next);
        return;
      }
      TrackPlayer.seekBy(seconds);
      logger.info('Seek forward completed', { seconds }, 'useTrackPlayer');
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
      if (isWeb) {
        const audio = webAudioRef.current;
        if (!audio) return;
        const prev = Math.max((audio.currentTime || 0) - seconds, 0);
        audio.currentTime = prev;
        setWebPosition(prev);
        return;
      }
      TrackPlayer.seekBy(-seconds);
      logger.info('Seek backward completed', { seconds }, 'useTrackPlayer');
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
      if (isWeb) {
        const audio = webAudioRef.current;
        if (audio) {
          try { audio.pause(); } catch (_) {}
          setIsPlaying(false);
        }
        return;
      }
      TrackPlayer.stop();
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
      if (watchdogIntervalRef.current) {
        clearInterval(watchdogIntervalRef.current);
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      
      trackLoadMutex.current = false;
      isTransitioning.current = false;
      isLoadingNewFile.current = false;

      if (!isWeb) {
        TrackPlayer.destroy();
        logger.info('TrackPlayer cleanup completed', {}, 'useTrackPlayer');
      } else {
        const audio = webAudioRef.current;
        if (audio) {
          try { audio.pause(); } catch (_) {}
          try { audio.src = ''; } catch (_) {}
        }
        webAudioRef.current = null;
        setWebPosition(0);
        setWebDuration(0);
        logger.debug('Cleaned up web audio element', {}, 'useTrackPlayer');
      }
    } catch (error) {
      logger.error('Error cleaning up TrackPlayer', { 
        error: error instanceof Error ? error.message : String(error) 
      }, 'useTrackPlayer');
    }
  };

  return {
    isPlaying,
    isLoading,
    currentTrack,
    playlist,
    currentIndex,
    position: isWeb ? webPosition : position,
    duration: isWeb ? webDuration : duration,
    appStateVisible,
    
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
    
    ensureAudioSessionActive,
  };
};

export default useTrackPlayer;
