import React, { useEffect, useState } from 'react';
import { useGlobalSearchParams, Link } from 'expo-router';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Alert } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

function customDecodeURI(str) {
  return decodeURIComponent(str.replace(/%27/g, "'").replace(/%28/g, "(").replace(/%29/g, ")"));
}

const DayScreen = () => {
  const { year, month, dataString } = useGlobalSearchParams();
  const [data, setData] = useState<any[]>([]);
  const [listenedPositions, setListenedPositions] = useState<{ [url: string]: number }>({});

  const handleResetPosition = async (url: string) => {
    if (Platform.OS === 'web') {
      if (window.confirm('You are about to mark this track "unplayed." Your bookmark will be erased. Are you sure?')) {
        await removeTrackFromStorage(url);
      }
    } else {
      Alert.alert(
        "Reset Track Progress",
        'You are about to mark this track "unplayed." Your bookmark will be erased. Are you sure?',
        [
          { text: "Cancel", style: "cancel" },
          { text: "Yes, Reset", onPress: async () => await removeTrackFromStorage(url) }
        ]
      );
    }
  };

  const removeTrackFromStorage = async (url: string) => {
    try {
      const jsonValue = await AsyncStorage.getItem("@playedSongs");
      if (!jsonValue) return;
      const playedSongs = JSON.parse(jsonValue);

      // Remove the entry whose url matches
      for (const entry of playedSongs) {
        if (entry?.song?.url === url) {
          playedSongs.splice(playedSongs.indexOf(entry), 1);
        }
      }
      await AsyncStorage.setItem("@playedSongs", JSON.stringify(playedSongs));

      // Also remove from listenedPositions so the dot disappears
      setListenedPositions(prevPositions => {
        const newPositions = { ...prevPositions };
        delete newPositions[url];
        return newPositions;
      });
    } catch (error) {
      console.error("Error resetting position:", error);
    }
  }

  useEffect(() => {
    // Fetch listened positions
    (async () => {
      const fetchedListenedPositions = await import('./api/apiWrapper')
        .then(mod => mod.getListenedPositions());
      setListenedPositions(fetchedListenedPositions);
      console.log("listenedPositions for DayScreen:", fetchedListenedPositions);
    })();

    if (!dataString) {
      return;
    }
    const parsedData = JSON.parse(dataString);
    const dataWithTitles = parsedData.map((url: string) => {
      const title = customDecodeURI(url)?.split('/').pop() || '';
      return { url, title, month, year };
    });
    setData(dataWithTitles);
  }, [dataString]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ScrollView>
        <View>
          {data.map((item, index) => (
            <View style={styles.container} key={index}>
              {(item.url in listenedPositions) && (
                <TouchableOpacity
                  style={styles.neonGreenDot}
                  onPress={Platform.OS === 'web' ? () => handleResetPosition(item.url) : undefined}
                  onLongPress={Platform.OS !== 'web' ? () => handleResetPosition(item.url) : undefined}
                />
              )}
              <Link
                href={{ pathname: "AudioScreen", params: { url: item.url, title: item.title } }}
                asChild
              >
                <TouchableOpacity style={styles.playButton}>
                  <Image
                    source={require('../assets/images/vecteezy_jogar-design-de-sinal-de-icone-de-botao_10148443.png')}
                    style={styles.playIcon}
                  />
                </TouchableOpacity>
              </Link>
              <View style={styles.textContainer}>
                <Text style={styles.titleText} numberOfLines={3} ellipsizeMode='tail'>
                  {item.title.split('.')[0].replaceAll("_", " ")}
                </Text>
                <Text></Text>
                <Text style={styles.dateText}>{item.month.slice(2)}/{item.year}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    flexDirection: 'row',
    padding: 10,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc', // Adjust color as needed
  },
  playButton: {
    marginRight: 30,
  },
  playIcon: {
    width: 30,
    height: 30,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  titleText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  dateText: {
    fontSize: 14,
    color: 'grey',
  },
  neonGreenDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#39FF14', // neon green
    bottom: 20,
    right: 20,
    zIndex: 10,
  },
});

export default DayScreen;