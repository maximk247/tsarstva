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
const WORD_BOUNDARY = String.raw`[\p{L}\p{N}]`;

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

function getSearchTokens(value: string) {
  return normalizeSearchText(value).split(/\s+/).filter(Boolean);
}

function matchesTerm(token: string, term: string) {
  if (term.length <= 2) return token === term;
  return token.startsWith(term);
}

function countTermMatches(tokens: string[], term: string) {
  return tokens.reduce(
    (count, token) => count + (matchesTerm(token, term) ? 1 : 0),
    0,
  );
}

function findFirstTermIndex(tokens: string[], terms: string[]) {
  const indexes = terms
    .map((term) => tokens.findIndex((token) => matchesTerm(token, term)))
    .filter((index) => index >= 0);

  return indexes.length > 0 ? Math.min(...indexes) : 0;
}

function countPhraseMatches(tokens: string[], terms: string[]) {
  if (terms.length < 2) return 0;

  let count = 0;
  for (let index = 0; index <= tokens.length - terms.length; index++) {
    const isPhraseMatch = terms.every((term, termIndex) =>
      matchesTerm(tokens[index + termIndex], term),
    );
    if (isPhraseMatch) count++;
  }

  return count;
}

export function searchVerses(
  verses: SearchVerse[],
  query: string,
  limit = 80,
): SearchResultSet {
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
  const looseMatches: SearchResult[] = [];
  const shouldPreferPhrase = terms.length > 1;

  verses.forEach((verse, sourceIndex) => {
    const tokens = getSearchTokens(textWithReference(verse));
    if (
      !terms.every((term) => tokens.some((token) => matchesTerm(token, term)))
    )
      return;

    const phraseCount = countPhraseMatches(tokens, terms);
    const firstTermIndex = findFirstTermIndex(tokens, terms);
    const matchCount = terms.reduce(
      (count, term) => count + countTermMatches(tokens, term),
      0,
    );
    const score =
      phraseCount * 1000 +
      matchCount * 24 -
      firstTermIndex * 0.2 -
      sourceIndex * 0.0001;

    const result = { ...verse, score, matchCount };
    if (shouldPreferPhrase && phraseCount > 0) {
      matches.push(result);
    } else if (!shouldPreferPhrase) {
      matches.push(result);
    } else {
      looseMatches.push(result);
    }
  });

  const resultMatches = matches.length > 0 ? matches : looseMatches;
  resultMatches.sort((a, b) => b.score - a.score);
  const items = resultMatches.slice(0, limit);

  return {
    items,
    total: items.length,
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
  const pattern = escapeRegExp(term).replace(/[её]/g, "[её]");
  return term.length <= 2 ? pattern : `${pattern}${WORD_BOUNDARY}*`;
}

function getHighlightPattern(terms: string[]) {
  if (terms.length > 1) {
    return terms.map(termToPattern).join(String.raw`[^\p{L}\p{N}]+`);
  }

  return termToPattern(terms[0]);
}

export function getHighlightedSegments(
  text: string,
  terms: string[],
): HighlightSegment[] {
  if (terms.length === 0) return [{ text, isMatch: false }];

  const pattern = getHighlightPattern(terms);
  const regex = new RegExp(
    String.raw`(?<!${WORD_BOUNDARY})(?:${pattern})(?!${WORD_BOUNDARY})`,
    "giu",
  );
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
