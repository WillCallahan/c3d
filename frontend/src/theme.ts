const feedbackPalette = {
  success: '#4AD295',
  danger: '#F05D5E',
  warning: '#FFC555',
};

export const lightTheme = {
  body: '#EEF1F8',
  text: '#0F172A',
  heading: '#030712',
  muted: '#616A82',
  primary: '#5B6CFF',
  primaryHover: '#4856F1',
  primarySoft: 'rgba(91, 108, 255, 0.15)',
  borderColor: 'rgba(15, 23, 42, 0.08)',
  card: '#FFFFFF',
  panel: '#FDFDFE',
  cardHighlight: '#F6F7FF',
  dropzoneBg: 'rgba(255, 255, 255, 0.95)',
  dropzoneBorder: 'rgba(91, 108, 255, 0.45)',
  dropzoneAccent: 'linear-gradient(135deg, rgba(91,108,255,0.2), rgba(255,123,202,0.22))',
  accent: '#FF7BCA',
  gradient: 'linear-gradient(135deg, #6B66FF 0%, #8A85FF 50%, #B6A8FF 100%)',
  pageBackground:
    'radial-gradient(circle at 20% 20%, rgba(108,99,255,0.15), transparent 40%), radial-gradient(circle at 80% 0%, rgba(255,123,202,0.18), transparent 35%), #F6F8FC',
  shadow: '0 30px 70px rgba(15, 23, 42, 0.12)',
  cardShadow: '0 20px 45px rgba(15, 23, 42, 0.08)',
  adBg: 'linear-gradient(135deg, #171C2B, #1F2A4D)',
  adBorder: 'rgba(255, 255, 255, 0.08)',
  glow: 'rgba(91,108,255,0.35)',
  surfaceLine: 'rgba(15, 23, 42, 0.06)',
  ...feedbackPalette,
};

export const darkTheme = {
  body: '#050A18',
  text: '#F8FAFC',
  heading: '#FFFFFF',
  muted: '#94A3B8',
  primary: '#8C93FF',
  primaryHover: '#7F86F3',
  primarySoft: 'rgba(140, 147, 255, 0.12)',
  borderColor: 'rgba(148, 163, 184, 0.2)',
  card: 'rgba(15, 23, 42, 0.75)',
  panel: 'rgba(15, 23, 42, 0.9)',
  cardHighlight: 'rgba(148, 163, 184, 0.08)',
  dropzoneBg: 'rgba(15, 23, 42, 0.85)',
  dropzoneBorder: 'rgba(140, 147, 255, 0.55)',
  dropzoneAccent: 'linear-gradient(135deg, rgba(140,147,255,0.25), rgba(255,138,190,0.25))',
  accent: '#FF8ABE',
  gradient: 'linear-gradient(135deg, #7F7BFF 0%, #9E71FF 50%, #FF7FBF 100%)',
  pageBackground:
    'radial-gradient(circle at 20% 20%, rgba(111,86,248,0.35), transparent 45%), radial-gradient(circle at 80% 10%, rgba(255,111,187,0.28), transparent 40%), #050A18',
  shadow: '0 35px 90px rgba(0,0,0,0.55)',
  cardShadow: '0 25px 65px rgba(0,0,0,0.5)',
  adBg: 'linear-gradient(145deg, #10162A, #192540)',
  adBorder: 'rgba(255, 255, 255, 0.12)',
  glow: 'rgba(140,147,255,0.4)',
  surfaceLine: 'rgba(255, 255, 255, 0.08)',
  ...feedbackPalette,
};

export type AppTheme = typeof lightTheme;
