import React from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import Svg, { Path, Polyline } from 'react-native-svg';
import { colors, fonts, radii, spacing } from '../constants/theme';

export function Screen({
  children,
  contentStyle,
  scroll = true,
}: {
  children: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  scroll?: boolean;
}) {
  if (!scroll) {
    return (
      <View style={styles.screenBg}>
        <View style={[styles.screenContent, contentStyle]}>{children}</View>
      </View>
    );
  }
  return (
    <View style={styles.screenBg}>
      <ScrollView
        style={styles.screenBg}
        contentContainerStyle={[styles.screenContent, contentStyle]}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </View>
  );
}

export function BackLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={8}>
      <Text style={styles.backLink}>{label}</Text>
    </Pressable>
  );
}

export function Tag({ bg, fg, label }: { bg: string; fg: string; label: string }) {
  return (
    <View style={[styles.tag, { backgroundColor: bg }]}>
      <Text style={[styles.tagText, { color: fg }]}>{label}</Text>
    </View>
  );
}

export function SectionLabel({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.sectionLabel, style]}>{children}</Text>;
}

export function StepLabel({ step, of, style }: { step: number; of: number; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.stepLabel, style]}>{`Step ${step} of ${of}`}</Text>;
}

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function PrimaryButton({
  label,
  onPress,
  loading,
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.primaryButton, (disabled || loading) && { opacity: 0.6 }, style]}
    >
      {loading ? <ActivityIndicator color={colors.paper} /> : <Text style={styles.primaryButtonText}>{label}</Text>}
    </Pressable>
  );
}

export function SecondaryButton({
  label,
  onPress,
  style,
}: {
  label: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.secondaryButton, style]}>
      <Text style={styles.secondaryButtonText}>{label}</Text>
    </Pressable>
  );
}

export function TextLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={8}>
      <Text style={styles.textLink}>{label}</Text>
    </Pressable>
  );
}

export function Checkbox({ checked }: { checked: boolean }) {
  return (
    <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
      {checked ? (
        <Svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke={colors.cream} strokeWidth={3.5}>
          <Polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      ) : null}
    </View>
  );
}

export function ChecklistRow({
  label,
  meta,
  done,
  onPress,
}: {
  label: string;
  meta?: string;
  done: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.checklistRow}>
      <Checkbox checked={done} />
      <Text
        style={[
          styles.checklistLabel,
          { color: done ? colors.inkFaint : colors.ink },
          done && { textDecorationLine: 'line-through' },
        ]}
      >
        {label}
      </Text>
      {meta ? <Text style={styles.checklistMeta}>{meta}</Text> : null}
    </Pressable>
  );
}

export function PillToggle({
  options,
  value,
  onChange,
}: {
  options: { key: string; label: string }[];
  value: string;
  onChange: (key: string) => void;
}) {
  return (
    <View style={styles.pillRow}>
      {options.map((opt) => {
        const active = opt.key === value;
        return (
          <Pressable
            key={opt.key}
            onPress={() => onChange(opt.key)}
            style={[styles.pillToggleItem, { backgroundColor: active ? colors.ink : colors.paper }]}
          >
            <Text style={[styles.pillToggleText, { color: active ? colors.cream : colors.inkSoft }]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function WrapPill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.wrapPill, { backgroundColor: active ? colors.ink : colors.paper }]}
    >
      <Text style={[styles.wrapPillText, { color: active ? colors.paper : colors.inkSoft }]}>{label}</Text>
    </Pressable>
  );
}

export function ChevronRight({ color = colors.inkFaint }: { color?: string }) {
  return <Text style={{ color, fontSize: 15 }}>{'›'}</Text>;
}

export function IconCircle({
  bg,
  stroke,
  children,
}: {
  bg: string;
  stroke: string;
  children: React.ReactNode;
}) {
  return <View style={[styles.iconCircle, { backgroundColor: bg }]}>{children}</View>;
}

export function GearIcon({ color = colors.inkSoft }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.75}>
      <Path d="M12 20a6 6 0 1 0 0-12 6 6 0 0 0 0 12z" strokeLinecap="round" strokeLinejoin="round" />
      <Path
        d="M12 4v2M12 18v2M4 12h2M18 12h2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M6.3 17.7l1.4-1.4M16.3 7.7l1.4-1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const shadow = Platform.select({
  web: { boxShadow: '0 1px 2px rgba(122,83,48,0.06)' } as any,
  default: {
    shadowColor: '#7A5330',
    shadowOpacity: 0.06,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
});

const styles = StyleSheet.create({
  screenBg: { flex: 1, backgroundColor: colors.cream },
  screenContent: { padding: spacing.lg, paddingBottom: 90, flexGrow: 1 },
  backLink: { fontSize: 13, color: colors.inkSoft, fontFamily: fonts.ui },
  tag: { borderRadius: 5, paddingHorizontal: 9, paddingVertical: 3, alignSelf: 'flex-start' },
  tagText: { fontSize: 10.5, fontWeight: '700', fontFamily: fonts.uiBold },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.inkSoft,
    fontFamily: fonts.uiBold,
  },
  stepLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.marigold,
    fontFamily: fonts.uiBold,
    marginBottom: 9,
  },
  card: {
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.xl,
    padding: 14,
    ...shadow,
  },
  primaryButton: {
    backgroundColor: colors.syrup,
    borderRadius: radii.md,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { color: colors.onAccent, fontSize: 14, fontWeight: '700', fontFamily: fonts.uiBold },
  secondaryButton: {
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.md,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: { color: colors.inkSoft, fontSize: 13.5, fontWeight: '600', fontFamily: fonts.uiSemiBold },
  textLink: { fontSize: 12.5, color: colors.inkSoft, textDecorationLine: 'underline', fontFamily: fonts.ui },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.inkFaint,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkboxChecked: { backgroundColor: colors.ink, borderColor: colors.ink },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    borderStyle: 'dashed',
  },
  checklistLabel: { flex: 1, fontSize: 13.5, fontFamily: fonts.ui },
  checklistMeta: { fontSize: 11, color: colors.inkFaint, fontFamily: fonts.ui },
  pillRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  pillToggleItem: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: radii.sm },
  pillToggleText: { fontSize: 12.5, fontWeight: '600', fontFamily: fonts.uiSemiBold },
  wrapPill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radii.pill },
  wrapPillText: { fontSize: 12, fontWeight: '600', fontFamily: fonts.uiSemiBold },
  iconCircle: { width: 36, height: 36, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
});
