/**
 * 공통 컬러 변수
 * 프로젝트 전반에서 사용되는 메인 컬러를 관리합니다.
 */

export const COLORS = {
  // 메인 컬러
  PRIMARY: '#F6313A',
  PRIMARY_FOREGROUND: '#FFFFFF',
  
  // 보조 컬러 (메인 컬러 기반)
  PRIMARY_LIGHT: '#FF6B6B',
  PRIMARY_DARK: '#D62828',
  
  // Accent 컬러
  ACCENT: '#FF4757',
  ACCENT_FOREGROUND: '#FFFFFF',
  
  // Secondary 컬러
  SECONDARY: '#FF6B6B',
  SECONDARY_FOREGROUND: '#FFFFFF',
  
  // 세컨 컬러
  SECONDARY_COLOR: '#FFC75D',
} as const

// CSS 변수로도 사용할 수 있도록 export
export const CSS_VARS = {
  '--color-primary': COLORS.PRIMARY,
  '--color-primary-foreground': COLORS.PRIMARY_FOREGROUND,
  '--color-accent': COLORS.ACCENT,
  '--color-accent-foreground': COLORS.ACCENT_FOREGROUND,
} as const

