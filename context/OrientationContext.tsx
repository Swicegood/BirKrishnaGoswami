// Create a new file called OrientationContext.tsx
import React from 'react';

export type OrientationType = 'PORTRAIT' | 'LANDSCAPE';

export const OrientationContext = React.createContext<{
  orientation: OrientationType;
  setOrientation: (orientation: OrientationType) => void;
}>({
  orientation: 'PORTRAIT',
  setOrientation: () => {},
});