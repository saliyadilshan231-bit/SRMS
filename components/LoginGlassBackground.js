import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';

import { PT } from '@/constants/peerTutorTheme';

/** Same study / bookshelf vibe as peer tutor registration (screen 3). */
const STUDY_BG_URI =
  'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1400&q=80&auto=format&fit=crop';

/**
 * Light, blurred glass stack — same for role landing (Welcome) + student + peer tutor login.
 */
export default function LoginGlassBackground() {
  const blurIntensity = Platform.OS === 'android' ? 38 : 52;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={PT.pageGradient}
        locations={PT.pageLocations}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <Image
        source={{ uri: STUDY_BG_URI }}
        style={[StyleSheet.absoluteFillObject, { opacity: 0.52 }]}
        contentFit="cover"
        cachePolicy="memory-disk"
      />

      {/* Soft wash — airy blue-white, lets photo read through (like registration header) */}
      <LinearGradient
        colors={PT.wash}
        locations={[0, 0.45, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Left cyan veil — matches “light blue on the left” in reference */}
      <LinearGradient
        colors={['rgba(224,242,254,0.55)', 'rgba(255,255,255,0.08)', 'transparent']}
        locations={[0, 0.35, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />

      <BlurView
        intensity={blurIntensity}
        tint="light"
        experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
        style={StyleSheet.absoluteFill}
      />

      {/* Thin bright veil — extra transparency / glass feel */}
      <LinearGradient
        colors={[
          'rgba(255,255,255,0.42)',
          'rgba(255,255,255,0.12)',
          'rgba(248,250,252,0.28)',
        ]}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}
