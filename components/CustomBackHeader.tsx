import {Text, View} from './Themed';
import {StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { FontAwesome } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

type DrawerParamList = {
  Home: undefined;
  // Add other routes here
  index: undefined;
};

function CustomBackHeader({title}: {title: string}) {
  const navigation = useNavigation<DrawerNavigationProp<DrawerParamList, 'Home'>>();

  return (
    <>
      <StatusBar style="light" />
    <SafeAreaView style={styles.safeArea} edges={['right', 'top', 'left']}>
      <View style={styles.header}>
      <TouchableOpacity  style={styles.leftItem} hitSlop={{top: 20, bottom: 20, left: 20, right: 20}} onPress={() => navigation.navigate('index')}>
         <FontAwesome name="angle-left" size={32} color="white" />
      </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.headerText}>{title}</Text>
        </View>
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
  titleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    fontSize: 28,
    fontWeight: 'bold',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ED4D4E', // Choose your color
  },
  leftItem: {
    zIndex: 1,
    fontSize: 28,
    color: 'white',
},
  headerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white', // Choose your color
  },
});

export default CustomBackHeader;
