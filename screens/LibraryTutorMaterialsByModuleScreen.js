import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Linking,
  Modal,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import LibraryBlueBackground from '@/components/LibraryBlueBackground';
import { LIB_REF } from '@/constants/libraryTheme';
import {
  LIBRARY_UPLOAD_CATEGORY,
  getTutorLibraryUploadsForModule,
} from '@/services/tutorLibraryUploadStorage';
import { isImageLibraryUpload, libraryFileKindLabel } from '@/utils/libraryUploadDisplay';

const NAVY = '#0A0A5C';
const TITLE = LIB_REF.titleNavy;
const GAP = 10;

function paramStr(v) {
  if (v == null) return '';
  return String(Array.isArray(v) ? v[0] : v);
}

function formatShortDate(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return '';
  }
}

/** Student view: files for one module (after picking module from list). */
export default function LibraryTutorMaterialsByModuleScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const moduleIdParam = paramStr(params.moduleId);
  const resolvedModuleTitle = useMemo(() => {
    const raw = paramStr(params.moduleTitle);
    if (!raw) return '';
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }, [params.moduleTitle]);

  const { width } = useWindowDimensions();
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!moduleIdParam) {
      router.replace('/library/tutor-materials');
    }
  }, [moduleIdParam, router]);

  const load = useCallback(async () => {
    if (!moduleIdParam) return;
    const rows = await getTutorLibraryUploadsForModule(moduleIdParam);
    setItems(rows);
  }, [moduleIdParam]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const filtered = useMemo(() => {
    let list = items;
    if (filter === LIBRARY_UPLOAD_CATEGORY.NOTES) {
      list = list.filter((x) => x.category === LIBRARY_UPLOAD_CATEGORY.NOTES);
    } else if (filter === LIBRARY_UPLOAD_CATEGORY.PAPERS) {
      list = list.filter((x) => x.category === LIBRARY_UPLOAD_CATEGORY.PAPERS);
    }
    return list;
  }, [items, filter]);

  const tileW = useMemo(() => {
    const pad = 16 * 2 + GAP;
    return Math.floor((width - pad) / 2);
  }, [width]);

  const openItem = useCallback(async (item) => {
    if (!item?.uri) return;
    if (isImageLibraryUpload(item)) {
      setPreview(item);
      return;
    }
    try {
      const can = await Linking.canOpenURL(item.uri);
      if (can) {
        await Linking.openURL(item.uri);
      } else {
        setPreview(item);
      }
    } catch {
      Alert.alert('Open file', 'Could not open this file. Try tapping again to see options.');
      setPreview(item);
    }
  }, []);

  const renderItem = useCallback(
    ({ item }) => {
      const isNotes = item.category === LIBRARY_UPLOAD_CATEGORY.NOTES;
      const isImg = isImageLibraryUpload(item);
      const kind = libraryFileKindLabel(item);
      return (
        <Pressable
          onPress={() => void openItem(item)}
          style={({ pressed }) => [styles.tile, { width: tileW }, pressed && styles.tilePressed]}>
          {isImg ? (
            <Image
              source={{ uri: item.uri }}
              style={styles.tileImage}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
            />
          ) : (
            <View style={styles.tileDoc}>
              <Ionicons name="document-text-outline" size={40} color={NAVY} />
              <Text style={styles.tileDocKind}>{kind}</Text>
            </View>
          )}
          <View style={[styles.badge, isNotes ? styles.badgeNotes : styles.badgePapers]}>
            <Text style={styles.badgeText}>{isNotes ? 'Notes' : 'Papers'}</Text>
          </View>
          <View style={styles.tileFooter}>
            {item.fileName ? (
              <Text style={styles.tileCaption} numberOfLines={2}>
                {item.fileName}
              </Text>
            ) : (
              <Text style={styles.tileCaptionMuted} numberOfLines={1}>
                {formatShortDate(item.createdAt)}
              </Text>
            )}
          </View>
        </Pressable>
      );
    },
    [tileW, openItem],
  );

  const keyExtractor = useCallback((it) => String(it.id), []);

  if (!moduleIdParam) {
    return (
      <View style={styles.root}>
        <LibraryBlueBackground />
      </View>
    );
  }

  const headerTitle = resolvedModuleTitle || 'Module materials';

  return (
    <View style={styles.root}>
      <LibraryBlueBackground />
      <StatusBar barStyle="dark-content" />

      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
            <Ionicons name="chevron-back" size={24} color={TITLE} />
          </Pressable>
          <Text style={styles.topTitle} numberOfLines={2}>
            {headerTitle}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <Text style={styles.subhead}>
          Tutor uploads for this module on this device — filter by Notes or Papers, then tap a file to open.
        </Text>

        <View style={styles.filterRow}>
          {[
            { key: 'all', label: 'All' },
            { key: LIBRARY_UPLOAD_CATEGORY.NOTES, label: 'Notes' },
            { key: LIBRARY_UPLOAD_CATEGORY.PAPERS, label: 'Papers' },
          ].map(({ key, label }) => (
            <Pressable
              key={key}
              onPress={() => setFilter(key)}
              style={({ pressed }) => [
                styles.filterChip,
                filter === key && styles.filterChipOn,
                pressed && styles.filterChipPressed,
              ]}>
              <Text style={[styles.filterChipText, filter === key && styles.filterChipTextOn]}>{label}</Text>
            </Pressable>
          ))}
        </View>

        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="documents-outline" size={48} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No files here yet</Text>
            <Text style={styles.emptyBody}>
              When a tutor adds materials for this module from Upload library, they show up here for everyone on this
              device.
            </Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            numColumns={2}
            columnWrapperStyle={styles.columnWrap}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>

      <Modal
        visible={!!preview}
        transparent
        animationType="fade"
        onRequestClose={() => setPreview(null)}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalBackdrop} onPress={() => setPreview(null)} />
          <SafeAreaView style={styles.modalSafe} edges={['top', 'bottom']}>
            <View style={styles.modalTop}>
              <Pressable onPress={() => setPreview(null)} style={styles.modalClose} hitSlop={12}>
                <Ionicons name="close" size={28} color="#FFFFFF" />
              </Pressable>
              <Text style={styles.modalTitle} numberOfLines={2}>
                {preview?.fileName || (preview?.category === LIBRARY_UPLOAD_CATEGORY.PAPERS ? 'Paper' : 'Note')}
              </Text>
              <View style={{ width: 40 }} />
            </View>
            {preview?.uri && isImageLibraryUpload(preview) ? (
              <Image
                source={{ uri: preview.uri }}
                style={styles.modalImage}
                contentFit="contain"
                transition={200}
                cachePolicy="memory-disk"
              />
            ) : preview?.uri ? (
              <View style={styles.modalDoc}>
                <Ionicons name="document-attach-outline" size={56} color="#E2E8F0" />
                <Text style={styles.modalDocKind}>{libraryFileKindLabel(preview)}</Text>
                <Text style={styles.modalDocName} numberOfLines={2}>
                  {preview.fileName || 'Document'}
                </Text>
                <Pressable
                  onPress={async () => {
                    try {
                      await Linking.openURL(preview.uri);
                    } catch {
                      Alert.alert('Open file', 'Try opening this file from your device file manager.');
                    }
                  }}
                  style={({ pressed }) => [styles.modalOpenBtn, pressed && styles.modalOpenBtnPressed]}>
                  <Text style={styles.modalOpenBtnText}>Open file</Text>
                </Pressable>
              </View>
            ) : null}
            {preview?.createdAt ? (
              <Text style={styles.modalMeta}>{formatShortDate(preview.createdAt)}</Text>
            ) : null}
          </SafeAreaView>
        </View>
      </Modal>
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
    gap: 8,
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
    flex: 1,
    fontSize: 16,
    fontFamily: 'Roboto_700Bold',
    color: TITLE,
    textAlign: 'center',
  },
  subhead: {
    marginHorizontal: 16,
    marginBottom: 12,
    fontSize: 14,
    fontFamily: 'Roboto_400Regular',
    color: '#475569',
    lineHeight: 20,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(147,197,253,0.65)',
  },
  filterChipOn: {
    backgroundColor: NAVY,
    borderColor: NAVY,
  },
  filterChipPressed: { opacity: 0.88 },
  filterChipText: {
    fontSize: 14,
    fontFamily: 'Roboto_600SemiBold',
    color: NAVY,
  },
  filterChipTextOn: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  columnWrap: {
    gap: GAP,
    marginBottom: GAP,
  },
  tile: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(147,197,253,0.55)',
  },
  tilePressed: { opacity: 0.92 },
  tileImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#E2E8F0',
  },
  tileDoc: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  tileDocKind: {
    fontSize: 12,
    fontFamily: 'Roboto_600SemiBold',
    color: '#4338CA',
  },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeNotes: {
    backgroundColor: 'rgba(14,165,233,0.92)',
  },
  badgePapers: {
    backgroundColor: 'rgba(217,119,6,0.92)',
  },
  badgeText: {
    fontSize: 11,
    fontFamily: 'Roboto_700Bold',
    color: '#FFFFFF',
  },
  tileFooter: {
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 8,
  },
  tileCaption: {
    fontSize: 12,
    fontFamily: 'Roboto_500Medium',
    color: NAVY,
    minHeight: 32,
  },
  tileCaptionMuted: {
    fontSize: 11,
    fontFamily: 'Roboto_400Regular',
    color: '#64748B',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 24,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 18,
    fontFamily: 'Roboto_700Bold',
    color: NAVY,
  },
  emptyBody: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: 'Roboto_400Regular',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 21,
  },
  modalRoot: {
    flex: 1,
    backgroundColor: 'rgba(4,30,66,0.88)',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalSafe: {
    flex: 1,
  },
  modalTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  modalClose: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 15,
    fontFamily: 'Roboto_600SemiBold',
    color: '#FFFFFF',
    paddingHorizontal: 8,
  },
  modalImage: {
    flex: 1,
    width: '100%',
    minHeight: 200,
  },
  modalDoc: {
    flex: 1,
    width: '100%',
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  modalDocKind: {
    fontSize: 15,
    fontFamily: 'Roboto_600SemiBold',
    color: '#E2E8F0',
  },
  modalDocName: {
    fontSize: 13,
    fontFamily: 'Roboto_400Regular',
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  },
  modalOpenBtn: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#38BDF8',
  },
  modalOpenBtnPressed: { opacity: 0.9 },
  modalOpenBtnText: {
    fontSize: 15,
    fontFamily: 'Roboto_600SemiBold',
    color: '#FFFFFF',
  },
  modalMeta: {
    textAlign: 'center',
    paddingVertical: 12,
    fontSize: 12,
    fontFamily: 'Roboto_400Regular',
    color: 'rgba(255,255,255,0.75)',
  },
});
