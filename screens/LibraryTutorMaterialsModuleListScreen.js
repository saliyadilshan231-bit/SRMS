import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import LibraryBlueBackground from '@/components/LibraryBlueBackground';
import { LIBRARY_BROWSE_MODULES } from '@/constants/libraryModules';
import { LIB_REF } from '@/constants/libraryTheme';
import { getTutorLibraryUploads } from '@/services/tutorLibraryUploadStorage';

const NAVY = '#0A0A5C';
const TITLE = LIB_REF.titleNavy;

/**
 * Student flow: Library → Tutor notes & papers → pick a module → see that module's files.
 */
export default function LibraryTutorMaterialsModuleListScreen() {
  const router = useRouter();
  const [uploads, setUploads] = useState([]);

  const load = useCallback(async () => {
    const all = await getTutorLibraryUploads();
    setUploads(all);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const countByModuleId = useMemo(() => {
    const m = new Map();
    for (const x of uploads) {
      const id = x.moduleId != null ? String(x.moduleId).trim() : '';
      if (!id) continue;
      m.set(id, (m.get(id) || 0) + 1);
    }
    return m;
  }, [uploads]);

  const modulesSorted = useMemo(() => {
    return [...LIBRARY_BROWSE_MODULES].sort((a, b) => a.title.localeCompare(b.title));
  }, []);

  const goModule = useCallback(
    (m) => {
      const mid = encodeURIComponent(String(m.id));
      const titleQ = encodeURIComponent(m.title);
      router.push(`/library/tutor-materials/${mid}?moduleTitle=${titleQ}`);
    },
    [router],
  );

  const renderModule = useCallback(
    ({ item }) => {
      const n = countByModuleId.get(String(item.id)) || 0;
      return (
        <Pressable
          onPress={() => goModule(item)}
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
          <View style={styles.cardIcon}>
            <Ionicons name="folder-outline" size={26} color="#0284C7" />
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.cardSub} numberOfLines={2}>
              {item.subtitle}
            </Text>
            <Text style={styles.cardCount}>
              {n === 0 ? 'No files yet' : `${n} file${n === 1 ? '' : 's'} from tutor`}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#94A3B8" />
        </Pressable>
      );
    },
    [countByModuleId, goModule],
  );

  const keyExtractor = useCallback((m) => String(m.id), []);

  return (
    <View style={styles.root}>
      <LibraryBlueBackground />
      <StatusBar barStyle="dark-content" />

      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
            <Ionicons name="chevron-back" size={24} color={TITLE} />
          </Pressable>
          <Text style={styles.topTitle}>Tutor notes & papers</Text>
          <View style={{ width: 40 }} />
        </View>

        <Text style={styles.subhead}>
          Choose a module to see notes and papers your tutors uploaded for that module on this device.
        </Text>

        <FlatList
          data={modulesSorted}
          keyExtractor={keyExtractor}
          renderItem={renderModule}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#E8F4FC' },
  safe: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(147,197,253,0.75)',
  },
  topTitle: {
    fontSize: 17,
    fontFamily: 'Roboto_700Bold',
    color: TITLE,
  },
  subhead: {
    marginHorizontal: 16,
    marginBottom: 14,
    fontSize: 14,
    fontFamily: 'Roboto_400Regular',
    color: '#475569',
    lineHeight: 20,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(147,197,253,0.55)',
    marginBottom: 10,
  },
  cardPressed: { opacity: 0.92 },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(14,165,233,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1, minWidth: 0 },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Roboto_700Bold',
    color: NAVY,
    lineHeight: 22,
  },
  cardSub: {
    marginTop: 4,
    fontSize: 13,
    fontFamily: 'Roboto_400Regular',
    color: '#64748B',
    lineHeight: 18,
  },
  cardCount: {
    marginTop: 6,
    fontSize: 12,
    fontFamily: 'Roboto_600SemiBold',
    color: '#2563EB',
  },
});
