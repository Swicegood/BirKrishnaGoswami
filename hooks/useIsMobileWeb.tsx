import { useState, useEffect } from 'react';
import { Platform } from 'react-native';

const useIsMobileWeb = () => {
  const [isMobileWeb, setIsMobileWeb] = useState(false);

  useEffect(() => {
    const checkIsMobileWeb = () => {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const userAgent = window.navigator.userAgent;
        const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
        const isMobileDevice = mobileRegex.test(userAgent);
        const isSmallScreen = window.innerWidth <= 768;

        setIsMobileWeb(isMobileDevice || isSmallScreen);
      } else {
        setIsMobileWeb(false);
      }
    };

    checkIsMobileWeb();

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.addEventListener('resize', checkIsMobileWeb);
      return () => window.removeEventListener('resize', checkIsMobileWeb);
    }
  }, []);

  return isMobileWeb;
};

export default useIsMobileWeb;