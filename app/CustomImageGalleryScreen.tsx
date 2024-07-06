import React, { useState, useEffect } from 'react';
import { View, Image, StyleSheet, Dimensions, TouchableOpacity, Platform, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

const PhotosScreen = () => {
  const { imagesSlice, index } = useLocalSearchParams<{ imagesSlice: string, index: string }>();
  const [images, setImages] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(parseInt(index || '0', 10));

  useEffect(() => {
    if (imagesSlice) {
      setImages(imagesSlice.split(','));
    }
  }, [imagesSlice]);

  const nextImage = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

  if (images.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.prevButton} onPress={prevImage}>
        <Text style={styles.buttonText}>{'<'}</Text>
      </TouchableOpacity>
      <Image
        source={{ uri: images[currentIndex] }}
        style={styles.image}
        resizeMode="contain"
      />
      <TouchableOpacity style={styles.nextButton} onPress={nextImage}>
        <Text style={styles.buttonText}>{'>'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  prevButton: {
    position: 'absolute',
    left: 10,
    top: '50%',
    zIndex: 1,
  },
  nextButton: {
    position: 'absolute',
    right: 10,
    top: '50%',
    zIndex: 1,
  },
  buttonText: {
    color: 'white',
    fontSize: 24,
  },
});

export default PhotosScreen;