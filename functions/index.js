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
const cors = require('cors')({origin: true});

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
        key: API_KEY,
      },
    });

    res.send({data: response.data});
  } catch (error) {
    console.error("Error fetching data: ", error);
    res.status(500).send('Failed to fetch data from YouTube');
  }
});


exports.getYouTubeVideos = functions.https.onRequest(async (req, res) => {
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

exports.getSearchYouTubeVideos = functions.https.onRequest(async (req, res) => {
  const API_KEY = functions.config().youtube.api_key; // Store your API key in Firebase config
  const channelId = req.body.data.channelId; // Extract channelId from the body of the request
  const searchTerm = req.body.data.searchTerm; // Extract searchTerm from the body of the request

  try {
    const response = await axios.get(`https://www.googleapis.com/youtube/v3/search`, {
      params: {
        part: 'snippet',
        q: searchTerm,
        channelId: channelId,
        maxResults: 50, // Adjust based on your needs
        order: 'date', // Adjust based on your needs
        // type: 'video',
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
      }
    })
    .then(response => {
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
    })
  } catch (error) {
    console.error("Error fetching data: ", error);
    res.status(500).send('Failed to fetch data from YouTube');
  }
});

