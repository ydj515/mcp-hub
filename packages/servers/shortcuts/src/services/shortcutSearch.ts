import { categories } from "../data/categories.js";
import { allShortcuts } from "../data/shortcuts.js";
import type { Shortcut } from "../types/shortcut.js";

export type ShortcutPlatform = "mac" | "win";

export interface ShortcutSearchOptions {
  query: string;
  category?: string;
  platform?: ShortcutPlatform;
  limit?: number;
}

export interface ShortcutSearchResult {
  categoryId: string;
  categoryName: string;
  action: string;
  mac: string;
  win: string;
  keywords: string[];
  score: number;
  matchedFields: string[];
  matchedKeywords: string[];
}

const DEFAULT_LIMIT = 10;

const normalize = (value: string) =>
  value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const normalizedCategories = new Map<string, string>();
const categoryNameById = new Map<string, string>();

for (const category of categories) {
  categoryNameById.set(category.id, category.name);
  const normalizedId = normalize(category.id);
  const normalizedName = normalize(category.name);
  normalizedCategories.set(normalizedId, category.id);
  normalizedCategories.set(normalizedName, category.id);
}

const getCategoryId = (value: string | undefined): string | undefined => {
  if (!value) return undefined;
  const normalized = normalize(value);
  return normalizedCategories.get(normalized);
};

export const listShortcutCategories = () =>
  categories
    .map((category) => ({ id: category.id, name: category.name }))
    .sort((a, b) => a.name.localeCompare(b.name));

export const searchShortcuts = (options: ShortcutSearchOptions): ShortcutSearchResult[] => {
  const { query, category, platform, limit = DEFAULT_LIMIT } = options;
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return [];
  }

  const normalizedQuery = normalize(trimmedQuery);
  const terms = normalizedQuery.split(/\s+/g).filter(Boolean);
  const categoryId = getCategoryId(category);

  const results: ShortcutSearchResult[] = [];

  for (const shortcut of allShortcuts) {
    if (categoryId && shortcut.category !== categoryId) {
      continue;
    }

    if (platform === "mac" && isUnavailable(shortcut.mac)) {
      continue;
    }

    if (platform === "win" && isUnavailable(shortcut.win)) {
      continue;
    }

    const normalizedAction = normalize(shortcut.action);
    const normalizedCategory = normalize(shortcut.category);
    const normalizedMac = normalize(shortcut.mac);
    const normalizedWin = normalize(shortcut.win);
    const normalizedKeywords = shortcut.keywords.map(normalize);
    const normalizedTokens = [
      normalizedAction,
      normalizedCategory,
      normalizedMac,
      normalizedWin,
      ...normalizedKeywords
    ].join(" ");

    if (!terms.every((term) => normalizedTokens.includes(term))) {
      continue;
    }

    const matchedFields = new Set<string>();
    const matchedKeywords = new Set<string>();
    let score = 0;

    if (normalizedAction.includes(normalizedQuery)) {
      matchedFields.add("action");
      score += 6;
    }

    if (platform === "mac" && normalizedMac.includes(normalizedQuery)) {
      matchedFields.add("mac");
      score += 3;
    }

    if (platform === "win" && normalizedWin.includes(normalizedQuery)) {
      matchedFields.add("win");
      score += 3;
    }

    for (const term of terms) {
      if (normalizedAction.includes(term)) {
        matchedFields.add("action");
        score += 2;
      }
      if (normalizedMac.includes(term)) {
        matchedFields.add("mac");
        score += 1;
      }
      if (normalizedWin.includes(term)) {
        matchedFields.add("win");
        score += 1;
      }
      if (normalizedCategory.includes(term)) {
        matchedFields.add("category");
        score += 1;
      }
    }

    for (let index = 0; index < normalizedKeywords.length; index += 1) {
      const normalizedKeyword = normalizedKeywords[index];
      if (normalizedKeyword.includes(normalizedQuery)) {
        matchedFields.add("keyword");
        matchedKeywords.add(shortcut.keywords[index]);
        score += 3;
      }

      for (const term of terms) {
        if (normalizedKeyword.includes(term)) {
          matchedFields.add("keyword");
          matchedKeywords.add(shortcut.keywords[index]);
          score += 1;
        }
      }
    }

    if (!matchedFields.size) {
      matchedFields.add("context");
    }

    results.push({
      categoryId: shortcut.category,
      categoryName: categoryNameById.get(shortcut.category) ?? shortcut.category,
      action: shortcut.action,
      mac: shortcut.mac,
      win: shortcut.win,
      keywords: shortcut.keywords,
      score,
      matchedFields: Array.from(matchedFields),
      matchedKeywords: Array.from(matchedKeywords)
    });
  }

  results.sort((first, second) => {
    if (second.score !== first.score) {
      return second.score - first.score;
    }
    if (first.categoryName !== second.categoryName) {
      return first.categoryName.localeCompare(second.categoryName, "en");
    }
    return first.action.localeCompare(second.action, "en");
  });

  return results.slice(0, Math.max(1, limit));
};

const isUnavailable = (value: Shortcut["mac" | "win"]) => {
  const normalizedValue = normalize(value);
  return !normalizedValue || normalizedValue === "-" || normalizedValue === "n/a";
};
