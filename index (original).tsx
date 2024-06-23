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
  useWindowDimensions,
  ImageBackground,
  Platform,
} from 'react-native';
import Carousel, { Pagination } from 'react-native-snap-carousel';
import { Text, View } from '../../components/Themed';
import React, { useState, useEffect } from 'react';
import { Link } from 'expo-router';
import { collection, query, getDocs, or } from "firebase/firestore";
import NotificationHandler from '../api/notifications';
import { db } from '../api/firebase';
import MeasureView from '../api/MeasureView';

const ENTRIES = [
  { title: 'Slide 1', image: require('../../assets/images/Thought_of_the_Day.png'), link: '../QuoteScreen' },
  { title: 'Slide 2', image: require('../../assets/images/News.png'), link: './NewsScreen' },
  { title: 'Slide 3', image: require('../../assets/images/Memories.png'), link: './MemoriesScreen' },
  { title: 'Slide 4', image: require('../../assets/images/Books_and_Ebooks.png'), link: '../BooksScreen' },
  { title: 'Slide 5', image: require('../../assets/images/Vyasa_Puja.png'), link: '../(tabs3)/VPPlaylistScreen' },
  // Add more entries here
];



export default function TabOneScireen() {
  const [value, setValue] = useState(0);
  const [activeSlide, setActiveSlide] = useState(0); // Add this state variable
  const [whatsAppUrl, setWhatsAppUrl] = useState('https://chat.whatsapp.com/FaPXfrT3qBLBSxd04TZr9X');
  const [updateKey, setUpdateKey] = useState(0); // Add a key to force updates
  const { width, height } = useWindowDimensions();
  const [iosWidth, setIosWidth] = useState(Dimensions.get('window').width);
  const sliderHeight = width / 3;
  const [orientation, setOrientation] = useState(
    Dimensions.get('window').width > Dimensions.get('window').height ? 'LANDSCAPE' : 'PORTRAIT'
  );

  if (Platform.OS !== 'web') {
    // Initialize and handle push notifications for non-web platforms
    const expoPushToken = NotificationHandler();
  }


  const onSetWidth = (width) => {
    console.log('Width set to', width);
    setIosWidth(width);
    // Force an update regardless of orientation change
    setUpdateKey(prevKey => prevKey + 1);
  }

  useEffect(() => {
    console.log('Width:', width, 'Height:', height);
    const newOrientation = width > height ? 'LANDSCAPE' : 'PORTRAIT';
    console.log('Orientation changed to', newOrientation);
    if (orientation !== newOrientation) {
      setOrientation(newOrientation);
    }
    // Force an update regardless of orientation change
    setUpdateKey(prevKey => prevKey + 1);
  }, [width, height]);

  const onSetOrientation = (orientation) => {
    setOrientation(orientation);
  };

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


  function renderItem({ item, index }: { item: any, index: number }) {
    return (
      <Link href={item.link}>
        <View style={styles.slide}>
          {Platform.OS === 'ios' ? (
            <Image source={item.image} style={styles.iosImage} />
          ) : (
            <Image source={item.image} style={styles.image} />
          )}
        </View>
      </Link>
    );
  }

  function renderWideItem({ item, index }: { item: any, index: number }) {
    return (
      <Link href={item.link}>
        <View style={styles.slide}>
          {Platform.OS === 'ios' ? (
            <Image source={item.image} style={styles.iosImageWide} />
          ) : (
            <Image source={item.image} style={styles.imageWide} />
          )}
        </View>
      </Link>
    );
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
      width: width,
      height: sliderHeight,
      resizeMode: 'cover',
    },
    imageWide: {
      width: width * .8,
      height: width * .8 / 3,
      resizeMode: 'cover',
    },
    iosImage: {
      width: iosWidth,
      height: iosWidth / 3,
      resizeMode: 'cover',
    },
    iosImageWide: {
      width: iosWidth * .8,
      height: iosWidth * .8 / 3,
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
      width: Dimensions.get('window').width,
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

  return (
    <>
      {console.log('Rendering: ', orientation)}
      <SafeAreaView style={styles.safeArea}>
        {(Platform.OS === 'ios') ? (
          <MeasureView onSetOrientation={onSetOrientation} onSetWidth={onSetWidth}>
            {(orientation === 'LANDSCAPE') ? (
              <View style={{ position: 'absolute', top: 0, left: iosWidth * .1, marginBottom: 0 }}>
                <Carousel
                  data={ENTRIES}
                  renderItem={renderWideItem}
                  sliderWidth={iosWidth * .8}
                  itemWidth={iosWidth * .8}
                  autoplay={true}
                  autoplayInterval={3000} // Change this to adjust the delay (in milliseconds)
                  loop={true}
                  loopClonesPerSide={5}
                  onSnapToItem={(index) => setActiveSlide(index)} // Add this prop
                />
                <View style={{ position: 'absolute', top: iosWidth * .8 / 3 - 30, left: iosWidth / 2.5, backgroundColor: 'transparent' }}>
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
                </View>
              </View>
            ) : (
              <>
                <Carousel
                  data={ENTRIES}
                  renderItem={renderItem}
                  sliderWidth={iosWidth}
                  itemWidth={iosWidth}
                  autoplay={true}
                  autoplayInterval={3000} // Change this to adjust the delay (in milliseconds)
                  loop={true}
                  loopClonesPerSide={5}
                  onSnapToItem={(index) => setActiveSlide(index)} // Add this prop
                />
                <View style={{ position: 'absolute', top: (iosWidth / 3) - 30, left: iosWidth / 3, backgroundColor: 'transparent' }}>
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
                </View>
              </>
            )}
          </MeasureView>
        ) : (
          <React.Fragment>
            {(orientation === 'PORTRAIT') ? (
              <View style={styles.carousel}>
                <Carousel
                  data={ENTRIES}
                  renderItem={renderItem}
                  sliderWidth={width}
                  itemWidth={width}
                  autoplay={true}
                  autoplayInterval={3000} // Change this to adjust the delay (in milliseconds)
                  loop={true}
                  loopClonesPerSide={5}
                  onSnapToItem={(index) => setActiveSlide(index)} // Add this prop
                />
                <View style={{ position: 'absolute', top: sliderHeight - 30, left: width / 3, backgroundColor: 'transparent' }}>
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
                </View>
              </View>
            ) : (
              <View style={styles.carousel}>
                <Carousel
                  data={ENTRIES}
                  renderItem={renderWideItem}
                  sliderWidth={width * .8}
                  itemWidth={width * .8}
                  autoplay={true}
                  autoplayInterval={3000} // Change this to adjust the delay (in milliseconds)
                  loop={true}
                  loopClonesPerSide={5}
                  onSnapToItem={(index) => setActiveSlide(index)} // Add this prop
                />
                <View style={{ position: 'absolute', top: width * .8 / 3 - 30, left: width / 2.5, backgroundColor: 'transparent' }}>
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
                </View>
              </View>
            )}
          </React.Fragment>
        )}
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
            </React.Fragment>
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
              </View>
            </>
          )
          }

        </ScrollView>
      </SafeAreaView>
      {/* Footer */}
      <ImageBackground
        source={require('../../assets/images/Footer.png')} // replace with your image path
        style={styles.footer}
        resizeMode="cover" // or "contain" depending on your needs
      >
        <View style={styles.footer}>
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
    </>

  );

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
    iosImage: ImageStyle;
    iosImageWide: ImageStyle;
  }



}

