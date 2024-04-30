import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { StatusBar } from 'expo-status-bar';

const CustomHeaderMain = ({ title }) => {
    const navigation = useNavigation();




    return (
        <>
            <StatusBar style="light" />
            <SafeAreaView style={styles.safeArea} edges={['right', 'top', 'left']}>
                <View style={styles.header}>
                    {navigation.canGoBack() && (
                        <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [{ opacity: pressed ? 0.5 : 1 }, styles.leftItem]}>
                            <FontAwesome name="angle-left" size={32} color="white" />
                        </Pressable>
                    )}
                    {!navigation.canGoBack() && (
                        <Pressable onPress={() => router.push('./(drawer)/BioScreen')} style={({ pressed }) => [{ opacity: pressed ? 0.5 : 1 }, styles.leftItem]}>
                            <Text>{'\u2630'}</Text>
                        </Pressable>
                    )}
                    <View style={styles.titleContainer}>
                        <Text style={styles.title}>{title}</Text>
                    </View>
                    <View style={styles.rightItem}>
                        {/* Placeholder for right item */}
                    </View>
                </View>
            </SafeAreaView>
        </>
    );
};


const styles = StyleSheet.create({
    safeArea: {
        backgroundColor: '#993D39', // Use the same color as your header
    },
    header: {
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        backgroundColor: '#ED4D4E', // Set the background color for your header
    },
    titleContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
    },
    leftItem: {
        zIndex: 1,
        fontSize: 28,
        color: 'white',
    },
    rightItem: {
        // Styles for the right item...
    },
    menuText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: 'white', // Choose your color
    },
});

export default CustomHeaderMain;
