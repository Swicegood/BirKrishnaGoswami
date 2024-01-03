
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, Tabs } from 'expo-router';
import { Pressable, useColorScheme } from 'react-native';
import  CustomHeader  from '../../components/CustomHeader';
import CustomBackHeader from '../../components/CustomBackHeader';
import { Drawer } from 'expo-router/drawer';
import Colors from '../../constants/Colors';

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
    <Drawer>
    <Drawer.Screen
      name="about" // This is the name of the page and must match the url from root
      options={{
        drawerLabel: 'About',
        title: 'overview',
        header: () => <CustomBackHeader />,
      }}
    />
    <Drawer.Screen
      name="travel" // This is the name of the page and must match the url from root
      options={{
        drawerLabel: 'Travel Schedule',
        title: 'Travel Schedule',
        header: () => <CustomBackHeader />,
      }}
    />
    <Drawer.Screen
      name="blog" // This is the name of the page and must match the url from root
      options={{
        drawerLabel: 'Blog',
        title: 'Gurudeva\'s Blog',
        header: () => <CustomBackHeader />,
      }}
    />
    <Drawer.Screen
      name="downloads" // This is the name of the page and must match the url from root
      options={{
        drawerLabel: 'Downloads',
        title: 'Downloads',
        header: () => <CustomBackHeader />,
      }}
    />
    <Drawer.Screen 
    name="index"
    options={{ 
        drawerLabel: 'Home',
        drawerItemStyle: { height: 0 }, 
        header: () => <CustomHeader />, }} 
    />    
  </Drawer>
  );
}