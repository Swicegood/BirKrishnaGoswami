import React, { useCallback, useEffect, useState, ReactNode } from 'react'
import { LayoutChangeEvent, StyleSheet, View, Dimensions } from 'react-native'
import { useDebouncedCallback } from '../../hooks'

let i = 0

interface MeasureViewProps {
    children: ReactNode;
    onSetOrientation: (orientation: string) => void; // Add this line
    onSetWidth: (width: number) => void;
}

interface ChildProps {
    orientation: string;
}

const MeasureView: React.FC<MeasureViewProps> = ({ children, onSetOrientation, onSetWidth }) => {
    const [orientation, setOrientation] = useState(Dimensions.get('window').width > Dimensions.get('window').height ? 'LANDSCAPE' : 'PORTRAIT');
    const [width, setWidth] = useState(Dimensions.get('window').width);

    useEffect(() => {
        setOrientation(orientation === 'LANDSCAPE' ? 'PORTRAIT' : 'LANDSCAPE');
        onSetOrientation(orientation);
        console.log('MeasureView orientation: ', orientation)
        onSetWidth(width);
    }, [width]);


    // Create handlers
    const [setDimensions] = useDebouncedCallback(
        (width: number, height: number) => {
            setWidth(width)
        },
        500
    )
    const handleLayout = useCallback(
        (event: LayoutChangeEvent) => {
            const { width, height } = event.nativeEvent.layout
            setDimensions(width, height)
        },
        [setDimensions]
    )

    return (
        <View onLayout={handleLayout}>
            {children}
        </View>
    )
}

export default MeasureView