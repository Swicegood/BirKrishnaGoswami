/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// You must install axios in your functions directory: npm install axios

// Enable CORS using the `cors` express middleware.

const functions = require('firebase-functions');
const axios = require('axios');

exports.getYouTubePlaylists = functions.https.onRequest(async (req, res) => {
  const API_KEY = functions.config().youtube.api_key; // Store your API key in Firebase config
  const channelId = req.body.data.channelId; // Extract channelId from the body of the request

  try {
    const response = await axios.get(`https://www.googleapis.com/youtube/v3/playlists`, {
      params: {
        part: 'snippet,contentDetails',
        channelId: channelId,
        maxResults: 50, // Adjust based on your needs
        order: 'date', // Order by date
        key: API_KEY,
      },
    });

    res.send({data: response.data});
  } catch (error) {
    console.error("Error fetching data: ", error);
    res.status(500).send('Failed to fetch data from YouTube');
  }
});


exports.getYouTubePlaylistVideos = functions.https.onRequest(async (req, res) => {
  const API_KEY = functions.config().youtube.api_key; // Store your API key in Firebase config
  const playlistId = req.body.data.playlistId; // Extract channelId from the body of the request

  try {
    const response = await axios.get(`https://www.googleapis.com/youtube/v3/playlistItems`, {
      params: {
        part: 'snippet,contentDetails',
        playlistId: playlistId,
        maxResults: 50, // Adjust based on your needs
        key: API_KEY,
      },
    });

    res.send({data: response.data});
  } catch (error) {
    console.error("Error fetching data: ", error);
    res.status(500).send('Failed to fetch data from YouTube');
  }
});

exports.getYouTubeChannelVideos = functions.https.onRequest(async (req, res) => {
  const API_KEY = functions.config().youtube.api_key; // Store your API key in Firebase config
  const channelId = req.body.data.channelId; // Extract channelId from the body of the request

  try {
    const response = await axios.get(`https://www.googleapis.com/youtube/v3/search`, {
      params: {
        part: 'snippet',
        channelId: channelId,
        maxResults: 50, // Maximum allowed by the API
        order: 'date', // Order by date
        type: 'video', // Uncommented to only get videos
        key: API_KEY,
      },
    });

    res.send({data: response.data});
  } catch (error) {
    console.error("Error fetching data: ", error);
    res.status(500).send('Failed to fetch data from YouTube');
  }
});


exports.getSearchYouTubeVideos = functions.https.onRequest(async (req, res) => {
  const API_KEY = functions.config().youtube.api_key; // Store your API key in Firebase config
  const channelId = req.body.data.channelId; // Extract channelId from the body of the request
  const searchTerm = req.body.data.searchTerm; // Extract searchTerm from the body of the request

  try {
    const response = await axios.get(`https://www.googleapis.com/youtube/v3/search`, {
      params: {
        part: 'snippet',
        q: searchTerm.toLowerCase(),
        channelId: channelId,
        maxResults: 50, // Maximum allowed by the API
        order: 'relevance', // Order by relevance instead of date
        type: 'video', // Uncommented to only get videos
        key: API_KEY,
      },
    });

    res.send({data: response.data});
  } catch (error) {
    console.error("Error fetching data: ", error);
    res.status(500).send('Failed to fetch data from YouTube');
  }
});


exports.getLiveVideo = functions.https.onRequest(async (req, res) => {
  const API_KEY = functions.config().youtube.api_key; // Store your API key in Firebase config
  const channelId = req.body.data.channelId; // Extract channelId from the body of the request

  try {
    const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        channelId: channelId, // Use channelId here
        eventType: 'live',
        type: 'video',
        key: API_KEY,
      },
    });

    console.log("Response: ", response.data);
    const liveVideos = response.data.items;
    if (liveVideos.length > 0) {
      const liveVideoId = liveVideos[0].id.videoId;
      console.log(`Live video ID: ${liveVideoId}`);
      // Embed this video ID in an iframe
      res.send({data: liveVideoId});
    } else {
      console.log("No live streams found.");
    }
  } catch (error) {
    console.error("Error fetching data: ", error);
    res.status(500).send('Failed to fetch data from YouTube');
  }
});

const admin = require('firebase-admin');
admin.initializeApp();

exports.handleYouTubeNotification = functions.https.onRequest(async (req, res) => {
  // Check if this is a subscription verification request
  if (req.query['hub.mode'] === 'subscribe' && req.query['hub.challenge']) {
    // Respond with the hub.challenge value to verify the subscription
    const challenge = req.query['hub.challenge'];
    console.log('Verifying subscription');
    res.status(200).send(challenge);
  } else {
    // Handle other notifications (e.g., video upload notifications)
    console.log('Received a notification');
    // Process the notification here

    // Respond to indicate successful receipt of the notification
    res.status(200).send('OK');


    // Parse the request body to obtain the video ID  and other intersting info from the notification from YouTube
    const videoId = req.body.videoId;
    const videoTitle = req.body.videoTitle;
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    console.log(`New video: ${videoTitle} at ${videoUrl}`);


    const userTokens = await getUserTokens();

    // Send a message to each user token.
    const {Expo} = require('expo-server-sdk');

    // Create a new Expo SDK client
    const expo = new Expo();

    userTokens.forEach(async (token) => {
      if (!Expo.isExpoPushToken(token)) {
        console.error(`Push token ${token} is not a valid Expo push token`);
        return;
      }

      const message = {
        to: token,
        sound: 'default',
        title: 'New Video Posted',
        body: `A new video has been posted on BKGoswami YouTube entitled ${videoTitle}.`,
        data: {link: videoUrl},
      };

      try {
        const ticket = await expo.sendPushNotificationsAsync([message]);
        console.log(ticket);
      } catch (error) {
        console.error(`Failed to send push notification: ${error}`);
      }
    });
  }
  /**
  * Fetches the user tokens from the database.
  * @return {Promise<Array<string>>} A promise that resolves to an array of user tokens.
  */
  async function getUserTokens() {
    // Fetch tokens from your database. This is just a good placeholder.
    // Replace this with your actual code to fetch tokens.
    return ['ExponentPushToken[-RFVv5Cyl8v14P9aAE_2uh]'];
  }
});
