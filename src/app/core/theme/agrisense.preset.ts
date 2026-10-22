import { definePreset } from '@primeng/themes';
import Aura from '@primeng/themes/aura';

/** PrimeNG preset for AgriSense: teal/cyan primary, deep-slate surfaces in dark mode (amber is used as a Tailwind accent). */
export const AgriSensePreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#effefb',
      100: '#c8fff4',
      200: '#91feea',
      300: '#53f5dc',
      400: '#1fe0c8',
      500: '#06c4b0',
      600: '#029e91',
      700: '#077e75',
      800: '#0b645e',
      900: '#0e524d',
      950: '#003331',
    },
    focusRing: { width: '2px', style: 'solid', color: '{primary.500}', offset: '2px' },
    colorScheme: {
      light: {
        surface: {
          0: '#ffffff',
          50: '#f6f8fa',
          100: '#eceff3',
          200: '#d6dce4',
          300: '#b2bdcb',
          400: '#8797ac',
          500: '#687a92',
          600: '#536379',
          700: '#445063',
          800: '#2b3442',
          900: '#1a212c',
          950: '#0d1219',
        },
        primary: {
          color: '{primary.600}',
          contrastColor: '#ffffff',
          hoverColor: '{primary.700}',
          activeColor: '{primary.800}',
        },
        highlight: {
          background: '{primary.50}',
          focusBackground: '{primary.100}',
          color: '{primary.800}',
          focusColor: '{primary.900}',
        },
      },
      dark: {
        surface: {
          0: '#ffffff',
          50: '#e5ebf2',
          100: '#c9d3df',
          200: '#94a3b8',
          300: '#71819a',
          400: '#56657d',
          500: '#3b4a5e',
          600: '#2c3a4b',
          700: '#253242',
          800: '#19232f',
          900: '#121a24',
          950: '#0b1017',
        },
        primary: {
          color: '{primary.400}',
          contrastColor: '#06201f',
          hoverColor: '{primary.300}',
          activeColor: '{primary.200}',
        },
        highlight: {
          background: 'color-mix(in srgb, {primary.400}, transparent 84%)',
          focusBackground: 'color-mix(in srgb, {primary.400}, transparent 76%)',
          color: 'rgba(255,255,255,.87)',
          focusColor: 'rgba(255,255,255,.87)',
        },
      },
    },
  },
});
