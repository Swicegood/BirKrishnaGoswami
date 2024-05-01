
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useColorScheme } from 'react-native';
import CustomHeader from '../../components/CustomHeader';
import CustomBackHeader from '../../components/CustomBackHeader';
import { Drawer } from 'expo-router/drawer';
import React from 'react';
import { View, Text, Dimensions, StyleSheet, SafeAreaView } from 'react-native';
import { Link } from 'expo-router';
import { Entypo, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';



const windowHeight = Dimensions.get('window').height;

function CustomDrawerContent() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.drawerContent}>
        <View style={styles.header}>
        </View>
        <View style={styles.content}><Link href="./BioScreen" asChild>
          <Text style={styles.drawerText}>About</Text>
        </Link>
          <Link href="./TravelScreen" asChild>
            <Text style={styles.drawerText}>
            <MaterialCommunityIcons name='calendar-clock-outline' size={18} color='black' />    Travel Schedule
            </Text>
          </Link>
          <Link href="./NewsScreen" asChild>
            <Text style={styles.drawerText}>
              <Ionicons name='newspaper-outline' size={18} color='black' />    News
              </Text>
          </Link>
          <Link href="./downloads" asChild>
            <Text style={styles.drawerText}>
              <Entypo name="download" size={18} color="#ED4D4E" />    Downloads
            </Text>
          </Link>
        </View>
        <View style={styles.footer}>
        </View>
      </View>
    </SafeAreaView>
  );
}


/**
 * You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
 */
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function DrawerLayout() {
  const colorScheme = useColorScheme();

  return (
    <Drawer
      drawerContent={(props) => {

        return <CustomDrawerContent drawerPosition={undefined} {...props} />
      }}
      screenOptions={{
        drawerType: "front",
        drawerStyle: {
          width: "70%",
        },
      }}
    >
      <Drawer.Screen
        name="BioScreen" // This is the name of the page and must match the url from root
        options={{
          drawerLabel: 'About',
          title: 'overview',
          header: () => <CustomBackHeader title='BIOGRAPHY' />,
        }}
      />
      <Drawer.Screen
        name="TravelScreen" // This is the name of the page and must match the url from root
        options={{
          drawerLabel: 'Travel Schedule',
          title: 'Travel Schedule',
          header: () => <CustomBackHeader title='TRAVEL' />,
        }}
      />
      <Drawer.Screen
        name="NewsScreen" // This is the name of the page and must match the url from root
        options={{
          drawerLabel: 'News',
          title: 'News About Gurudeva',
          header: () => <CustomBackHeader title='NEWS' />,
        }}
      />
      <Drawer.Screen
        name="downloads" // This is the name of the page and must match the url from root
        options={{
          drawerLabel: 'Downloads',
          title: 'Downloads',
          header: () => <CustomBackHeader title='DOWNLOADS' />,
        }}
      />
      <Drawer.Screen
        name="index"
        options={{
          drawerLabel: 'Home',
          drawerItemStyle: { height: 0 },
          header: () => <CustomHeader />,
        }}
      />
    </Drawer>

  );

}
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#993D39',
  },
  header: {
    backgroundColor: '#ED4D4E',
    alignItems: 'center',
    justifyContent: 'center',
    height: .2 * windowHeight,
  },
  headerText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    backgroundColor: 'white',
    paddingLeft: 40,
    height: .67 * windowHeight,
  },
  footer: {
    backgroundColor: '#ED4D4E',
    alignItems: 'center',
    justifyContent: 'center',
    height: .15 * windowHeight,
  },
  drawerContent: {
    flex: 1,
    backgroundColor: 'white', // Customize your color
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },
  drawerText: {
    fontFamily: 'OblikBold', // Use the OblikBold font
    fontSize: 16,
    color: '#3f3f3f', // Choose your color
    marginTop: 20,
    marginBottom: 30,
  },
});