import React from 'react';
import { View, Text, StyleSheet, Pressable, TouchableOpacity } from 'react-native';
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
                        <TouchableOpacity style={styles.leftItem} hitSlop={{top: 20, bottom: 20, left: 20, right: 10}} onPress={() => navigation.goBack() }>
                            <FontAwesome name="angle-left" size={32} color="white" />
                        </TouchableOpacity>
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
