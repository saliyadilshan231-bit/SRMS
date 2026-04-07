import React, { useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';

import COLORS from '@/constants/colors';

function DashboardCard({
  title,
  description,
  icon = 'apps',
  iconType = 'ionicons',
  iconUri,
  onPress,
  colors = [COLORS.white, '#F4F9FF'],
  featured = false,
  /** 'grid' = half-width tile; 'list' = full-width row, stacked vertically */
  variant = 'grid',
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const animateIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      friction: 8,
      tension: 140,
    }).start();
  };

  const animateOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 140,
    }).start();
  };

  const IconComponent = iconType === 'material' ? MaterialIcons : Ionicons;
  const isList = variant === 'list';

  return (
    <Animated.View
      style={[
        styles.wrapper,
        isList && styles.wrapperList,
        { transform: [{ scale: scaleAnim }] },
      ]}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={animateIn}
        onPressOut={animateOut}
        onPress={onPress}>
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.card, isList && styles.cardList, featured && styles.cardFeatured]}>
          <View style={[styles.iconContainer, isList && styles.iconContainerList]}>
            {iconUri ? (
              <Image
                source={{ uri: iconUri }}
                style={[styles.iconImage, isList && styles.iconImageList]}
                contentFit="contain"
              />
            ) : (
              <IconComponent name={icon} size={isList ? 20 : 22} color={COLORS.darkNavy} />
            )}
          </View>
          <View style={isList ? styles.textBlockList : undefined}>
            <Text style={[styles.title, isList && styles.titleList]}>{title}</Text>
            <Text
              style={[styles.description, isList && styles.descriptionList]}
              numberOfLines={isList ? 2 : undefined}
              ellipsizeMode="tail">
              {description}
            </Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '48%',
    marginBottom: 10,
  },
  wrapperList: {
    alignSelf: 'center',
    width: '88%',
    maxWidth: 380,
    marginBottom: 0,
  },
  card: {
    minHeight: 132,
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: 'rgba(15, 40, 72, 0.08)',
    shadowColor: '#0F2847',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  cardList: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  cardFeatured: {
    borderWidth: 1.5,
    borderColor: 'rgba(14, 165, 233, 0.42)',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  iconContainerList: {
    width: 40,
    height: 40,
    borderRadius: 12,
    marginBottom: 0,
    marginRight: 11,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.15)',
  },
  textBlockList: {
    flex: 1,
    minWidth: 0,
  },
  iconImage: {
    width: 24,
    height: 24,
  },
  iconImageList: {
    width: 20,
    height: 20,
  },
  title: {
    fontSize: 14,
    fontFamily: 'Roboto_700Bold',
    color: COLORS.darkNavy,
    marginBottom: 4,
  },
  titleList: {
    fontSize: 15,
    marginBottom: 3,
    letterSpacing: -0.3,
    lineHeight: 19,
  },
  description: {
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.deepBlueGray,
    fontFamily: 'Roboto_400Regular',
  },
  descriptionList: {
    fontSize: 13,
    lineHeight: 17,
    letterSpacing: -0.1,
    opacity: 0.92,
  },
});

export default DashboardCard;

