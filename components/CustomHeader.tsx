import { Text, View } from './Themed';
import { StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from 'expo-router';
import { StatusBar } from 'expo-status-bar';


type DrawerParamList = {
  Home: undefined;
  // Add other routes here
};

function CustomHeader() {
  const navigation = useNavigation();

  return (
    <>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea} edges={['right', 'top', 'left']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.menuButton} onPress={() => navigation.openDrawer()}>
            <Text style={styles.menuText}>☰</Text>
          </TouchableOpacity>
          <Image source={require('../assets/images/Crown.png')} style={{ width: 100, height: 85 ,position: 'absolute', top: 0 , left: (Dimensions.get('window').width / 2) - 50, zIndex: 1, resizeMode: 'contain' }} />
          <Text style={styles.headerText}></Text>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#993D39', // Use the same color as your header
  },

  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    backgroundColor: '#ED4D4E', // Set the background color for your header
  },
  menuButton: {
    // Style your menu button
  },
  menuText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white', // Choose your color
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white', // Choose your color
  },
});

export default CustomHeader;
