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

    // Log the entire request body
    const xml2js = require('xml2js');

    // Convert the Buffer to a string and parse the XML
    xml2js.parseString(req.body.toString(), (err, result) => {
      if (err) {
        console.error('Failed to parse XML:', err);
        return;
      }

      console.log('Parsed XML:', result);

      // Extract the video ID and other interesting info from the parsed XML
      const videoId = result.feed.entry[0]['yt:videoId'][0];
      const videoTitle = result.feed.entry[0]['title'][0];
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
      console.log(`New video: ${videoTitle} at ${videoUrl}`);

      /**
       * Retrieves user tokens.
       *
       * @async
       * @function getUserTokens
       * @return {Promise<Array<string>>} A promise that resolves to an array of user tokens.
       */
      async function handleNotification() {
        // Get Expo SDK
        const {Expo} = require('expo-server-sdk');

        // Get user tokens
        const userTokens = await getUserTokens();

        // Create an array of promises
        const notifications = userTokens.map(async (token) => {
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
          // Create a new Expo SDK client
          const expo = new Expo();

          // Send the notification
          try {
            const ticket = await expo.sendPushNotificationsAsync([message]);
            console.log(ticket);
          } catch (error) {
            console.error(`Failed to send push notification: ${error}`);
          }
        });
        // Wait for all notifications to be sent
        await Promise.all(notifications);
      }
      handleNotification();
    });
  }
  /**
  * Fetches the user tokens from the database.
  * @return {Promise<Array<string>>} A promise that resolves to an array of user tokens.
  */
  async function getUserTokens() {
    const db = admin.firestore();
    const tokensCollection = db.collection('push-tokens');
    const snapshot = await tokensCollection.get();
    const tokens = snapshot.docs.map((doc) => doc.data().token);
    return tokens;
  }
});

const qs = require('qs');

exports.subscribeToPubSub = functions.https.onRequest(async (req, res) => {
  console.log('Attempt Subscribing to PubSub');
  const data = {
    'hub.mode': 'subscribe',
    'hub.topic': 'https://www.youtube.com/feeds/videos.xml?channel_id=UCLiuTwQ-ap30PbKzprrN2Hg',
    'hub.callback': 'https://us-central1-birkrishnagoswami-b7360.cloudfunctions.net/handleYouTubeNotification',
    'hub.verify': 'sync',
    'hub.lease_seconds': '864000',
  };

  try {
    const response = await axios.post('https://pubsubhubbub.appspot.com/subscribe', qs.stringify(data), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    console.log(`Status: ${response.status}`);
    console.log('Headers: ', response.headers);
    console.log('Data: ', response.data);
    res.status(200).send('Subscribed to PubSub');
  } catch (error) {
    console.error(`Error: ${error.message}`);
    console.error(error.stack);
    res.status(500).send(`An error occurred while subscribing to PubSub: ${error.message}`);
  }
});
