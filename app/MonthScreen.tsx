import React, { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { View, Text, TouchableOpacity,StyleSheet, Image } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { getListenedPositions } from './api/apiWrapper';

const MonthScreen = () => {
  const { year, dataString }: { year: string; dataString: string } = useLocalSearchParams();
  const [data, setData] = useState({});
  const [listenedMonths, setListenedMonths] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!dataString) {
      console.log('Year: ', year);
      console.log('No data string');
      return;
    }
    try {
      const parsedData = JSON.parse(dataString);
      setData(parsedData);

      (async () => {
        const listenedPositions = await getListenedPositions();
        console.log("listenedPositions:", listenedPositions);
        const newSet = new Set<string>();
        Object.keys(parsedData).forEach((month) => {
          const urls = parsedData[month] || [];
          // If any URL in this month is found in listenedPositions,
          // treat this month as "listened".
          if (urls.some((url: string) => url in listenedPositions)) {
            newSet.add(month);
          }
        });
        setListenedMonths(newSet);
      })();

    } catch (error) {
      console.error('Error parsing data:', error);
    }
  }, [dataString]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <ScrollView>
      <View>
        {Object.keys(data).sort((a, b) => Number(a.slice(0, 2)) - Number(b.slice(0, 2))).map((month) => (
          <TouchableOpacity 
            style={styles.container} 
            key={month}
            onPress={() => router.push(`DayScreen?year=${year}&month=${month}&dataString=${JSON.stringify(data[month])}`)}
          >
            <View style={styles.playButton}>
              {/* Replace with your play icon */}
              <Image source={require('../assets/images/folder.png')} style={styles.playIcon} />
              {listenedMonths.has(month) && (
                <View style={styles.neonGreenDot} />
              )}
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.titleText} numberOfLines={3} ellipsizeMode='tail'>{month}</Text>
            </View>
            <Text style={styles.countText}>{data[month]?.length}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
    </GestureHandlerRootView>
  );

}
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 10,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc', // Adjust color as needed
    backgroundColor: 'white',
  },
  countText: {
    position: 'absolute',
    right: 10,
  },
  playButton: {
    marginRight: 30,
    position: 'relative',
  },
  playIcon: {
    width: 70, // Adjust size as needed
    height: 70, // Adjust size as needed
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  titleText: {
    fontSize: 14,
    fontWeight: 'bold',
    // Adjust style as needed
  },
  dateText: {
    fontSize: 14,
    color: 'grey',
    // Adjust style as needed
  },
  neonGreenDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#39FF14', // neon green
    bottom: 0,
    right: 0,
    zIndex: 10,
  },
});

export default MonthScreen;