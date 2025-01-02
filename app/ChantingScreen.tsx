import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { doc, getDoc } from "firebase/firestore";
import { db } from './api/firebase';
import { router } from 'expo-router';
import { Alert } from 'react-native';
const windowHeight = Dimensions.get('window').height;

const isTablet = () => {
  const { width, height } = Dimensions.get('window');
  const aspectRatio = width / height;
  const isLandscape = Math.min(width, height) >= 600 && (aspectRatio > 1.2 || aspectRatio < 0.9);
  console.log('isTablet: ', isLandscape);
  return isLandscape
};

const chanting: React.FC = () => {
  // Navigation function or hook should be implemented based on your navigation setup
  const [track, setTrack] = useState<string>("https://atourcity.com/bkgoswami.com/wp/wp-content/uploads/Original_Miami_Japa_1981.mp3");

  useEffect(() => {
    const fetchChanting = async () => {
      const docRef = doc(db, "files-urls", "chanting");
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setTrack(data.url);
      }
    };

    fetchChanting();
  }, []);


  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.content}>
          <TouchableOpacity 
            style={styles.card}
            onPress={() => {
              Alert.alert(
                "Important Notice",
                "The audio you are about to hear has been verified to be Gurudev when he was a young man in Miami. Please do not be alarmed by how different his voice is.",
                [
                  {
                    text: "Cancel",
                    style: "cancel"
                  },
                  {
                    text: "Continue",
                    onPress: () => {
                      router.push({
                        pathname: "/AudioScreen",
                        params: { url: track, title: "Chanting Japa" }
                      });
                    }
                  }
                ]
              );
            }}
          >
            <Image
              source={require('../assets/images/Chanting_Japa.png')}
              resizeMode="cover" 
              style={styles.cardImage}
            />
            <Text style={styles.cardText}>Chanting japa 108 times</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: '#ED4D4E',
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    height: .2 * windowHeight,
  },
  headerText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginVertical: 8,
    width: '80%',
    elevation: 3,
    shadowOffset: { width: 1, height: 1 },
    shadowColor: 'black',
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  cardImage: {
    width: '100%',
    height: isTablet() ? 250 : 180,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 8,
    resizeMode: 'contain',
  },
  cardText: {
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 10,
    fontSize: 18,
    fontFamily: 'OblikBold',
    color: '#7e2b18',
  },
});

export default chanting;
