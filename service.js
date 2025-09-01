import TrackPlayer, { Event, State } from 'react-native-track-player';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';

// Global flag to prevent service interference during manual navigation
let isManualNavigation = false;

// Function to set manual navigation flag (will be called from main app)
global.setManualNavigation = (value) => {
  isManualNavigation = value;
  console.log('Manual navigation flag set to:', value);
};

const requestAudioFocus = async () => {
  try {
    await Audio.setAudioModeAsync({
      staysActiveInBackground: true,
      interruptionModeIOS: InterruptionModeIOS.DuckOthers,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
      playThroughEarpieceAndroid: false,
    });
    return true;
  } catch (error) {
    console.error('Failed to set audio mode:', error);
    return false;
  }
};

const playWithRetry = async (maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await TrackPlayer.play();
      return true;
    } catch (error) {
      console.error(`Play attempt ${i + 1} failed:`, error);
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
};

module.exports = async function () {
  console.log('TrackPlayer service started');

  TrackPlayer.addEventListener(Event.RemotePlay, () => {
    console.log('RemotePlay event received');
    TrackPlayer.play();
  });

  TrackPlayer.addEventListener(Event.RemotePause, () => {
    console.log('RemotePause event received');
    TrackPlayer.pause();
  });

  TrackPlayer.addEventListener(Event.RemoteStop, async () => {
    console.log('RemoteStop event received');
    try {
      const position = await TrackPlayer.getPosition();
      const currentTrack = await TrackPlayer.getCurrentTrack();
      if (currentTrack) {
        const trackObject = await TrackPlayer.getTrack(currentTrack);
        await AsyncStorage.setItem('lastSongUrl', trackObject.url);
        await AsyncStorage.setItem('lastSongPosition', position.toString());
        console.log('Saved last song state:', { url: trackObject.url, position });
      }
      await TrackPlayer.destroy();
      console.log('TrackPlayer destroyed');
    } catch (error) {
      console.error('Error in RemoteStop event:', error);
    }
  });

  TrackPlayer.addEventListener(Event.RemoteNext, async () => {
    console.log('RemoteNext event received');
    
    // Set manual navigation flag to prevent auto-continuation interference
    isManualNavigation = true;
    console.log('Manual navigation flag set to true for RemoteNext');
    
    try {
      // Get next track from current playlist or go to next file
      const currentTrack = await TrackPlayer.getCurrentTrack();
      if (currentTrack !== null) {
        const trackObject = await TrackPlayer.getTrack(currentTrack);
        const playlistData = await AsyncStorage.getItem('currentPlaylist');
        const currentIndex = await AsyncStorage.getItem('currentIndex');
        
        if (playlistData && currentIndex !== null) {
          const playlist = JSON.parse(playlistData);
          const nextIndex = parseInt(currentIndex) + 1;
          
          if (nextIndex < playlist.length) {
            const nextTrack = playlist[nextIndex];
            console.log('Loading next track from playlist:', nextTrack.title);
            
            await TrackPlayer.reset();
            await TrackPlayer.add({
              id: nextIndex.toString(),
              url: nextTrack.url,
              title: nextTrack.title,
            });
            
            await AsyncStorage.setItem('currentIndex', nextIndex.toString());
            
            const focusGranted = await requestAudioFocus();
            if (focusGranted) {
              await playWithRetry();
            } else {
              console.error('Failed to get audio focus for next track');
            }
          }
        }
      }
    } catch (error) {
      console.error('Error in RemoteNext event:', error);
    } finally {
      // Clear manual navigation flag after a delay to prevent race conditions
      setTimeout(() => {
        isManualNavigation = false;
        console.log('Manual navigation flag cleared after RemoteNext');
      }, 3000);
    }
  });

  TrackPlayer.addEventListener(Event.RemotePrevious, async () => {
    console.log('RemotePrevious event received');
    
    // Set manual navigation flag to prevent auto-continuation interference
    isManualNavigation = true;
    console.log('Manual navigation flag set to true for RemotePrevious');
    
    try {
      const currentTrack = await TrackPlayer.getCurrentTrack();
      if (currentTrack !== null) {
        const trackObject = await TrackPlayer.getTrack(currentTrack);
        const playlistData = await AsyncStorage.getItem('currentPlaylist');
        const currentIndex = await AsyncStorage.getItem('currentIndex');
        
        if (playlistData && currentIndex !== null) {
          const playlist = JSON.parse(playlistData);
          const prevIndex = parseInt(currentIndex) - 1;
          
          if (prevIndex >= 0) {
            const prevTrack = playlist[prevIndex];
            console.log('Loading previous track from playlist:', prevTrack.title);
            
            await TrackPlayer.reset();
            await TrackPlayer.add({
              id: prevIndex.toString(),
              url: prevTrack.url,
              title: prevTrack.title,
            });
            
            await AsyncStorage.setItem('currentIndex', prevIndex.toString());
            
            const focusGranted = await requestAudioFocus();
            if (focusGranted) {
              await playWithRetry();
            } else {
              console.error('Failed to get audio focus for previous track');
            }
          }
        }
      }
    } catch (error) {
      console.error('Error in RemotePrevious event:', error);
    } finally {
      // Clear manual navigation flag after a delay to prevent race conditions
      setTimeout(() => {
        isManualNavigation = false;
        console.log('Manual navigation flag cleared after RemotePrevious');
      }, 3000);
    }
  });

  TrackPlayer.addEventListener(Event.RemoteSeek, async (event) => {
    console.log('RemoteSeek event received:', event);
    try {
      await TrackPlayer.seekTo(event.position);
    } catch (error) {
      console.error('Error in RemoteSeek event:', error);
    }
  });

  TrackPlayer.addEventListener(Event.PlaybackTrackChanged, async (event) => {
    console.log('PlaybackTrackChanged event:', event);
    if (event.nextTrack !== null) {
      try {
        const track = await TrackPlayer.getTrack(event.nextTrack);
        console.log('Now playing:', track?.title);
      } catch (error) {
        console.error('Error getting track info:', error);
      }
    }
  });

  TrackPlayer.addEventListener(Event.PlaybackState, async (event) => {
    console.log('PlaybackState event:', event);
    
    if (event.state === State.Stopped) {
      console.log('Playback stopped');
    } else if (event.state === State.Playing) {
      console.log('Playback started');
    } else if (event.state === State.Paused) {
      console.log('Playback paused');
    }
  });

  TrackPlayer.addEventListener(Event.PlaybackError, async (event) => {
    console.error('Playback error:', event);
    // Handle playback errors - could retry or skip to next track
  });

  TrackPlayer.addEventListener(Event.PlaybackQueueEnded, async (event) => {
    console.log('PlaybackQueueEnded event:', event);
    
    if (isManualNavigation) {
      console.log('Manual navigation in progress, skipping auto-continuation');
      return;
    }
    
    try {
      // Auto-continue to next track if available
      const playlistData = await AsyncStorage.getItem('currentPlaylist');
      const currentIndex = await AsyncStorage.getItem('currentIndex');
      
      if (playlistData && currentIndex !== null) {
        const playlist = JSON.parse(playlistData);
        const nextIndex = parseInt(currentIndex) + 1;
        
        if (nextIndex < playlist.length) {
          const nextTrack = playlist[nextIndex];
          console.log('Auto-continuing to next track:', nextTrack.title);
          
          await TrackPlayer.reset();
          await TrackPlayer.add({
            id: nextIndex.toString(),
            url: nextTrack.url,
            title: nextTrack.title,
          });
          
          await AsyncStorage.setItem('currentIndex', nextIndex.toString());
          
          const focusGranted = await requestAudioFocus();
          if (focusGranted) {
            await playWithRetry();
          }
        } else {
          console.log('End of playlist reached');
        }
      }
    } catch (error) {
      console.error('Error in PlaybackQueueEnded event:', error);
    }
  });
};
