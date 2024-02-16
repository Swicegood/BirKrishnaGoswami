
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries  
import { initializeApp, getApp } from 'firebase/app';
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';
import { getAnalytics } from "firebase/analytics";
import React, { useEffect, useState } from 'react';
import YoutubePlayer from 'react-native-youtube-iframe';
import { Image, Text, Dimensions, StyleSheet } from 'react-native';
import { View } from '../components/Themed';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD8JpSB_tK2CBj1tC6f434-vezZ2x0bRbk",
  authDomain: "birkrishnagoswami-b7360.firebaseapp.com",
  projectId: "birkrishnagoswami-b7360",
  storageBucket: "birkrishnagoswami-b7360.appspot.com",
  messagingSenderId: "790459013032",
  appId: "1:790459013032:web:d33b61fc48a0178cf82f9d",
  measurementId: "G-7GVXDMLLSY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);


interface GetYouTubeVideosRequest {
    channelId: string;
  }
  
  interface Video {
    id: string;
    title: string;
    // Add other playlist properties as needed
  }
  
  interface GetYouTubeVideosResponse {
    video: Video;
  }


interface FirebaseFunctionError {
    code: string;
    message: string;
    details?: any; // The details can vary depending on the error
  }
  
  const LiveScreen = () => {
    const [video, setVideo] = useState<GetYouTubeVideosResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const functions = getFunctions(getApp());
    connectFunctionsEmulator(functions, "127.0.0.1", 5001);
  
    useEffect(() => {
      const fetchVideos = async () => {
        const getLiveVideo = httpsCallable<GetYouTubeVideosRequest, GetYouTubeVideosResponse>(functions, 'getLiveVideo');
  
        // Use the interface for the request
        const request: GetYouTubeVideosRequest = { channelId: 'UCLiuTwQ-ap30PbKzprrN2Hg' };
        try {
          const result = await getLiveVideo(request);
          // Use the interface for the response
          const response: GetYouTubeVideosResponse = result.data;
          console.log("live videos", response);
          setVideo(response);
        } catch (error) {
          console.error("Error calling the function: ", error.message);
          if (error.message === "not-found") {
            console.log("No live video found");
            setError("No live video found");
          }
        }
      };
  
      fetchVideos();
    }, []);
  
    if (error || !video) {
      return (
        <View>
        <Image source={require('../assets/images/placeholder_355_200.png')} style={{ width: Dimensions.get('window').width , height: 200 }} />
        <Text>Live Streaming is not available right now!</Text>
        <Text> Please try again later. </Text>
        </View>
      );
    }
   
    console.log("live video video", video);

    return (
      <View style={styles.textContainer}>
      <YoutubePlayer
        height={300} // Adjust based on your needs
        play={true} // If you want the video to start playing as soon as it loads, set this to true
        videoId={video}
      />
    </View>
    );
  };

  const styles = StyleSheet.create({
    textContainer: {
      flex: 1,
      justifyContent: 'center',
    },
  });
  
  export default LiveScreen;

