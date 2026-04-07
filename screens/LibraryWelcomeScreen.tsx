// @ts-nocheck
import React, { useCallback, useState } from 'react';
import {
  Keyboard,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { sessionSchedulingBrowseModulesParams } from '@/constants/sessionSchedulingFaculties';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

/** Bookshelves — readable with dark overlay */
const LIBRARY_BG_URI =
  'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=1920&q=80&auto=format&fit=crop';

const ORANGE = '#FFB300';
const ORANGE_BTN = '#F9A825';
const WHITE = '#FFFFFF';
const NAVY_DOT = '#0A1628';

export default function LibraryWelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');

  const goBrowse = useCallback(
    (q) => {
      Keyboard.dismiss();
      const trimmed = (q ?? query).trim();
      router.push({
        pathname: '/library/browse',
        params: trimmed ? { q: trimmed } : {},
      });
    },
    [query, router],
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <Image
        source={{ uri: LIBRARY_BG_URI }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        cachePolicy="memory-disk"
        transition={300}
      />
      <LinearGradient
        colors={['rgba(6,12,28,0.55)', 'rgba(8,18,42,0.72)', 'rgba(4,8,22,0.88)']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.topRow}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={({ pressed }) => [styles.backChip, pressed && styles.backChipPressed]}>
            <Ionicons name="chevron-back" size={22} color={WHITE} />
          </Pressable>
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/session-scheduling-modules',
                params: sessionSchedulingBrowseModulesParams,
              })
            }
            style={({ pressed }) => [styles.banner, pressed && styles.bannerPressed]}>
            <Text style={styles.bannerText} numberOfLines={2}>
              Reserve Your Study Space Now
            </Text>
          </Pressable>
        </View>

        <View style={styles.center}>
          <Text style={styles.welcomeScript}>Welcome to</Text>
          <Text style={styles.heroTitle}>Kuppi Library</Text>
          <Text style={styles.subHero}>Start your library search…</Text>

          <View style={styles.searchRow}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search…"
              placeholderTextColor="#94A3B8"
              style={styles.searchInput}
              returnKeyType="search"
              onSubmitEditing={() => goBrowse()}
              autoCorrect={false}
              autoCapitalize="none"
            />
            <Pressable
              onPress={() => goBrowse()}
              style={({ pressed }) => [styles.searchFab, pressed && styles.searchFabPressed]}
              accessibilityLabel="Search library">
              <Ionicons name="search" size={22} color={WHITE} />
            </Pressable>
          </View>

          <Pressable onPress={() => goBrowse('')} style={({ pressed }) => [styles.skipRow, pressed && { opacity: 0.85 }]}>
            <Text style={styles.skipText}>Browse all modules</Text>
            <Ionicons name="arrow-forward-circle" size={22} color={ORANGE} />
          </Pressable>

          <Pressable
            onPress={() => router.push('/library/tutor-materials')}
            style={({ pressed }) => [styles.tutorMaterialsRow, pressed && styles.tutorMaterialsRowPressed]}>
            <Ionicons name="documents-outline" size={22} color={WHITE} />
            <View style={styles.tutorMaterialsTextWrap}>
              <Text style={styles.tutorMaterialsTitle}>Tutor notes & papers</Text>
              <Text style={styles.tutorMaterialsSub}>Choose a module, then view uploaded files</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.85)" />
          </Pressable>
        </View>

        <View style={[styles.dots, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={[styles.dot, styles.dotOn]} />
          <View style={styles.dot} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a1628' },
  safe: { flex: 1 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 4,
    gap: 10,
  },
  backChip: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backChipPressed: { opacity: 0.85 },
  banner: {
    maxWidth: '68%',
    backgroundColor: ORANGE,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderBottomLeftRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
  },
  bannerPressed: { opacity: 0.92 },
  bannerText: {
    color: WHITE,
    fontFamily: 'Roboto_700Bold',
    fontSize: 11,
    lineHeight: 15,
    textAlign: 'right',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
    marginTop: -28,
  },
  welcomeScript: {
    fontFamily: 'LibreBaskerville_700Bold',
    fontSize: 26,
    color: WHITE,
    textAlign: 'center',
    fontStyle: 'italic',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  heroTitle: {
    marginTop: 6,
    fontFamily: 'Roboto_900Black',
    fontSize: Platform.OS === 'web' ? 42 : 36,
    lineHeight: Platform.OS === 'web' ? 48 : 42,
    color: WHITE,
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  subHero: {
    marginTop: 14,
    fontFamily: 'Roboto_700Bold',
    fontSize: 16,
    color: ORANGE,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  searchRow: {
    marginTop: 28,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHITE,
    borderRadius: 999,
    paddingLeft: 20,
    paddingRight: 6,
    paddingVertical: Platform.OS === 'ios' ? 6 : 4,
    minHeight: 52,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.95)',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Roboto_400Regular',
    color: '#0F172A',
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
  },
  searchFab: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: ORANGE_BTN,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ORANGE_BTN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 6,
  },
  searchFabPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  skipRow: {
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  skipText: {
    fontFamily: 'Roboto_500Medium',
    fontSize: 15,
    color: 'rgba(255,255,255,0.92)',
  },
  tutorMaterialsRow: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  tutorMaterialsRowPressed: { opacity: 0.88 },
  tutorMaterialsTextWrap: { flex: 1, minWidth: 0 },
  tutorMaterialsTitle: {
    fontFamily: 'Roboto_700Bold',
    fontSize: 15,
    color: WHITE,
  },
  tutorMaterialsSub: {
    marginTop: 2,
    fontFamily: 'Roboto_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.78)',
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: NAVY_DOT,
    opacity: 0.55,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  dotOn: {
    backgroundColor: WHITE,
    opacity: 1,
    width: 9,
    height: 9,
    borderRadius: 5,
    borderColor: 'rgba(255,255,255,0.6)',
  },
});

