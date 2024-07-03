// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries  
import { Platform, StyleSheet, ScrollView } from "react-native";
import EBooksScreen from "../EbooksScreen";

const PlaylistScreen = () => {
  return (
  <ScrollView style={scrollViewStyle}>
  <EBooksScreen vponly={true} />
  </ScrollView>
  )
};

const styles = StyleSheet.create({
  scrollViewStyle: {},
});

const scrollViewStyle = Platform.OS === 'web' 
    ? { height: '100vh', overflowY: 'scroll' as 'scroll' }
    : styles.scrollViewStyle;

export default PlaylistScreen;