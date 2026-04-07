// @ts-nocheck
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import LibraryBlueBackground from '@/components/LibraryBlueBackground';
import { LIBRARY_BROWSE_MODULES, LIBRARY_FILTER_DROPDOWN_VALUES } from '@/constants/libraryModules';
import { LIB_FRAME, LIB_HEADER_DARK, LIB_REF } from '@/constants/libraryTheme';
import { STORAGE_KEYS } from '@/constants/storageKeys';

const BLUE_DEEP = '#1E3A8A';
const BLUE = '#2563EB';
const TEXT_DARK = '#1F2937';
const TEXT_MUTED = '#6B7280';

function capitalizeWord(word) {
  if (!word) return '';
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

/**
 * Greeting first name only (e.g. Asitha) — not IT number, not "student", not full email local part.
 */
function buildGreetingFirstName(fullNameStored, emailStored) {
  const full = fullNameStored?.trim();
  if (full) {
    const parts = full.split(/\s+/).filter((p) => p.toLowerCase() !== 'student');
    if (parts.length) return capitalizeWord(parts[0]);
  }
  const local = (emailStored || '').split('@')[0]?.trim() || '';
  if (!local) return 'there';
  const segments = local.split(/[._-]+/).filter((s) => s && s.toLowerCase() !== 'student');
  if (segments.length) return capitalizeWord(segments[0]);
  return 'there';
}

export default function LibraryCoursesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const initialQuery =
    typeof params.q === 'string' ? params.q : Array.isArray(params.q) ? params.q[0] : '';
  const { width } = useWindowDimensions();
  const [firstName, setFirstName] = useState('there');
  const [search, setSearch] = useState(() => initialQuery || '');
  const [filterLabel, setFilterLabel] = useState('All');
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [dropdownMetrics, setDropdownMetrics] = useState(null);
  const filterAnchorRef = useRef(null);
  const [sortLabel, setSortLabel] = useState('Sort by module name');
  const [viewLabel, setViewLabel] = useState('Card');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [fullNameStored, emailStored] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.studentFullName),
        AsyncStorage.getItem(STORAGE_KEYS.studentEmail),
      ]);
      if (!cancelled) {
        setFirstName(buildGreetingFirstName(fullNameStored, emailStored));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (initialQuery) setSearch(initialQuery);
  }, [initialQuery]);

  const cols = width >= 640 ? 3 : 2;
  const pad = 16;
  const gap = 12;
  const cardWidth = (width - pad * 2 - gap * (cols - 1)) / cols;

  const filteredModules = useMemo(() => {
    let list = [...LIBRARY_BROWSE_MODULES];
    if (filterLabel !== 'All') {
      list = list.filter((m) => m.title === filterLabel);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (m) =>
          m.title.toLowerCase().includes(q) || m.subtitle.toLowerCase().includes(q),
      );
    }
    if (sortLabel.includes('module name') || sortLabel.includes('course name')) {
      list.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortLabel.includes('progress')) {
      list.sort((a, b) => b.progress - a.progress);
    }
    return list;
  }, [search, sortLabel, filterLabel]);

  const closeFilterDropdown = useCallback(() => {
    setFilterDropdownOpen(false);
    setDropdownMetrics(null);
  }, []);

  const openFilterDropdown = useCallback(() => {
    filterAnchorRef.current?.measureInWindow((x, y, w, h) => {
      const minW = Math.max(w, 272);
      const maxPanel = 340;
      const left = Math.max(12, Math.min(x, width - maxPanel - 12));
      setDropdownMetrics({ top: y + h + 6, left, minWidth: minW, maxWidth: maxPanel });
      setFilterDropdownOpen(true);
    });
  }, [width]);

  const toggleFilterDropdown = useCallback(() => {
    if (filterDropdownOpen) {
      closeFilterDropdown();
    } else {
      openFilterDropdown();
    }
  }, [filterDropdownOpen, openFilterDropdown, closeFilterDropdown]);

  const selectFilter = useCallback(
    (value) => {
      setFilterLabel(value);
      closeFilterDropdown();
    },
    [closeFilterDropdown],
  );

  const onSortPress = useCallback(() => {
    Alert.alert('Sort by', undefined, [
      { text: 'Module name', onPress: () => setSortLabel('Sort by module name') },
      { text: 'Progress', onPress: () => setSortLabel('Sort by progress') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, []);

  const onViewPress = useCallback(() => {
    Alert.alert('View', undefined, [
      { text: 'Card', onPress: () => setViewLabel('Card') },
      { text: 'List (soon)', onPress: () => setViewLabel('Card') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, []);

  const openModuleResources = useCallback(
    (module) => {
      router.push({
        pathname: `/module/${module.id}`,
        params: { title: module.title },
      });
    },
    [router],
  );

  const onModuleMenu = useCallback((module) => {
    Alert.alert(
      module.title,
      'Quick actions for this module.',
      [
        { text: 'Open materials', onPress: () => openModuleResources(module) },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  }, [openModuleResources]);

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
              <Text style={styles.pageTitleOnDark}>All Modules</Text>
              <Text style={styles.greetingOnDark}>Hi, {firstName}</Text>
            </LinearGradient>
          </View>

          <Pressable
            onPress={() => router.push('/library/tutor-materials')}
            style={({ pressed }) => [styles.tutorMaterialsLink, pressed && styles.tutorMaterialsLinkPressed]}>
            <Ionicons name="folder-open-outline" size={22} color={LIB_FRAME.title} />
            <Text style={styles.tutorMaterialsLinkText}>Tutor notes & papers</Text>
            <Ionicons name="chevron-forward" size={18} color={LIB_FRAME.title} />
          </Pressable>

          <View style={styles.tabSectionFrame}>
            <LinearGradient
              colors={LIB_HEADER_DARK.tabStripGradient}
              locations={LIB_HEADER_DARK.tabLocations}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.tabSectionGradient}>
              <View style={styles.tabRow}>
                <View style={styles.tabActive}>
                  <Text style={styles.tabActiveTextOnDark}>Module overview</Text>
                  <LinearGradient
                    colors={['#22D3EE', '#38BDF8', '#0EA5E9']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.tabUnderline}
                  />
                </View>
              </View>
            </LinearGradient>
          </View>

          <View style={styles.controlsRow}>
            <View ref={filterAnchorRef} collapsable={false} style={styles.dropdownAnchor}>
              <Pressable onPress={toggleFilterDropdown} style={styles.pillDark}>
                <Text style={styles.pillDarkText} numberOfLines={1}>
                  {filterLabel}
                </Text>
                <Ionicons
                  name={filterDropdownOpen ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={LIB_FRAME.title}
                />
              </Pressable>
            </View>
          </View>

          <Modal
            visible={filterDropdownOpen && dropdownMetrics != null}
            transparent
            animationType="fade"
            onRequestClose={closeFilterDropdown}>
            <View style={styles.dropdownOverlayRoot} pointerEvents="box-none">
              <Pressable style={styles.dropdownDismiss} onPress={closeFilterDropdown} />
              {dropdownMetrics ? (
                <View
                  style={[
                    styles.dropdownPanel,
                    {
                      top: dropdownMetrics.top,
                      left: dropdownMetrics.left,
                      minWidth: dropdownMetrics.minWidth,
                      maxWidth: dropdownMetrics.maxWidth,
                    },
                  ]}
                  pointerEvents="box-none">
                  <Text style={styles.dropdownTitle}>Filter by module</Text>
                  <ScrollView
                    nestedScrollEnabled
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    style={styles.dropdownScroll}>
                    {LIBRARY_FILTER_DROPDOWN_VALUES.map((value) => (
                      <Pressable
                        key={value}
                        onPress={() => selectFilter(value)}
                        style={({ pressed }) => [
                          styles.dropdownRow,
                          pressed && styles.dropdownRowPressed,
                          filterLabel === value && styles.dropdownRowSelected,
                        ]}>
                        <Text
                          style={[
                            styles.dropdownRowText,
                            filterLabel === value && styles.dropdownRowTextSelected,
                          ]}
                          numberOfLines={2}>
                          {value}
                        </Text>
                        {filterLabel === value ? (
                          <Ionicons name="checkmark-circle" size={22} color={BLUE} />
                        ) : null}
                      </Pressable>
                    ))}
                  </ScrollView>
                  <Pressable style={styles.dropdownClose} onPress={closeFilterDropdown}>
                    <Text style={styles.dropdownCloseText}>Close</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          </Modal>

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

          <View style={styles.sortRow}>
            <Pressable onPress={onSortPress} style={styles.pillDarkWide}>
              <Text style={styles.pillDarkTextSmall} numberOfLines={1}>
                {sortLabel}
              </Text>
              <Ionicons name="chevron-down" size={16} color={LIB_FRAME.title} />
            </Pressable>
            <Pressable onPress={onViewPress} style={styles.pillDarkNarrow}>
              <Text style={styles.pillDarkTextSmall}>{viewLabel}</Text>
              <Ionicons name="chevron-down" size={16} color={LIB_FRAME.title} />
            </Pressable>
          </View>

          <View style={[styles.grid, { gap }]}>
            {filteredModules.map((module) => (
              <Pressable
                key={module.id}
                onPress={() => openModuleResources(module)}
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
                    <Text style={styles.progressText}>{module.progress}% complete</Text>
                  </View>
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.moduleTitle} numberOfLines={2}>
                    {module.title}
                  </Text>
                  <Text style={styles.moduleSub} numberOfLines={2}>
                    {module.subtitle}
                  </Text>
                  <Pressable
                    style={styles.cardMenu}
                    onPress={() => onModuleMenu(module)}
                    hitSlop={8}>
                    <Ionicons name="ellipsis-vertical" size={18} color={TEXT_MUTED} />
                  </Pressable>
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
  safe: {
    flex: 1,
  },
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
  backBtnPressed: {
    opacity: 0.75,
  },
  glassHeaderOuter: {
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
  glassHeaderInner: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  pageTitleOnDark: {
    fontSize: 28,
    fontFamily: 'Roboto_900Black',
    color: LIB_HEADER_DARK.title,
    letterSpacing: 0.2,
  },
  greetingOnDark: {
    marginTop: 8,
    fontSize: 17,
    fontFamily: 'Roboto_500Medium',
    color: LIB_HEADER_DARK.subtitle,
  },
  tutorMaterialsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderWidth: 1.5,
    borderColor: 'rgba(147,197,253,0.85)',
  },
  tutorMaterialsLinkPressed: { opacity: 0.88 },
  tutorMaterialsLinkText: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Roboto_600SemiBold',
    color: LIB_FRAME.title,
  },
  tabSectionFrame: {
    marginTop: 18,
    marginHorizontal: 16,
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
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 4,
  },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: LIB_HEADER_DARK.tabRowDivider,
  },
  tabActive: {
    paddingBottom: 10,
    marginRight: 24,
  },
  tabActiveTextOnDark: {
    fontSize: 16,
    fontFamily: 'Roboto_700Bold',
    color: LIB_HEADER_DARK.tabLabelActive,
  },
  tabUnderline: {
    marginTop: 8,
    height: 3,
    width: '100%',
    minWidth: 120,
    borderRadius: 2,
  },
  controlsRow: {
    flexDirection: 'row',
    marginTop: 16,
    marginHorizontal: 16,
    alignItems: 'center',
    zIndex: 20,
  },
  dropdownAnchor: {
    alignSelf: 'flex-start',
  },
  pillDark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: LIB_REF.panelInner,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: LIB_REF.borderCool,
    flexShrink: 0,
    minWidth: 88,
  },
  pillDarkText: {
    color: LIB_FRAME.title,
    fontSize: 14,
    fontFamily: 'Roboto_700Bold',
    flexShrink: 0,
    maxWidth: 260,
  },
  dropdownOverlayRoot: {
    flex: 1,
  },
  dropdownDismiss: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.08)',
  },
  dropdownPanel: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.1)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 22,
    elevation: 14,
    maxHeight: 400,
  },
  dropdownTitle: {
    fontSize: 17,
    fontFamily: 'Roboto_700Bold',
    color: BLUE_DEEP,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  dropdownScroll: {
    maxHeight: 300,
  },
  dropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EEEEEE',
  },
  dropdownRowPressed: {
    backgroundColor: '#F9FAFB',
  },
  dropdownRowSelected: {
    backgroundColor: '#F0F4FF',
  },
  dropdownRowText: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Roboto_400Regular',
    color: TEXT_DARK,
    paddingRight: 10,
  },
  dropdownRowTextSelected: {
    fontFamily: 'Roboto_700Bold',
    color: BLUE,
  },
  dropdownClose: {
    paddingVertical: 14,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FAFAFA',
  },
  dropdownCloseText: {
    fontSize: 15,
    fontFamily: 'Roboto_700Bold',
    color: BLUE_DEEP,
  },
  searchBlock: {
    marginHorizontal: 16,
    marginTop: 14,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: LIB_REF.borderCool,
    backgroundColor: LIB_REF.panelInner,
  },
  searchUnderlineWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 6,
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
  sortRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 14,
    gap: 10,
    flexWrap: 'wrap',
  },
  pillDarkWide: {
    flex: 1,
    minWidth: 140,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    backgroundColor: LIB_REF.panelInner,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: LIB_REF.borderCool,
  },
  pillDarkNarrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: LIB_REF.panelInner,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: LIB_REF.borderCool,
  },
  pillDarkTextSmall: {
    color: LIB_FRAME.title,
    fontSize: 12,
    fontFamily: 'Roboto_700Bold',
    flex: 1,
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
  cardPressed: {
    opacity: 0.92,
  },
  bannerWrap: {
    position: 'relative',
  },
  banner: {
    height: 100,
    width: '100%',
  },
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
    fontFamily: 'Roboto_500Medium',
  },
  cardBody: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 36,
    position: 'relative',
  },
  moduleTitle: {
    fontSize: 15,
    fontFamily: 'Roboto_700Bold',
    color: TEXT_DARK,
    paddingRight: 28,
  },
  moduleSub: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: 'Roboto_400Regular',
    color: TEXT_MUTED,
    paddingRight: 28,
  },
  cardMenu: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    textAlign: 'center',
    marginTop: 24,
    color: LIB_FRAME.muted,
    fontFamily: 'Roboto_400Regular',
  },
});
