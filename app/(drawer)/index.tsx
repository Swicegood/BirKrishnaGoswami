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
} from 'react-native';
import Carousel, { Pagination } from 'react-native-snap-carousel';
import { Text, View } from '../../components/Themed';
import { useState, forwardRef, useEffect } from 'react';
import { Link } from 'expo-router';
import { collection, query, getDocs } from "firebase/firestore";
import NotificationHandler from '../api/notifications';
import { db } from '../api/firebase';

const ENTRIES = [
  { title: 'Slide 1', image: require('../../assets/images/Thought_of_the_Day.png'), link: '../QuoteScreen' },
  { title: 'Slide 2', image: require('../../assets/images/News.png'), link: './NewsScreen' },
  { title: 'Slide 3', image: require('../../assets/images/Memories.png'), link: './MemoriesScreen' },
  { title: 'Slide 4', image: require('../../assets/images/books_placeholder_355x120.png'), link: '../BooksScreen' },
  { title: 'Slide 5', image: require('../../assets/images/Vyasa_Puja.png'), link: '../(tabs3)/VPPlaylistScreen' },
  // Add more entries here
];

const windowWidth = Dimensions.get('window').width;
const sliderHeight = windowWidth / 3;

function renderItem({ item, index }: { item: any, index: number }) {
  return (
    <Link href={item.link}>
      <View style={styles.slide}>
        <Image source={item.image} style={styles.image} />
      </View>
    </Link>
  );
}
export default function TabOneScireen() {
  const [value, setValue] = useState(0);
  const [activeSlide, setActiveSlide] = useState(0); // Add this state variable
  const [whatsAppUrl, setWhatsAppUrl] = useState('https://chat.whatsapp.com/FaPXfrT3qBLBSxd04TZr9X');
  const expoPushToken = NotificationHandler();
  const windowDimensions = useWindowDimensions();

  const isLandscape = windowDimensions.width > windowDimensions.height;
  const [orientation, setOrientation] = useState(isLandscape ? 'LANDSCAPE' : 'PORTRAIT');

  useEffect(() => {
    setOrientation(isLandscape ? 'LANDSCAPE' : 'PORTRAIT');
  }, [isLandscape]);


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


  return (
    <>
      <SafeAreaView style={styles.safeArea}>

        <View style={styles.carousel}>
          {orientation === 'PORTRAIT' && (
            <>
              <Carousel
                data={ENTRIES}
                renderItem={renderItem}
                sliderWidth={Dimensions.get('window').width}
                itemWidth={Dimensions.get('window').width}
                autoplay={true}
                autoplayInterval={3000} // Change this to adjust the delay (in milliseconds)
                loop={true}
                onSnapToItem={(index) => setActiveSlide(index)} // Add this prop
              />
              <View style={{ position: 'absolute', top: sliderHeight- 30, left: windowWidth / 3 , backgroundColor: 'transparent' }}>
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
        </View>

        <ScrollView style={styles.container}>
          {/* Header */}

          {/* Button Rows */}
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
                <Image source={require('../../assets/images/Chanting.png')} style={styles.footerButton}/>
                <Text style={styles.footerText}>CHANTING</Text>
              </TouchableOpacity>
          </Link>
          <Link href="./(drawer)/BioScreen" asChild>
            <TouchableOpacity style={styles.footerButton}>
            <Image source={require('../../assets/images/About_Footer.png')} style={styles.footerButton}/>
              <Text style={styles.footerText}>ABOUT</Text>
            </TouchableOpacity>
          </Link>
          <Link href="./LiveScreen" asChild>
            <TouchableOpacity style={styles.footerButton}>
            <Image source={require('../../assets/images/Live.png')} style={styles.footerButtonBig}/>
            </TouchableOpacity>
          </Link>
          <Link href="./DonationScreen" asChild>
            <TouchableOpacity style={styles.footerButton}>
            <Image source={require('../../assets/images/Donation.png')} style={styles.footerButton}/>
              <Text style={styles.footerText}>DONATION</Text>
            </TouchableOpacity>
          </Link>
          <TouchableOpacity style={styles.footerButton} onPress={() => { Linking.openURL(whatsAppUrl) /* Handle button press */ }}>
          <Image source={require('../../assets/images/WhatsApp.png')} style={styles.footerButton}/>
            <Text style={styles.footerText}>WHATSAPP</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </>

  );
}

type ButtonProps = {
  title: string;
  onPress: () => void;
};

const Button = forwardRef((props: ButtonProps, ref: React.Ref<any>) => (
  <TouchableOpacity style={styles.buttonContainer} >
    <Image
      source={require('../../assets/images/placeholder_355_200.png')} // Replace with your local or network image
      style={styles.buttonImage}
      ref={ref}
    />
    <Text style={styles.buttonText}>{props.title}</Text>
  </TouchableOpacity>
));





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
}

const styles = StyleSheet.create<Styles>({
  carousel: {
    marginBottom: 20, // No bottom margin
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
    width: windowWidth,
    height: sliderHeight,
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
