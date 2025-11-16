import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ViewStyle,
  TextStyle,
  ImageStyle,
  Dimensions,
  Linking,
  ImageBackground,
  Platform,
} from 'react-native';
import Carousel, { Pagination } from 'react-native-snap-carousel';
import { Text, View } from '../../components/Themed';
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'expo-router';
import { collection, query, getDocs } from "firebase/firestore";
import NotificationHandler from '../api/notifications';
import { db } from '../api/firebase';
import GuageView from '../../components/GuageView';
import * as SafeAreaViewContext from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '../../utils/logger';

const ORIENTATION_THRESHOLD = 0.1; // 10% threshold

const ENTRIES = [
  { title: 'Slide 1', image: require('../../assets/images/Thought_of_the_Day.png'), link: '../QuoteScreen' },
  { title: 'Slide 2', image: require('../../assets/images/News.png'), link: './NewsScreen' },
  { title: 'Slide 3', image: require('../../assets/images/Memories.png'), link: './MemoriesScreen' },
  { title: 'Slide 4', image: require('../../assets/images/Books_and_Ebooks.png'), link: '../BooksScreen' },
  { title: 'Slide 5', image: require('../../assets/images/Vyasa_Puja.png'), link: '../(tabs3)/VPPlaylistScreen' },
  // Add more entries here
];

const windowWidth = Dimensions.get('window').width;
const sliderHeight = windowWidth / 3;

const isTablet = () => {
  const { width, height } = Dimensions.get('window');
  const aspectRatio = width / height;
  const isLandscape = Math.min(width, height) >= 600 && (aspectRatio > 1.2 || aspectRatio < 0.9);
  return isLandscape;
}

export default function TabOneScireen() {
  const [value, setValue] = useState(0);
  const [activeSlide, setActiveSlide] = useState(0); // Add this state variable
  const [whatsAppUrl, setWhatsAppUrl] = useState('https://chat.whatsapp.com/FaPXfrT3qBLBSxd04TZr9X');
  const [updateKey, setUpdateKey] = useState(0); // Add a key to force updates
  const [width, setWidth] = useState(Dimensions.get('window').width);
  const [height, setHeight] = useState(Dimensions.get('window').height);
  const initialOrientation = 'LANDSCAPE';
  const [isOrientationInitialized, setIsOrientationInitialized] = useState(false);
  const [orientation, setOrientation] = useState(
    Dimensions.get('window').width > Dimensions.get('window').height ? 'LANDSCAPE' : 'PORTRAIT'
  );


  if (Platform.OS !== 'web') {
    // Initialize and handle push notifications for non-web platforms
    const expoPushToken = NotificationHandler();
  }

  const handleOrientationChange = () => {
    const newWidth = Dimensions.get('window').width;
    const newHeight = Dimensions.get('window').height;
    const aspectRatio = newWidth / newHeight;
    const previousAspectRatio = width / height;

    // Only change orientation if the aspect ratio change is significant
    if (Math.abs(aspectRatio - previousAspectRatio) > ORIENTATION_THRESHOLD) {
      const newOrientation = newWidth > newHeight ? 'LANDSCAPE' : 'PORTRAIT';
      setOrientation(newOrientation);
    }

    setWidth(newWidth);
    setHeight(newHeight);
    console.log('HandleOrientation Called :', orientation);
  }

  const onSetWidth = (newWidth) => {
    console.log(`${new Date().toISOString()}onSetWidth called: ', ${newWidth}`);
    setWidth(newWidth);
  };

  const onSetOrientation = (orientation: string) => {
    if (Platform.OS === 'web') {
      handleOrientationChange(orientation);
    } else {
      setOrientation(orientation);
    }
  };

  useEffect(() => {
    console.log('Orientation changed to:', orientation);
  }, [orientation]);

  useEffect(() => {
    if (!isOrientationInitialized) {
      setIsOrientationInitialized(true);
    }
  }, []);

  useEffect(() => {
    const fetchWhatsAppUrl = async () => {
      const q = query(collection(db, 'whatsapp'));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        // doc.data() returns an object with title, blurb, imageurl, and purchaseurl
        setWhatsAppUrl(doc.data().url);
      });
    }

    fetchWhatsAppUrl();
  }, []);

  // Clean up logs older than 24 hours when home screen renders
  useEffect(() => {
    const cleanupOldLogs = async () => {
      try {
        const jsonValue = await AsyncStorage.getItem('@debug_logs');
        if (jsonValue !== null) {
          const logs = JSON.parse(jsonValue);
          const now = Date.now();
          const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000); // 24 hours in milliseconds
          
          // Filter out logs older than 24 hours
          const recentLogs = logs.filter((log: any) => {
            const logTime = new Date(log.timestamp).getTime();
            return logTime > twentyFourHoursAgo;
          });
          
          // Only update storage if we actually removed some logs
          if (recentLogs.length < logs.length) {
            await AsyncStorage.setItem('@debug_logs', JSON.stringify(recentLogs));
            logger.info('Cleaned up old debug logs', {
              originalCount: logs.length,
              remainingCount: recentLogs.length,
              removedCount: logs.length - recentLogs.length
            }, 'HomeScreen');
          }
        }
      } catch (error) {
        logger.error('Error cleaning up old debug logs', {
          error: error instanceof Error ? error.message : String(error)
        }, 'HomeScreen');
      }
    };

    cleanupOldLogs();
  }, []);


  function renderItem({ item, index }: { item: any, index: number }) {
    return (
      <Link href={item.link}>
        <View style={styles.slide}>
          <Image source={item.image} style={{ ...styles.image, width: getImageWidth(), height: getImageHeight() }} />
        </View>
      </Link>
    );
  }

  const getImageWidth = () => {
    if (isTablet() || Platform.OS === 'web') {
      if (orientation === 'LANDSCAPE') {
        return width * 0.8;
      }
      return width;
    }
    if (orientation === 'LANDSCAPE') {
      return width * 0.25;
    }
    return width;
  }

  const getImageHeight = () => {
    if (isTablet() || Platform.OS === 'web') {
      return getImageWidth() * .346 + 5;
    }
    if (orientation === 'LANDSCAPE') {
      return getImageWidth() * .346;
    }
    return 160;
  }

  const getTopPosition = () => {
    if (isTablet() || Platform.OS === 'web') {
      if (orientation === 'LANDSCAPE') {
        return width * .8 / 3 - 30;
      }
      return width / 3 - 30;
    }
    if (orientation === 'LANDSCAPE') {
      return width * .8 / 3 - 30;
    }
    return width / 2.5 - 30;
  }


  const renderCarousel = () => {
    const sliderWidth = getImageWidth();
    const itemWidth = getImageWidth();
    if (sliderWidth > 0 && itemWidth > 0) {
      return (
        <Carousel
          data={ENTRIES}
          renderItem={renderItem}
          sliderWidth={sliderWidth}
          itemWidth={itemWidth}
          autoplay={true}
          autoplayInterval={3000} // Change this to adjust the delay (in milliseconds)
          loop={true}
          loopClonesPerSide={5}
          onSnapToItem={(index) => setActiveSlide(index)} // Add this prop
        />
      );
    }
    return null;
  }

  const renderPagination = () => {
    return (
      <Pagination // Add this component
        dotsLength={ENTRIES.length}
        activeDotIndex={activeSlide}
        containerStyle={{ backgroundColor: 'transparent', paddingVertical: 0, marginTop: 10, marginBottom: 10 }}
        dotStyle={{
          width: 8,
          height: 8,
          borderRadius: 5,
          marginHorizontal: 0,
          backgroundColor: 'rgba(169, 89, 45, 0.92)' // Change this to the color you want for the active dot
        }}
        inactiveDotStyle={{
          backgroundColor: 'white' // Change this to the color you want for the inactive dots
        }}
        inactiveDotOpacity={0.4}
        inactiveDotScale={0.6}
      />
    );
  }

  // Web-only: render 12 buttons in 2 rows of 6 (primarily for landscape)
  const renderWebButtonRows = () => {
    if (Platform.OS !== 'web') {
      return null;
    }
    const buttons = [
      (
        <Link key="live" href="./LiveScreen" asChild>
          <TouchableOpacity style={styles.buttonContainer}>
            <Image
              source={require('../../assets/images/Live_Streaming.png')}
              style={styles.buttonImage}
            />
            <Text style={styles.buttonText}>LIVE</Text>
          </TouchableOpacity>
        </Link>
      ),
      (
        <Link key="audio" href="./AudioStartScreen" asChild>
          <TouchableOpacity style={styles.buttonContainer}>
            <Image
              source={require('../../assets/images/Audio.png')}
              style={styles.buttonImage}
            />
            <Text style={styles.buttonText}>AUDIO</Text>
          </TouchableOpacity>
        </Link>
      ),
      (
        <Link key="pictures" href="./GurudevaPicsScreen" asChild>
          <TouchableOpacity style={styles.buttonContainer}>
            <Image
              source={require('../../assets/images/Pictures.png')}
              style={styles.buttonImage}
            />
            <Text style={styles.buttonText}>PICTURES</Text>
          </TouchableOpacity>
        </Link>
      ),
      (
        <Link key="deities" href="./DeityGallery" asChild>
          <TouchableOpacity style={styles.buttonContainer}>
            <Image
              source={require('../../assets/images/Deities.png')}
              style={styles.buttonImage}
            />
            <Text style={styles.buttonText}>DEITIES</Text>
          </TouchableOpacity>
        </Link>
      ),
      (
        <Link key="temples" href="./TemplesScreen" asChild>
          <TouchableOpacity style={styles.buttonContainer}>
            <Image
              source={require('../../assets/images/Temples.png')}
              style={styles.buttonImage}
            />
            <Text style={styles.buttonText}>TEMPLES</Text>
          </TouchableOpacity>
        </Link>
      ),
      (
        <Link key="blog" href="./BlogScreen" asChild>
          <TouchableOpacity style={styles.buttonContainer}>
            <Image
              source={require('../../assets/images/Blog.png')}
              style={styles.buttonImage}
            />
            <Text style={styles.buttonText}>BLOG</Text>
          </TouchableOpacity>
        </Link>
      ),
      (
        <Link key="search" href="./SearchYouTubeScreen" asChild>
          <TouchableOpacity style={styles.buttonContainer}>
            <Image
              source={require('../../assets/images/Search_Videos.png')}
              style={styles.buttonImage}
            />
            <Text style={styles.buttonText}>SEARCH VIDEOS</Text>
          </TouchableOpacity>
        </Link>
      ),
      (
        <Link key="recent" href="./(tabs)/RecentUploads" asChild>
          <TouchableOpacity style={styles.buttonContainer}>
            <Image
              source={require('../../assets/images/Recent_Uploads.png')}
              style={styles.buttonImage}
            />
            <Text style={styles.buttonText}>RECENT UPLOADS</Text>
          </TouchableOpacity>
        </Link>
      ),
      (
        <Link key="quotes" href="./QuoteScreen" asChild>
          <TouchableOpacity style={styles.buttonContainer}>
            <Image
              source={require('../../assets/images/quotes.png')}
              style={styles.buttonImage}
            />
            <Text style={styles.buttonText}>QUOTES</Text>
          </TouchableOpacity>
        </Link>
      ),
      (
        <Link key="books" href="./BooksScreen" asChild>
          <TouchableOpacity style={styles.buttonContainer}>
            <Image
              source={require('../../assets/images/Books.png')}
              style={styles.buttonImage}
            />
            <Text style={styles.buttonText}>BOOKS</Text>
          </TouchableOpacity>
        </Link>
      ),
      (
        <Link key="vp" href="../(tabs3)/VPPlaylistScreen" asChild>
          <TouchableOpacity style={styles.buttonContainer}>
            <Image
              source={require('../../assets/images/Vyasa-Puja-Button.png')}
              style={styles.buttonImage}
            />
            <Text style={styles.buttonText}>VYASA PUJA</Text>
          </TouchableOpacity>
        </Link>
      ),
      (
        <Link key="vp-books" href="../VPBooksScreen" asChild>
          <TouchableOpacity style={styles.buttonContainer}>
            <Image
              source={require('../../assets/images/vyasa-puja-books.png')}
              style={styles.buttonImage}
            />
            <Text style={styles.buttonText}>VP BOOKS</Text>
          </TouchableOpacity>
        </Link>
      ),
    ];
    return (
      <>
        <View style={styles.buttonRow}>
          {buttons.slice(0, 6)}
        </View>
        <View style={styles.buttonRow}>
          {buttons.slice(6, 12)}
        </View>
      </>
    );
  }

  return (
    <>
      <SafeAreaView style={styles.safeArea}>
        <GuageView onSetOrientation={onSetOrientation} onSetWidth={onSetWidth}>
          {(orientation === 'PORTRAIT') ? (
            <View style={styles.carousel}>
              {renderCarousel()}
              <View style={{ position: 'absolute', top: getTopPosition(), left: width / 2 - 80, backgroundColor: 'transparent' }}>
                {renderPagination()}
              </View>
            </View>
          ) : (
            <View style={{ ...styles.carousel, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ backgroundColor: '#E53935', width: (width - getImageWidth()) / 2, height: getImageHeight(), marginTop: -5 }} />
              {renderCarousel()}
              <View style={{ backgroundColor: '#E53935', width: (width - getImageWidth()) / 2, height: getImageHeight(), marginTop: -5 }} />
              <View style={{ position: 'absolute', top: getTopPosition(), left: width / 2 - 80, backgroundColor: 'transparent' }}>
                {renderPagination()}
              </View>
            </View>
          )}
        </GuageView>
        <ScrollView style={styles.container}>
          {/* Header */}
          {orientation === 'PORTRAIT' ? (
            <React.Fragment>
              <View style={styles.buttonRow}>
                {/* Button components */}
                <Link href="./LiveScreen" asChild>
                  <TouchableOpacity style={styles.buttonContainer}>
                    <Image
                      source={require('../../assets/images/Live_Streaming.png')} // Replace with your local or network image
                      style={styles.buttonImage}
                    />
                    <Text style={styles.buttonText}>LIVE</Text>
                  </TouchableOpacity>
                </Link>
                <Link href="./AudioStartScreen" asChild>
                  <TouchableOpacity style={styles.buttonContainer}>
                    <Image
                      source={require('../../assets/images/Audio.png')} // Replace with your local or network image
                      style={styles.buttonImage}
                    />
                    <Text style={styles.buttonText}>AUDIO</Text>
                  </TouchableOpacity>
                </Link>
                {/* More buttons */}
              </View>

              {/* Additional Button Rows as needed */}
              <View style={styles.buttonRow}>
                {/* Button components */}
                <Link href="./GurudevaPicsScreen" asChild>
                  <TouchableOpacity style={styles.buttonContainer}>
                    <Image
                      source={require('../../assets/images/Pictures.png')} // Replace with your local or network image
                      style={styles.buttonImage}
                    />
                    <Text style={styles.buttonText}>PICTURES</Text>
                  </TouchableOpacity>
                </Link>
                <Link href="./DeityGallery" asChild>
                  <TouchableOpacity style={styles.buttonContainer}>
                    <Image
                      source={require('../../assets/images/Deities.png')} // Replace with your local or network image
                      style={styles.buttonImage}
                    />
                    <Text style={styles.buttonText}>DEITIES</Text>
                  </TouchableOpacity>
                </Link>
                {/* More buttons */}
              </View>

              <View style={styles.buttonRow}>
                {/* Button components */}
                <Link href="./TemplesScreen" asChild>
                  <TouchableOpacity style={styles.buttonContainer}>
                    <Image
                      source={require('../../assets/images/Temples.png')} // Replace with your local or network image
                      style={styles.buttonImage}
                    />
                    <Text style={styles.buttonText}>TEMPLES</Text>
                  </TouchableOpacity>
                </Link>
                <Link href="./BlogScreen" asChild>
                  <TouchableOpacity style={styles.buttonContainer}>
                    <Image
                      source={require('../../assets/images/Blog.png')} // Replace with your local or network image
                      style={styles.buttonImage}
                    />
                    <Text style={styles.buttonText}>BLOG</Text>
                  </TouchableOpacity>
                </Link>
                {/* More buttons */}
              </View>

              <View style={styles.buttonRow}>
                {/* Button components */}
                <Link href="./SearchYouTubeScreen" asChild>
                  <TouchableOpacity style={styles.buttonContainer}>
                    <Image
                      source={require('../../assets/images/Search_Videos.png')} // Replace with your local or network image
                      style={styles.buttonImage}
                    />
                    <Text style={styles.buttonText}>SEARCH VIDEOS</Text>
                  </TouchableOpacity>
                </Link>
                <Link href="./(tabs)/RecentUploads" asChild>
                  <TouchableOpacity style={styles.buttonContainer}>
                    <Image
                      source={require('../../assets/images/Recent_Uploads.png')} // Replace with your local or network image
                      style={styles.buttonImage}
                    />
                    <Text style={styles.buttonText}>RECENT UPLOADS</Text>
                  </TouchableOpacity>
                </Link>
                {/* More buttons */}
              </View>

              <View style={styles.buttonRow}>
                {/* Button components */}
                <Link href="./QuoteScreen" asChild>
                  <TouchableOpacity style={styles.buttonContainer}>
                    <Image
                      source={require('../../assets/images/quotes.png')} // Replace with your local or network image
                      style={styles.buttonImage}
                    />
                    <Text style={styles.buttonText}>QUOTES</Text>
                  </TouchableOpacity>
                </Link>
                <Link href="./BooksScreen" asChild>
                  <TouchableOpacity style={styles.buttonContainer}>
                    <Image
                      source={require('../../assets/images/Books.png')} // Replace with your local or network image
                      style={styles.buttonImage}
                    />
                    <Text style={styles.buttonText}>BOOKS</Text>
                  </TouchableOpacity>
                </Link>
              </View>

              <View style={styles.buttonRow}>
                {/* Button components */}
                <Link href="../(tabs3)/VPPlaylistScreen" asChild>
                  <TouchableOpacity style={styles.buttonContainer}>
                    <Image
                      source={require('../../assets/images/Vyasa-Puja-Button.png')} // Replace with your local or network image
                      style={styles.buttonImage}
                    />
                    <Text style={styles.buttonText}>VYASA PUJA</Text>
                  </TouchableOpacity>
                </Link>
                <Link href="../VPBooksScreen" asChild>
                  <TouchableOpacity style={styles.buttonContainer}>
                    <Image
                      source={require('../../assets/images/vyasa-puja-books.png')} // Replace with your local or network image
                      style={styles.buttonImage}
                    />
                    <Text style={styles.buttonText}>VP BOOKS</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </React.Fragment>
          ) : (
            <>
              {Platform.OS === 'web' ? (
                renderWebButtonRows()
              ) : (
                <>
                  <View style={styles.buttonRow}>
                    {/* Button components */}
                    <Link href="./LiveScreen" asChild>
                      <TouchableOpacity style={styles.buttonContainer}>
                        <Image
                          source={require('../../assets/images/Live_Streaming.png')} // Replace with your local or network image
                          style={styles.buttonImage}
                        />
                        <Text style={styles.buttonText}>LIVE</Text>
                      </TouchableOpacity>
                    </Link>
                    <Link href="./AudioStartScreen" asChild>
                      <TouchableOpacity style={styles.buttonContainer}>
                        <Image
                          source={require('../../assets/images/Audio.png')} // Replace with your local or network image
                          style={styles.buttonImage}
                        />
                        <Text style={styles.buttonText}>AUDIO</Text>
                      </TouchableOpacity>
                    </Link>
                    {/* More buttons */}
                    <Link href="./GurudevaPicsScreen" asChild>
                      <TouchableOpacity style={styles.buttonContainer}>
                        <Image
                          source={require('../../assets/images/Pictures.png')} // Replace with your local or network image
                          style={styles.buttonImage}
                        />
                        <Text style={styles.buttonText}>PICTURES</Text>
                      </TouchableOpacity>
                    </Link>
                    <Link href="./DeityGallery" asChild>
                      <TouchableOpacity style={styles.buttonContainer}>
                        <Image
                          source={require('../../assets/images/Deities.png')} // Replace with your local or network image
                          style={styles.buttonImage}
                        />
                        <Text style={styles.buttonText}>DEITIES</Text>
                      </TouchableOpacity>
                    </Link>
                    {/* More buttons */}
                    <Link href="./TemplesScreen" asChild>
                      <TouchableOpacity style={styles.buttonContainer}>
                        <Image
                          source={require('../../assets/images/Temples.png')} // Replace with your local or network image
                          style={styles.buttonImage}
                        />
                        <Text style={styles.buttonText}>TEMPLES</Text>
                      </TouchableOpacity>
                    </Link>
                  </View>
                  <View style={styles.buttonRow}>
                    <Link href="./BlogScreen" asChild>
                      <TouchableOpacity style={styles.buttonContainer}>
                        <Image
                          source={require('../../assets/images/Blog.png')} // Replace with your local or network image
                          style={styles.buttonImage}
                        />
                        <Text style={styles.buttonText}>BLOG</Text>
                      </TouchableOpacity>
                    </Link>
                    {/* More buttons */}
                    <Link href="./SearchYouTubeScreen" asChild>
                      <TouchableOpacity style={styles.buttonContainer}>
                        <Image
                          source={require('../../assets/images/Search_Videos.png')} // Replace with your local or network image
                          style={styles.buttonImage}
                        />
                        <Text style={styles.buttonText}>SEARCH VIDEOS</Text>
                      </TouchableOpacity>
                    </Link>
                    <Link href="./(tabs)/RecentUploads" asChild>
                      <TouchableOpacity style={styles.buttonContainer}>
                        <Image
                          source={require('../../assets/images/Recent_Uploads.png')} // Replace with your local or network image
                          style={styles.buttonImage}
                        />
                        <Text style={styles.buttonText}>RECENT UPLOADS</Text>
                      </TouchableOpacity>
                    </Link>
                    {/* More buttons */}
                    <Link href="./QuoteScreen" asChild>
                      <TouchableOpacity style={styles.buttonContainer}>
                        <Image
                          source={require('../../assets/images/quotes.png')} // Replace with your local or network image
                          style={styles.buttonImage}
                        />
                        <Text style={styles.buttonText}>QUOTES</Text>
                      </TouchableOpacity>
                    </Link>
                    <Link href="./BooksScreen" asChild>
                      <TouchableOpacity style={styles.buttonContainer}>
                        <Image
                          source={require('../../assets/images/Books.png')} // Replace with your local or network image
                          style={styles.buttonImage}
                        />
                        <Text style={styles.buttonText}>BOOKS</Text>
                      </TouchableOpacity>
                    </Link>
                    <View style={styles.buttonRow}>
                      {/* Button components */}
                      <Link href="../(tabs3)/VPPlaylistScreen" asChild>
                        <TouchableOpacity style={styles.buttonContainer}>
                          <Image
                            source={require('../../assets/images/Vyasa-Puja-Button.png')} // Replace with your local or network image
                            style={styles.buttonImage}
                          />
                          <Text style={styles.buttonText}>VYASA PUJA</Text>
                        </TouchableOpacity>
                      </Link>
                      <Link href="../VPBooksScreen" asChild>
                        <TouchableOpacity style={styles.buttonContainer}>
                          <Image
                            source={require('../../assets/images/vyasa-puja-books.png')} // Replace with your local or network image
                            style={styles.buttonImage}
                          />
                          <Text style={styles.buttonText}>VP BOOKS</Text>
                        </TouchableOpacity>
                      </Link>
                    </View>
                  </View>
                </>
              )}
            </>
          )
          }

        </ScrollView>
      </SafeAreaView>
      {/* Footer */}
      <SafeAreaViewContext.SafeAreaView edges={['left', 'right']}>
        <ImageBackground
          source={require('../../assets/images/Footer.png')} // replace with your image path
          style={{ ...styles.footer, width: width }}
          resizeMode="cover" // or "contain" depending on your needs
        >
          <View style={{ ...styles.footer, width: width }}>
            <Link href="./ChantingScreen" asChild>
              <TouchableOpacity style={styles.footerButton}>
                <Image source={require('../../assets/images/Chanting.png')} style={styles.footerButton} />
                <Text style={styles.footerText}>CHANTING</Text>
              </TouchableOpacity>
            </Link>
            <Link href="./(drawer)/BioScreen" asChild>
              <TouchableOpacity style={styles.footerButton}>
                <Image source={require('../../assets/images/About_Footer.png')} style={styles.footerButton} />
                <Text style={styles.footerText}>ABOUT</Text>
              </TouchableOpacity>
            </Link>
            <Link href="./LiveScreen" asChild>
              <TouchableOpacity style={styles.footerButton}>
                <Image source={require('../../assets/images/Live.png')} style={styles.footerButtonBig} />
              </TouchableOpacity>
            </Link>
            <Link href="./DonationScreen" asChild>
              <TouchableOpacity style={styles.footerButton}>
                <Image source={require('../../assets/images/Donation.png')} style={styles.footerButton} />
                <Text style={styles.footerText}>DONATION</Text>
              </TouchableOpacity>
            </Link>
            <TouchableOpacity style={styles.footerButton} onPress={() => { Linking.openURL(whatsAppUrl) /* Handle button press */ }}>
              <Image source={require('../../assets/images/WhatsApp.png')} style={styles.footerButton} />
              <Text style={styles.footerText}>WHATSAPP</Text>
            </TouchableOpacity>
          </View>
        </ImageBackground>
      </SafeAreaViewContext.SafeAreaView>
    </>

  );

}

// Style definitions
interface Styles {
  slide: ViewStyle;
  carousel: ViewStyle;
  title: TextStyle;
  image: ImageStyle;
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
  footerButtonBig: ViewStyle;
  footerText: TextStyle;
  imageWide: ImageStyle;
}

const styles = StyleSheet.create<Styles>({
  carousel: {
    marginBottom: 20,
  },
  slide: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#9DD6EB',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  image: {
    resizeMode: 'cover',
  },
  imageWide: {
    resizeMode: 'cover',
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
    marginVertical: 5,
  },
  buttonContainer: {
    alignItems: 'center',
    width: 100, // Set a fixed width
  },
  buttonImage: {
    width: 178, // Set your desired image width
    height: 100, // Set your desired image height
    marginBottom: 8, // Space between image and text
    borderRadius: 5, // Adjust this value as needed
  },
  buttonText: {
    color: '#7e2b18',
    fontWeight: 'bold',
    textAlign: 'center',
    marginLeft: -20,
    marginRight: -20,
    fontFamily: 'OblikBold',
  },
  footer: {
    width: '100%',
    height: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    paddingLeft: 20, // Add this
    paddingRight: 60, // Add this
    paddingBottom: 10, // Add this
  },
  footerButton: {
    width: 36, // Adjust this value as needed
    height: 36, // This is 50% of the footer height
    borderRadius: 18, // This should be half of the button width/height
  },
  footerButtonBig: {
    width: 44, // Adjust this value as needed
    height: 44, // This is 50% of the footer height
    borderRadius: 22, // This should be half of the button width/height
    marginLeft: -5,
  },
  footerText: {
    color: 'maroon',
    fontWeight: 'bold',
    fontSize: 10,
    fontFamily: 'OblikBold',
    marginLeft: -10,
    marginRight: -10,
    textAlign: 'center',
  },
});
