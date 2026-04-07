import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';

/**
 * Students in a learning / library setting — education-focused (similar portal vibe to full-bleed campus logins).
 * Alternative (bookshelves): photo-1521587760476-6c12a4b04042
 */
const BG_STUDENTS =
  'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1600&q=80&auto=format&fit=crop';

/**
 * Full-bleed photo + dark navy wash — image stays visible (Glion-style overlay).
 * Welcome / role landing only — login screens keep LoginGlassBackground.
 */
export default function KuppiWelcomeBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Image
        source={{ uri: BG_STUDENTS }}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
        cachePolicy="memory-disk"
      />

      <LinearGradient
        colors={['rgba(5, 18, 45, 0.58)', 'rgba(8, 28, 55, 0.66)', 'rgba(3, 12, 32, 0.74)']}
        locations={[0, 0.48, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <LinearGradient
        colors={['rgba(0, 35, 55, 0.35)', 'transparent', 'rgba(2, 8, 28, 0.45)']}
        locations={[0, 0.45, 1]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}
