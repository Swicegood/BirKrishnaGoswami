import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { Link } from 'expo-router';

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

const AudioScreen: React.FC = () => {
  // Navigation function or hook should be implemented based on your navigation setup
  const navigateToYearwise = () => {
    // Navigation logic to 'Yearwise' screen
  };

  const navigateToBookwise = () => {
    // Navigation logic to 'Bookwise' screen
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Audio Lectures</Text>
        </View>
        <View style={styles.content}>
          <Link href="./YearScreen" asChild>
            <TouchableOpacity style={styles.card}>
              <Image
                source={require('../assets/images/placeholder_355_200.png')}
                resizeMode="cover"
                style={styles.cardImage}
              />
              <Text style={styles.cardText}>BY-YEAR</Text>
            </TouchableOpacity>
          </Link>
          <Link href="./FolderScreen" asChild>
            <TouchableOpacity style={styles.card}>
                <Image
                source={require('../assets/images/placeholder_355_200.png')}
                resizeMode="cover"
                style={styles.cardImage}
                />
                <Text style={styles.cardText}>BY-BOOK</Text>
            </TouchableOpacity>
          </Link>
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

export default AudioScreen;
