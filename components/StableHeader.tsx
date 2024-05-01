import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { usePathname } from 'expo-router';
import CustomHeaderMain from './CustomHeaderMain';

function StableHeader() {
  const pathname = usePathname();
  const [headerContent, setHeaderContent] = useState(null);

  useEffect(() => {
    // Decide what to render based on pathname
    if (
      pathname === '/' ||
      pathname === '/NewsScreen' ||
      pathname === '/BioScreen' ||
      pathname === '/modal' ||
      pathname === '/TravelScreen' ||
      pathname === '/downloads' 
    ) {
      setHeaderContent(null); // Or some other header setup
    } else {
        if (pathname === '/PicturesScreen') {
            setHeaderContent(<CustomHeaderMain title="PICTURES" />);
        } else if (pathname === '/AudioStartScreen') {
            setHeaderContent(<CustomHeaderMain title="AUDIO" />);
        } else if (pathname === '/ChantingScreen') {
            setHeaderContent(<CustomHeaderMain title="CHANTING" />);
        } else if (pathname === '/DayScreen') {
            setHeaderContent(<CustomHeaderMain title="AUDIO" />);
        } else if (pathname === '/DeitiesScreen') {
            setHeaderContent(<CustomHeaderMain title="DEITIES" />);
        } else if (pathname === '/DeityGallery') {
            setHeaderContent(<CustomHeaderMain title="DEITIES" />);
        } else if (pathname === '/BooksScreen') {
            setHeaderContent(<CustomHeaderMain title="BOOKS" />);
        } else if (pathname === '/BlogScreen') {
            setHeaderContent(<CustomHeaderMain title="BLOG" />);
        } else if (pathname === '/DonationScreen') {
            setHeaderContent(<CustomHeaderMain title="DONATE" />);
        } else if (pathname === '/EbooksScreen') {
            setHeaderContent(<CustomHeaderMain title="EBOOKS" />);
        } else if (pathname === '/FolderScreen') {
            setHeaderContent(<CustomHeaderMain title="AUDIO" />);
        } else if (pathname === '/GalleryScreen') {
            setHeaderContent(<CustomHeaderMain title="GALLERY" />);
        } else if (pathname === '/GurudevaPicsScreen') {
            setHeaderContent(<CustomHeaderMain title="LIVE" />);
        } else if (pathname === '/MemoriesScreen') {
            setHeaderContent(<CustomHeaderMain title="MEMORIES" />);
        } else if (pathname === '/MonthScreen') {
            setHeaderContent(<CustomHeaderMain title="AUDIO" />);
        } else if (pathname === '/NewsItemScreen') {
            setHeaderContent(<CustomHeaderMain title="NEWS" />);
        } else if (pathname === '/PdfViewScreen') {
            setHeaderContent(<CustomHeaderMain title="PDF" />);
        } else if (pathname === '/PhotosScreen') {
            setHeaderContent(<CustomHeaderMain title="PHOTOS" />);
        } else if (pathname === '/PicturesScreen') {
            setHeaderContent(<CustomHeaderMain title="PICTURES" />);
        } else if (pathname === '/PlaylistScreen') {
            setHeaderContent(<CustomHeaderMain title="PLAYLIST" />);
        } else if (pathname === '/PurchaseScreen') {
            setHeaderContent(<CustomHeaderMain title="BOOKS" />);
        } else if (pathname === '/QuoteScreen') {
            setHeaderContent(<CustomHeaderMain title="QUOTE" />);
        } else if (pathname === '/ReadVPScreen') {
            setHeaderContent(<CustomHeaderMain title="VYASA PUJA" />);
        } else if (pathname === '/RecentVideosScreen') {
            setHeaderContent(<CustomHeaderMain title="VIDEOS" />);
        } else if (pathname === '/SearchYouTubeScreen') {
            setHeaderContent(<CustomHeaderMain title="VIDEOS" />);
        } else if (pathname === '/TemplesScreen') {
            setHeaderContent(<CustomHeaderMain title="TEMPLES" />);
        } else if (pathname === '/YearScreen') {
            setHeaderContent(<CustomHeaderMain title="AUDIO" />);
        } else if (pathname === '/RecentUploads') {
            setHeaderContent(<CustomHeaderMain title="VIDEOS" />);
        } else if (pathname === '/RecentVideosScreen') {
            setHeaderContent(<CustomHeaderMain title="VIDEOS" />);
        } else if (pathname === '/SPPlaylistScreen') {
            setHeaderContent(<CustomHeaderMain title="VIDEOS" />);
        }  else if (pathname === '/VPOfferingsScreen') {
            setHeaderContent(<CustomHeaderMain title="OFFERINGS" />);
        }  else if (pathname === '/VPBooksScreen') {
            setHeaderContent(<CustomHeaderMain title="BOOKS" />);
        }  else if (pathname === '/VPPlaylistScreen') {
            setHeaderContent(<CustomHeaderMain title="VIDEOS" />);
        } 
    }
  }, [pathname]);

  return headerContent ? (
    <>
      {headerContent}
    </>
  ) : null;
}

export default StableHeader;
