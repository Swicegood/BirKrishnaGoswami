import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Image, Dimensions, ActivityIndicator, Platform
} from 'react-native';
import { collection, query, orderBy, limit, getDocs, where } from "firebase/firestore";
import { db } from '../api/firebase';
import GuageView from '../../components/GuageView';
import { get } from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

function formatDate(dateString) {
  if (!dateString || dateString.split('/').length !== 3) {
    return '';
  }
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dateParts = dateString.split('/');
  const date = new Date(`20${dateParts[0]}`, dateParts[1] - 1, dateParts[2]);

  const month = months[date.getMonth()];
  const day = String(date.getDate()).padStart(2, '0');

  return `${month} ${day}`;
}

const isTablet = () => {
  const { width, height } = Dimensions.get('window');
  const aspectRatio = width / height;
  const isLandscape = Math.min(width, height) >= 600 && (aspectRatio > 1.2 || aspectRatio < 0.9);
  console.log('isTablet: ', isLandscape);
  return isLandscape
}

const TravelScreen = () => {
  const [text, setText] = useState('');
  const [date, setDate] = useState('');
  const [currentDoc, setCurrentDoc] = useState(null);
  const [atFirstDoc, setAtFirstDoc] = useState(true);
  const [atLastDoc, setAtLastDoc] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [orientation, setOrientation] = useState(Dimensions.get('window').width > Dimensions.get('window').height ? 'LANDSCAPE' : 'PORTRAIT');
  const [width, setWidth] = useState(Dimensions.get('window').width);

  const onSetWidth = (width: number) => {
    console.log('TravelScreen width: ', width);
    setWidth(width);
  };

  const onSetOrientation = (orientation: string) => {
    if ((Platform.OS === 'android' && !isTablet()) || Platform.OS === 'web') {
      if (orientation === 'LANDSCAPE') {
        setOrientation('PORTRAIT');
      } else {
        setOrientation('LANDSCAPE');
      }
      return;
    }
    setOrientation(orientation);
  };

  useEffect(() => {
    const fetchText = async () => {
      const q = query(collection(db, 'travel-schedule'), orderBy('date', 'desc'), limit(1));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        setText(doc.data().text);
        setDate(doc.data().date);
        setCurrentDoc(doc);
      });
      setIsLoading(false);
    };

    fetchText();
  }, []);

  const handleNextText = async () => {
    setAtFirstDoc(false);
    if (currentDoc) {
      const currentDate = currentDoc.data().date;
      console.log("currentDate", currentDate);
      const nextQuery = query(
        collection(db, 'travel-schedule'),
        where('date', '<', currentDate),
        orderBy('date', 'desc'),
        limit(1)
      );
      let nextdoc = null;
      let newText = text;
      let newDate = date;

      try {
        const nextQuerySnapshot = await getDocs(nextQuery);
        nextQuerySnapshot.forEach((doc) => {
          newText = doc.data().text;
          newDate = doc.data().date;
          console.log("nextDate", newDate);
          nextdoc = doc;
        });

        if (newText !== text) {
          setText(newText);
        }

        if (newDate !== date) {
          setDate(newDate);
        }

        if (nextdoc) {
          setCurrentDoc(nextdoc);
        }
      } catch (error) {
        console.error("Failed to get documents:", error);
      }

      try {
        if (nextdoc) {
          console.log("currentDocNextQuery", nextdoc.date);
          const nextNextQuery = query(
            collection(db, 'travel-schedule'),
            where('date', '<', nextdoc.data().date),
            orderBy('date', 'desc'),
          );

          const querySnapshot = await getDocs(nextNextQuery)
          console.log("querySnapshot", querySnapshot.docs.length);
          if (querySnapshot.docs.length < 1) {
            setAtLastDoc(true);
          } else {
            setAtLastDoc(false);
          }
        } else {
          setAtLastDoc(true);
        }
      } catch (error) {
        console.error("Failed to get documents:", error);
      }
    }
  };

  const handlePreviousText = async () => {
    setAtLastDoc(false);
    if (currentDoc) {
      const currentDate = currentDoc.data().date;
      console.log("currentTimestamp", currentDate);
      const prevQuery = query(
        collection(db, 'travel-schedule'),
        where('date', '>', currentDate),
        orderBy('date', 'asc'),
        limit(1)
      );
      const prevQuerySnapshot = await getDocs(prevQuery);

      let newText = text;
      let newDate = date;
      let prevDoc = null;

      prevQuerySnapshot.forEach((doc) => {
        const newData = doc.data();
        newText = newData.text;
        newDate = newData.date;
        prevDoc = doc;

        if (newText !== text) {
          setText(newText);
        }

        if (newDate !== date) {
          setDate(newDate);
        }

        console.log("currentDoc", newDate);
      });

      if (prevQuerySnapshot.docs[0]) {
        setCurrentDoc(prevQuerySnapshot.docs[0]);
      }
      if (prevDoc) {
        console.log("currentDocPrevQuery", prevDoc.data().date);

        const nextPrevQuery = query(
          collection(db, 'travel-schedule'),
          where('date', '>', prevDoc.data().date),
          orderBy('date', 'desc'),
        );

        const querySnapshot = await getDocs(nextPrevQuery)

        if (querySnapshot.docs.length < 1) {
          setAtFirstDoc(true);
        } else {
          setAtFirstDoc(false);
        }
      } else {
        setAtFirstDoc(true);
      }
    };
  };

  const getImageHeight = () => {
    if (isTablet() || Platform.OS === 'web') {
      if (orientation === 'LANDSCAPE') {
        return width * 0.3;
      }
      return width * 0.4;
    }
    return orientation === 'LANDSCAPE' ? 160 : 260;
  }

  const getImageWidth = () => {
    if (isTablet() || Platform.OS === 'web') {
      return getImageHeight() * 1.78;
    }
    return width;
  }


  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#ED4D4E" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.container}>
        <GuageView onSetWidth={onSetWidth} onSetOrientation={onSetOrientation}>
          {(Platform.OS === 'web' || isTablet() || orientation === 'LANDSCAPE') ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' }}>
              <View style={{ ...styles.fill, width: (width - getImageWidth()) / 2, height: getImageHeight() }} />
              <Image
                source={require('../../assets/images/Trave_Plane.png')}
                style={{
                  width: getImageWidth(),
                  height:  getImageHeight(),
                  resizeMode: (orientation === 'LANDSCAPE') ? 'contain' : 'cover'
                }}
              />
              <View style={{ ...styles.fill, width: (width - getImageWidth()) / 2, height: getImageHeight() }} />
            </View>
          ) : (
            <Image
              source={require('../../assets/images/Trave_Plane.png')}
              style={{
                width: width,
                height: (orientation === 'LANDSCAPE') ? 160 : 250,
                resizeMode: (orientation === 'LANDSCAPE') ? 'contain' : 'cover'
              }}
            />
          )}
        </GuageView>
        <View style={styles.content}>
          <Text style={styles.date}>{formatDate(date)}</Text>
          {(Platform.OS === 'web' || isTablet()) ? (
            <Text style={styles.textText}>{text}</Text>
          ) : (
            orientation === 'LANDSCAPE' ? (
              <Text style={{ ...styles.textText, paddingLeft: 100, paddingRight: 100 }}>{text}</Text>
            ) : (
              <Text style={styles.textText}>{text}</Text>
            )
          )}
        </View>
      </View>
      <View style={{ justifyContent: 'space-between' }}>
        <View style={{ paddingTop: 10, padding: 30, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', ...(Platform.OS === 'web' ? { paddingEnd: 100, paddingStart: 100 } : {}) }}>
          <View style={{ flex: !atFirstDoc ? 0 : 0 }}>
            {!atFirstDoc && (
              <TouchableOpacity style={styles.nextButton} onPress={handlePreviousText}>
                <View style={{ flexDirection: 'row' }}>
                  <Text style={{ ...styles.nextButtonText, paddingStart: 10 }}>{'<'}</Text>
                  <Text style={{ ...styles.nextButtonText, paddingEnd: 10 }}>PREV.</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
          <View style={{ flex: !atLastDoc ? 0 : 0 }}>
            {!atLastDoc && (
              <TouchableOpacity style={styles.nextButton} onPress={handleNextText}>
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
  container: {
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
  textText: {
    fontSize: 20,
    marginTop: 10,
    marginLeft: 10,
    marginRight: 10,
    fontFamily: 'UbuntuRegular',
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
    borderRadius: 10,
    color: '#E53935',
  },
  nextButtonText: {
    color: '#E53935',
    padding: 10,
  },
});

export default TravelScreen;