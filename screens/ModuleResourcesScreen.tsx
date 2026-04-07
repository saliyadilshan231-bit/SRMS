// @ts-nocheck
import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import LibraryBlueBackground from '@/components/LibraryBlueBackground';
import { LIB_FRAME, LIB_HEADER_DARK, LIB_REF } from '@/constants/libraryTheme';
import {
  LIBRARY_UPLOAD_CATEGORY,
  getTutorLibraryUploadsForModule,
} from '@/services/tutorLibraryUploadStorage';
import { isImageLibraryUpload, libraryFileKindLabel } from '@/utils/libraryUploadDisplay';

const BLUE = '#2563EB';
const TEXT_DARK = '#1F2937';
const TEXT_MUTED = '#6B7280';

const TABS = [
  { key: 'notes', label: 'Notes', icon: 'document-text-outline' },
  { key: 'papers', label: 'Papers', icon: 'newspaper-outline' },
];

function paramStr(v) {
  if (v == null) return '';
  return String(Array.isArray(v) ? v[0] : v);
}

function formatShortDate(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium' });
  } catch {
    return '';
  }
}

export default function ModuleResourcesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const moduleIdParam = paramStr(params.id);
  const rawTitle = paramStr(params.title);
  let moduleTitle = 'Module';
  if (rawTitle) {
    try {
      moduleTitle = decodeURIComponent(rawTitle);
    } catch {
      moduleTitle = rawTitle;
    }
  }

  const [activeTab, setActiveTab] = useState('notes');
  const [moduleUploads, setModuleUploads] = useState([]);

  const load = useCallback(async () => {
    if (!moduleIdParam) {
      setModuleUploads([]);
      return;
    }
    const rows = await getTutorLibraryUploadsForModule(moduleIdParam);
    setModuleUploads(rows);
  }, [moduleIdParam]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const filtered = useMemo(() => {
    const cat =
      activeTab === 'papers' ? LIBRARY_UPLOAD_CATEGORY.PAPERS : LIBRARY_UPLOAD_CATEGORY.NOTES;
    return moduleUploads.filter((x) => x.category === cat);
  }, [moduleUploads, activeTab]);

  const openFile = useCallback(async (upload) => {
    if (!upload?.uri) {
      Alert.alert('Open file', 'No file link is available for this item.');
      return;
    }
    try {
      const can = await Linking.canOpenURL(upload.uri);
      if (can) {
        await Linking.openURL(upload.uri);
      } else {
        Alert.alert('Open file', 'This file cannot be opened from here on this device.');
      }
    } catch {
      Alert.alert('Open file', 'Could not open this file. Try again.');
    }
  }, []);

  return (
    <View style={styles.root}>
      <LibraryBlueBackground />

      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backBtn, pressed && styles.backPressed]}
            hitSlop={12}>
            <Ionicons name="chevron-back" size={26} color={LIB_HEADER_DARK.backIcon} />
          </Pressable>
        </View>

        <View style={styles.headerOuter}>
          <LinearGradient
            colors={LIB_HEADER_DARK.cardGradient}
            locations={LIB_HEADER_DARK.cardLocations}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerInner}>
            <Text style={styles.moduleTitleOnDark} numberOfLines={3}>
              {moduleTitle}
            </Text>
            <Text style={styles.headerSubOnDark}>Tutor notes & papers for this module (this device)</Text>
          </LinearGradient>
        </View>

        <View style={styles.tabSectionFrame}>
          <LinearGradient
            colors={LIB_HEADER_DARK.tabStripGradient}
            locations={LIB_HEADER_DARK.tabLocations}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.tabSectionGradient}>
            <View style={styles.tabBar}>
              {TABS.map((tab) => {
                const active = activeTab === tab.key;
                return (
                  <Pressable
                    key={tab.key}
                    onPress={() => setActiveTab(tab.key)}
                    style={styles.tabItem}>
                    <Ionicons
                      name={tab.icon}
                      size={18}
                      color={active ? LIB_HEADER_DARK.tabIconActive : LIB_HEADER_DARK.tabIconInactive}
                      style={styles.tabIcon}
                    />
                    <Text style={[styles.tabLabelOnDark, active && styles.tabLabelActiveOnDark]}>
                      {tab.label}
                    </Text>
                    {active ? (
                      <LinearGradient
                        colors={['#22D3EE', '#38BDF8', '#0EA5E9']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.tabUnderline}
                      />
                    ) : (
                      <View style={styles.tabUnderlinePlaceholder} />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </LinearGradient>
        </View>

        <ScrollView
          style={styles.listScroll}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}>
          {!moduleIdParam ? (
            <View style={styles.emptyBlock}>
              <Text style={styles.emptyText}>This screen needs a module link from the library.</Text>
            </View>
          ) : filtered.length === 0 ? (
            <View style={styles.emptyBlock}>
              <Ionicons name="documents-outline" size={40} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No {activeTab === 'papers' ? 'papers' : 'notes'} yet</Text>
              <Text style={styles.emptySub}>
                When a tutor uploads files for this module from Upload library, they will appear here on this device.
              </Text>
            </View>
          ) : (
            filtered.map((upload) => {
              const title = upload.fileName || libraryFileKindLabel(upload);
              const kind = libraryFileKindLabel(upload);
              const dateStr = upload.createdAt ? formatShortDate(upload.createdAt) : '';
              const meta = [kind, dateStr].filter(Boolean).join(' · ');
              const img = isImageLibraryUpload(upload);
              return (
                <View key={String(upload.id)} style={styles.resourceRow}>
                  <Pressable
                    onPress={() => void openFile(upload)}
                    style={({ pressed }) => [styles.resourceMain, pressed && styles.resourceRowPressed]}
                    accessibilityRole="button"
                    accessibilityLabel={`Open ${title}`}>
                    <View style={styles.resourceIconWrap}>
                      {img ? (
                        <Image
                          source={{ uri: upload.uri }}
                          style={styles.resourceThumb}
                          contentFit="cover"
                          cachePolicy="memory-disk"
                        />
                      ) : (
                        <Ionicons
                          name={activeTab === 'papers' ? 'reader-outline' : 'document-text-outline'}
                          size={22}
                          color={BLUE}
                        />
                      )}
                    </View>
                    <View style={styles.resourceText}>
                      <Text style={styles.resourceTitle} numberOfLines={2}>
                        {title}
                      </Text>
                      {meta ? <Text style={styles.resourceMeta}>{meta}</Text> : null}
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
                  </Pressable>
                  <Pressable
                    onPress={() => void openFile(upload)}
                    style={({ pressed }) => [styles.downloadBtn, pressed && styles.downloadBtnPressed]}
                    accessibilityRole="button"
                    accessibilityLabel={`Open ${title}`}
                    hitSlop={10}>
                    <Ionicons name="open-outline" size={22} color={BLUE} />
                  </Pressable>
                </View>
              );
            })
          )}
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
  safe: {
    flex: 1,
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
  backPressed: {
    opacity: 0.75,
  },
  headerOuter: {
    marginHorizontal: 16,
    marginTop: 4,
    borderRadius: 14,
    padding: 2,
    borderWidth: 1.5,
    borderColor: LIB_HEADER_DARK.frameBorder,
    backgroundColor: 'rgba(4, 26, 46, 0.35)',
    shadowColor: '#020617',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 5,
    overflow: 'hidden',
  },
  headerInner: {
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  moduleTitleOnDark: {
    fontSize: 22,
    fontFamily: 'Roboto_900Black',
    color: LIB_HEADER_DARK.title,
    lineHeight: 28,
  },
  headerSubOnDark: {
    marginTop: 6,
    fontSize: 14,
    fontFamily: 'Roboto_400Regular',
    color: LIB_HEADER_DARK.subtitle,
  },
  tabSectionFrame: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: LIB_HEADER_DARK.frameBorder,
    overflow: 'hidden',
    shadowColor: '#020617',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  tabSectionGradient: {
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 4,
  },
  tabBar: {
    flexDirection: 'row',
    paddingBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: LIB_HEADER_DARK.tabRowDivider,
  },
  tabItem: {
    flex: 1,
    position: 'relative',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  tabIcon: {
    marginBottom: 4,
  },
  tabLabelOnDark: {
    fontSize: 13,
    fontFamily: 'Roboto_500Medium',
    color: LIB_HEADER_DARK.tabLabelInactive,
    marginBottom: 8,
  },
  tabLabelActiveOnDark: {
    color: LIB_HEADER_DARK.tabLabelActive,
    fontFamily: 'Roboto_700Bold',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: -1,
    left: '12%',
    right: '12%',
    height: 3,
    borderRadius: 2,
  },
  tabUnderlinePlaceholder: {
    position: 'absolute',
    bottom: -1,
    height: 3,
    width: '76%',
    opacity: 0,
  },
  listScroll: {
    flex: 1,
    marginTop: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 28,
  },
  emptyBlock: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 17,
    fontFamily: 'Roboto_700Bold',
    color: TEXT_DARK,
  },
  emptySub: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: 'Roboto_400Regular',
    color: TEXT_MUTED,
    textAlign: 'center',
    lineHeight: 21,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Roboto_400Regular',
    color: TEXT_MUTED,
    textAlign: 'center',
  },
  resourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LIB_FRAME.cardFace,
    borderRadius: 16,
    paddingVertical: 6,
    paddingLeft: 12,
    paddingRight: 6,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: LIB_FRAME.cardBorder,
    shadowColor: LIB_FRAME.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
  },
  resourceMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
    paddingVertical: 8,
    paddingRight: 4,
    borderRadius: 12,
  },
  resourceRowPressed: {
    backgroundColor: '#F8FAFC',
  },
  downloadBtn: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(37,99,235,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(37,99,235,0.2)',
  },
  downloadBtnPressed: {
    backgroundColor: 'rgba(37,99,235,0.16)',
  },
  resourceIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(37,99,235,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  resourceThumb: {
    width: 44,
    height: 44,
    borderRadius: 12,
  },
  resourceText: {
    flex: 1,
    minWidth: 0,
  },
  resourceTitle: {
    fontSize: 15,
    fontFamily: 'Roboto_700Bold',
    color: TEXT_DARK,
  },
  resourceMeta: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: 'Roboto_400Regular',
    color: TEXT_MUTED,
  },
});

