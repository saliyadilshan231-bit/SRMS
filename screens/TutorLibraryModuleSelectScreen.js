import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import LibraryBlueBackground from '@/components/LibraryBlueBackground';
import { LIBRARY_BROWSE_MODULES } from '@/constants/libraryModules';
import { LIB_FRAME, LIB_HEADER_DARK, LIB_REF } from '@/constants/libraryTheme';

const TEXT_DARK = '#1F2937';
const TEXT_MUTED = '#6B7280';

export default function TutorLibraryModuleSelectScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [search, setSearch] = useState('');

  const cols = width >= 640 ? 3 : 2;
  const pad = 16;
  const gap = 12;
  const cardWidth = (width - pad * 2 - gap * (cols - 1)) / cols;

  const filteredModules = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = [...LIBRARY_BROWSE_MODULES];
    if (q) {
      list = list.filter(
        (m) =>
          m.title.toLowerCase().includes(q) || m.subtitle.toLowerCase().includes(q),
      );
    }
    list.sort((a, b) => a.title.localeCompare(b.title));
    return list;
  }, [search]);

  const goUpload = (module) => {
    router.push({
      pathname: '/library-upload',
      params: {
        moduleId: module.id,
        moduleTitle: encodeURIComponent(module.title),
      },
    });
  };

  return (
    <View style={styles.root}>
      <LibraryBlueBackground />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}>
          <View style={styles.topBar}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
              hitSlop={12}>
              <Ionicons name="chevron-back" size={26} color={LIB_HEADER_DARK.backIcon} />
            </Pressable>
          </View>

          <View style={styles.glassHeaderOuter}>
            <LinearGradient
              colors={LIB_HEADER_DARK.cardGradient}
              locations={LIB_HEADER_DARK.cardLocations}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.glassHeaderInner}>
              <Text style={styles.pageTitleOnDark}>Choose module</Text>
              <Text style={styles.greetingOnDark}>Pick a module to upload notes or papers for</Text>
            </LinearGradient>
          </View>

          <View style={styles.searchBlock}>
            <View style={styles.searchUnderlineWrap}>
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search modules…"
                placeholderTextColor="rgba(148,163,184,0.95)"
                style={styles.searchInput}
              />
              {search.length > 0 ? (
                <Pressable onPress={() => setSearch('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={20} color={TEXT_MUTED} />
                </Pressable>
              ) : null}
            </View>
            <LinearGradient
              colors={['#BAE6FD', '#7DD3FC', '#38BDF8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.searchAccentLine}
            />
          </View>

          <View style={[styles.grid, { gap }]}>
            {filteredModules.map((module) => (
              <Pressable
                key={module.id}
                onPress={() => goUpload(module)}
                style={({ pressed }) => [
                  styles.card,
                  { width: cardWidth },
                  pressed && styles.cardPressed,
                ]}>
                <View style={styles.bannerWrap}>
                  <LinearGradient
                    colors={module.banner}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.banner}
                  />
                  <View style={styles.progressBar}>
                    <Text style={styles.progressText}>Tap to upload</Text>
                  </View>
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.moduleTitle} numberOfLines={2}>
                    {module.title}
                  </Text>
                  <Text style={styles.moduleSub} numberOfLines={2}>
                    {module.subtitle}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>

          {filteredModules.length === 0 ? (
            <Text style={styles.empty}>No modules match your search.</Text>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: LIB_REF.screenBg,
  },
  safe: { flex: 1 },
  scroll: {
    paddingBottom: 32,
  },
  topBar: {
    paddingHorizontal: 8,
    paddingTop: 4,
  },
  backBtn: {
    alignSelf: 'flex-start',
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: LIB_HEADER_DARK.backBorder,
    backgroundColor: LIB_HEADER_DARK.backFill,
  },
  backBtnPressed: { opacity: 0.75 },
  glassHeaderOuter: {
    marginHorizontal: 16,
    marginTop: 4,
    borderRadius: 14,
    padding: 2,
    borderWidth: 1.5,
    borderColor: LIB_HEADER_DARK.frameBorder,
    backgroundColor: 'rgba(4, 26, 46, 0.35)',
    overflow: 'hidden',
  },
  glassHeaderInner: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  pageTitleOnDark: {
    fontSize: 26,
    fontFamily: 'Roboto_900Black',
    color: LIB_HEADER_DARK.title,
    letterSpacing: 0.2,
  },
  greetingOnDark: {
    marginTop: 8,
    fontSize: 15,
    fontFamily: 'Roboto_500Medium',
    color: LIB_HEADER_DARK.subtitle,
    lineHeight: 21,
  },
  searchBlock: {
    marginHorizontal: 16,
    marginTop: 18,
  },
  searchUnderlineWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Roboto_400Regular',
    color: LIB_FRAME.body,
    paddingVertical: 4,
  },
  searchAccentLine: {
    height: 3,
    borderRadius: 2,
    marginTop: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 16,
    marginTop: 20,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: LIB_FRAME.cardFace,
    marginBottom: 4,
    shadowColor: LIB_FRAME.cardShadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 5,
    borderWidth: 1.5,
    borderColor: LIB_FRAME.cardBorder,
  },
  cardPressed: { opacity: 0.92 },
  bannerWrap: { position: 'relative' },
  banner: { height: 100, width: '100%' },
  progressBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15,23,42,0.55)',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  progressText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'Roboto_600SemiBold',
  },
  cardBody: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 14,
  },
  moduleTitle: {
    fontSize: 15,
    fontFamily: 'Roboto_700Bold',
    color: TEXT_DARK,
  },
  moduleSub: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: 'Roboto_400Regular',
    color: TEXT_MUTED,
  },
  empty: {
    marginTop: 24,
    textAlign: 'center',
    marginHorizontal: 24,
    fontSize: 14,
    color: TEXT_MUTED,
    fontFamily: 'Roboto_400Regular',
  },
});
