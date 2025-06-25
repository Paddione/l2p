import 'styled-components';
import type { ThemeConfig } from './game';

declare module 'styled-components' {
  export interface DefaultTheme extends ThemeConfig {}
} 