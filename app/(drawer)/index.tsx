import { 
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ViewStyle,
  TextStyle,
  ImageStyle,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Text, View } from '../../components/Themed';
import { useState } from 'react';


export default function TabOneScreen() {
  const [value, setValue] = useState(0);
  return (
    <>
    <SafeAreaView style={styles.safeArea}>
 
     <ScrollView style={styles.container}>

      <View style={styles.container}>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={1}
          minimumTrackTintColor="#FFFFFF"
          maximumTrackTintColor="#000000"
          onValueChange={setValue}
          value={value}
        />
      </View>
        {/* Header */}
     
      {/* Button Rows */}
      <View style={styles.buttonRow}>
        {/* Button components */}
        <Button title="LIVE" />
        <Button title="AUDIO" />
        {/* More buttons */}
      </View>

      {/* Additional Button Rows as needed */}
      <View style={styles.buttonRow}>
        {/* Button components */}
        <Button title="PHOTOS" />
        <Button title="DEITIES" />
        {/* More buttons */}
      </View>

      <View style={styles.buttonRow}>
        {/* Button components */}
        <Button title="YATRAS" />
        <Button title="NEWS" />
        {/* More buttons */}
      </View>

      <View style={styles.buttonRow}>
        {/* Button components */}
        <Button title="SEARCH VIDEOS" />
        <Button title="RECENT UPLOAD" />
        {/* More buttons */}
      </View>

      <View style={styles.buttonRow}>
        {/* Button components */}
        <Button title="QUOTES" />
        <Button title="BOOKS" />
        {/* More buttons */}
      </View>
    </ScrollView>
    </SafeAreaView>
    {/* Footer */}
    <View style={styles.footer}>
      <FooterButton title="CHANTING" />
      {/* More footer buttons */}
    </View>
    </>
  
  );
}

// Button component
type ButtonProps = {
  title: string;
};

const Button: React.FC<ButtonProps> = ({ title }) => (
  <View style={styles.buttonContainer}>
    <Image
      source={require('../../assets/images/placeholder_355_200.png')} // Replace with your local or network image
      style={styles.buttonImage}
    />
    <Text style={styles.buttonText}>{title}</Text>
  </View>
);

// FooterButton component
const FooterButton: React.FC<ButtonProps> = ({ title }) => (
  <TouchableOpacity style={styles.footerButton}>
    <Text style={styles.footerText}>{title}</Text>
  </TouchableOpacity>
);

// Style definitions
interface Styles {
  slider: ViewStyle;
  safeArea: ViewStyle;
  container: ViewStyle;
  header: ViewStyle;
  menuButton: ViewStyle;
  menuText: TextStyle;
  headerText: TextStyle;
  buttonRow: ViewStyle;
  buttonContainer: ViewStyle;
  buttonImage: ImageStyle;
  buttonText: TextStyle;
  footer: ViewStyle;
  footerButton: ViewStyle;
  footerText: TextStyle;
}

const styles = StyleSheet.create<Styles>({
  slider: {
    width: 200, 
    height: 40,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFDF8',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFDF8',
  },
  header: {
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'coral',

  },
  menuButton: {
    position: 'absolute',
    left: 10,
    top: 15,
  },
  menuText: {
    fontSize: 28,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
  },
  buttonContainer: {
    alignItems: 'center',
    width: 100, // Set a fixed width
  },
  buttonImage: {
    width: 178, // Set your desired image width
    height: 100, // Set your desired image height
    marginBottom: 8, // Space between image and text
  },
  buttonText: {
    color: '#000',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  footer: {
    height: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FCDCCB',
  },
  footerButton: {
    // Define your footer button styles here
  },
  footerText: {
    color: 'brown',
    fontWeight: 'bold',
  },
});
