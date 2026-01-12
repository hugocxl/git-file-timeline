/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GIT_PROVIDER: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Asset modules
declare module "*.mp4" {
  const src: string;
  export default src;
}

declare module "*.webm" {
  const src: string;
  export default src;
}

declare module "*.jpg" {
  const src: string;
  export default src;
}

declare module "*.png" {
  const src: string;
  export default src;
}

declare module "*.svg" {
  import type { FC, SVGProps } from "react";
  export const ReactComponent: FC<SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}

declare module "*.css" {
  const styles: Record<string, string>;
  export default styles;
}

// Netlify Auth Providers
declare module "netlify-auth-providers" {
  interface AuthOptions {
    scope?: string;
  }

  interface AuthResult {
    token: string;
  }

  interface Authenticator {
    authenticate(
      options: AuthOptions,
      callback: (error: Error | null, result?: AuthResult) => void
    ): void;
  }

  export default class NetlifyAuthProvider {
    constructor(config: { site_id: string });
    authenticate(
      options: { provider: string; scope?: string },
      callback: (error: Error | null, result?: { token: string }) => void
    ): void;
  }
}

// js-base64
declare module "js-base64" {
  export function decode(base64: string): string;
  export function encode(str: string): string;
  export function encodeURI(str: string): string;
  export function decodeURI(base64: string): string;
  export const Base64: {
    decode: typeof decode;
    encode: typeof encode;
    encodeURI: typeof encodeURI;
    decodeURI: typeof decodeURI;
  };
}

// Pierre Diffs library
declare module "@pierre/diffs" {
  export interface TokenColor {
    color?: string;
    fontStyle?: number;
  }

  export interface ThemedToken {
    content: string;
    color?: string;
    fontStyle?: number;
  }

  export interface ShikiHighlighter {
    codeToTokensBase(
      code: string,
      options: { lang: string; theme?: string }
    ): ThemedToken[][];
  }

  export interface PreloadOptions {
    langs?: string[];
    themes?: string[];
  }

  export function preloadHighlighter(options?: PreloadOptions): Promise<void>;
  export function getSharedHighlighter(): Promise<ShikiHighlighter>;
  export function disposeHighlighter(): void;

  // File diff components
  export interface FileDiffProps {
    oldCode: string;
    newCode: string;
    language?: string;
    theme?: string;
  }

  export function FileDiff(props: FileDiffProps): JSX.Element;
  export function MultiFileDiff(props: unknown): JSX.Element;
  export function PatchDiff(props: unknown): JSX.Element;
  export function File(props: unknown): JSX.Element;

  export function parseDiffFromFile(diff: string): unknown;
}

// Rebound library types
declare module "rebound" {
  export interface SpringListener {
    onSpringUpdate?: (spring: Spring) => void;
    onSpringAtRest?: (spring: Spring) => void;
    onSpringActivate?: (spring: Spring) => void;
    onSpringEndStateChange?: (spring: Spring) => void;
  }

  export class Spring {
    constructor(springSystem: SpringSystem);
    setCurrentValue(value: number): Spring;
    getCurrentValue(): number;
    setEndValue(value: number): Spring;
    getEndValue(): number;
    setVelocity(velocity: number): Spring;
    getVelocity(): number;
    addListener(listener: SpringListener): Spring;
    removeListener(listener: SpringListener): Spring;
    removeAllListeners(): Spring;
    isAtRest(): boolean;
    isOvershootClampingEnabled(): boolean;
    setOvershootClampingEnabled(enabled: boolean): Spring;
    destroy(): void;
  }

  export class SpringSystem {
    constructor();
    createSpring(tension?: number, friction?: number): Spring;
    createSpringWithConfig(config: SpringConfig): Spring;
    getAllSprings(): Spring[];
    registerSpring(spring: Spring): void;
    deregisterSpring(spring: Spring): void;
    advance(time: number, deltaTime: number): void;
    loop(currentTimeMillis: number): void;
  }

  export class SpringConfig {
    static fromOrigamiTensionAndFriction(
      tension: number,
      friction: number
    ): SpringConfig;
    static fromBouncinessAndSpeed(
      bounciness: number,
      speed: number
    ): SpringConfig;
    static coastingConfigWithOrigamiFriction(friction: number): SpringConfig;
    tension: number;
    friction: number;
  }
}
