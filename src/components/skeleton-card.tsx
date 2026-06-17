import { StyleSheet, View, useColorScheme } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { useEffect } from 'react';

import { Spacing } from '@/constants/theme';

export function SkeletonCard({ index }: { index: number }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 800 }),
        withTiming(0.3, { duration: 800 })
      ),
      -1,
      false
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const bgColor = isDark ? '#1A1A2E' : '#E5E7EB';
  const shimmerColor = isDark ? '#2A2A3E' : '#F3F4F6';

  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: bgColor,
          borderColor: isDark ? '#2A2A3E' : '#E8EAF0',
        },
        animatedStyle,
      ]}
    >
      <View style={styles.row}>
        <View style={[styles.iconBadge, { backgroundColor: shimmerColor }]} />
        <View style={styles.content}>
          <View style={[styles.line, { backgroundColor: shimmerColor, width: '60%' }]} />
          <View style={[styles.line, { backgroundColor: shimmerColor, width: '40%', height: 12 }]} />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: Spacing.two + 4,
    borderWidth: 1,
    borderCurve: 'continuous',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
  },
  content: {
    flex: 1,
    gap: 6,
  },
  line: {
    height: 14,
    borderRadius: 4,
  },
});
