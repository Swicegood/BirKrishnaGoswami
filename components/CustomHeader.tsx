import {Text, View} from './Themed';
import {StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from 'expo-router/src/useNavigation';

function CustomHeader() {
  const navigation = useNavigation();

  // Use 'navigation' in your component...

  return (
    // Your component JSX...
    <View style={styles.header}>

    <Text style={styles.headerText}>Main Page</Text>
  </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    backgroundColor: 'orange', // Set the background color for your header
  },
  menuButton: {
    // Style your menu button
  },
  menuText: {
    fontSize: 28,
    color: 'white', // Choose your color
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white', // Choose your color
  },
});

export default CustomHeader;
