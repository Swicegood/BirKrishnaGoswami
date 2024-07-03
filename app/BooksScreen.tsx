import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView,
   SafeAreaView, Dimensions, TouchableOpacity, Platform } from 'react-native';
import { Link } from 'expo-router';
import MeasureView from './api/MeasureView';

const isTablet = () => {
  const { width, height } = Dimensions.get('window');
  const aspectRatio = width / height;
  const isLandscape = Math.min(width, height) >= 600 && (aspectRatio > 1.2 || aspectRatio < 0.9);
  console.log('isTablet: ', isLandscape);
  return isLandscape
};

const BooksScreen: React.FC = () => {
  const [orientation, setOrientation] = useState(Dimensions.get('window').width > Dimensions.get('window').height ? 'LANDSCAPE' : 'PORTRAIT');
  const [width, setWidth] = useState(Dimensions.get('window').width);
  const [height, setHeight] = useState(Dimensions.get('window').height);

  const onSetWidth = (width: number) => {
    console.log('BooksScreen width: ', width);
    setWidth(width);
  };

  const onSetOrientation = (orientation: string) => {
    if ( ( Platform.OS === 'android' && ! isTablet() ) ||  Platform.OS === 'web') {
      if (orientation === 'LANDSCAPE') {
        setOrientation('PORTRAIT');
      } else {
        setOrientation('LANDSCAPE');
      }
      return;
    }
    setOrientation(orientation);
  };

  useEffect(() => {
    if (Platform.OS === 'web') {
      // Apply styles to force scrollbars on web
      document.body.style.overflow = 'auto';
      document.documentElement.style.overflow = 'auto';
    }
  }, []);

  const scrollViewStyle = Platform.OS === 'web' 
    ? { height: '100vh', overflowY: 'scroll' as 'scroll' }
    : styles.scrollViewStyle;

  return (
    <SafeAreaView style={styles.safeArea}>
      <MeasureView onSetOrientation={onSetOrientation} onSetWidth={onSetWidth}>
        {orientation === 'PORTRAIT' ? (
          <ScrollView style={scrollViewStyle}>
            <Image source={require('../assets/images/Books_and_Ebooks.png')} style={{ 
              width: width, 
              height: width * 0.4, 
              resizeMode: (Platform.OS === 'web' || isTablet()) ? 'contain' : 'cover' 
            }} />
            <View style={styles.content}>
              <Link href="./PurchaseScreen" asChild>
                <TouchableOpacity style={styles.card}>
                  <Image
                    source={require('../assets/images/Purchase_Books.png')}
                    resizeMode="cover"
                    style={styles.cardImage}
                  />
                  <Text style={styles.cardText}>PURCHASE GURUDEVA'S BOOKS</Text>
                </TouchableOpacity>
              </Link>
              <Link href="./EbooksScreen" asChild>
                <TouchableOpacity style={styles.card}>
                  <Image
                    source={require('../assets/images/Vyasa_Puja_Books.png')}
                    resizeMode="cover"
                    style={styles.cardImage}
                  />
                  <Text style={styles.cardText}>READ FREE E-BOOKS</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </ScrollView>
        ) : (
          <ScrollView style={scrollViewStyle} contentContainerStyle={styles.landscapeContainer}>
            <View style={styles.landscapeImageContainer}>
              <Image source={require('../assets/images/Books_and_Ebooks.png')} style={{ 
                width: width * 0.5, 
                height: '30%',
                resizeMode: (Platform.OS === 'web' || isTablet()) ? 'contain' : 'cover'
              }} />
            </View>
            <View style={styles.landscapeContent}>
              <Link href="./PurchaseScreen" asChild>
                <TouchableOpacity style={styles.landscapeCard}>
                  <Image
                    source={require('../assets/images/Purchase_Books.png')}
                    resizeMode="cover"
                    style={{...styles.landscapeCardImage, 
                      height: isTablet() ? height * 0.3 : height * 0.125}}
                  />
                  <Text style={styles.cardText}>PURCHASE GURUDEVA'S BOOKS</Text>
                </TouchableOpacity>
              </Link>
              <Link href="./EbooksScreen" asChild>
                <TouchableOpacity style={styles.landscapeCard}>
                  <Image
                    source={require('../assets/images/Vyasa_Puja_Books.png')}
                    resizeMode="cover"
                    style={{...styles.landscapeCardImage, 
                      height: isTablet() ? height * 0.3 : height * 0.125}}
                  />
                  <Text style={styles.cardText}>READ FREE E-BOOKS</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </ScrollView>
        )}
      </MeasureView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollViewStyle: {},
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
    height: isTablet() ? 200 : 150,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  cardText: {
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 10,
    fontSize: 18,
    color: 'maroon',
  },
  landscapeContainer: {
    flexDirection: 'row',
    height: '100%',
  },
  landscapeImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  landscapeContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  landscapeCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginVertical: 8,
    width: '100%',
    elevation: 3,
    shadowOffset: { width: 1, height: 1 },
    shadowColor: 'black',
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  landscapeCardImage: {
    width: '100%',
    height: 250,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
});

export default BooksScreen;