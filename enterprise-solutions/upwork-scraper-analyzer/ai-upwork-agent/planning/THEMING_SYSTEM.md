# Design System & Theming Architecture

## 🎨 Design Philosophy

### **Core Principles**
1. **Consistency** - Unified visual language across all components
2. **Accessibility** - WCAG 2.1 AA compliance with proper contrast ratios
3. **Scalability** - Design tokens that work across different screen sizes
4. **Flexibility** - Easy theming for light/dark modes and brand customization
5. **Performance** - CSS-in-JS free approach using CSS variables

### **Design Token Strategy**
- **Semantic Tokens** - Purpose-based naming (primary, secondary, success, warning)
- **Primitive Tokens** - Base color, spacing, and typography values
- **Component Tokens** - Component-specific design decisions
- **Theme Variants** - Light, dark, and system preference support

## 🎭 Theme Architecture

### **CSS Variables Structure**
```css
:root {
  /* Color System - HSL for better manipulation */
  --color-primary-hue: 210;
  --color-primary-saturation: 100%;

  /* Primary Scale */
  --color-primary-50: hsl(var(--color-primary-hue), var(--color-primary-saturation), 97%);
  --color-primary-100: hsl(var(--color-primary-hue), var(--color-primary-saturation), 93%);
  --color-primary-200: hsl(var(--color-primary-hue), var(--color-primary-saturation), 86%);
  --color-primary-300: hsl(var(--color-primary-hue), var(--color-primary-saturation), 76%);
  --color-primary-400: hsl(var(--color-primary-hue), var(--color-primary-saturation), 63%);
  --color-primary-500: hsl(var(--color-primary-hue), var(--color-primary-saturation), 50%);
  --color-primary-600: hsl(var(--color-primary-hue), var(--color-primary-saturation), 40%);
  --color-primary-700: hsl(var(--color-primary-hue), var(--color-primary-saturation), 31%);
  --color-primary-800: hsl(var(--color-primary-hue), var(--color-primary-saturation), 24%);
  --color-primary-900: hsl(var(--color-primary-hue), var(--color-primary-saturation), 15%);
  --color-primary-950: hsl(var(--color-primary-hue), var(--color-primary-saturation), 9%);

  /* Semantic Colors */
  --color-background: hsl(0, 0%, 100%);
  --color-foreground: hsl(222.2, 84%, 4.9%);
  --color-card: hsl(0, 0%, 100%);
  --color-card-foreground: hsl(222.2, 84%, 4.9%);
  --color-popover: hsl(0, 0%, 100%);
  --color-popover-foreground: hsl(222.2, 84%, 4.9%);
  --color-muted: hsl(210, 40%, 96%);
  --color-muted-foreground: hsl(215.4, 16.3%, 46.9%);
  --color-accent: hsl(210, 40%, 96%);
  --color-accent-foreground: hsl(222.2, 84%, 4.9%);
  --color-destructive: hsl(0, 84.2%, 60.2%);
  --color-destructive-foreground: hsl(210, 40%, 98%);
  --color-border: hsl(214.3, 31.8%, 91.4%);
  --color-input: hsl(214.3, 31.8%, 91.4%);
  --color-ring: hsl(222.2, 84%, 4.9%);

  /* Success Colors */
  --color-success: hsl(142.1, 76.2%, 36.3%);
  --color-success-foreground: hsl(355.7, 100%, 97.3%);

  /* Warning Colors */
  --color-warning: hsl(38, 92%, 50%);
  --color-warning-foreground: hsl(48, 96%, 9%);

  /* Info Colors */
  --color-info: hsl(210, 100%, 56%);
  --color-info-foreground: hsl(210, 40%, 98%);

  /* Typography */
  --font-sans: 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, monospace;

  /* Font Sizes */
  --font-size-xs: 0.75rem;    /* 12px */
  --font-size-sm: 0.875rem;   /* 14px */
  --font-size-base: 1rem;     /* 16px */
  --font-size-lg: 1.125rem;   /* 18px */
  --font-size-xl: 1.25rem;    /* 20px */
  --font-size-2xl: 1.5rem;    /* 24px */
  --font-size-3xl: 1.875rem;  /* 30px */
  --font-size-4xl: 2.25rem;   /* 36px */
  --font-size-5xl: 3rem;      /* 48px */

  /* Font Weights */
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  /* Line Heights */
  --line-height-tight: 1.25;
  --line-height-snug: 1.375;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.625;
  --line-height-loose: 2;

  /* Spacing Scale - Based on 0.25rem (4px) base unit */
  --spacing-0: 0;
  --spacing-px: 1px;
  --spacing-0-5: 0.125rem;  /* 2px */
  --spacing-1: 0.25rem;     /* 4px */
  --spacing-1-5: 0.375rem;  /* 6px */
  --spacing-2: 0.5rem;      /* 8px */
  --spacing-2-5: 0.625rem;  /* 10px */
  --spacing-3: 0.75rem;     /* 12px */
  --spacing-3-5: 0.875rem;  /* 14px */
  --spacing-4: 1rem;        /* 16px */
  --spacing-5: 1.25rem;     /* 20px */
  --spacing-6: 1.5rem;      /* 24px */
  --spacing-7: 1.75rem;     /* 28px */
  --spacing-8: 2rem;        /* 32px */
  --spacing-9: 2.25rem;     /* 36px */
  --spacing-10: 2.5rem;     /* 40px */
  --spacing-11: 2.75rem;    /* 44px */
  --spacing-12: 3rem;       /* 48px */
  --spacing-14: 3.5rem;     /* 56px */
  --spacing-16: 4rem;       /* 64px */
  --spacing-20: 5rem;       /* 80px */
  --spacing-24: 6rem;       /* 96px */
  --spacing-28: 7rem;       /* 112px */
  --spacing-32: 8rem;       /* 128px */

  /* Border Radius */
  --radius-none: 0;
  --radius-sm: 0.125rem;     /* 2px */
  --radius-base: 0.25rem;    /* 4px */
  --radius-md: 0.375rem;     /* 6px */
  --radius-lg: 0.5rem;       /* 8px */
  --radius-xl: 0.75rem;      /* 12px */
  --radius-2xl: 1rem;        /* 16px */
  --radius-3xl: 1.5rem;      /* 24px */
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-base: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  --shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);
  --shadow-inner: inset 0 2px 4px 0 rgb(0 0 0 / 0.05);

  /* Z-Index Scale */
  --z-index-dropdown: 1000;
  --z-index-sticky: 1020;
  --z-index-fixed: 1030;
  --z-index-modal-backdrop: 1040;
  --z-index-modal: 1050;
  --z-index-popover: 1060;
  --z-index-tooltip: 1070;
  --z-index-toast: 1080;
}
```

### **Dark Theme Overrides**
```css
[data-theme="dark"] {
  /* Dark mode color adjustments */
  --color-background: hsl(222.2, 84%, 4.9%);
  --color-foreground: hsl(210, 40%, 98%);
  --color-card: hsl(222.2, 84%, 4.9%);
  --color-card-foreground: hsl(210, 40%, 98%);
  --color-popover: hsl(222.2, 84%, 4.9%);
  --color-popover-foreground: hsl(210, 40%, 98%);
  --color-muted: hsl(217.2, 32.6%, 17.5%);
  --color-muted-foreground: hsl(215, 20.2%, 65.1%);
  --color-accent: hsl(217.2, 32.6%, 17.5%);
  --color-accent-foreground: hsl(210, 40%, 98%);
  --color-destructive: hsl(0, 62.8%, 30.6%);
  --color-destructive-foreground: hsl(210, 40%, 98%);
  --color-border: hsl(217.2, 32.6%, 17.5%);
  --color-input: hsl(217.2, 32.6%, 17.5%);
  --color-ring: hsl(212.7, 26.8%, 83.9%);

  /* Adjusted shadows for dark mode */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.3);
  --shadow-base: 0 1px 3px 0 rgb(0 0 0 / 0.4), 0 1px 2px -1px rgb(0 0 0 / 0.4);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.4);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.4), 0 4px 6px -4px rgb(0 0 0 / 0.4);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.4), 0 8px 10px -6px rgb(0 0 0 / 0.4);
  --shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.5);
}
```

## 🌈 Color System

### **Brand Color Palette**
```typescript
const brandColors = {
  // Primary Brand Colors
  upworkGreen: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',  // Main brand color
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
    950: '#052e16'
  },

  // Secondary Brand Colors
  professionalBlue: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',  // Professional blue
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554'
  },

  // Neutral Colors
  slate: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617'
  }
};
```

### **Semantic Color Mapping**
```typescript
const semanticColors = {
  // Status Colors
  success: {
    light: brandColors.upworkGreen[500],
    dark: brandColors.upworkGreen[400],
    foreground: '#ffffff'
  },
  warning: {
    light: '#f59e0b',  // Amber-500
    dark: '#fbbf24',   // Amber-400
    foreground: '#451a03'  // Amber-950
  },
  error: {
    light: '#ef4444',  // Red-500
    dark: '#f87171',   // Red-400
    foreground: '#ffffff'
  },
  info: {
    light: brandColors.professionalBlue[500],
    dark: brandColors.professionalBlue[400],
    foreground: '#ffffff'
  },

  // UI Element Colors
  primary: {
    light: brandColors.professionalBlue[600],
    dark: brandColors.professionalBlue[400],
    foreground: '#ffffff'
  },
  secondary: {
    light: brandColors.slate[100],
    dark: brandColors.slate[800],
    foreground: {
      light: brandColors.slate[900],
      dark: brandColors.slate[100]
    }
  }
};
```

## 🎯 Component Theming

### **Button Component Variants**
```typescript
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  // Base styles
  [
    'inline-flex items-center justify-center rounded-md text-sm font-medium',
    'transition-colors duration-200 ease-in-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50'
  ],
  {
    variants: {
      variant: {
        default: [
          'bg-primary text-primary-foreground',
          'hover:bg-primary/90',
          'shadow-sm'
        ],
        destructive: [
          'bg-destructive text-destructive-foreground',
          'hover:bg-destructive/90',
          'shadow-sm'
        ],
        outline: [
          'border border-input bg-background',
          'hover:bg-accent hover:text-accent-foreground',
          'shadow-sm'
        ],
        secondary: [
          'bg-secondary text-secondary-foreground',
          'hover:bg-secondary/80',
          'shadow-sm'
        ],
        ghost: [
          'hover:bg-accent hover:text-accent-foreground'
        ],
        link: [
          'text-primary underline-offset-4',
          'hover:underline'
        ],
        success: [
          'bg-success text-success-foreground',
          'hover:bg-success/90',
          'shadow-sm'
        ],
        warning: [
          'bg-warning text-warning-foreground',
          'hover:bg-warning/90',
          'shadow-sm'
        ],
        info: [
          'bg-info text-info-foreground',
          'hover:bg-info/90',
          'shadow-sm'
        ]
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        xl: 'h-12 rounded-md px-10 text-base',
        icon: 'h-10 w-10'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}
```

### **Card Component System**
```typescript
const cardVariants = cva(
  [
    'rounded-lg border bg-card text-card-foreground',
    'transition-all duration-200 ease-in-out'
  ],
  {
    variants: {
      variant: {
        default: 'shadow-sm',
        elevated: 'shadow-md hover:shadow-lg',
        outlined: 'border-2 shadow-none',
        ghost: 'border-none shadow-none bg-transparent'
      },
      padding: {
        none: 'p-0',
        sm: 'p-4',
        default: 'p-6',
        lg: 'p-8'
      },
      interactive: {
        true: 'hover:shadow-md hover:border-accent-foreground/20 cursor-pointer',
        false: ''
      }
    },
    defaultVariants: {
      variant: 'default',
      padding: 'default',
      interactive: false
    }
  }
);
```

## 🎨 Theme Provider Implementation

### **Theme Context & Provider**
```typescript
'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeProviderContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
}

const ThemeProviderContext = createContext<ThemeProviderContextType | undefined>(
  undefined
);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'upwork-agent-theme'
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem(storageKey) as Theme;
    if (savedTheme) {
      setThemeState(savedTheme);
    }
  }, [storageKey]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    let resolvedThemeValue: 'light' | 'dark';

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
        .matches ? 'dark' : 'light';
      resolvedThemeValue = systemTheme;
    } else {
      resolvedThemeValue = theme;
    }

    root.classList.add(resolvedThemeValue);
    root.setAttribute('data-theme', resolvedThemeValue);
    setResolvedTheme(resolvedThemeValue);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem(storageKey, newTheme);
    setThemeState(newTheme);
  };

  return (
    <ThemeProviderContext.Provider
      value={{
        theme,
        setTheme,
        resolvedTheme
      }}
    >
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
```

### **Theme Toggle Component**
```typescript
'use client';

import { Moon, Sun, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/components/providers/theme-provider';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => setTheme('light')}
          className={theme === 'light' ? 'bg-accent' : ''}
        >
          <Sun className="mr-2 h-4 w-4" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('dark')}
          className={theme === 'dark' ? 'bg-accent' : ''}
        >
          <Moon className="mr-2 h-4 w-4" />
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('system')}
          className={theme === 'system' ? 'bg-accent' : ''}
        >
          <Monitor className="mr-2 h-4 w-4" />
          <span>System</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

## 📱 Responsive Design System

### **Breakpoint System**
```typescript
const breakpoints = {
  sm: '640px',   // Mobile large
  md: '768px',   // Tablet
  lg: '1024px',  // Desktop
  xl: '1280px',  // Desktop large
  '2xl': '1536px' // Desktop extra large
};

// Tailwind CSS configuration
module.exports = {
  theme: {
    screens: {
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    }
  }
};
```

### **Responsive Typography**
```css
/* Fluid typography using clamp() */
:root {
  --font-size-xs: clamp(0.75rem, 0.7rem + 0.2vw, 0.8rem);
  --font-size-sm: clamp(0.875rem, 0.8rem + 0.3vw, 0.95rem);
  --font-size-base: clamp(1rem, 0.9rem + 0.4vw, 1.1rem);
  --font-size-lg: clamp(1.125rem, 1rem + 0.5vw, 1.25rem);
  --font-size-xl: clamp(1.25rem, 1.1rem + 0.6vw, 1.4rem);
  --font-size-2xl: clamp(1.5rem, 1.3rem + 0.8vw, 1.75rem);
  --font-size-3xl: clamp(1.875rem, 1.6rem + 1vw, 2.25rem);
  --font-size-4xl: clamp(2.25rem, 1.9rem + 1.4vw, 2.75rem);
}
```

### **Container System**
```typescript
const containerVariants = cva(
  'mx-auto w-full px-4 sm:px-6 lg:px-8',
  {
    variants: {
      size: {
        sm: 'max-w-3xl',
        default: 'max-w-7xl',
        lg: 'max-w-screen-2xl',
        full: 'max-w-none'
      },
      padding: {
        none: 'px-0',
        sm: 'px-4 sm:px-6',
        default: 'px-4 sm:px-6 lg:px-8',
        lg: 'px-6 sm:px-8 lg:px-12'
      }
    },
    defaultVariants: {
      size: 'default',
      padding: 'default'
    }
  }
);
```

## 🎊 Animation System

### **Motion Tokens**
```css
:root {
  /* Duration */
  --duration-instant: 0ms;
  --duration-fast: 150ms;
  --duration-normal: 300ms;
  --duration-slow: 500ms;
  --duration-slower: 750ms;

  /* Easing Functions */
  --ease-linear: linear;
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
  --ease-elastic: cubic-bezier(0.68, -0.6, 0.32, 1.6);
}
```

### **Animation Utilities**
```typescript
const animations = {
  // Entrance animations
  fadeIn: 'animate-in fade-in duration-300',
  slideInFromTop: 'animate-in slide-in-from-top-2 duration-300',
  slideInFromBottom: 'animate-in slide-in-from-bottom-2 duration-300',
  slideInFromLeft: 'animate-in slide-in-from-left-2 duration-300',
  slideInFromRight: 'animate-in slide-in-from-right-2 duration-300',
  scaleIn: 'animate-in zoom-in-95 duration-300',

  // Exit animations
  fadeOut: 'animate-out fade-out duration-200',
  slideOutToTop: 'animate-out slide-out-to-top-2 duration-200',
  slideOutToBottom: 'animate-out slide-out-to-bottom-2 duration-200',
  slideOutToLeft: 'animate-out slide-out-to-left-2 duration-200',
  slideOutToRight: 'animate-out slide-out-to-right-2 duration-200',
  scaleOut: 'animate-out zoom-out-95 duration-200',

  // Loading animations
  spin: 'animate-spin',
  pulse: 'animate-pulse',
  bounce: 'animate-bounce'
};
```

## 🧩 Component Styling Patterns

### **Base Component Classes**
```typescript
// Common button base classes
const buttonBase = [
  'inline-flex items-center justify-center',
  'rounded-md font-medium text-sm',
  'transition-colors duration-200',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
  'disabled:pointer-events-none disabled:opacity-50'
];

// Input base classes
const inputBase = [
  'flex h-10 w-full rounded-md border border-input',
  'bg-background px-3 py-2 text-sm',
  'ring-offset-background file:border-0 file:bg-transparent',
  'file:text-sm file:font-medium placeholder:text-muted-foreground',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
  'disabled:cursor-not-allowed disabled:opacity-50'
];

// Card base classes
const cardBase = [
  'rounded-lg border bg-card text-card-foreground shadow-sm'
];
```

### **Status-based Styling**
```typescript
const statusStyles = {
  success: {
    background: 'bg-success/10',
    border: 'border-success/20',
    text: 'text-success-foreground',
    icon: 'text-success'
  },
  warning: {
    background: 'bg-warning/10',
    border: 'border-warning/20',
    text: 'text-warning-foreground',
    icon: 'text-warning'
  },
  error: {
    background: 'bg-destructive/10',
    border: 'border-destructive/20',
    text: 'text-destructive-foreground',
    icon: 'text-destructive'
  },
  info: {
    background: 'bg-info/10',
    border: 'border-info/20',
    text: 'text-info-foreground',
    icon: 'text-info'
  }
};
```

This comprehensive theming system provides a solid foundation for consistent, accessible, and maintainable design across the entire AI Upwork Agent platform while supporting multiple theme variants and responsive design patterns.