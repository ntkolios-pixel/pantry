import React from 'react';
import type { ColorValue } from 'react-native';
import { Tabs } from 'expo-router';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { colors, fonts } from '../../constants/theme';

function TabIcon({ name, color }: { name: string; color: ColorValue }) {
  const props = { width: 19, height: 19, viewBox: '0 0 24 24', fill: 'none', stroke: color as string, strokeWidth: 1.75 };
  switch (name) {
    case 'home':
      return (
        <Svg {...props}>
          <Path d="M3 11l9-8 9 8" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M5 10v10h14V10" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'plan':
      return (
        <Svg {...props}>
          <Rect x={3} y={4} width={18} height={18} rx={3} />
          <Line x1={3} y1={9} x2={21} y2={9} />
          <Line x1={8} y1={2} x2={8} y2={6} />
          <Line x1={16} y1={2} x2={16} y2={6} />
        </Svg>
      );
    case 'groceries':
      return (
        <Svg {...props}>
          <Circle cx={9} cy={21} r={1} />
          <Circle cx={19} cy={21} r={1} />
          <Path
            d="M2 3h2l2.4 12.4a2 2 0 0 0 2 1.6h9.2a2 2 0 0 0 2-1.6L22 6H6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'prep':
      return (
        <Svg {...props}>
          <Path d="M9 11l3 3L22 4" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'discover':
      return (
        <Svg {...props}>
          <Path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'library':
      return (
        <Svg {...props}>
          <Path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    default:
      return null;
  }
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.inkFaint,
        tabBarStyle: {
          backgroundColor: colors.cream,
          borderTopWidth: 1.5,
          borderTopColor: colors.line,
          borderStyle: 'dashed',
          paddingTop: 8,
          height: 78,
        },
        tabBarLabelStyle: { fontSize: 9.5, fontWeight: '600', fontFamily: fonts.uiSemiBold },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{ title: 'Home', tabBarIcon: ({ color }) => <TabIcon name="home" color={color} /> }}
      />
      <Tabs.Screen
        name="plan"
        options={{ title: 'Plan', tabBarIcon: ({ color }) => <TabIcon name="plan" color={color} /> }}
      />
      <Tabs.Screen
        name="groceries"
        options={{ title: 'Groceries', tabBarIcon: ({ color }) => <TabIcon name="groceries" color={color} /> }}
      />
      <Tabs.Screen
        name="prep"
        options={{ title: 'Prep', tabBarIcon: ({ color }) => <TabIcon name="prep" color={color} /> }}
      />
      <Tabs.Screen
        name="discover"
        options={{ title: 'Discover', tabBarIcon: ({ color }) => <TabIcon name="discover" color={color} /> }}
      />
      <Tabs.Screen
        name="library"
        options={{ title: 'Library', tabBarIcon: ({ color }) => <TabIcon name="library" color={color} /> }}
      />
    </Tabs>
  );
}
