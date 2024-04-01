import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { useLocalSearchParams } from 'expo-router';
import * as Progress from 'react-native-progress';

const PdfViewScreen = () => {
  const [progress, setProgress] = useState(0);
  const { url } = useLocalSearchParams<{ url: string }>();
  console.log(url);

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: url }}
        onLoadProgress={({ nativeEvent }) => setProgress(nativeEvent.progress)}
        style={styles.webView}
      />
      {progress < 1 && (
        <View style={styles.progressBarContainer}>
          <Progress.Bar progress={progress} width={200} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webView: {
    flex: 1,
  },
  progressBarContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

export default PdfViewScreen;