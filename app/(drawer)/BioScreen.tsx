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
          <Text style={styles.quoteText}>H.H. Bir Krishna Goswami Maharaja is a spiritual leader and a member of the International Society for Krishna Consciousness (ISKCON). He was born in 1944 in New York City. He is a disciple of A.C. Bhaktivedanta Swami Prabhupada, the founder of ISKCON. He has been a member of the Governing Body Commission of ISKCON since 1987. He has been a member of the Governing Body Commission of ISKCON since 1987. He has been a member of the Governing Body Commission of ISKCON since 1987. He has been a member of the Governing Body Commission of ISKCON since 1987. He has been a member of the Governing Body Commission of ISKCON since 1987. He has been a member of the Governing Body Commission of ISKCON since 1987. He has been a member of the Governing Body Commission of ISKCON since 1987. He has been a member of the Governing Body Commission of ISKCON since 1987.</Text>
          <Text style={styles.category}>Category: Spiritual Leader</Text>

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
  quoteText: {
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
