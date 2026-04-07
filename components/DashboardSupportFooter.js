import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { STORAGE_KEYS } from '@/constants/storageKeys';

const BLUE_DEEP = '#1E3A8A';
const BLUE = '#2563EB';
const BLUE_SOFT = '#60A5FA';
const SLATE = '#64748B';
const SLATE_DARK = '#334155';
const LIGHT_YELLOW = '#FEF08A';
const LIGHT_YELLOW_DEEP = '#FACC15';

const SUPPORT_EMAIL = 'kuppi@gmail.com';
const SUPPORT_PHONE = '0112341231';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function calendarCells(year, monthIndex) {
  const first = new Date(year, monthIndex, 1);
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  let mondayOffset = first.getDay();
  mondayOffset = mondayOffset === 0 ? 6 : mondayOffset - 1;
  const cells = [];
  for (let i = 0; i < mondayOffset; i++) cells.push(null);
  for (let d = 1; d <= lastDay; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function chunkWeeks(cells) {
  const rows = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }
  return rows;
}

function dotDaysForMonth(year, monthIndex, todayParts, loginParts) {
  const s = new Set();
  if (todayParts && todayParts.y === year && todayParts.m === monthIndex) s.add(todayParts.d);
  if (loginParts && loginParts.y === year && loginParts.m === monthIndex) s.add(loginParts.d);
  return s;
}

export default function DashboardSupportFooter() {
  const { width } = useWindowDimensions();
  // Place calendar on the right on phones too (iPhone 16 wide enough for compact two-column).
  const wide = width >= 360;
  const supportMaxWidth = width < 420 ? 210 : 320;
  const calendarMaxWidth = width < 420 ? Math.max(170, width - supportMaxWidth - 44) : 300;
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear());
  const [monthIndex, setMonthIndex] = useState(() => new Date().getMonth());
  const [loginParts, setLoginParts] = useState(null);
  const todayParts = useMemo(() => {
    const d = new Date(nowMs);
    return { y: d.getFullYear(), m: d.getMonth(), d: d.getDate() };
  }, [nowMs]);

  const [selected, setSelected] = useState(() => ({
    month: new Date().getMonth(),
    day: new Date().getDate(),
  }));

  const cells = useMemo(
    () => calendarCells(calendarYear, monthIndex),
    [calendarYear, monthIndex],
  );
  const weeks = useMemo(() => chunkWeeks(cells), [cells]);
  const dotDays = useMemo(
    () => dotDaysForMonth(calendarYear, monthIndex, todayParts, loginParts),
    [calendarYear, loginParts, monthIndex, todayParts],
  );

  // Sync selection to last login day if it is visible; otherwise select today if visible.
  useEffect(() => {
    if (loginParts && loginParts.y === calendarYear && loginParts.m === monthIndex) {
      setSelected({ month: monthIndex, day: loginParts.d });
      return;
    }
    if (todayParts.y === calendarYear && todayParts.m === monthIndex) {
      setSelected({ month: monthIndex, day: todayParts.d });
    }
  }, [calendarYear, loginParts, monthIndex, todayParts]);

  // Refresh "today" highlighting in real time.
  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 60 * 1000);
    return () => clearInterval(t);
  }, []);

  // Load last login timestamp for highlighting.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEYS.lastLoginAt);
        if (!alive) return;
        if (!raw) return;
        const ms = Date.parse(raw);
        if (Number.isNaN(ms)) return;
        const d = new Date(ms);
        setLoginParts({ y: d.getFullYear(), m: d.getMonth(), d: d.getDate() });
      } catch {
        // ignore
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const goPrev = useCallback(() => {
    setMonthIndex((m) => {
      if (m <= 0) {
        setCalendarYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  }, []);

  const goNext = useCallback(() => {
    setMonthIndex((m) => {
      if (m >= 11) {
        setCalendarYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  }, []);

  const openMail = useCallback(() => {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}`);
  }, []);

  const openPhone = useCallback(() => {
    Linking.openURL(`tel:${SUPPORT_PHONE.replace(/\s/g, '')}`);
  }, []);

  const onFullCalendar = useCallback(() => {
    Alert.alert('Calendar', 'Full month view can connect to Session Scheduling in a later update.');
  }, []);

  return (
    <View style={styles.screenPanel}>
      <View style={[styles.row, wide ? styles.rowWide : styles.rowNarrow]}>
        {/* Support — left */}
        <View
          style={[
            styles.supportBlock,
            wide && styles.supportBlockWide,
            { maxWidth: supportMaxWidth },
          ]}>
          <Text style={styles.supportEyebrow}>DO YOU NEED ANY</Text>
          <Text style={styles.supportTitle}>SUPPORT ?</Text>

          <Pressable
            onPress={openMail}
            style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}>
            <View style={styles.iconBubble}>
              <Ionicons name="globe-outline" size={18} color={BLUE} />
            </View>
            <Text style={styles.linkEmail}>{SUPPORT_EMAIL}</Text>
          </Pressable>

          <Pressable
            onPress={openPhone}
            style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}>
            <View style={[styles.iconBubble, styles.iconBubbleMuted]}>
              <Ionicons name="call-outline" size={18} color={SLATE} />
            </View>
            <Text style={styles.phoneText}>{SUPPORT_PHONE}</Text>
          </Pressable>
        </View>

        {wide ? <View style={styles.spacer} /> : null}

        {/* Calendar — right corner (wide) / below support (narrow) */}
        <View
          style={[
            styles.calendarBlock,
            wide ? styles.calendarBlockCorner : styles.calendarBlockStacked,
            { maxWidth: calendarMaxWidth },
          ]}>
          <View style={styles.calHeader}>
            <Text style={styles.calTitle}>Calendar</Text>
            <LinearGradient
              colors={[LIGHT_YELLOW_DEEP, LIGHT_YELLOW]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.calUnderline}
            />
          </View>

          <View style={styles.calNav}>
            <Pressable
              onPress={goPrev}
              style={({ pressed }) => [
                styles.calArrow,
                pressed && monthIndex > 0 && styles.pressed,
              ]}
              hitSlop={10}>
              <Ionicons
                name="caret-back"
                size={16}
                color={BLUE}
              />
            </Pressable>
            <Text style={styles.calMonthYear}>
              {MONTH_NAMES[monthIndex]} {calendarYear}
            </Text>
            <Pressable
              onPress={goNext}
              style={({ pressed }) => [
                styles.calArrow,
                pressed && monthIndex < 11 && styles.pressed,
              ]}
              hitSlop={10}>
              <Ionicons
                name="caret-forward"
                size={16}
                color={BLUE}
              />
            </Pressable>
          </View>

          <View style={styles.weekRow}>
            {WEEK_DAYS.map((d) => (
              <Text key={d} style={styles.weekDay}>
                {d}
              </Text>
            ))}
          </View>

          {weeks.map((week, wi) => (
            <View key={wi} style={styles.dayRow}>
              {week.map((day, di) => (
                <View key={di} style={styles.dayCell}>
                  {day != null ? (
                    <Pressable
                      onPress={() => setSelected({ month: monthIndex, day })}
                      style={[
                        styles.dayInner,
                        selected.month === monthIndex && selected.day === day && styles.daySelected,
                      ]}>
                      <Text
                        style={[
                          styles.dayNum,
                          selected.month === monthIndex &&
                            selected.day === day &&
                            styles.dayNumSelected,
                        ]}>
                        {day}
                      </Text>
                      {dotDays.has(day) ? (
                        <View
                          style={[
                            styles.eventDot,
                            selected.month === monthIndex &&
                              selected.day === day &&
                              styles.eventDotOnSelected,
                          ]}
                        />
                      ) : (
                        <View style={styles.dotPlaceholder} />
                      )}
                    </Pressable>
                  ) : (
                    <View style={styles.dayEmpty} />
                  )}
                </View>
              ))}
            </View>
          ))}

          <Pressable
            onPress={onFullCalendar}
            style={[styles.fullCalLink, wide && styles.fullCalLinkRight]}>
            <Text style={styles.fullCalText}>Full calendar</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screenPanel: {
    width: '100%',
    backgroundColor: 'transparent',
    marginTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.22)',
    overflow: 'visible',
  },
  row: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  rowWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    paddingLeft: 18,
    paddingRight: 12,
  },
  rowNarrow: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  supportBlock: {
    maxWidth: 320,
  },
  supportBlockWide: {
    paddingTop: 4,
  },
  spacer: {
    flex: 1,
    minWidth: 8,
  },
  calendarBlock: {
    width: '100%',
    maxWidth: 300,
  },
  calendarBlockCorner: {
    alignSelf: 'flex-end',
    marginRight: 4,
    paddingTop: 4,
  },
  calendarBlockStacked: {
    marginTop: 20,
    alignSelf: 'stretch',
    maxWidth: '100%',
  },
  supportEyebrow: {
    color: SLATE,
    fontSize: 11,
    fontFamily: 'Roboto_500Medium',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  supportTitle: {
    color: BLUE_DEEP,
    fontSize: 26,
    fontFamily: 'Roboto_900Black',
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  iconBubble: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(37,99,235,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(37,99,235,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBubbleMuted: {
    backgroundColor: 'rgba(100,116,139,0.08)',
    borderColor: 'rgba(100,116,139,0.15)',
  },
  linkEmail: {
    color: BLUE,
    fontSize: 15,
    fontFamily: 'Roboto_700Bold',
    flexShrink: 1,
  },
  phoneText: {
    color: SLATE,
    fontSize: 15,
    fontFamily: 'Roboto_400Regular',
  },
  pressed: {
    opacity: 0.78,
  },
  calHeader: {
    marginBottom: 12,
  },
  calTitle: {
    color: BLUE_DEEP,
    fontSize: 18,
    fontFamily: 'Roboto_700Bold',
    marginBottom: 6,
  },
  calUnderline: {
    height: 3,
    width: 88,
    borderRadius: 2,
  },
  calNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  calArrow: {
    padding: 6,
  },
  calArrowDisabled: {
    opacity: 0.35,
  },
  calMonthYear: {
    color: SLATE_DARK,
    fontSize: 15,
    fontFamily: 'Roboto_700Bold',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    color: SLATE,
    fontSize: 10,
    fontFamily: 'Roboto_500Medium',
  },
  dayRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    minHeight: 40,
  },
  dayInner: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 4,
    minWidth: 36,
    borderRadius: 18,
  },
  daySelected: {
    backgroundColor: LIGHT_YELLOW,
    borderWidth: 1,
    borderColor: 'rgba(37,99,235,0.2)',
  },
  dayNum: {
    color: SLATE_DARK,
    fontSize: 13,
    fontFamily: 'Roboto_500Medium',
  },
  dayNumSelected: {
    color: BLUE_DEEP,
    fontFamily: 'Roboto_700Bold',
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: BLUE_SOFT,
    marginTop: 3,
  },
  eventDotOnSelected: {
    backgroundColor: BLUE,
  },
  dotPlaceholder: {
    height: 7,
    marginTop: 3,
  },
  dayEmpty: {
    height: 36,
  },
  fullCalLink: {
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  fullCalLinkRight: {
    alignSelf: 'flex-end',
  },
  fullCalText: {
    color: BLUE,
    fontSize: 13,
    fontFamily: 'Roboto_700Bold',
  },
});
