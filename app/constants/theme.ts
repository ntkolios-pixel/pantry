// Ported 1:1 from the Claude Design prototype's CSS custom properties
// (project/PhoneApp.dc.html :root block).
export const colors = {
  cream: '#F4EFE4',
  paper: '#FFFFFF',
  linen: '#FBF8F1',
  ink: '#4A3722',
  inkSoft: '#8A7458',
  inkFaint: '#B5A68E',
  syrup: '#7A5330',
  onAccent: '#FFFDF7',
  line: '#E4DAC8',

  olive: '#9A6B45',
  oliveSoft: '#EFE3D3',
  marigold: '#9A6B45',
  marigoldSoft: '#EFE3D3',
  marigoldInk: '#6B4726',

  rust: '#A25A34',
  rustSoft: '#F6E3D7',
  butter: '#9A8560',
  butterSoft: '#EFE7DA',

  sage: '#6E7548',
  sageSoft: '#EEEFDC',
  success: '#6E7548',
  successSoft: '#EEEFDC',

  berry: '#8E5A5C',
  berrySoft: '#F6E4E2',
  slate: '#7B7166',
  slateSoft: '#EFEBE4',
  sky: '#5F7480',
  skySoft: '#E6EDEF',
} as const;

export const fonts = {
  display: 'CormorantGaramond_300Light_Italic',
  ui: 'DMSans_400Regular',
  uiMedium: 'DMSans_500Medium',
  uiSemiBold: 'DMSans_600SemiBold',
  uiBold: 'DMSans_700Bold',
} as const;

export const kosherStyle = {
  meat: { bg: colors.rustSoft, fg: colors.rust, label: 'Meat' },
  dairy: { bg: colors.skySoft, fg: colors.sky, label: 'Dairy' },
  parve: { bg: colors.sageSoft, fg: colors.sage, label: 'Parve' },
} as const;

export type KosherType = keyof typeof kosherStyle;

// Alternating tint pair used for each household member's initial avatar
// (welcome/preferences screens) — cycles by their position in the list.
export const personTints = [
  { strip: '#FFFDF7', circle: '#F2EADB' },
  { strip: '#FFFDF7', circle: '#F0E7D4' },
] as const;

export const radii = { sm: 8, md: 10, lg: 12, xl: 14, xxl: 16, pill: 999 };
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 18, xxl: 24, xxxl: 32 };
