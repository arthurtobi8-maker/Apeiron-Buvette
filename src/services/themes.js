export const THEME_PRESETS = {
  'amber-gold': {
    id: 'amber-gold',
    label: 'Or Ambré 🍺',
    bg: '#0a0908',
    themeColor: '#f0a500',
    color1: 'rgba(240, 165, 0, 0.16)',
    color2: 'rgba(232, 93, 4, 0.12)',
    color3: 'rgba(255, 215, 0, 0.08)'
  },
  'midnight-neon': {
    id: 'midnight-neon',
    label: 'Midnight Néon 🌌',
    bg: '#080711',
    themeColor: '#d946ef',
    color1: 'rgba(217, 70, 239, 0.18)',
    color2: 'rgba(99, 102, 241, 0.18)',
    color3: 'rgba(168, 85, 247, 0.12)'
  },
  'deep-forest': {
    id: 'deep-forest',
    label: 'Forêt Émeraude 🌲',
    bg: '#040b07',
    themeColor: '#10b981',
    color1: 'rgba(16, 185, 129, 0.16)',
    color2: 'rgba(5, 150, 105, 0.14)',
    color3: 'rgba(52, 211, 153, 0.1)'
  },
  'ocean-breeze': {
    id: 'ocean-breeze',
    label: 'Brise Océanique 🌊',
    bg: '#030914',
    themeColor: '#0ea5e9',
    color1: 'rgba(14, 165, 233, 0.18)',
    color2: 'rgba(37, 99, 235, 0.16)',
    color3: 'rgba(6, 182, 212, 0.12)'
  },
  'sunset-rose': {
    id: 'sunset-rose',
    label: 'Coucher de Soleil 🌇',
    bg: '#0d050a',
    themeColor: '#f43f5e',
    color1: 'rgba(244, 63, 94, 0.18)',
    color2: 'rgba(249, 115, 22, 0.14)',
    color3: 'rgba(236, 72, 153, 0.12)'
  }
};

export const getThemeConfig = (presetId, customColor) => {
  const preset = THEME_PRESETS[presetId];
  if (preset) return preset;

  // Custom fallback theme
  const c = customColor || '#f0a500';
  return {
    id: 'custom',
    label: 'Personnalisé',
    bg: '#0d0d0f',
    themeColor: c,
    color1: `${c}22`, // Hex transparency
    color2: 'rgba(100, 100, 110, 0.12)',
    color3: 'rgba(50, 50, 60, 0.08)'
  };
};
