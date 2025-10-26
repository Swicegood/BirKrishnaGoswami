// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries  
import { Platform, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import EBooksScreen from "./EbooksScreen";

const VPBooksScreen = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={scrollViewStyle}>
        <EBooksScreen vponly={true} />
      </ScrollView>
    </SafeAreaView>
  )
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFDF8',
  },
  scrollViewStyle: {
    flex: 1,
  },
});

const scrollViewStyle = Platform.OS === 'web' 
    ? { flex: 1, overflowY: 'scroll' as 'scroll' }
    : styles.scrollViewStyle;

export default VPBooksScreen;
