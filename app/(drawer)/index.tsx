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
  Linking
} from 'react-native';
import Carousel, { Pagination } from 'react-native-snap-carousel';
import { Text, View } from '../../components/Themed';
import { useState, forwardRef, useEffect } from 'react';
import { Link } from 'expo-router';
import { collection, getFirestore, query, getDocs } from "firebase/firestore";
import NotificationHandler from '../api/notifications';
import * as ScreenOrientation from 'expo-screen-orientation';
import { initializeApp } from 'firebase/app';

const ENTRIES = [
  { title: 'Slide 1', image: require('../../assets/images/quotes_placeholder_355x200.jpg'), link: '../QuoteScreen' },
  { title: 'Slide 2', image: require('../../assets/images/news_placeholder_355x200.jpg'), link: './NewsScreen' },
  { title: 'Slide 3', image: require('../../assets/images/memories_placeholder_355x200.jpg'), link: './MemoriesScreen' },
  { title: 'Slide 4', image: require('../../assets/images/books_placeholder_355x200.jpg'), link: '../BooksScreen' },
  { title: 'Slide 5', image: require('../../assets/images/vyasa_puja_placeholder_355x200.jpg'), link: '../(tabs3)/VPPlaylistScreen' },
  // Add more entries here
];

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

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
  const [orientation, setOrientation] = useState(ScreenOrientation.Orientation.PORTRAIT_UP);

  useEffect(() => {
    const subscription = ScreenOrientation.addOrientationChangeListener(({ orientationInfo }) => {
      setOrientation(orientationInfo.orientation);
    });
  
    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    const fetchWhatsAppUrl = async () => {
      const db = getFirestore(app);
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
    {orientation === ScreenOrientation.Orientation.PORTRAIT_UP && (
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
                  backgroundColor: 'gray' // Change this to the color you want for the inactive dots
              }}
              inactiveDotOpacity={0.4}
              inactiveDotScale={0.6}
            />
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
              source={require('../../assets/images/placeholder_355_200.png')} // Replace with your local or network image
              style={styles.buttonImage}
            />
            <Text style={styles.buttonText}>LIVE</Text>
          </TouchableOpacity>
        </Link>
        <Link href="./audio" asChild>
        <TouchableOpacity style={styles.buttonContainer}> 
            <Image
              source={require('../../assets/images/placeholder_355_200.png')} // Replace with your local or network image
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
              source={require('../../assets/images/placeholder_355_200.png')} // Replace with your local or network image
              style={styles.buttonImage}
            />
            <Text style={styles.buttonText}>PICTURES</Text>
          </TouchableOpacity>
        </Link>
        <Link href="./DeityGallery" asChild>
        <TouchableOpacity style={styles.buttonContainer}> 
            <Image
              source={require('../../assets/images/placeholder_355_200.png')} // Replace with your local or network image
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
              source={require('../../assets/images/placeholder_355_200.png')} // Replace with your local or network image
              style={styles.buttonImage}
            />
            <Text style={styles.buttonText}>TEMPLES</Text>
          </TouchableOpacity>
        </Link>
         <Link href="./BlogScreen" asChild>
        <TouchableOpacity style={styles.buttonContainer}> 
            <Image
              source={require('../../assets/images/placeholder_355_200.png')} // Replace with your local or network image
              style={styles.buttonImage}
            />
            <Text style={styles.buttonText}>BLOG</Text>
          </TouchableOpacity>
        </Link>
        {/* More buttons */}
      </View>

      <View style={styles.buttonRow}>
        {/* Button components */}
        <Link href="./SearchYoutubeScreen" asChild>
            <TouchableOpacity style={styles.buttonContainer}> 
                <Image
                  source={require('../../assets/images/placeholder_355_200.png')} // Replace with your local or network image
                  style={styles.buttonImage}
                />
                <Text style={styles.buttonText}>SEARCH VIDEOS</Text>
              </TouchableOpacity>
        </Link>
          <Link href="./(tabs)/RecentUploads" asChild>
            <TouchableOpacity style={styles.buttonContainer}> 
                <Image
                  source={require('../../assets/images/placeholder_355_200.png')} // Replace with your local or network image
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
                  source={require('../../assets/images/placeholder_355_200.png')} // Replace with your local or network image
                  style={styles.buttonImage}
                />
                <Text style={styles.buttonText}>QUOTES</Text>
              </TouchableOpacity>
        </Link>
        <Link href="./BooksScreen" asChild>
            <TouchableOpacity style={styles.buttonContainer}> 
                <Image
                  source={require('../../assets/images/placeholder_355_200.png')} // Replace with your local or network image
                  style={styles.buttonImage}
                />
                <Text style={styles.buttonText}>BOOKS</Text>
              </TouchableOpacity>
        </Link>
        </View>
    </ScrollView>
    </SafeAreaView>
    {/* Footer */}
    <View style={styles.footer}>
      <Link href="./ChantingScreen" asChild>
        <TouchableOpacity style={styles.footerButton}> 
            <Text style={styles.footerText}>CHANTING</Text>
        </TouchableOpacity>
      </Link>
      <Link href="./(drawer)/BioScreen" asChild>
        <TouchableOpacity style={styles.footerButton}> 
            <Text style={styles.footerText}>ABOUT</Text>
        </TouchableOpacity>
      </Link>
      <Link href="./LiveScreen" asChild>
        <TouchableOpacity style={styles.footerButton}> 
            <Text style={styles.footerText}>LIVE</Text>
        </TouchableOpacity>
      </Link>
      <Link href="./DonationScreen" asChild>
        <TouchableOpacity style={styles.footerButton}> 
            <Text style={styles.footerText}>DONATION</Text>
        </TouchableOpacity>
      </Link>
      <TouchableOpacity style={styles.footerButton} onPress={() => { Linking.openURL(whatsAppUrl) /* Handle button press */ }}>
        <Text style={styles.footerText}>WhatsApp</Text>
      </TouchableOpacity>
    </View>
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
  footerText: TextStyle;
}

const styles = StyleSheet.create<Styles>({
  carousel: {
    marginBottom: 0, // No bottom margin
  },
  slide: {
    width: windowWidth,
    height: windowHeight * 0.2, // Adjust this value as needed
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#9DD6EB',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  image: {
    width: windowWidth, // Adjust this value as needed
    height: windowHeight * 0.2, // Adjust this value as needed
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
    color: '#7e2b18',
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
    width: 36, // Adjust this value as needed
    height: 36, // This is 50% of the footer height
    borderRadius: 18, // This should be half of the button width/height
    backgroundColor: '#b91805',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 10,
  },
});
