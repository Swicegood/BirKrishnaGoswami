import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Dimensions, SafeAreaView, Platform } from 'react-native';
import MeasureView from '../api/MeasureView';

const BioScreen = () => {
  const [orientation, setOrientation] = useState(Dimensions.get('window').width > Dimensions.get('window').height ? 'LANDSCAPE' : 'PORTRAIT');
  const [width, setWidth] = useState(Dimensions.get('window').width);

  const onSetWidth = (width: number) => {
    console.log('BioScreen width: ', width)
    setWidth(width);
  };

  const isTablet = () => {
    const { width, height } = Dimensions.get('window');
    const aspectRatio = width / height;
    return Math.min(width, height) >= 600 && (aspectRatio > 1.6 || aspectRatio < 0.64);
  };

  const onSetOrientation = (orientation: string) => {
    if ( (Platform.OS === 'android' && ! isTablet()) || Platform.OS === 'web') {
      if (orientation === 'LANDSCAPE') {
        setOrientation('PORTRAIT');
      }
      else {
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

  const text = `Bir Krishna Goswami is one of the spiritual leaders of the International Society for Krishna Consciousness. He has a special status of being among the first Western-born members of the authorized chain of disciplic succession descending from the Supreme Lord, Krishna. In modern times, the most essential task of Krishna conscious spiritual masters is to publish the Vedic scriptures of ancient India and distribute them throughout the world. Bir Krishna Goswami has made this mission his life and soul.

  Bir Krishna Goswami spent his childhood in Long Island, New York. As an academically gifted student at North Western University, he began reading the Vedic literature translated by His Divine Grace A. C. Bhaktivedanta Swami Prabhupada, the Founder-Acharya of the Krishna consciousness movement. Impressed by Srila Prabhupada's scholarship and saintliness Bir Krishna Goswami became a member of the Krishna conscious community in Gainesville, Florida in 1971. Shortly thereafter, he was initiated as Srila Prabhupada's disciple.

  From the beginning, Bir Krishna Goswami distinguished himself by his oratorical skills, his spiritual dedication, and his devotion to studying the writings of his spiritual master, through which he acquired a deep knowledge of the process of Krishna consciousness. In 1972 he began traveling throughout the United States distributing Srila Prabhupada's books and lecturing at colleges and universities. This continued until 1974 when Bir Krishna Goswami became directly involved in the publication of Srila Prabhupada's books in English and in Spanish. He also spoke widely in South America, Central America, and the Caribbean on the science of Krishna consciousness.

  In early 1978 Bir Krishna Goswami entered the renounced order of life(sannyasa) in Lima, Peru. In 1982 he came to North Carolina and opened its first permanent Krishna conscious center. In 1995 he began to work on the GBC (Governing Body Commission).`

  const scrollViewStyle = Platform.OS === 'web' 
    ? { ...styles.scrollViewStyle, height: '100vh', overflowY: 'scroll' as 'scroll' }
    : styles.scrollViewStyle;

  return (
    <SafeAreaView style={styles.container}>
      <MeasureView onSetOrientation={onSetOrientation} onSetWidth={onSetWidth}>
        {orientation === 'PORTRAIT' ? (
          <>
            <Image
              source={require('../../assets/images/About_Bio.png')}
              style={{
                width: width,
                height: width * 0.6,
                resizeMode: (Platform.OS === 'web' || isTablet()) ? 'contain' : 'cover'
              }}
            />
            <View style={styles.header}>
              <Text style={styles.headerText}>H. H. Bir Krishna Goswami Maharaja</Text>
            </View>
            <ScrollView style={scrollViewStyle}>
              <View style={styles.content}>
                <Text style={styles.bodyText}>
                  {text}
                </Text>
                <Text style={styles.category}>Category: Spiritual Leader</Text>
              </View>
            </ScrollView>
          </>
        ) : (
          <ScrollView style={scrollViewStyle}>
            <>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Image
                source={require('../../assets/images/About_Bio.png')}
                style={{
                  width: width,
                  resizeMode: (Platform.OS === 'web' || isTablet()) ? 'contain' : 'cover'
                }}
              />
            </View>
            <View style={styles.header}>
              <Text style={styles.headerText}>H. H. Bir Krishna Goswami Maharaja</Text>
            </View>
            <View style={styles.content}>
              <Text style={styles.bodyText}>
                {text}
              </Text>
              <Text style={styles.category}>Category: Spiritual Leader</Text>
            </View>
            </>
          </ScrollView>
        )}
      </MeasureView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 10,
  },
  headerText: {
    color: '#A91D15',
    fontSize: 20,
    textAlign: 'center',
    fontFamily: 'PacificoRegular',
  },
  content: {
    marginLeft: 20,
    marginRight: 20,
  }, 
  date: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#E53935',
  },
  bodyText: {
    fontSize: 20,
    marginTop: 10,
    fontFamily: 'OblikBold',
    color: '#454545'
  },
  category: {
    fontSize: 16,
    color: 'blue',
    marginTop: 10,
  },
  scrollViewStyle: {
  },
});

export default BioScreen;