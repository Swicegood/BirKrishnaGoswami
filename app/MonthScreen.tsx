import React, { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { View, Text, TouchableOpacity,StyleSheet, Image } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

const MonthScreen = () => {
  const { year, dataString }: { year: string; dataString: string } = useLocalSearchParams();
  const [data, setData] = useState({});


  useEffect(() => {
    if (!dataString) {
      console.log('Year: ', year);
      console.log('No data string');
      return;
    }
    try {
      const parsedData = JSON.parse(dataString);
      setData(parsedData);
    } catch (error) {
      console.error('Error parsing data:', error);
    }
  }, [dataString]);


  return (
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
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.titleText} numberOfLines={3} ellipsizeMode='tail'>{month}</Text>
            </View>
            <Text style={styles.countText}>{data[month]?.length}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
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
    // Add your styles for the button, such as size, backgroundColor, etc.
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
});

export default MonthScreen;