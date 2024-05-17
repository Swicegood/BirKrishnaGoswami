import { Stack } from 'expo-router';
import { StyleSheet, Image } from 'react-native';
import { View } from '../components/Themed';

// This screen is displayed when the user navigates to a screen that doesn't exist.

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={styles.noVideosContainer}>
        <Image source={require('../assets/images/no_videos.png')} style={styles.noVideosImage} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  noVideosContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#edefef',
  },
  noVideosImage: {
    width: '100%',
    height: 600, // Adjust as needed
    resizeMode: 'cover',
  },
});
