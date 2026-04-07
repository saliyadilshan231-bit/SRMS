import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  FACULTY_MODULE_IDS,
  SESSION_SCHEDULING_BROWSE_ALL_ID,
  SESSION_SCHEDULING_CREATE_ALL_ID,
  SESSION_SCHEDULING_FACULTIES,
  getFacultyById,
  sessionSchedulingBrowseModulesParams,
  sessionSchedulingCreateModulesParams,
} from '@/constants/sessionSchedulingFaculties';
import { STORAGE_KEYS } from '@/constants/storageKeys';
import { TIMED_QUIZ_MODULES } from '@/constants/timedQuizContent';
import { getSessionPolls } from '@/services/sessionPollStorage';
import { displayNameFromEmail, stripStudentRoleFromDisplayName } from '@/utils/displayNameFromEmail';

const NAVY = '#0A0A5C';
const SUBTITLE = '#475569';

const SCREEN_BG = '#F4F4F4';
const HERO_GRADIENT = ['#003366', '#004080', '#001F3F'];
const TAB_SOLID = '#001A33';
const TAB_ACCENT = '#00BFFF';
const HEADER_RADIUS = 14;
const CARD_RADIUS = 14;
const MODULE_CARD_MIN_HEIGHT = 72;
const H_PAD = 16;

/** Light card fills — varied cool/warm pastels, still readable with NAVY / slate text. */
const MODULE_CARD_GRADIENTS = [
  ['#C4E8F7', '#E8F4FC'], // powder blue → near-white blue
  ['#D4E4FF', '#EDF2FF'], // periwinkle → icy lilac
  ['#B8EBD8', '#E6FAF2'], // seafoam → mint cream
  ['#FDE7C9', '#FFF6E8'], // apricot → warm ivory
  ['#E9D8FD', '#F6F0FF'], // soft violet → lavender white
  ['#B8E8E8', '#E6F7F7'], // aqua mist → pale teal
];

const MODULE_ICONS = [
  'briefcase-outline',
  'stats-chart-outline',
  'server-outline',
  'extension-puzzle-outline',
  'globe-outline',
  'code-slash-outline',
];

function paramStr(v) {
  if (v == null) return '';
  return String(Array.isArray(v) ? v[0] : v);
}

export default function SessionSchedulingModulesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const facultyId = paramStr(params.facultyId);
  const facultyTitleParam = paramStr(params.facultyTitle);
  const intent = paramStr(params.intent);
  const isCreateFlow = intent === 'create';
  const { width: windowWidth } = useWindowDimensions();
  const [pollCounts, setPollCounts] = useState({});
  const [hiName, setHiName] = useState('Student');
  const [isPeerTutor, setIsPeerTutor] = useState(false);

  const contentWidth = useMemo(() => Math.max(0, windowWidth - H_PAD * 2), [windowWidth]);

  const facultyTitleDecoded = useMemo(() => {
    if (!facultyTitleParam) return getFacultyById(facultyId)?.title || '';
    try {
      return decodeURIComponent(facultyTitleParam);
    } catch {
      return facultyTitleParam;
    }
  }, [facultyId, facultyTitleParam]);

  const moduleRows = useMemo(() => {
    const allFacultiesMode =
      (facultyId === SESSION_SCHEDULING_CREATE_ALL_ID && isCreateFlow) ||
      (facultyId === SESSION_SCHEDULING_BROWSE_ALL_ID && !isCreateFlow);
    if (allFacultiesMode) {
      const rows = [];
      for (const f of SESSION_SCHEDULING_FACULTIES) {
        const ids = FACULTY_MODULE_IDS[f.id];
        if (!ids?.length) continue;
        for (const mid of ids) {
          const m = TIMED_QUIZ_MODULES.find((x) => String(x.id) === String(mid));
          if (m) {
            rows.push({ module: m, rowFacultyId: f.id, rowFacultyTitle: f.title });
          }
        }
      }
      return rows;
    }
    const ids = FACULTY_MODULE_IDS[facultyId];
    if (!ids?.length) return [];
    const allow = new Set(ids);
    return TIMED_QUIZ_MODULES.filter((mod) => allow.has(mod.id)).map((m) => ({
      module: m,
      rowFacultyId: facultyId,
      rowFacultyTitle: facultyTitleDecoded || getFacultyById(facultyId)?.title || '',
    }));
  }, [facultyId, facultyTitleDecoded, isCreateFlow]);

  useEffect(() => {
    const validSingle = facultyId && FACULTY_MODULE_IDS[facultyId];
    const validCreateAll =
      isCreateFlow && facultyId === SESSION_SCHEDULING_CREATE_ALL_ID;
    const validBrowseAll =
      !isCreateFlow && facultyId === SESSION_SCHEDULING_BROWSE_ALL_ID;
    if (!facultyId || (!validSingle && !validCreateAll && !validBrowseAll)) {
      router.replace({
        pathname: '/session-scheduling-modules',
        params: isCreateFlow
          ? sessionSchedulingCreateModulesParams
          : sessionSchedulingBrowseModulesParams,
      });
    }
  }, [facultyId, router, isCreateFlow]);

  const loadProfileName = useCallback(async () => {
    const [email, full, role] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.studentEmail),
      AsyncStorage.getItem(STORAGE_KEYS.studentFullName),
      AsyncStorage.getItem(STORAGE_KEYS.loginRole),
    ]);
    setIsPeerTutor(role === 'peerTutor');
    let n = 'Student';
    if (full?.trim()) {
      const first = full.trim().split(/\s+/)[0];
      n = first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
    } else {
      const fromEmail = displayNameFromEmail(email || '');
      if (fromEmail) n = fromEmail.split(/\s+/)[0];
    }
    setHiName(stripStudentRoleFromDisplayName(n) || 'Student');
  }, []);

  const refreshCounts = useCallback(async () => {
    const all = await getSessionPolls();
    const next = {};
    for (const p of all) {
      if (p.moduleId == null || p.moduleId === '') continue;
      const k = String(p.moduleId);
      next[k] = (next[k] || 0) + 1;
    }
    setPollCounts(next);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfileName();
      refreshCounts();
    }, [loadProfileName, refreshCounts]),
  );

  const openModule = useCallback(
    (m, rowFacultyId, rowFacultyTitle) => {
      const facultyTitlePass = encodeURIComponent(rowFacultyTitle || '');
      if (isCreateFlow) {
        router.push({
          pathname: '/tutor-session-module-choice',
          params: {
            moduleId: m.id,
            moduleTitle: encodeURIComponent(m.title),
            facultyId: rowFacultyId,
            facultyTitle: facultyTitlePass,
          },
        });
        return;
      }
      router.push({
        pathname: '/session-scheduling-polls',
        params: {
          moduleId: m.id,
          moduleTitle: encodeURIComponent(m.title),
          facultyId: rowFacultyId,
          facultyTitle: facultyTitlePass,
        },
      });
    },
    [router, isCreateFlow],
  );

  if (!facultyId) {
    return <View style={styles.root} />;
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={SCREEN_BG} />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={[styles.scrollPage, { paddingHorizontal: H_PAD }]}
          showsVerticalScrollIndicator={false}>
          <Pressable onPress={() => router.back()} style={styles.backRow} hitSlop={12}>
            <View style={styles.backBtn}>
              <Ionicons name="chevron-back" size={22} color="#1E293B" />
            </View>
          </Pressable>

          <View style={[styles.headerBlock, { width: contentWidth }]}>
            <View style={[styles.heroOuter, { borderRadius: HEADER_RADIUS }]}>
              <LinearGradient
                colors={HERO_GRADIENT}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={[styles.heroCard, { borderRadius: HEADER_RADIUS }]}>
                <Text style={styles.heroTitle} numberOfLines={2}>
                  {facultyTitleDecoded || 'Modules'}
                </Text>
                <Text style={styles.heroHi}>Hi, {hiName}</Text>
              </LinearGradient>
            </View>

            <View style={[styles.tabBar, { borderRadius: HEADER_RADIUS }]}>
              <Text style={styles.tabSubtitle}>
                {isCreateFlow
                  ? 'Choose a module, then pick Create poll or Kuppi meeting link.'
                  : isPeerTutor
                    ? facultyId === SESSION_SCHEDULING_BROWSE_ALL_ID
                      ? 'Choose a module to see polls you published and live vote counts. You can’t vote here—students use Submit votes.'
                      : 'Choose a module under this faculty to see polls and vote counts (view only for tutors).'
                    : facultyId === SESSION_SCHEDULING_BROWSE_ALL_ID
                      ? 'Choose a module to view and vote on session polls.'
                      : 'Choose a module under this faculty to open session polls.'}
              </Text>
              <View style={styles.tabIndicator} />
            </View>
          </View>

          <View style={styles.moduleList}>
            {moduleRows.length === 0 ? (
              <Text style={styles.emptyFaculty}>
                No modules are linked to this faculty yet. Use another faculty or contact support.
              </Text>
            ) : (
              moduleRows.map(({ module: m, rowFacultyId, rowFacultyTitle }, i) => {
                const palette = MODULE_CARD_GRADIENTS[i % MODULE_CARD_GRADIENTS.length];
                const iconName = MODULE_ICONS[i % MODULE_ICONS.length];
                const count = pollCounts[m.id] || 0;
                const isCreateAll = facultyId === SESSION_SCHEDULING_CREATE_ALL_ID && isCreateFlow;
                const isBrowseAll = facultyId === SESSION_SCHEDULING_BROWSE_ALL_ID && !isCreateFlow;
                let subLine =
                  count > 0 ? `${m.subtitle} · ${count} poll${count !== 1 ? 's' : ''}` : m.subtitle;
                if (isCreateAll || isBrowseAll) {
                  subLine = `${rowFacultyTitle} · ${subLine}`;
                }

                return (
                  <Pressable
                    key={`${rowFacultyId}-${m.id}-${i}`}
                    onPress={() => openModule(m, rowFacultyId, rowFacultyTitle)}
                    style={({ pressed }) => [
                      styles.moduleCardOuter,
                      { width: contentWidth, borderRadius: CARD_RADIUS },
                      pressed && styles.moduleCardPressed,
                    ]}>
                    <LinearGradient
                      colors={palette}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[
                        styles.cardInner,
                        { borderRadius: CARD_RADIUS, minHeight: MODULE_CARD_MIN_HEIGHT },
                      ]}>
                      <View style={styles.iconWrap}>
                        <Ionicons name={iconName} size={22} color={NAVY} />
                      </View>
                      <View style={styles.textBlock}>
                        <Text style={styles.cardTitle} numberOfLines={2}>
                          {m.title}
                        </Text>
                        <Text style={styles.cardSub} numberOfLines={2} ellipsizeMode="tail">
                          {subLine}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={22} color="#94A3B8" />
                    </LinearGradient>
                  </Pressable>
                );
              })
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: SCREEN_BG },
  safe: { flex: 1 },
  scrollPage: {
    paddingBottom: 32,
    alignItems: 'stretch',
  },
  backRow: {
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  backBtn: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  headerBlock: {
    alignSelf: 'center',
    gap: 12,
  },
  heroOuter: {
    overflow: 'hidden',
    shadowColor: '#001F3F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  heroCard: {
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  heroTitle: {
    fontSize: 24,
    fontFamily: 'Roboto_700Bold',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  heroHi: {
    marginTop: 8,
    fontSize: 15,
    fontFamily: 'Roboto_400Regular',
    color: 'rgba(255,255,255,0.92)',
  },
  tabBar: {
    backgroundColor: TAB_SOLID,
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  tabSubtitle: {
    fontSize: 14,
    fontFamily: 'Roboto_400Regular',
    color: 'rgba(255,255,255,0.95)',
    lineHeight: 21,
  },
  tabIndicator: {
    marginTop: 12,
    alignSelf: 'center',
    height: 3,
    width: '55%',
    maxWidth: 280,
    borderRadius: 2,
    backgroundColor: TAB_ACCENT,
  },
  calendarOuter: {
    marginTop: 14,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(18, 52, 86, 0.08)',
    shadowColor: '#123456',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    padding: 12,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  calendarMonth: {
    fontSize: 14,
    fontFamily: 'Roboto_700Bold',
    color: NAVY,
  },
  calendarLoginHint: {
    fontSize: 11,
    fontFamily: 'Roboto_400Regular',
    color: '#64748B',
    flex: 1,
    textAlign: 'right',
  },
  calendarWeekRow: {
    flexDirection: 'row',
  },
  weekLabel: {
    flex: 1,
    fontSize: 10,
    fontFamily: 'Roboto_500Medium',
    color: '#94A3B8',
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
  },
  dayCell: {
    // Width/height overridden per-phone via `calendarSizing` for better iPhone 16 fit.
    width: `${100 / 7}%`,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayEmpty: {
    width: 28,
    height: 28,
  },
  dayText: {
    fontSize: 12,
    fontFamily: 'Roboto_400Regular',
    color: '#0F172A',
  },
  todayDay: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,191,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayDayText: {
    fontSize: 12,
    fontFamily: 'Roboto_700Bold',
    color: NAVY,
  },
  loginDay: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0EA5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginDayText: {
    fontSize: 12,
    fontFamily: 'Roboto_700Bold',
    color: '#FFFFFF',
  },
  moduleList: {
    marginTop: 20,
    gap: 12,
  },
  emptyFaculty: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: 'Roboto_400Regular',
    color: SUBTITLE,
    lineHeight: 21,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  moduleCardOuter: {
    alignSelf: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(18, 52, 86, 0.1)',
    shadowColor: '#123456',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  moduleCardPressed: {
    opacity: 0.94,
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 8,
    gap: 12,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(18, 52, 86, 0.08)',
  },
  textBlock: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Roboto_700Bold',
    color: NAVY,
    lineHeight: 21,
  },
  cardSub: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'Roboto_400Regular',
    color: SUBTITLE,
  },
});
