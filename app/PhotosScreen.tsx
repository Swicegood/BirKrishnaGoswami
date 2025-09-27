import { View, Dimensions, Image, Text } from 'react-native';
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useLocalSearchParams } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import logger from '../utils/logger';

// Import Gallery properly - it's a class component, not a function
import Gallery from 'react-native-image-gallery/src/Gallery';

// Move require() inside useEffect to avoid React 19 ref validation issues

type RawParams = Record<string, string | string[] | undefined>;

const PhotosScreen = () => {
  // React 19 COMPATIBLE: Now that we've fixed the Gallery component's ref issues,
  // we can safely use useLocalSearchParams again
  const rawParams = useLocalSearchParams();

  // React 19 COMPATIBLE: Extract parameters safely
  const imagesSlice = (() => {
    const v = rawParams?.imagesSlice;
    return Array.isArray(v) ? v.join(',') : (v ?? '');
  })();

  const captionsSlice = (() => {
    const v = rawParams?.captionsSlice;
    return Array.isArray(v) ? v.join(',') : (v ?? '');
  })();

  const index = (() => {
    const v = rawParams?.index;
    return Array.isArray(v) ? (v[0] ?? '0') : (v ?? '0');
  })();
  
  // Enhanced logging for PhotosScreen
  try {
    logger.info('PhotosScreen component started', { 
      hasImagesSlice: !!imagesSlice, 
      hasCaptionsSlice: !!captionsSlice, 
      hasIndex: !!index 
    }, 'PhotosScreen');
  } catch (error) {
    console.error('Logger error in PhotosScreen:', error);
  }

  console.log("index", index);
  console.log("parseInt(index, 10)", index ? parseInt(index, 10) : -1);
  
  const imageUrls = imagesSlice ? imagesSlice.split(',') : [];
  const captions = captionsSlice ? captionsSlice.split(',') : [];
  
  logger.debug('Parsed image data', { 
    imageCount: imageUrls.length, 
    captionCount: captions.length,
    urls: imageUrls,
    index: index 
  }, 'PhotosScreen');

  // React 19 COMPATIBLE - Initialize state with simple, predictable values
  // Use empty array first, then populate via useEffect to avoid ref validation issues
  const [images, setImages] = useState([]);
  const [imageHeight, setImageHeight] = useState(0);
  const [imageWidth, setImageWidth] = useState(0);
  // React 19 fix: Use state instead of useRef to avoid ref validation issues
  const [isMounted, setIsMounted] = useState(true);

  // Initialize images immediately to avoid React 19 ref validation issues
  useEffect(() => {
    // Create placeholder image inside useEffect to avoid require() ref validation issues
    const placeholderImage = { 
      source: require('../assets/images/placeholder-podq8jasdkjc0jdfrw96hbgsm3dx9f5s9dtnqlglf4.png'), 
      dimensions: { width: 600, height: 600 },
      caption: ''
    };
    const initialImages = imageUrls.length > 0 ? imageUrls.map(() => placeholderImage) : [];
    setImages(initialImages);
    logger.debug('Initial images set', { count: initialImages.length }, 'PhotosScreen');
  }, [imageUrls.length]);

  useEffect(() => {
    logger.info('PhotosScreen mounting', null, 'PhotosScreen');
    
    getImageHeight().then((height) => {
      setImageHeight(height);
      logger.debug('Image height set', { height }, 'PhotosScreen');
    }); // set the initial height when the component mounts
    getImageWidth().then((width) => {
      setImageWidth(width);
      logger.debug('Image width set', { width }, 'PhotosScreen');
    }); // set the initial width when the component mounts

    // Store the subscription object in a variable
    const subscription = ScreenOrientation.addOrientationChangeListener(handleOrientationChange);
    logger.debug('Screen orientation listener added', null, 'PhotosScreen');

    return () => {
      // Pass the subscription object to removeOrientationChangeListener
      ScreenOrientation.removeOrientationChangeListener(subscription);
      logger.debug('Screen orientation listener removed', null, 'PhotosScreen');
    };
  }, []);

  useEffect(() => {
    logger.info('Starting image loading process', { 
      imageSliceLength: imagesSlice?.length || 0 
    }, 'PhotosScreen');

    // Split the string into an array of strings
    const imageUrls = imagesSlice ? imagesSlice.split(',') : [];

    // Initialize images with placeholder
    logger.debug('Initializing images with placeholder', { 
      placeholderCount: imageUrls.length 
    }, 'PhotosScreen');

    // Fetch dimensions for all images
    const imagePromises = imageUrls.map((url, index) => {
      logger.debug('Fetching image dimensions', { 
        url, 
        imageIndex: index 
      }, 'PhotosScreen');
      
      return new Promise((resolve, reject) => {
        Image.getSize(
          url,
          (width, height) => {
            if (isMounted) {
              logger.debug('Image dimensions fetched', { 
                url, 
                width, 
                height,
                index 
              }, 'PhotosScreen');
              resolve({ 
                source: { uri: url }, 
                dimensions: { width, height },
                caption: captions[index] || '' 
              });
            }
          },
          (error) => {
            logger.error('Failed to get image dimensions', { 
              url, 
              error: error.message || error,
              index 
            }, 'PhotosScreen');
            reject(error);
          }
        );
      });
    });

    Promise.all(imagePromises)
      .then((imagesWithDimensions) => {
        logger.info('All image dimensions fetched successfully', { 
          count: imagesWithDimensions.length,
          isMounted,
          images: imagesWithDimensions
        }, 'PhotosScreen');
        if (isMounted) {
          setImages(imagesWithDimensions as any[]);
          logger.info('Images state updated', { 
            newCount: imagesWithDimensions.length 
          }, 'PhotosScreen');
        } else {
          logger.warn('Component unmounted, skipping setImages', null, 'PhotosScreen');
        }
      })
      .catch((error) => {
        logger.error('Error fetching image dimensions', { 
          error: error.message || error,
          stack: error.stack 
        }, 'PhotosScreen');
        console.error('Error fetching image dimensions:', error);
      });

    // Clean up function
    return () => {
      logger.debug('PhotosScreen cleanup', null, 'PhotosScreen');
    };
  }, [imagesSlice]);

  // Cleanup effect to set isMounted to false
  useEffect(() => {
    logger.debug('Component mounted, isMounted set to true', null, 'PhotosScreen');
    return () => {
      logger.debug('Component unmounting, isMounted set to false', null, 'PhotosScreen');
      setIsMounted(false);
    };
  }, []);


  function handleOrientationChange() {
    logger.debug('Handling orientation change', null, 'PhotosScreen');
    getImageHeight().then((height) => {
      setImageHeight(height);
      logger.debug('Orientation change - height updated', { height }, 'PhotosScreen');
    });
    getImageWidth().then((width) => {
      setImageWidth(width);
      logger.debug('Orientation change - width updated', { width }, 'PhotosScreen');
    });
  }

  async function getImageHeight() {
    const orientation = await ScreenOrientation.getOrientationAsync();
    const screenWidth = Dimensions.get('window').width;
    const screenHeight = Dimensions.get('window').height;

    if (orientation === ScreenOrientation.Orientation.PORTRAIT_UP || orientation === ScreenOrientation.Orientation.PORTRAIT_DOWN) {
      // In portrait mode, set height based on screen width and aspect ratio
      return screenWidth * 9 / 16;
    } else {
      // In landscape mode, set height to screen height
      return screenHeight;
    }
  }

  async function getImageWidth() {
    const orientation = await ScreenOrientation.getOrientationAsync();
    const screenWidth = Dimensions.get('window').width;
    const screenHeight = Dimensions.get('window').height;

    if (orientation === ScreenOrientation.Orientation.PORTRAIT_UP || orientation === ScreenOrientation.Orientation.PORTRAIT_DOWN) {
      // In portrait mode, set height based on screen width and aspect ratio
      return screenWidth;
    } else {
      // In landscape mode, set height to screen height
      return screenHeight;
    }
  }

  logger.debug('Current images state', { 
    imagesLength: images.length,
    currentImageIndex: index ? parseInt(index, 10) : 0 
  }, 'PhotosScreen');
  console.log("images", images[parseInt(index || '0', 10)]);

  const shiftedImages = [...images];
  const shiftedCaptions = captions ? [...captions] : [];

  if (index) {
    const currentIndex = parseInt(index || '0', 10);
    const beginning = shiftedImages.splice(currentIndex);
    shiftedImages.unshift(...beginning);
    logger.debug('Image shifting performed', { 
      currentIndex, 
      shiftedLength: shiftedImages.length 
    }, 'PhotosScreen');

    if (captions) {
      const beginningCaptions = shiftedCaptions.splice(currentIndex);
      shiftedCaptions.unshift(...beginningCaptions);
      logger.debug('Caption shifting performed', { 
        captionLength: shiftedCaptions.length 
      }, 'PhotosScreen');
    }
  }
  
  logger.debug('Rendering PhotoGallery', { 
    finalImageCount: shiftedImages.length,
    captionCount: shiftedCaptions.length 
  }, 'PhotosScreen');
  
  console.log("shiftedImages", images[0]?.source?.uri || images[0]?.source || 'no source found');

  // Debug: Check what Gallery actually is
  console.log('Gallery type:', typeof Gallery);
  console.log('Gallery value:', Gallery);
  console.log('Gallery constructor:', Gallery?.constructor?.name);
  console.log('Gallery is class:', typeof Gallery === 'function' && Gallery.prototype);
  
  // Safety check for Gallery component at runtime (it's a class, not a function)
  if (!Gallery || (typeof Gallery !== 'function' && typeof Gallery !== 'object')) {
    logger.error('Gallery is not available or not a valid component', {
      galleryType: typeof Gallery,
      isNull: Gallery === null,
      galleryValue: Gallery,
      isClass: typeof Gallery === 'function' && Gallery.prototype
    }, 'PhotosScreen');
    return (
      <View style={{ flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: 'white', fontSize: 20, textAlign: 'center' }}>
          Gallery not available
        </Text>
      </View>
    );
  }

  // Additional safety checks
  if (!Array.isArray(shiftedImages) || shiftedImages.length === 0) {
    logger.warn('No images to display in gallery', { shiftedImagesLength: shiftedImages?.length }, 'PhotosScreen');
    return (
      <View style={{ flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: 'white', fontSize: 20, textAlign: 'center' }}>
          No images to display
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: 'black', position: 'relative' }}>
      <Gallery
        style={{ width: Dimensions.get('window').width, height: 300 }}
        images={shiftedImages}
      />
      <View style={{ flex: 1, alignItems: 'center', position: 'absolute', top: '80%', left: 0, right: 0 }}>
        <Text style={{ color: 'white', fontSize: 20, textAlign: 'center' }}>
          {shiftedCaptions ? shiftedCaptions[0]: ''}
        </Text>
      </View>
    </View>
  );

};
export default PhotosScreen;