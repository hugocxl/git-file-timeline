import { diffLines, type Change as DiffChange } from "diff";
import tokenize from "./shiki-tokenizer";
import type { Token, Line, Change } from "../types";

const newlineRe = /\r\n|\r|\n/;

interface InternalLine {
  content: string;
  slides: number[];
  tokens: Token[];
}

interface ParsedChange {
  oldIndex: number;
  lines: string[];
  count: number | undefined;
  removed: boolean | undefined;
  added: boolean | undefined;
}

function myDiff(oldCode: string, newCode: string): ParsedChange[] {
  const changes = diffLines(oldCode || "", newCode);

  let oldIndex = -1;
  return changes.map(({ value, count, removed, added }: DiffChange) => {
    const lines = value.split(newlineRe);
    // check if last line is empty, if it is, remove it
    const lastLine = lines.pop();
    if (lastLine) {
      lines.push(lastLine);
    }
    const result: ParsedChange = {
      oldIndex,
      lines,
      count,
      removed,
      added,
    };
    if (!added) {
      oldIndex += count ?? 0;
    }
    return result;
  });
}

function insert<T>(array: T[], index: number, elements: T[]): T[] {
  array.splice(index, 0, ...elements);
  return array;
}

async function slideDiff(
  lines: InternalLine[],
  codes: string[],
  slideIndex: number,
  language: string
): Promise<void> {
  const prevLines = lines.filter((l) => l.slides.includes(slideIndex - 1));
  const prevCode = codes[slideIndex - 1] || "";
  const currCode = codes[slideIndex] ?? "";

  const changes = myDiff(prevCode, currCode);

  for (const change of changes) {
    if (change.added) {
      const prevLine = prevLines[change.oldIndex];
      const addAtIndex = lines.indexOf(prevLine) + 1;
      const addLines: InternalLine[] = change.lines.map((content) => ({
        content,
        slides: [slideIndex],
        tokens: [],
      }));
      insert(lines, addAtIndex, addLines);
    } else if (!change.removed) {
      for (let j = 1; j <= (change.count ?? 0); j++) {
        const line = prevLines[change.oldIndex + j];
        if (line) {
          line.slides.push(slideIndex);
        }
      }
    }
  }

  const tokenLines = await tokenize(currCode, language);
  const currLines = lines.filter((l) => l.slides.includes(slideIndex));
  currLines.forEach((line, index) => {
    line.tokens = tokenLines[index] ?? [];
  });
}

export async function parseLines(
  codes: string[],
  language: string
): Promise<InternalLine[]> {
  const lines: InternalLine[] = [];
  for (let slideIndex = 0; slideIndex < codes.length; slideIndex++) {
    await slideDiff(lines, codes, slideIndex, language);
  }
  return lines;
}

export async function getSlides(
  codes: string[],
  language: string
): Promise<Line[][]> {
  // codes are in reverse chronological order
  const lines = await parseLines(codes, language);
  return codes.map((_, slideIndex) => {
    return lines
      .map((line, lineIndex) => ({
        content: line.content,
        tokens: line.tokens,
        left: line.slides.includes(slideIndex + 1),
        middle: line.slides.includes(slideIndex),
        right: line.slides.includes(slideIndex - 1),
        key: lineIndex,
      }))
      .filter((line) => line.middle || line.left || line.right);
  });
}

export function getChanges(lines: Line[]): Change[] {
  const changes: Change[] = [];
  let currentChange: { start: number; end?: number } | null = null;
  let i = 0;
  const isNewLine = (idx: number) => {
    const line = lines[idx];
    return line && !line.left && line.middle;
  };

  while (i < lines.length) {
    if (isNewLine(i)) {
      if (!currentChange) {
        currentChange = { start: i };
      }
    } else {
      if (currentChange) {
        currentChange.end = i - 1;
        changes.push(currentChange as Change);
        currentChange = null;
      }
    }
    i++;
  }

  if (currentChange) {
    currentChange.end = i - 1;
    changes.push(currentChange as Change);
  }

  return changes;
}
