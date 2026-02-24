export const COLORS = {
    primary: '#0B3D91',
    accent: '#D32F2F',
    bg: '#0A192F',
    surface: '#112240',
    muted: '#8892B0',
    border: '#1E3A5F',
    white: '#FFFFFF',
    success: '#00C853',
    warning: '#FFB300',
} as const;

export const FONTS = {
    title: 28,
    heading: 22,
    subheading: 18,
    body: 15,
    caption: 13,
} as const;

export const SPACING = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
} as const;

export const RADIUS = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
} as const;

export const SHADOW = {
    card: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    button: {
        shadowColor: '#0B3D91',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 10,
    },
    alert: {
        shadowColor: '#D32F2F',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 10,
    },
} as const;
