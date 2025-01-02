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

// Helper function to convert 'MM/DD/YY' to 'MM/DD/YYYY'
function convertToFullYearDate(dateString: string): string {
  const dateParts = dateString.split('/');
  return `${dateParts[0]}/${dateParts[1]}/20${dateParts[2]}`;
}

// Helper function to shift date by a given number of days (pos/neg)
function shiftDate(fullYearDate: string, days: number): string {
  const fullDateParts = fullYearDate.split('/');
  const shiftedDate = new Date(
    parseInt(fullDateParts[2], 10),
    parseInt(fullDateParts[0], 10) - 1,
    parseInt(fullDateParts[1], 10)
  );
  shiftedDate.setDate(shiftedDate.getDate() + days);

  // Return 'MM/DD/YY'
  const month = String(shiftedDate.getMonth() + 1).padStart(2, '0');
  const day = String(shiftedDate.getDate()).padStart(2, '0');
  const year = String(shiftedDate.getFullYear()).slice(-2);
  return `${month}/${day}/${year}`;
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

    // Find the next "processed" doc that's older (descending)
    const currentTimestamp = currentDoc.data().processed;
    console.log("currentTimestamp", currentTimestamp.toDate().toLocaleString());

    const nextQuery = query(
      collection(db, 'thought-of-the-days'),
      where('processed', '<', currentTimestamp),
      orderBy('processed', 'desc'),
      limit(1)
    );
    const nextQuerySnapshot = await getDocs(nextQuery);

    if (!nextQuerySnapshot.empty) {
      // Currently stored date to shift
      const currentDate = convertToFullYearDate(currentDoc.data().date);
      // Subtract one day
      const previousDateString = shiftDate(currentDate, -1);
      console.log("previous date", previousDateString);

      // Fetch documents matching this new date
      let querySnapshotNewDate = await getDocs(
        query(
          collection(db, 'thought-of-the-days'),
          where('date', '==', previousDateString),
          orderBy('processed', 'desc')
        )
      );

      // If empty, just get the next "processed" doc
      if (querySnapshotNewDate.empty) {
        querySnapshotNewDate = await getDocs(
          query(
            collection(db, 'thought-of-the-days'),
            where('processed', '<', currentTimestamp),
            orderBy('processed', 'desc'),
            limit(1)
          )
        );
      }

      querySnapshotNewDate.forEach((doc) => {
        setQuote(doc.data().totd.replace(/"/g, '').replace(/\n/g, ' '));
        setDate(doc.data().date);
        console.log("currentDoc", doc.data().processed.toDate().toLocaleString());
      });

      setCurrentDoc(querySnapshotNewDate.docs[0]);
      setIsLoading(false);
    }

    // Check if the current doc is the last one
    const nextNextQuery = query(
      collection(db, 'thought-of-the-days'),
      where('date', '<', currentDoc.data().date),
      orderBy('date', 'desc')
    );
    const querySnapshotCheck = await getDocs(nextNextQuery);
    setAtLastDoc(querySnapshotCheck.docs.length < 1);
  };

  const handlePreviousQuote = async () => {
    setAtLastDoc(false);
    if (!currentDoc) return;

    // Find the next newer "processed" doc
    const currentTimestamp = currentDoc.data().processed;
    console.log("currentTimestamp", currentTimestamp.toDate().toLocaleString());

    const prevQuery = query(
      collection(db, 'thought-of-the-days'),
      where('processed', '>', currentTimestamp),
      orderBy('processed', 'asc'),
      limit(1)
    );
    const prevQuerySnapshot = await getDocs(prevQuery);

    // If no document found, we're at the first
    if (prevQuerySnapshot.empty) {
      setAtFirstDoc(true);
    } else {
      // Shift our current date by +1 day
      const currentDate = convertToFullYearDate(currentDoc.data().date);
      const nextDateString = shiftDate(currentDate, +1);
      console.log("previous date", nextDateString);

      let pQuerySnapshot = await getDocs(
        query(
          collection(db, 'thought-of-the-days'),
          where('date', '==', nextDateString),
          orderBy('processed', 'desc')
        )
      );

      // If nothing found, query again by processed
      if (pQuerySnapshot.empty) {
        pQuerySnapshot = await getDocs(
          query(
            collection(db, 'thought-of-the-days'),
            where('processed', '>', currentTimestamp),
            orderBy('processed', 'asc'),
            limit(1)
          )
        );
      }

      pQuerySnapshot.forEach((doc) => {
        setQuote(doc.data().totd.replace(/"/g, '').replace(/\n/g, ' '));
        setDate(doc.data().date);
        console.log("currentDoc", doc.data().processed.toDate().toLocaleString());
      });

      if (pQuerySnapshot.docs[0]) {
        setCurrentDoc(pQuerySnapshot.docs[0]);
      }

      // Check if we are at the first doc
      const nextPrevQuery = query(
        collection(db, 'thought-of-the-days'),
        where('processed', '>', currentDoc.data().processed)
      );
      const querySnapshotCheck = await getDocs(nextPrevQuery);
      setAtFirstDoc(querySnapshotCheck.docs.length < 1);
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
