import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Polyline, Rect } from 'react-native-svg';
import { Colors } from '../../constants/theme';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DATA = [7, 5, 6, 4, 7, 8, 7];

const H = 120;
const PAD = 16;

export default function MoodTrendChart() {
  const [W, setW] = useState<number>(300); // Default fallback before measurement

  const maxVal = 10;
  const points = DATA.map((d, i) => {
    const x = PAD + (i / (DATA.length - 1)) * (W - PAD * 2);
    const y = H - PAD - ((d / maxVal) * (H - PAD * 2));
    return `${x},${y}`;
  }).join(' ');

  const dotCoords = DATA.map((d, i) => ({
    cx: PAD + (i / (DATA.length - 1)) * (W - PAD * 2),
    cy: H - PAD - ((d / maxVal) * (H - PAD * 2)),
  }));

  return (
    <View style={styles.card} onLayout={(e) => {
      // Set chart width to full container width minus padding (14 on each side = 28)
      setW(e.nativeEvent.layout.width - 28);
    }}>
      <Text style={styles.title}>☀️ Mood Trend — This Week</Text>
      <Svg width={W} height={H}>
        <Rect x={0} y={0} width={W} height={H} fill="#F0FFFE" rx={8} />
        <Polyline
          points={points}
          fill="none"
          stroke={Colors.light.tint}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {dotCoords.map((dot, i) => (
          <Circle key={i} cx={dot.cx} cy={dot.cy} r={4} fill={Colors.light.tint} />
        ))}
      </Svg>
      <View style={styles.labels}>
        {DAYS.map((d) => (
          <Text key={d} style={styles.dayLabel}>{d}</Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  title: { fontSize: 14, fontWeight: '600', color: Colors.light.text, marginBottom: 10 },
  labels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, paddingHorizontal: 12 },
  dayLabel: { fontSize: 11, color: Colors.light.text },
});