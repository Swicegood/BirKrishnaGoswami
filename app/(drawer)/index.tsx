import { StyleSheet,ScrollView, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';

import { Text, View } from '../../components/Themed';

export default function TabOneScreen() {
  return (
    <ScrollView style={styles.container}>
    <View style={styles.header}>
      <TouchableOpacity style={styles.menuButton}>
        {/* Replace with an icon component if available, e.g., <Icon name="menu" size={24} color="#fff" /> */}
        <Text style={styles.menuText}>☰</Text>
      </TouchableOpacity>
      <Text style={styles.headerText}>Main Page</Text>
    </View>

    {/* Button Rows */}
    <View style={styles.buttonRow}>
      {/* Button components */}
      <Button title="YATRAS" />
      <Button title="NEWS" />
      {/* More buttons */}
    </View>

    {/* Additional Button Rows as needed */}

    {/* Footer */}
    <View style={styles.footer}>
      <FooterButton title="CHANTING" />
      {/* More footer buttons */}
    </View>
  </ScrollView>
  );
}

// Button component
type ButtonProps = {
  title: string;
};

const Button: React.FC<ButtonProps> = ({ title }) => (
  <TouchableOpacity style={styles.button}>
    <Text style={styles.buttonText}>{title}</Text>
  </TouchableOpacity>
);

// FooterButton component
const FooterButton: React.FC<ButtonProps> = ({ title }) => (
  <TouchableOpacity style={styles.footerButton}>
    <Text style={styles.footerText}>{title}</Text>
  </TouchableOpacity>
);

// Style definitions
interface Styles {
  container: ViewStyle;
  header: ViewStyle;
  menuButton: ViewStyle;
  menuText: TextStyle;
  headerText: TextStyle;
  buttonRow: ViewStyle;
  button: ViewStyle;
  buttonText: TextStyle;
  footer: ViewStyle;
  footerButton: ViewStyle;
  footerText: TextStyle;
}

const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  button: {
    backgroundColor: 'skyblue',
    padding: 20,
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  footer: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'coral',
  },
  footerButton: {
    // Style similar to menuButton
  },
  footerText: {
    color: '#fff',
  },
  // Additional styles as needed
});
