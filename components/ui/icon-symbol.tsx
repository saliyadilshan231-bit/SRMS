// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolViewProps, SymbolWeight } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Partial<Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>>;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  'house.fill': 'home',
  'person.fill': 'person',
  gear: 'settings',
  'bell.fill': 'notifications',
  'paperplane.fill': 'send',
  magnifyingglass: 'search',
  laptopcomputer: 'laptop',
  ellipsis: 'more-horiz',
  'checkmark.circle.fill': 'check-circle',
  'person.2.fill': 'groups',
  'heart.fill': 'favorite',
  'doc.fill': 'description',
  'bookmark.fill': 'bookmark',
  'moon.fill': 'dark-mode',
  'lock.fill': 'lock',
  'chart.bar.fill': 'bar-chart',
  timer: 'timer',
  checkmark: 'check',
  pencil: 'edit',
  'info.circle.fill': 'info',
  'bubble.right.fill': 'chat-bubble',
  'square.grid.2x2.fill': 'grid-view',
  calendar: 'calendar-month',
  'chevron.left': 'chevron-left',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'chevron.up': 'expand-less',
  'chevron.down': 'expand-more',
  plus: 'add',
  minus: 'remove',
  xmark: 'close',
  'play.fill': 'play-arrow',
  'pause.fill': 'pause',
  'arrow.counterclockwise': 'refresh',
  'exclamationmark.triangle.fill': 'warning',
  'clock.fill': 'access-time',
  'robot.fill': 'smart-toy',
  'bell.slash': 'notifications-off',
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: SymbolViewProps['name'];
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  const materialName = MAPPING[name] ?? 'help-outline';
  return <MaterialIcons color={color} size={size} name={materialName} style={style} />;
}
