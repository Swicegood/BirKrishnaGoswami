import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, SafeAreaView, Dimensions, 
  FlatList, TouchableOpacity, Linking, ScrollView } from 'react-native';

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

const DonationScreen = () => {

    const [selectedAmount, setSelectedAmount] = useState(null);

    const renderItem = ({ item }) => (
      <TouchableOpacity 
        style={styles.button}
        onPress={() => Linking.openURL('https://checkout.square.site/pay/333adf5df20c41079f65c2580bc40f9e')}
      >
        <Text style={styles.buttonText}>{item.amount}</Text>
      </TouchableOpacity>

    );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView>
      <View style={styles.container}>
        <Image source={require('../assets/images/placeholder_355_160.png')} style={{ width: windowWidth, alignSelf: 'center' }} />
        <View style={styles.content}>
            <Text style={styles.headerText}>Hare Krishna!</Text>
            <Text style={styles.cardText}>Thank you for considering donating to the mission of Srila Bir Krishna Goswami Maharaja. 
            Your contribution will support Maharaja's service to his spritual master His Divince Grace A. C. Bhaktivedanta Swami Prabupada</Text>
            <Text style={styles.subHeaderText}>Kindly Donate Generously</Text>
            <Text style={styles.secondText}>Choose the amount you want to donate below.</Text>
            <FlatList
                numColumns={3} 
                data={[{key: '1', amount: '$10'}, {key: '2', amount: '$50'}, {key: '3', amount: '$100'}, {key: '4', amount: '$250'}, {key: '5', amount: '$500'}, {key: '6', amount: '$1000'}, {key: '7', amount: '$5000'}, {key: '8', amount: '$10000'}, {key: '9', amount: 'CUSTOM'}]}
                renderItem={renderItem}
            />
        </View>
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
  },
  content: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  button: {
    backgroundColor: '#ED4D4E',
    color: '#fff',
    borderRadius: 8,
    textAlign: 'center',
    paddingVertical: 10,
    marginTop: 10,
    alignItems: 'center',
    marginHorizontal: 10,
    width: 100,
  },
  cardText: {
    fontWeight: 'bold',
    padding: 10,
    fontSize: 18,
    color: 'grey',
  },
  headerText: {
      fontWeight: 'bold',
      textAlign: 'center',
      padding: 10,
      fontSize: 34,
      color: '#bb1900',
      fontFamily: 'PacificoRegular',
  },
  subHeaderText: {
      fontWeight: 'bold',
      textAlign: 'center',
      padding: 10,
      fontSize: 24,
      color: 'red',
  },
  secondText: {
        fontWeight: 'bold',
        textAlign: 'center',
        padding: 10,
        fontSize: 16,
        color: 'grey',
    },


});

export default DonationScreen;
