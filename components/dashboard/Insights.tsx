import { useAuth } from '@/context/auth';
import { DATABASE_ID, databases, MOOD_LOGS_COLLECTION_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import { getInsights, WellbeingInsights } from '../../lib/mockData'; // kept as fallback

const THEME = {
  primary: '#1E3A8A',
  textSecondary: '#64748B'
};

const FEATURE_CARDS = [
  { id: '1', icon: '📚', title: 'Layered Architecture', body: 'Layer 1: Basic support. Layer 2: Context-aware alerts. Layer 3: Adaptive recovery plans.' },
  { id: '2', icon: '🧠', title: 'Context-Aware Engine', body: 'Cross-references mood data with academic events to provide proactive, not reactive, support.' },
  { id: '3', icon: '🛡️', title: 'Ethical by Design', body: 'Emotional data is encrypted and consent-gated. Students control what counselors see.' },
];

const PRIVACY_ITEMS = [
  { id: '1', icon: '🔒', title: 'End-to-End Encryption', body: 'All mood journals and session notes are encrypted at rest and in transit.' },
  { id: '2', icon: '🤝', title: 'Consent-Gated Sharing', body: 'Students explicitly choose what data is shared. Mood scores can be shared without journal content.' },
  { id: '3', icon: '👁️', title: 'No Surveillance Model', body: 'The system supports, never monitors. Academic data is used for contextual support only.' },
];

function BarChart({ data }: { data: WellbeingInsights['monthlyAverages'] }) {
  const [BAR_W, setW] = useState<number>(300); // Default fallback before measurement

  const BAR_H = 140;
  const maxVal = 10;
  const barWidth = (BAR_W / data.length) * 0.5;
  const gap = (BAR_W / data.length) * 0.5;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(translateYAnim, { toValue: 0, friction: 6, tension: 40, useNativeDriver: true })
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{ opacity: fadeAnim, transform: [{ translateY: translateYAnim }] }}
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
    >
      <Svg width={BAR_W} height={BAR_H + 30}>
        {data.map((d, i) => {
          const barH = (d.value / maxVal) * BAR_H;
          const x = i * (barWidth + gap) + gap / 2;
          const y = BAR_H - barH;
          return (
            <G key={d.month}>
              <Rect x={x} y={y} width={barWidth} height={barH} fill={THEME.primary} rx={4} />
            </G>
          );
        })}
      </Svg>
      <View style={styles.barLabels}>
        {data.map((d) => (
          <Text key={d.month} style={styles.barLabel}>{d.month}</Text>
        ))}
      </View>
    </Animated.View>
  );
}

function DonutChart({ data }: { data: WellbeingInsights['moodDistribution'] }) {
  const size = 150;
  const cx = size / 2;
  const cy = size / 2;
  const r = 55;
  const innerR = 35;
  let cumulative = 0;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, delay: 200, useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(200),
        Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 40, useNativeDriver: true })
      ])
    ]).start();
  }, []);

  const slices = data.map((d) => {
    const start = cumulative;
    cumulative += d.percentage;
    const end = cumulative;
    return { ...d, start, end };
  });

  const toRad = (deg: number) => (deg / 100) * 2 * Math.PI - Math.PI / 2;

  const arcPath = (start: number, end: number) => {
    const s = toRad(start);
    const e = toRad(end);
    const x1 = cx + r * Math.cos(s);
    const y1 = cy + r * Math.sin(s);
    const x2 = cx + r * Math.cos(e);
    const y2 = cy + r * Math.sin(e);
    const ix1 = cx + innerR * Math.cos(e);
    const iy1 = cy + innerR * Math.sin(e);
    const ix2 = cx + innerR * Math.cos(s);
    const iy2 = cy + innerR * Math.sin(s);
    // Adjust large arc flag for slices slightly larger than 50%
    const large = (end - start) > 50 ? 1 : 0;

    // Prevent 100% full circle rendering bug with arcs
    if (end - start === 100) {
      return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx} ${cy + r} A ${r} ${r} 0 1 1 ${cx} ${cy - r} M ${cx} ${cy - innerR} A ${innerR} ${innerR} 0 1 0 ${cx} ${cy + innerR} A ${innerR} ${innerR} 0 1 0 ${cx} ${cy - innerR} Z`;
    }

    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${innerR} ${innerR} 0 ${large} 0 ${ix2} ${iy2} Z`;
  };

  return (
    <Animated.View style={[styles.donutContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
      <Svg width={size} height={size}>
        {slices.map((s) => (
          <Path key={s.label} d={arcPath(s.start, s.end)} fill={s.color} />
        ))}
        <Circle cx={cx} cy={cy} r={innerR - 2} fill="#FFFFFF" />
      </Svg>
      <View style={styles.legend}>
        {data.map((d) => (
          <View key={d.label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: d.color }]} />
            <Text style={styles.legendText}>{d.label} <Text style={styles.legendPercent}>{d.percentage}%</Text></Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

export default function Insights() {
  const { user } = useAuth();
  const [insights, setInsights] = useState<WellbeingInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState<'live' | 'mock'>('mock');
  const [barChartTitle, setBarChartTitle] = useState('Mood Average');
  const [totalEntries, setTotalEntries] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    // ── Try real Appwrite data first ────────────────────────────
    if (user) {
      try {
        const res = await databases.listDocuments(DATABASE_ID, MOOD_LOGS_COLLECTION_ID, [
          Query.equal('studentId', user.$id),
          Query.orderDesc('date'),
          Query.limit(200),
        ]);

        const logs = res.documents.map((d: any) => ({
          date: d.date as string,
          moodLevel: parseInt(d.moodLevel, 10) || 3,
          factors: (() => { try { return JSON.parse(d.factors); } catch { return []; } })() as string[],
        }));

        if (logs.length > 0) {
          const { data, chartTitle } = computeInsights(logs);
          setInsights(data);
          setBarChartTitle(chartTitle);
          setTotalEntries(logs.length);
          setDataSource('live');
          setLoading(false);
          return;
        }
        // No logs yet — show zeroed-out state
        setInsights(emptyInsights());
        setDataSource('live');
        setLoading(false);
        return;
      } catch (err) {
        // Appwrite failed (index missing, permissions, etc.) — fall through to mock
        console.warn('Insights: Appwrite fetch failed, falling back to mock data', err);
      }
    }

    // ── Fallback: mock data (always works) ─────────────────────
    const data = await getInsights();
    setInsights(data);
    setDataSource('mock');
    setLoading(false);
  };

  // ── Pure computation helpers ────────────────────────────────
  function computeInsights(logs: { date: string; moodLevel: number; factors: string[] }[]): { data: WellbeingInsights; chartTitle: string } {
    const avgMood = logs.reduce((s, l) => s + l.moodLevel, 0) / logs.length;

    // Factor distribution for donut
    const factorCounts: Record<string, number> = {};
    logs.forEach(l => l.factors.forEach(f => { factorCounts[f] = (factorCounts[f] || 0) + 1; }));
    const totalF = Object.values(factorCounts).reduce((a, b) => a + b, 0) || 1;
    const moodDistribution = Object.entries(factorCounts).map(([label, count], i) => ({
      label,
      percentage: Math.round((count / totalF) * 100),
      color: ['#FC8181', '#F6E05E', '#68D391', '#76E4F7', '#9F7AEA'][i % 5],
    }));

    // Streak
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 60; i++) {
      const day = new Date(today.getTime() - i * 86400000).toISOString().split('T')[0];
      if (logs.some(l => l.date.split('T')[0] === day)) streak++;
      else break;
    }

    // Determine how many distinct months have data
    const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthsWithData = new Set(logs.map(l => {
      const d = new Date(l.date);
      return `${d.getFullYear()}-${d.getMonth()}`;
    }));

    let chartTitle: string;
    let monthlyAverages: { month: string; value: number }[];

    if (monthsWithData.size <= 2) {
      // ── Sparse: show this month bucketed by week (compare day numbers to avoid timezone/midnight bugs) ──
      chartTitle = 'This Month — Weekly Mood';
      monthlyAverages = ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4'].map((label, wkIdx) => {
        const startDay = 1 + wkIdx * 7;        // e.g. 1, 8, 15, 22
        const endDay   = startDay + 6;          // e.g. 7, 14, 21, 28
        const wkLogs = logs.filter(l => {
          const d = new Date(l.date);
          const sameMonth = d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth();
          const day = d.getDate();
          return sameMonth && day >= startDay && day <= endDay;
        });
        const avg = wkLogs.length > 0
          ? (wkLogs.reduce((s, l) => s + l.moodLevel, 0) / wkLogs.length) * 2
          : 0;
        return { month: label, value: parseFloat(avg.toFixed(1)) };
      });
    } else {
      // ── Enough data: show per-month, skip empty months ──
      chartTitle = 'Monthly Mood Average';
      const allMonthAverages: { month: string; value: number }[] = [];
      for (let m = 5; m >= 0; m--) {
        const ref = new Date(today.getFullYear(), today.getMonth() - m, 1);
        const y = ref.getFullYear();
        const mo = ref.getMonth();
        const monthLogs = logs.filter(l => {
          const d = new Date(l.date);
          return d.getFullYear() === y && d.getMonth() === mo;
        });
        if (monthLogs.length === 0) continue; // skip empty months
        const avg = (monthLogs.reduce((s, l) => s + l.moodLevel, 0) / monthLogs.length) * 2;
        allMonthAverages.push({ month: MONTH_NAMES[mo], value: parseFloat(avg.toFixed(1)) });
      }
      monthlyAverages = allMonthAverages;
    }

    return {
      data: {
        weeklyAverage: Math.round(avgMood * 20),
        moodDistribution,
        streakDays: streak,
        score: Math.round(avgMood * 20),
        monthlyAverages,
      },
      chartTitle,
    };
  }

  function emptyInsights(): WellbeingInsights {
    const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const today = new Date();
    const monthlyAverages = Array.from({ length: 6 }, (_, i) => {
      const ref = new Date(today.getFullYear(), today.getMonth() - (5 - i), 1);
      return { month: MONTH_NAMES[ref.getMonth()], value: 0 };
    });
    return { weeklyAverage: 0, moodDistribution: [], streakDays: 0, score: 0, monthlyAverages };
  }

  if (loading || !insights) return <View style={styles.loader}><ActivityIndicator size="large" color={THEME.primary} /></View>;

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.heading}>📊 Wellbeing Insights</Text>
      <Text style={styles.sub}>Aggregated analytics from your mood data, context factors, and academic performance.</Text>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{insights.score}</Text>
          <Text style={styles.statLabel}>Wellbeing Score</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{insights.streakDays}🔥</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>
      </View>

      {/* Bar Chart */}
      <View style={styles.card}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
          <Text style={[styles.cardTitle, { marginBottom: 0 }]}>{barChartTitle}</Text>
          {dataSource === 'live' && totalEntries !== null && (
            <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '600' }}>{totalEntries} entries</Text>
          )}
        </View>
        {insights.monthlyAverages.length > 0
          ? <BarChart data={insights.monthlyAverages} />
          : <Text style={{ color: '#94A3B8', fontSize: 14, textAlign: 'center', paddingVertical: 20 }}>Log your mood a few times to see your trend here 📈</Text>
        }
      </View>

      {/* Donut Chart */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Mood Context Factors</Text>
        <DonutChart data={insights.moodDistribution} />
      </View>

      {/* What Makes This Different */}
      <Text style={styles.sectionTitle}>💡 What Makes This Different</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featureRow}>
        {FEATURE_CARDS.map((f) => (
          <View key={f.id} style={styles.featureCard}>
            <Text style={styles.featureIcon}>{f.icon}</Text>
            <Text style={styles.featureTitle}>{f.title}</Text>
            <Text style={styles.featureBody}>{f.body}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Privacy Framework */}
      <Text style={styles.sectionTitle}>🔐 Privacy & Ethical Framework</Text>
      <View style={styles.card}>
        {PRIVACY_ITEMS.map((item, index) => (
          <View key={item.id}>
            <View style={styles.privacyItem}>
              <Text style={styles.privacyIcon}>{item.icon}</Text>
              <View style={styles.privacyContent}>
                <Text style={styles.privacyTitle}>{item.title}</Text>
                <Text style={styles.privacyBody}>{item.body}</Text>
              </View>
            </View>
            {index < PRIVACY_ITEMS.length - 1 && <View style={styles.divider} />}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: 20, paddingBottom: 40, backgroundColor: '#F8FAFC' },
  heading: { fontSize: 26, fontWeight: '800', color: '#0F172A', marginBottom: 8, letterSpacing: -0.5 },
  sub: { fontSize: 14, color: THEME.textSecondary, lineHeight: 22, marginBottom: 24, paddingRight: 20 },

  statsRow: { flexDirection: 'row', gap: 14, marginBottom: 24 },
  statBox: { flex: 1, backgroundColor: '#0A0A5C', borderRadius: 20, padding: 20, alignItems: 'center', shadowColor: '#0A0A5C', shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  statValue: { fontSize: 28, fontWeight: '800', color: '#FFF', letterSpacing: -0.5 },
  statLabel: { fontSize: 13, color: '#DBEAFE', marginTop: 6, fontWeight: '500' },

  card: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 15, shadowOffset: { width: 0, height: 5 }, elevation: 3, borderWidth: 1, borderColor: '#F1F5F9' },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A', marginBottom: 20, letterSpacing: -0.3 },
  barLabels: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 12 },
  barLabel: { fontSize: 12, fontWeight: '600', color: '#94A3B8' },
  donutContainer: { flexDirection: 'row', alignItems: 'center', gap: 24, flexWrap: 'wrap', justifyContent: 'center' },
  legend: { flex: 1, gap: 12, minWidth: 120 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendText: { fontSize: 13, color: '#334155', flex: 1, fontWeight: '500' },
  legendPercent: { fontWeight: '700', color: '#0F172A' },

  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 16, marginTop: 12, letterSpacing: -0.4 },
  featureRow: { gap: 16, paddingBottom: 8, marginBottom: 20 },
  featureCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, width: 220, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2, borderWidth: 1, borderColor: '#F1F5F9' },
  featureIcon: { fontSize: 28, marginBottom: 12 },
  featureTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A', marginBottom: 8, letterSpacing: -0.2 },
  featureBody: { fontSize: 13, color: '#64748B', lineHeight: 20 },

  privacyItem: { flexDirection: 'row', gap: 14, paddingVertical: 12 },
  privacyIcon: { fontSize: 24, marginTop: 2 },
  privacyContent: { flex: 1 },
  privacyTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A', marginBottom: 6, letterSpacing: -0.2 },
  privacyBody: { fontSize: 13, color: '#64748B', lineHeight: 20 },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 4 },
});