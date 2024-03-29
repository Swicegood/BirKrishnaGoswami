import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, Dimensions, SafeAreaView } from 'react-native';

const BioScreen = () => {


  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Image source={require('../../assets/images/placeholder_355_200.png')} style={{ width: Dimensions.get("screen").width, alignSelf: 'center' }} />
        <View style={styles.header}>
          <Text style={styles.headerText}>H. H. Bir Krishna Goswami Maharaja</Text>
      </View>
      <View style={styles.content}>
          <Text style={styles.date}>Date of Birth: 1949</Text>
          <Text style={styles.bodyText}>
  Bir Krishna Goswami is one of the spiritual leaders of the International Society for Krishna Consciousness. He has a special status of being among the first Western-born members of the authorized chain of disciplic succession descending from the Supreme Lord, Krishna. In modern times, the most essential task of Krishna conscious spiritual masters is to publish the Vedic scriptures of ancient India and distribute them throughout the world. Bir Krishna Goswami has made this mission his life and soul.{'\n\n'}

  Bir Krishna Goswami spent his childhood in Long Island, New York. As an academically gifted student at North Western University, he began reading the Vedic literature translated by His Divine Grace A. C. Bhaktivedanta Swami Prabhupada, the Founder-Acharya of the Krishna consciousness movement. Impressed by Srila Prabhupada’s scholarship and saintliness Bir Krishna Goswami became a member of the Krishna conscious community in Gainesville, Florida in 1971. Shortly thereafter, he was initiated as Srila Prabhupada’s disciple.{'\n\n'}

  From the beginning, Bir Krishna Goswami distinguished himself by his oratorical skills, his spiritual dedication, and his devotion to studying the writings of his spiritual master, through which he acquired a deep knowledge of the process of Krishna consciousness. In 1972 he began traveling throughout the United States distributing Srila Prabhupada’s books and lecturing at colleges and universities. This continued until 1974 when Bir Krishna Goswami became directly involved in the publication of Srila Prabhupada’s books in English and in Spanish. He also spoke widely in South America, Central America, and the Caribbean on the science of Krishna consciousness.{'\n\n'}

  In early 1978 Bir Krishna Goswami entered the renounced order of life(sannyasa) in Lima, Peru. In 1982 he came to North Carolina and opened its first permanent Krishna conscious center. In 1995 he began to work on the GBC (Governing Body Commission).
</Text><Text style={styles.category}>Category: Spiritual Leader</Text>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: '#E53935',
    padding: 10,
  },
  headerText: {
    color: 'white',
    fontSize: 24,
    textAlign: 'center',
  },
  content: {
    margin: 20,
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
  },
  category: {
    fontSize: 16,
    color: 'blue',
    marginTop: 10,
  },
  nextButton: {
    backgroundColor: 'transparent',
    borderColor: '#E53935',
    borderWidth: 2,
    borderRadius: 10, // Adjust the border radius value as needed
    color: '#E53935',
  },
  nextButtonText: {
    color: '#E53935',
    padding: 10,
  },
  
});

export default BioScreen;
