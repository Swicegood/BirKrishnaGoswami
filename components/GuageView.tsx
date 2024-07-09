import React, { useCallback, useEffect, useState, ReactNode } from 'react'
import { LayoutChangeEvent, StyleSheet, View, Dimensions, Platform } from 'react-native'
import { useDebouncedCallback } from '../hooks'

interface MeasureViewProps {
    children: ReactNode;
    onSetOrientation: (orientation: string) => void;
    onSetWidth: (width: number) => void;
}

const isTablet = () => {
    const { width, height } = Dimensions.get('window');
    const aspectRatio = width / height;
    return Math.min(width, height) >= 600 && (aspectRatio > 1.2 || aspectRatio < 0.9);
}

const portraitWidth = () => {
    const { width, height } = Dimensions.get('window');
    return Math.min(width, height);
}

const isSmallTablet = () => {
    const { width, height } = Dimensions.get('window');
    const aspectRatio = width / height;
    return Math.min(width, height) >= 600 && (aspectRatio > 1.2 || aspectRatio < 0.9) && Math.min(width, height) < 820;
}

const MeasureView: React.FC<MeasureViewProps> = ({ children, onSetOrientation, onSetWidth }) => {
    const [width, setWidth] = useState(Dimensions.get('window').width);
    const [updateKey, setUpdateKey] = useState(0);

    useEffect(() => {
        const tablet = isTablet();
        let orientation: string;

        if (Platform.OS === 'android' && !tablet) {
            orientation = width > 500 ? 'LANDSCAPE' : 'PORTRAIT';
        } else if (Platform.OS === 'ios' && !tablet) {
            orientation = Dimensions.get('window').width > Dimensions.get('window').height ? 'LANDSCAPE' : 'PORTRAIT';
        } else if (tablet) {
            orientation = width > portraitWidth() ? 'LANDSCAPE' : 'PORTRAIT';
        } else if (Platform.OS === 'web') {
            orientation = Dimensions.get('window').width > Dimensions.get('window').height ? 'LANDSCAPE' : 'PORTRAIT';
        } else {
            orientation = 'PORTRAIT';
        }

        console.log(`${new Date().toISOString()} MeasureView orientation: ${orientation}`);
        onSetOrientation(orientation);
        onSetWidth(width);
    }, [updateKey]);

    const [setDebouncedWidth] = useDebouncedCallback(
        (newWidth: number) => {
            console.log(`${new Date().toISOString()} MeasureView setWidth: ${newWidth}`);
            setWidth(newWidth)
            setUpdateKey(updateKey + 1);
        },
        500
    )

    const handleLayout = useCallback(
        (event: LayoutChangeEvent) => {
            const newWidth = event.nativeEvent.layout.width
            setDebouncedWidth(newWidth)
        },
        [setDebouncedWidth]
    )

    return (
        <View onLayout={handleLayout} style={styles.container}>
            {children}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
    },
});

export default MeasureView