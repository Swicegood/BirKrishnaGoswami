import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView,
   SafeAreaView, Dimensions, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

const BooksScreen: React.FC = () => {


  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <Image source={require('../assets/images/placeholder_355_200.png')} style={{ width: windowWidth, alignSelf: 'center' }} />
        <View style={styles.content}>
          <Link href="./(tabs2)/SPPlaylistScreen" asChild>
          <TouchableOpacity style={styles.card}>
            <Image
              source={require('../assets/images/placeholder_355_200.png')}
              resizeMode="cover"
              style={styles.cardImage}
            />
            <Text style={styles.cardText}>PLAYLISTS</Text>
          </TouchableOpacity>
          </Link>
          <Link href="./(tabs2)/VPOfferingsScreen" asChild>
            <TouchableOpacity style={styles.card}>
                <Image
                source={require('../assets/images/placeholder_355_200.png')}
                resizeMode="cover"
                style={styles.cardImage}
                />
                <Text style={styles.cardText}>VYASA PUJA OFFERINGS</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
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
    height: 150,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  cardText: {
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 10,
    fontSize: 18,
  },
});

export default BooksScreen;
