import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Image, Dimensions, ActivityIndicator, Platform
} from 'react-native';
import { collection, query, orderBy, limit, getDocs, where } from "firebase/firestore";
import { db } from './api/firebase';
import GuageView from '../components/GuageView';
import useIsMobileWeb from '../hooks/useIsMobileWeb';
const defaultImage = require('../assets/images/Quote.png');


function formatDate(dateString: string) {
  if (!dateString || dateString.split('/').length !== 3) {
    return '';
  }
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dateParts = dateString.split('/');
  const date = new Date(
    parseInt(`20${dateParts[2]}`, 10),
    parseInt(dateParts[0], 10) - 1,
    parseInt(dateParts[1], 10)
  );
  const month = months[date.getMonth()];
  const day = String(date.getDate());

  return `${month} ${day}`;
}

function dateToDayNumber(dateString: string) {
  if (!dateString || dateString.split('/').length !== 3) {
    return 0;
  }
  const dateParts = dateString.split('/');
  const date = new Date(
    parseInt(`20${dateParts[2]}`, 10),
    parseInt(dateParts[0], 10) - 1,
    parseInt(dateParts[1], 10)
  );
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const day = Math.floor(diff / oneDay);
  console.log("dateString", dateString);
  console.log("date", date);
  console.log("day", day);
  return day;
}

const isTablet = () => {
  const { width, height } = Dimensions.get('window');
  const aspectRatio = width / height;
  const isLandscape = Math.min(width, height) >= 600 && (aspectRatio > 1.2 || aspectRatio < 0.9);
  console.log('isTablet: ', isLandscape);
  return isLandscape
}

// Add this helper function near the other date-related functions
function compareDates(date1: string, date2: string): number {
  // Convert MM/DD/YY to comparable numbers (YYYYMMDD)
  const parts1 = date1.split('/');
  const parts2 = date2.split('/');
  
  // Convert YY to YYYY
  const year1 = parseInt(`20${parts1[2]}`, 10);
  const year2 = parseInt(`20${parts2[2]}`, 10);
  
  // Create comparable numbers (YYYYMMDD)
  const num1 = (year1 * 10000) + (parseInt(parts1[0], 10) * 100) + parseInt(parts1[1], 10);
  const num2 = (year2 * 10000) + (parseInt(parts2[0], 10) * 100) + parseInt(parts2[1], 10);
  
  return num1 - num2;
}

const QuoteScreen = () => {
  const [quote, setQuote] = useState('');
  const [date, setDate] = useState('');
  const [currentDoc, setCurrentDoc] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [atFirstDoc, setAtFirstDoc] = useState(true);
  const [atLastDoc, setAtLastDoc] = useState(false);
  const [image, setImage] = useState(`https://atourcity.com/bkgoswami.com/wp/wp-content/uploads/quotes/${dateToDayNumber(date)}.png`);
  const [orientation, setOrientation] = useState(Dimensions.get('window').width > Dimensions.get('window').height ? 'LANDSCAPE' : 'PORTRAIT');
  const [width, setWidth] = useState(Dimensions.get('window').width);
  const isMobileWeb = useIsMobileWeb();

  const onSetWidth = (width: number) => {
    console.log('QuoteScreen width: ', width);
    setWidth(width);
  };

const [height, setHeight] = useState(Dimensions.get('window').height);
  const ORIENTATION_THRESHOLD = 0.1; // 10% threshold



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


  const onSetOrientation = (orientation: string) => {
    if (Platform.OS === 'web') {
      handleOrientationChange();
    } else {
      setOrientation(orientation);
    }
  };

  const getImageSource = (image: string) => {
    if (typeof image === 'string' && image.startsWith('http')) {
      return { uri: image };
    }
    return image;
  };

  useEffect(() => {
    setImage(`https://atourcity.com/bkgoswami.com/wp/wp-content/uploads/quotes/${dateToDayNumber(date)}.png`);
  }, [date]);

  useEffect(() => {
    const fetchQuote = async () => {
      const q = query(
        collection(db, 'thought-of-the-days'),
        orderBy('processed', 'desc'),
        limit(1)
      );
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        // Assuming doc.data() returns an object with text, date, and category
        setQuote((doc.data().totd).replace(/"/g, '').replace(/\n/g, ' '));
        setDate(doc.data().date);

        // Store the current document in the state variable
        setCurrentDoc(doc);
      });
      setIsLoading(false);
    };

    fetchQuote();
  }, []);

  const handleNextQuote = async () => {
    if (!currentDoc) return;
    setAtFirstDoc(false);

    const currentTimestamp = currentDoc.data().processed;
    const currentDate = currentDoc.data().date;
    console.log("currentTimestamp", currentTimestamp.toDate().toLocaleString());

    // Get all docs with earlier processed timestamp
    const nextQuery = query(
      collection(db, 'thought-of-the-days'),
      where('processed', '<', currentTimestamp),
      orderBy('processed', 'desc')
    );
    const nextQuerySnapshot = await getDocs(nextQuery);

    // Filter results to ensure proper date ordering
    const validDocs = nextQuerySnapshot.docs.filter(doc => 
      compareDates(doc.data().date, currentDate) < 0
    );

    if (validDocs.length > 0) {
      const nextDoc = validDocs[0];
      setQuote(nextDoc.data().totd.replace(/"/g, '').replace(/\n/g, ' '));
      setDate(nextDoc.data().date);
      setCurrentDoc(nextDoc);
      setIsLoading(false);
      
      // Check if this is the last doc
      const laterDocs = nextQuerySnapshot.docs.filter(doc => 
        compareDates(doc.data().date, nextDoc.data().date) < 0
      );
      setAtLastDoc(laterDocs.length === 0);
    } else {
      setAtLastDoc(true);
    }
  };

  const handlePreviousQuote = async () => {
    if (!currentDoc) return;
    setAtLastDoc(false);

    const currentTimestamp = currentDoc.data().processed;
    const currentDate = currentDoc.data().date;
    console.log("currentTimestamp", currentTimestamp.toDate().toLocaleString());

    // Get all docs with later processed timestamp
    const prevQuery = query(
      collection(db, 'thought-of-the-days'),
      where('processed', '>', currentTimestamp),
      orderBy('processed', 'asc')
    );
    const prevQuerySnapshot = await getDocs(prevQuery);

    // Filter results to ensure proper date ordering
    const validDocs = prevQuerySnapshot.docs.filter(doc => 
      compareDates(doc.data().date, currentDate) > 0
    );

    if (validDocs.length > 0) {
      const prevDoc = validDocs[0];
      setQuote(prevDoc.data().totd.replace(/"/g, '').replace(/\n/g, ' '));
      setDate(prevDoc.data().date);
      setCurrentDoc(prevDoc);
      
      // Check if this is the first doc
      const earlierDocs = prevQuerySnapshot.docs.filter(doc => 
        compareDates(doc.data().date, prevDoc.data().date) > 0
      );
      setAtFirstDoc(earlierDocs.length === 0);
    } else {
      setAtFirstDoc(true);
    }
  };

  const getImageHeight = () => {
    if (isTablet() || Platform.OS === 'web') {
      if (orientation === 'LANDSCAPE') {
        if (isMobileWeb){
          return width * 0.1;
        }
        return width * 0.3;
      }
      return width * 0.4;
    }
    return orientation === 'LANDSCAPE' ? 160 : 260;
  }

  const getImageWidth = () => {
    if (isTablet() || Platform.OS === 'web') {
      return getImageHeight() * 4 / 3;
    }
    return width;
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#ED4D4E" />
      </View>)
  }
  // Button labels PREVIOUS AND NEXT are backwards for user clarity
  return (
    <View style={{ flex: 1 }}>
      <View style={styles.quoteContainer}>
        <GuageView onSetWidth={onSetWidth} onSetOrientation={onSetOrientation}>
          {(orientation === 'LANDSCAPE' || isTablet() || (Platform.OS === 'web' && !isMobileWeb)) ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' }}>
              <View style={{ ...styles.fill, width: (width - getImageWidth()) / 2, height: getImageHeight() }} />
              <Image
                source={getImageSource(image)}
                onError={(error) => {
                  console.log('Failed to load image', error);
                  setImage(defaultImage);
                }}
                style={{ width: getImageWidth(), height: getImageHeight(), resizeMode: (orientation == 'LANDSCAPE') ? 'contain' : 'cover' }}
              />
              <View style={{ ...styles.fill, width: (width - getImageWidth()) / 2, height: getImageHeight() }} />
            </View>
          ) : (
            <Image
              source={getImageSource(image)}
              onError={(error) => {
                console.log('Failed to load image', error);
                setImage(defaultImage);
              }}
              style={{ width: width, height: orientation === 'LANDSCAPE' ? 160 : 260, resizeMode: (orientation == 'LANDSCAPE') ? 'contain' : 'cover' }}
            />
          )}
        </GuageView>
        <View style={styles.content}>
          <Text style={styles.date}>{formatDate(date)}</Text>
          {(Platform.OS === 'web' || isTablet()) ? <Text style={styles.quoteText}>{quote}</Text> :
            (orientation == 'LANDSCAPE' ? <Text style={{ ...styles.quoteText, paddingLeft: 100, paddingRight: 100 }}>{quote}</Text> :
              <Text style={styles.quoteText}>{quote}</Text>)}
        </View>
      </View>
      <View style={{ justifyContent: 'space-between' }}>

        <View style={{ paddingTop: 10, padding: 30, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', ...(Platform.OS === 'web' ? { paddingEnd: 100, paddingStart: 100 } : {}) }}>
          <View style={{ flex: !atFirstDoc ? 0 : 0 }}>
            {!atFirstDoc && (
              <TouchableOpacity style={styles.nextButton} onPress={handlePreviousQuote}>
                <View style={{ flexDirection: 'row' }}>
                  <Text style={{ ...styles.nextButtonText, paddingStart: 10 }}>{'<'}</Text>
                  <Text style={{ ...styles.nextButtonText, paddingEnd: 10 }}>PREV.</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
          <View style={{ flex: !atLastDoc ? 0 : 0 }}>
            {!atLastDoc && (
              <TouchableOpacity style={styles.nextButton} onPress={handleNextQuote}>
                <View style={{ flexDirection: 'row' }}>
                  <Text style={{ ...styles.nextButtonText, paddingStart: 10 }}>NEXT</Text>
                  <Text style={{ ...styles.nextButtonText, paddingEnd: 10 }}>{'>'}</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  quoteContainer: {
    flex: 1,
  },
  header: {
    backgroundColor: '#E53935',
    padding: 10,
  },
  headerText: {
    color: 'white',
    fontSize: 24,
    textAlign: 'center',
  },
  content: {
    margin: 20,
  },
  date: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#E53935',
    padding: 10,
  },
  fill: {
    backgroundColor: '#E53935',
  },
  quoteText: {
    fontSize: 18,
    marginTop: 10,
    fontFamily: 'UbuntuRegular',
    marginLeft: 10,
    marginRight: 10,
  },
  category: {
    fontSize: 16,
    color: 'blue',
    marginTop: 10,
  },
  nextButton: {
    backgroundColor: 'transparent',
    borderColor: '#E53935',
    borderWidth: 2,
    borderRadius: 10, // Adjust the border radius value as needed
    color: '#E53935',
  },
  nextButtonText: {
    color: '#E53935',
    paddingTop: 10,
    paddingBottom: 10,
  },

});

export default QuoteScreen;
