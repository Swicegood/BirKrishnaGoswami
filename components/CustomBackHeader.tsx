import {Text, View} from './Themed';
import {StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';

type DrawerParamList = {
  Home: undefined;
  // Add other routes here
  index: undefined;
};

function CustomBackHeader() {
  const navigation = useNavigation<DrawerNavigationProp<DrawerParamList, 'Home'>>();

  return (
    <SafeAreaView style={styles.safeArea} edges={['right', 'top', 'left']}>
      <View style={styles.header}>
      <TouchableOpacity style={styles.menuButton} onPress={() => navigation.navigate('index')}>
         <Text style={styles.menuText}>&lt;</Text>
      </TouchableOpacity>
        <Text style={styles.headerText}></Text>
      </View>
    </SafeAreaView>
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
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white', // Choose your color
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white', // Choose your color
  },
});

export default CustomBackHeader;
