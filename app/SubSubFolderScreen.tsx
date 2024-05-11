import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, Image, TouchableOpacity, FlatList,
    ActivityIndicator, Dimensions
} from 'react-native';
import { Link, useLocalSearchParams, useFocusEffect, router } from 'expo-router';
import { useNavigationState } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomHeaderMain from '../components/CustomHeaderMain';

// Assuming you have a placeholder image, replace 'placeholder.jpg' with your image path
const placeholderImage = require('../assets/images/placeholder_portrait.png');

// Calculate the width of the screen
const { width } = Dimensions.get('window');
const itemWidth = (width - 32) / 2; // Assuming we want 16px padding on both sides
const itemHeight = Dimensions.get('window').height / 3;

interface SubCategory {
    key: string;
    title: string;
    image: any;
    parents: any;
}

const images = {
    "01_-_Purva_Campu": require('../assets/images/Gopal_Champu.jpg'),
    "02_-_Uttara_Campu": require('../assets/images/Gopal_Champu.jpg'),
    "Chapter-01": require('../assets/images/Bhagavad_Gita.png'),
    "Chapter-02": require('../assets/images/Bhagavad_Gita.png'),
    "Chapter-03": require('../assets/images/Bhagavad_Gita.png'),
    "Chapter-04": require('../assets/images/Bhagavad_Gita.png'),
    "Chapter-05": require('../assets/images/Bhagavad_Gita.png'),
    "Chapter-06": require('../assets/images/Bhagavad_Gita.png'),
    "Chapter-07": require('../assets/images/Bhagavad_Gita.png'),
    "Chapter-08": require('../assets/images/Bhagavad_Gita.png'),
    "Chapter-09": require('../assets/images/Bhagavad_Gita.png'),
    "Chapter-10": require('../assets/images/Bhagavad_Gita.png'),
    "Chapter-11": require('../assets/images/Bhagavad_Gita.png'),
    "Chapter-12": require('../assets/images/Bhagavad_Gita.png'),
    "Chapter-13": require('../assets/images/Bhagavad_Gita.png'),
    "Chapter-14": require('../assets/images/Bhagavad_Gita.png'),
    "Chapter-15": require('../assets/images/Bhagavad_Gita.png'),
    "Chapter-16": require('../assets/images/Bhagavad_Gita.png'),
    "Chapter-17": require('../assets/images/Bhagavad_Gita.png'),
    Adi_Lila: require('../assets/images/Adi_Lila.jpg'),
    Madhya_Lila: require('../assets/images/Madhya_Lila.jpg'),
    Antya_Lila: require('../assets/images/Antya_Lila.jpg'),
    "2014": require('../assets/images/Nectar_of_Instruction.png'),
    "2022": require('../assets/images/Nectar_of_Instruction.png'),
    "2012": require('../assets/images/Empathic_Communication.jpg'),
    "2018": require('../assets/images/Empathic_Communication.jpg'),
    "July_2013": require('../assets/images/Health.png'),
    "June_2013": require('../assets/images/Health.png'),
    "01": require('../assets/images/Disciple_Course.png'),
    "02": require('../assets/images/Disciple_Course.png'),
    "03": require('../assets/images/Disciple_Course.png'),

};

function buildCategoryList(hierarchy: Record<string, any>, parent: string): string[] {
    const categories: string[] = [];
    console.log("buildCategoryList", hierarchy[0], parent);
    const traverse = (node: Record<string, any> | null, currentParent: string) => {
        if (currentParent === parent) {
            categories.push(...Object.keys(node));
        } else {
            for (const [key, value] of Object.entries(node)) {
                traverse(value, key);
            }
        }
    };

    traverse(hierarchy, '');
    return categories;
}


const SubSubFolderScreen = () => {
    const { hierarchy: localHierarchy, category } = useLocalSearchParams<{ category: string; hierarchy: string }>();
    const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let deserializedHierarchy: Record<string, any> = {};
        try {
            if (localHierarchy !== null) {
                deserializedHierarchy = JSON.parse(localHierarchy);
            }
        } catch (error) {
            console.log("Hierarchy Failed");
            return;
        }
        let subcategories: SubCategory[] = [];
        if (category !== null && deserializedHierarchy !== null) {
            subcategories = buildCategoryList(deserializedHierarchy, category).map((subcategory, index): SubCategory => ({
                title: subcategory,
                key: index.toString(),
                image: placeholderImage,
                parents: deserializedHierarchy[index],
            }));
        }
        const uniqueSubcategories = subcategories.reduce((unique, subcategory) => {
            if (unique.findIndex(item => item.title === subcategory.title) === -1) {
                unique.push(subcategory);
            }
            return unique;
        }, [] as SubCategory[]);
        setSubCategories(uniqueSubcategories);
        console.log("SubFolderScreenUniqSubCat", uniqueSubcategories);
        setIsLoading(false);

    }, [localHierarchy]);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#ED4D4E" />
            </View>
        );
    }

    const renderItem = ({ item }: { item: SubCategory }) => (
        <View style={styles.itemContainer}>
            <Link
                href={{
                    pathname: "FilesScreen",
                    params: {
                        category: item.title,
                    }
                }}
                asChild
            >
                <TouchableOpacity>
                    <View style={styles.imageView}>
                        <Image source={images[item.title] || item.image} style={styles.image} resizeMode="cover" />
                    </View>
                </TouchableOpacity>
            </Link>
            <Text style={styles.itemText}>{item.title.replaceAll('_', ' ')}</Text>
        </View>
    );

    return (
        <>
            <CustomHeaderMain title={category} />
            <View>
                <FlatList
                    data={subCategories}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.key}
                    numColumns={2}
                    columnWrapperStyle={styles.columnWrapper}
                    contentContainerStyle={styles.contentContainer}
                    ListFooterComponent={<View style={{ height: 120 }} />} // Add this line
                />
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
    },
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
    },
    columnWrapper: {
        justifyContent: 'space-between',
    },
    contentContainer: {
        alignItems: 'center',
    },
    itemContainer: {
        width: itemWidth,
        height: itemHeight,
        borderWidth: .25, // This sets the width of the border
        borderColor: 'lightgray', // This sets the color of the border
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    image: {
        width: '50%',
        height: undefined,
        aspectRatio: .673, // Your images are square
    },
    imageView: {
        width: '100%',
        backgroundColor: 'white',
        shadowColor: "#000",
        shadowOffset: {
            width: -10,
            height: 10,
        },
        shadowOpacity: 0.7,
        shadowRadius: 10,
        elevation: 15,
    },
    itemText: {
        position: 'absolute',
        bottom: 10,
        fontFamily: 'OblikBold',
        color: 'maroon',
    },
});

export default SubSubFolderScreen;