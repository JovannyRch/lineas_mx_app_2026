import { SymbolView } from 'expo-symbols';
import { StyleSheet, View, useColorScheme } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { DisplayLine } from '@/types';

function getLineConfig(line: DisplayLine, isDark: boolean) {
  if (line.isError) {
    return {
      icon: 'exclamationmark.triangle.fill' as const,
      iconColor: '#F59E0B',
      bg: isDark ? '#1C1917' : '#FFFBEB',
      border: isDark ? '#44403C' : '#FDE68A',
      numeroColor: isDark ? '#A8A29E' : '#78716C',
    };
  }
  if (line.isUnavailable) {
    return {
      icon: 'clock.fill' as const,
      iconColor: '#8B5CF6',
      bg: isDark ? '#1E1B4B' : '#F5F3FF',
      border: isDark ? '#3730A3' : '#DDD6FE',
      numeroColor: isDark ? '#A5B4FC' : '#6D28D9',
    };
  }
  if (line.isPossible) {
    return {
      icon: 'questionmark.circle.fill' as const,
      iconColor: '#F59E0B',
      bg: isDark ? '#1C1917' : '#FFFBEB',
      border: isDark ? '#44403C' : '#FDE68A',
      numeroColor: isDark ? '#FCD34D' : '#92400E',
    };
  }
  if (line.isNotFound) {
    return {
      icon: 'checkmark.circle.fill' as const,
      iconColor: '#10B981',
      bg: isDark ? '#052E16' : '#ECFDF5',
      border: isDark ? '#166534' : '#A7F3D0',
      numeroColor: isDark ? '#6EE7B7' : '#065F46',
    };
  }
  return {
    icon: 'phone.fill' as const,
    iconColor: '#EF4444',
    bg: isDark ? '#450A0A' : '#FEF2F2',
    border: isDark ? '#991B1B' : '#FECACA',
    numeroColor: isDark ? '#FCA5A5' : '#991B1B',
  };
}

export function LineCard({ line, index }: { line: DisplayLine; index: number }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const config = getLineConfig(line, isDark);

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 40)
        .duration(350)
        .springify()
        .damping(14)}
      style={[
        styles.card,
        {
          backgroundColor: config.bg,
          borderColor: config.border,
        },
      ]}
    >
      <View style={styles.row}>
        <View style={[styles.iconBadge, { backgroundColor: config.border }]}>
          <SymbolView name={config.icon} size={14} tintColor={config.iconColor} weight="semibold" />
        </View>

        <View style={styles.content}>
          <ThemedText type="smallBold" style={styles.operadora}>
            {line.operadora}
          </ThemedText>
          <ThemedText type="small" style={{ color: config.numeroColor }}>
            {line.numero}
          </ThemedText>
        </View>
      </View>

      {line.disclaimer && (
        <ThemedText
          type="small"
          style={[styles.disclaimer, { color: isDark ? '#A8A29E' : '#78716C' }]}
        >
          {line.disclaimer}
        </ThemedText>
      )}
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    gap: 2,
  },
  operadora: {
    fontSize: 14,
  },
  disclaimer: {
    marginTop: Spacing.one,
    fontSize: 12,
    lineHeight: 16,
    paddingLeft: 40,
  },
});
