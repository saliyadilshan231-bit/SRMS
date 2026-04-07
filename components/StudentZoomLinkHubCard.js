import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import COLORS from '@/constants/colors';

const CARD_GRADIENT = [COLORS.white, '#F4F9FF'];

/**
 * Single dashboard entry for all Zoom / meeting links. Opens the list of every module link.
 */
export default function StudentZoomLinkHubCard({ linkCount = 0 }) {
  const router = useRouter();

  const onPress = () => {
    router.push('/student-zoom-links-list');
  };

  const subtitle =
    linkCount === 0
      ? 'No links yet — tap to open the list'
      : linkCount === 1
        ? '1 module — tap to view link'
        : `${linkCount} modules — tap to view all links`;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.wrapper, pressed && styles.wrapperPressed]}
      accessibilityRole="button"
      accessibilityLabel={`Zoom Link. ${subtitle}`}>
      <LinearGradient
        colors={CARD_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientShell}>
        <View style={styles.cardRow}>
          <View style={styles.iconBox}>
            <Ionicons name="videocam-outline" size={20} color={COLORS.darkNavy} />
          </View>
          <View style={styles.textCol}>
            <Text style={styles.title}>Zoom Link</Text>
            <Text style={styles.subtitle} numberOfLines={2}>
              {subtitle}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color={COLORS.deepBlueGray} style={styles.chevron} />
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'center',
    width: '88%',
    maxWidth: 380,
    marginBottom: 0,
  },
  wrapperPressed: {
    opacity: 0.92,
  },
  gradientShell: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(15, 40, 72, 0.08)',
    shadowColor: '#0F2847',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
    overflow: 'hidden',
  },
  cardRow: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  chevron: {
    opacity: 0.75,
    marginLeft: 4,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 15,
    fontFamily: 'Roboto_700Bold',
    color: COLORS.darkNavy,
    letterSpacing: -0.3,
    lineHeight: 19,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'Roboto_400Regular',
    color: COLORS.deepBlueGray,
    opacity: 0.92,
  },
});
