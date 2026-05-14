import type { SearchVerse } from "@tsarstva/data";

export interface SearchResult extends SearchVerse {
  score: number;
  matchCount: number;
}

export interface HighlightSegment {
  text: string;
  isMatch: boolean;
}

export interface SearchResultSet {
  items: SearchResult[];
  total: number;
  terms: string[];
  isReady: boolean;
}

const MIN_QUERY_LENGTH = 2;

export function normalizeSearchText(value: string) {
  return value
    .toLocaleLowerCase("ru-RU")
    .replace(/ё/g, "е")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

export function getSearchTerms(query: string) {
  const normalizedQuery = normalizeSearchText(query);
  if (normalizedQuery.length < MIN_QUERY_LENGTH) return [];

  return Array.from(
    new Set(
      normalizedQuery
        .split(/\s+/)
        .filter((term) => term.length >= MIN_QUERY_LENGTH),
    ),
  );
}

function countMatches(text: string, term: string) {
  let count = 0;
  let index = text.indexOf(term);

  while (index !== -1) {
    count++;
    index = text.indexOf(term, index + term.length);
  }

  return count;
}

export function searchVerses(
  verses: SearchVerse[],
  query: string,
  limit = 80,
): SearchResultSet {
  const normalizedQuery = normalizeSearchText(query);
  const terms = getSearchTerms(query);

  if (terms.length === 0) {
    return {
      items: [],
      total: 0,
      terms,
      isReady: false,
    };
  }

  const matches: SearchResult[] = [];

  verses.forEach((verse, sourceIndex) => {
    const normalizedText = normalizeSearchText(textWithReference(verse));
    if (!terms.every((term) => normalizedText.includes(term))) return;

    const phraseIndex = normalizedText.indexOf(normalizedQuery);
    const firstTermIndex = Math.min(
      ...terms.map((term) => normalizedText.indexOf(term)),
    );
    const matchCount = terms.reduce(
      (count, term) => count + countMatches(normalizedText, term),
      0,
    );
    const score =
      (phraseIndex >= 0 ? 1000 : 0) +
      matchCount * 24 -
      Math.max(firstTermIndex, 0) * 0.2 -
      sourceIndex * 0.0001;

    matches.push({ ...verse, score, matchCount });
  });

  matches.sort((a, b) => b.score - a.score);

  return {
    items: matches.slice(0, limit),
    total: matches.length,
    terms,
    isReady: true,
  };
}

function textWithReference(verse: SearchVerse) {
  return `${verse.label} ${verse.bookName} ${verse.text}`;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function termToPattern(term: string) {
  return escapeRegExp(term).replace(/[её]/g, "[её]");
}

export function getHighlightedSegments(
  text: string,
  terms: string[],
): HighlightSegment[] {
  if (terms.length === 0) return [{ text, isMatch: false }];

  const pattern = [...terms]
    .sort((a, b) => b.length - a.length)
    .map(termToPattern)
    .join("|");
  const regex = new RegExp(pattern, "giu");
  const segments: HighlightSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        text: text.slice(lastIndex, match.index),
        isMatch: false,
      });
    }

    segments.push({ text: match[0], isMatch: true });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), isMatch: false });
  }

  return segments.length > 0 ? segments : [{ text, isMatch: false }];
}
