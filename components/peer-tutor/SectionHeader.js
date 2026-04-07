import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const F = {
  semi: 'Inter_600SemiBold',
  reg: 'Inter_400Regular',
};

export default function SectionHeader({ title, subtitle, titleStyle, subtitleStyle }) {
  return (
    <View style={styles.wrap}>
      <Text style={[styles.title, titleStyle]}>{title}</Text>
      {subtitle ? <Text style={[styles.subtitle, subtitleStyle]}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 12,
    marginTop: 2,
  },
  title: {
    fontSize: 17,
    fontFamily: F.semi,
    color: '#1E293B',
    letterSpacing: 0.15,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    fontFamily: F.reg,
    color: '#64748B',
    lineHeight: 18,
  },
});
