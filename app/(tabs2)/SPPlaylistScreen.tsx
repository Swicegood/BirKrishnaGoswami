import { useEffect, useState } from "react";
import { db } from "../api/firebase"
import PlaylistScreen from "../PlaylistScreen";
import { collection, query, limit, getDocs } from "firebase/firestore";

const SPPlaylistScreen = () => {
  const [playlistId, setPlaylistId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      // Get playlist id from firebase
      const q = query(collection(db, 'prabhupada-vyasa-puja-playlist'));
      // Get the first document
      const doc = await getDocs(q);
      // Playlist ID is doc id
      setPlaylistId(doc.docs[0].id);
    }
    fetchData();
  }, []);

  return playlistId ? <PlaylistScreen id={playlistId} /> : null;
};

export default SPPlaylistScreen;