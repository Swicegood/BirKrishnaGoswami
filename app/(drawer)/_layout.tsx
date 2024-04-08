
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useColorScheme } from 'react-native';
import  CustomHeader  from '../../components/CustomHeader';
import CustomBackHeader from '../../components/CustomBackHeader';
import { Drawer } from 'expo-router/drawer';

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
      name="BioScreen" // This is the name of the page and must match the url from root
      options={{
        drawerLabel: 'About',
        title: 'overview',
        header: () => <CustomBackHeader />,
      }}
    />
    <Drawer.Screen
      name="TravelScreen" // This is the name of the page and must match the url from root
      options={{
        drawerLabel: 'Travel Schedule',
        title: 'Travel Schedule',
        header: () => <CustomBackHeader />,
      }}
    />
    <Drawer.Screen
      name="NewsScreen" // This is the name of the page and must match the url from root
      options={{
        drawerLabel: 'News',
        title: 'News About Gurudeva',
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