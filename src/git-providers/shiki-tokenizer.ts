/**
 * Shiki-based syntax tokenizer using @pierre/diffs
 *
 * This module replaces the Prism-based tokenizer with Shiki for better
 * syntax highlighting quality and performance.
 */

import {
  getSharedHighlighter,
  preloadHighlighter,
  disposeHighlighter,
} from "@pierre/diffs";
import type { Token } from "../types";

const newlineRe = /\r\n|\r|\n/;

// Track initialization state
let isInitialized = false;
let initPromise: Promise<void> | null = null;

// Commonly used languages for preloading
const PRELOAD_LANGUAGES = [
  "javascript",
  "typescript",
  "jsx",
  "tsx",
  "json",
  "html",
  "css",
  "python",
  "java",
  "go",
  "rust",
  "c",
  "cpp",
  "markdown",
];

// Map Prism language names to Shiki language names where they differ
const LANGUAGE_MAP: Record<string, string> = {
  markup: "html",
  clike: "c",
  js: "javascript",
  ts: "typescript",
  py: "python",
  rb: "ruby",
  sh: "bash",
  shell: "bash",
  yml: "yaml",
  md: "markdown",
  objectivec: "objective-c",
  objc: "objective-c",
};

/**
 * Map a Prism language name to Shiki equivalent
 */
function mapLanguage(lang: string | null | undefined): string {
  if (!lang) return "text";
  const mapped = LANGUAGE_MAP[lang.toLowerCase()];
  return mapped || lang.toLowerCase();
}

/**
 * Initialize the Shiki highlighter
 * This should be called before first tokenization
 */
export async function initHighlighter(): Promise<void> {
  if (isInitialized) {
    return;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = preloadHighlighter({
    themes: ["night-owl"],
    langs: PRELOAD_LANGUAGES,
  })
    .then(() => {
      isInitialized = true;
    })
    .catch((err) => {
      console.warn("Failed to initialize Shiki highlighter:", err);
      // Allow fallback to plain text tokenization
      isInitialized = true;
    });

  return initPromise;
}

/**
 * Dispose the highlighter to free memory
 */
export function dispose(): void {
  if (isInitialized) {
    disposeHighlighter();
    isInitialized = false;
    initPromise = null;
  }
}

interface ShikiToken {
  color?: string;
  content: string;
  fontStyle?: number;
}

/**
 * Convert Shiki tokens to our internal format
 */
function convertShikiTokens(shikiLines: ShikiToken[][]): Token[][] {
  return shikiLines.map((line) => {
    return line.map((token) => ({
      type: "shiki",
      color: token.color || "#d6deeb",
      content: token.content,
      fontStyle: token.fontStyle,
    }));
  });
}

/**
 * Create plain text tokens (fallback when Shiki fails)
 */
function createPlainTextTokens(code: string): Token[][] {
  const lines = code.split(newlineRe);
  return lines.map((lineContent) => [
    {
      type: "plain",
      color: "#d6deeb",
      content: lineContent,
    },
  ]);
}

/**
 * Tokenize code using Shiki
 */
export default async function tokenize(
  code: string,
  language = "javascript"
): Promise<Token[][]> {
  // Ensure highlighter is initialized
  if (!isInitialized) {
    await initHighlighter();
  }

  const mappedLang = mapLanguage(language);

  try {
    const highlighter = await getSharedHighlighter();

    // Use codeToTokensBase for raw token access
    const tokens = highlighter.codeToTokensBase(code, {
      lang: mappedLang,
      theme: "night-owl",
    });

    // tokens is array of lines, each line is array of tokens
    return convertShikiTokens(tokens);
  } catch (err) {
    console.warn(
      `Shiki tokenization failed for language "${mappedLang}":`,
      err
    );
    // Fallback to plain text tokens
    return createPlainTextTokens(code);
  }
}

/**
 * Synchronous tokenization fallback (for compatibility during transition)
 */
export function tokenizeSync(
  code: string,
  _language = "javascript"
): Token[][] {
  return createPlainTextTokens(code);
}
