import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';

import { LIB_BG } from '@/constants/libraryTheme';

const STUDY_BG =
  'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1080&q=80&auto=format&fit=crop';

/**
 * Layered dark/light blue gradients + subtle study texture.
 */
export default function LibraryBlueBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={LIB_BG.base}
        locations={LIB_BG.baseLocations}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={LIB_BG.overlay}
        locations={LIB_BG.overlayLocations}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Image
        source={{ uri: STUDY_BG }}
        style={[StyleSheet.absoluteFillObject, { opacity: LIB_BG.imageOpacity }]}
        contentFit="cover"
      />
      <LinearGradient
        colors={LIB_BG.veil}
        locations={LIB_BG.veilLocations}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}
