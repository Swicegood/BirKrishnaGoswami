import React, { useEffect, useState } from 'react';
import { useGlobalSearchParams, Link } from 'expo-router';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

function customDecodeURI(str) {
  return decodeURIComponent(str.replace(/%27/g, "'").replace(/%28/g, "(").replace(/%29/g, ")"));
}

const DayScreen = () => {
  const { year, month, dataString } = useGlobalSearchParams();
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    if (!dataString) {
      return;
    }
    const parsedData = JSON.parse(dataString);
    const dataWithTitles = parsedData.map((url: string) => {
      const title = customDecodeURI(url)?.split('/').pop() || ''; // Extract basename from URL
      return { url, title, month, year };
    });
    setData(dataWithTitles);
  }, [dataString]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <ScrollView>
      <View>
        {data.map((item, index) => (
          <View style={styles.container} key={index}>
            <Link href={{ pathname: "AudioScreen", params: { url: item.url, title: item.title } }} asChild>
              <TouchableOpacity style={styles.playButton}>
                {/* Replace with your play icon */}
                <Image source={require('../assets/images/vecteezy_jogar-design-de-sinal-de-icone-de-botao_10148443.png')} style={styles.playIcon} />
              </TouchableOpacity>
            </Link>
            <View style={styles.textContainer}>
              <Text style={styles.titleText} numberOfLines={3} ellipsizeMode='tail'>
                {item.title.split('.')[0].replaceAll("_", " ")}
              </Text>
              <Text>
              </Text>
              <Text style={styles.dateText}>{item.month.slice(2)}/{item.year}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
    </GestureHandlerRootView>
  );
};


const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 10,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc', // Adjust color as needed
  },
  playButton: {
    marginRight: 30,
    // Add your styles for the button, such as size, backgroundColor, etc.
  },
  playIcon: {
    width: 30, // Adjust size as needed
    height: 30, // Adjust size as needed
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

export default DayScreen;