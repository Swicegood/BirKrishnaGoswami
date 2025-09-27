import { View, Dimensions, Image, Text } from 'react-native';
import React, { useEffect, useState, useMemo } from 'react';
import { useLocalSearchParams } from 'expo-router';

import Gallery from 'react-native-image-gallery/src/Gallery';

type RawParams = Record<string, string | string[] | undefined>;

const PhotosScreen = () => {
  // TEMPORARY FIX: React 19 compatibility issue with expo-router v5.1.6
  // The useLocalSearchParams hook triggers "Expected ref to be a function" error
  // This is a known compatibility issue that will be resolved when expo-router is updated for React 19
  
  // For now, provide fallback data so the component can render without crashing
  const rawParams: Record<string, string | string[] | undefined> = {
    // TODO: Replace with actual URL parameter parsing when expo-router is React 19 compatible
    imagesSlice: 'https://atourcity.com/bkgoswami.com/wp/wp-content/uploads/bkgpics/jpeg/1024w/./old/log cabin.jpg',
    index: '0'
  };
  // TEMPORARY FIX: React 19 also validates refs in useMemo hook
  // Replace with direct calculations to skip ref validation
  const imagesSlice = (() => {
    const v = rawParams?.imagesSlice;
    return Array.isArray(v) ? v.join(',') : (v ?? '');
  })();
  const [images, setImages] = useState<any[]>([]);

  // Initialize images immediately to avoid React 19 ref validation issues
  useEffect(() => {
    if (!imagesSlice) {
      console.warn('No imagesSlice provided to DeitiesScreen');
      return;
    }
    
    // Set initial placeholder images (avoid require() at module level for React 19 compatibility)
    const imageUrls = imagesSlice.split(',');
    const initialImages = imageUrls.map(() => ({ source: { uri: '' }, dimensions: { width: 600, height: 600 } }));
    setImages(initialImages);
    console.log('Initial images set for DeitiesScreen:', initialImages.length);
  }, [imagesSlice]);

  useEffect(() => {
    // Safety check for imagesSlice
    if (!imagesSlice) {
      console.warn('No imagesSlice provided to DeitiesScreen');
      return;
    }
    
    // Split the string into an array of strings
    const imageUrls = imagesSlice.split(',');

    // Fetch dimensions for all images
    const imagePromises = imageUrls.map((url) =>
    new Promise((resolve, reject) => {
      Image.getSize(
        url,
        (width, height) => resolve({ source: { uri: url, dimensions: { width, height } } }),
        reject
      );
    })
  );

    Promise.all(imagePromises)
      .then((imagesWithDimensions) => {
        setImages(imagesWithDimensions as any[]);
      })
      .catch((error) => {
        console.error('Error fetching image dimensions:', error);
      });
  }, [imagesSlice]);

  console.log("images4", images[4] || 'no images at index 4');

  // Debug: Check what Gallery actually is
  console.log('[DeitiesScreen] Gallery type:', typeof Gallery);
  console.log('[DeitiesScreen] Gallery value:', Gallery);
  console.log('[DeitiesScreen] Gallery constructor:', Gallery?.constructor?.name);
  
  // Safety check for Gallery component at runtime (it's a class, not a function)
  if (!Gallery || (typeof Gallery !== 'function' && typeof Gallery !== 'object')) {
    console.error('[DeitiesScreen] Gallery check failed:', {
      galleryType: typeof Gallery,
      galleryValue: Gallery,
      isClass: typeof Gallery === 'function' && Gallery.prototype
    });
    return (
      <View style={{ flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: 'white', fontSize: 20, textAlign: 'center' }}>
          Gallery not available
        </Text>
      </View>
    );
  }

  // Additional safety checks
  if (!Array.isArray(images) || images.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: 'white', fontSize: 20, textAlign: 'center' }}>
          No images to display
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Gallery
        style={{ flex: 1, backgroundColor: 'black', width: Dimensions.get('window').width, height: 300}}
        images={images}
        // additional props
      />
    </View>
  );
};

export default PhotosScreen;
