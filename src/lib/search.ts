import Fuse from 'fuse.js';

export interface LawArticle {
  article: number;
  title: string;
  chapter: string;
  part: string;
  text: string;
  tags: string[];
  lawSource?: string;
  articleNumberLabel?: string; // e.g., "Article 13"
}

export interface SearchResult extends LawArticle {
  score?: number;
  matches?: any[];
  matchType?: 'exact' | 'fuzzy';
}

export interface QueryMeta {
  originalQuery: string;
  normalizedQuery: string;
  isQuoted: boolean;
  isArticlePattern: boolean;
  articleNumber?: number;
  tokens: string[];
  regexPatterns: {
    wholeWord?: RegExp;
    articlePattern?: RegExp;
    articleStartPattern?: RegExp;
    quotedPhrase?: RegExp;
    andTerms?: RegExp;
  };
}

class LawSearch {
  private fuse: Fuse<LawArticle> | null = null;
  private articles: LawArticle[] = [];
  private normalizedCache = new Map<string, string>();

  private readonly fuseOptions = {
    keys: [
      { name: 'title', weight: 0.3 },
      { name: 'text', weight: 0.4 },
      { name: 'tags', weight: 0.2 },
      { name: 'chapter', weight: 0.05 },
      { name: 'part', weight: 0.05 },
    ],
    threshold: 0.2, // Lower threshold for fuzzy mode
    includeMatches: true,
    includeScore: true,
    minMatchCharLength: 2,
    findAllMatches: true,
  };

  async initialize() {
    try {
      const response = await fetch('/law.json');
      this.articles = await response.json();
      
      // Add articleNumberLabel for each article
      this.articles = this.articles.map(article => ({
        ...article,
        articleNumberLabel: `Article ${article.article}`
      }));
      
      this.fuse = new Fuse(this.articles, this.fuseOptions);
      return this.articles;
    } catch (error) {
      console.error('Failed to load law data:', error);
      return [];
    }
  }

  search(query: string, filters?: { chapter?: string; part?: string; tags?: string[]; lawSource?: string }, useFuzzy: boolean = false): SearchResult[] {
    console.log('Search called with query:', query, 'fuzzy:', useFuzzy, 'filters:', filters);
    
    if (!query.trim()) {
      // Show only first 4 articles when no search is performed
      console.log('No query, returning first 4 articles');
      return this.articles.slice(0, 4).map(article => ({ ...article }));
    }

    const cleanQuery = query.trim();
    if (!cleanQuery) {
      console.log('Empty query after trim, returning first 4 articles');
      return this.articles.slice(0, 4).map(article => ({ ...article }));
    }

    console.log('Processing query:', cleanQuery);

    // Use fuzzy search if explicitly requested
    if (useFuzzy && this.fuse) {
      console.log('Using fuzzy search');
      const fuseResults = this.fuse.search(cleanQuery);
      let results: SearchResult[] = fuseResults.map(result => ({
        ...result.item,
        score: result.score || 0,
        matches: result.matches ? [...result.matches] : [],
        matchType: 'fuzzy' as const
      }));

      // Apply filters to fuzzy results
      results = this.applyFilters(results, filters);
      console.log('Fuzzy search results:', results.length, 'articles');
      return results;
    }

    // Use exact search by default
    const queryMeta = this.buildQueryMeta(cleanQuery);
    console.log('Query meta:', queryMeta);

    const exactMatches: SearchResult[] = [];
    
    // Search through all articles for exact matches
    for (const article of this.articles) {
      const matchResult = this.matchItem(article, queryMeta);
      if (matchResult.matches) {
        const score = this.scoreMatch(article, queryMeta);
        exactMatches.push({
          ...article,
          score,
          matchType: 'exact' as const
        });
      }
    }
    
    // Sort exact matches by relevance
    let results = exactMatches.sort((a, b) => {
      // Higher score = better match
      return (b.score || 0) - (a.score || 0);
    });

    // Apply filters
    results = this.applyFilters(results, filters);

    console.log('Exact search results:', results.length, 'articles');
    return results;
  }

  buildQueryMeta(query: string): QueryMeta {
    const originalQuery = query;
    const normalizedQuery = this.normalize(query);
    
    // Check if query is quoted
    const isQuoted = query.startsWith('"') && query.endsWith('"');
    const unquotedQuery = isQuoted ? query.slice(1, -1) : query;
    const normalizedUnquoted = this.normalize(unquotedQuery);
    
    // Check if query matches article pattern
    const articleMatch = normalizedUnquoted.match(/^article\s*(\d+)$/i);
    const isArticlePattern = !!articleMatch;
    const articleNumber = articleMatch ? parseInt(articleMatch[1]) : undefined;
    
    // Extract tokens for multi-word queries
    const tokens = normalizedUnquoted.split(/\s+/).filter(token => token.length > 0);
    
    // Build regex patterns
    const regexPatterns: QueryMeta['regexPatterns'] = {};
    
    if (tokens.length === 1 && !isArticlePattern) {
      // Single token: whole word match
      const token = tokens[0];
      regexPatterns.wholeWord = new RegExp(`\\b${this.escapeRegex(token)}\\b`, 'i');
    } else if (isArticlePattern && articleNumber !== undefined) {
      // Article pattern: exact article number with lookahead
      regexPatterns.articlePattern = new RegExp(`\\barticle\\s*${articleNumber}(?=[^\\d]|$)`, 'i');
      regexPatterns.articleStartPattern = new RegExp(`^article\\s*${articleNumber}(?=[^\\d]|$)`, 'i');
    } else if (isQuoted) {
      // Quoted phrase: exact phrase match
      regexPatterns.quotedPhrase = new RegExp(this.escapeRegex(normalizedUnquoted), 'i');
    } else if (tokens.length > 1) {
      // Multi-word unquoted: AND of exact whole-word terms
      const andPatterns = tokens.map(token => `(?=.*\\b${this.escapeRegex(token)}\\b)`);
      regexPatterns.andTerms = new RegExp(andPatterns.join(''), 'i');
    }
    
    return {
      originalQuery,
      normalizedQuery: normalizedUnquoted,
      isQuoted,
      isArticlePattern,
      articleNumber,
      tokens,
      regexPatterns
    };
  }

  matchItem(article: LawArticle, queryMeta: QueryMeta): { matches: boolean; matchDetails?: any } {
    const { regexPatterns, isArticlePattern, articleNumber } = queryMeta;
    
    // Get normalized searchable text
    const searchableText = this.getNormalizedSearchableText(article);
    const normalizedTitle = this.normalize(article.title);
    const normalizedArticleLabel = this.normalize(article.articleNumberLabel || '');
    
    // Article pattern matching (highest priority)
    if (isArticlePattern && articleNumber !== undefined) {
      // Exact article number match
      if (article.article === articleNumber) {
        return { matches: true, matchDetails: { type: 'exactArticleNumber' } };
      }
      
      // Article pattern in title or text
      if (regexPatterns.articlePattern) {
        if (regexPatterns.articlePattern.test(normalizedTitle) || 
            regexPatterns.articlePattern.test(searchableText)) {
          return { matches: true, matchDetails: { type: 'articlePattern' } };
        }
      }
      
      return { matches: false };
    }
    
    // Quoted phrase matching
    if (regexPatterns.quotedPhrase) {
      if (regexPatterns.quotedPhrase.test(searchableText)) {
        return { matches: true, matchDetails: { type: 'quotedPhrase' } };
      }
      return { matches: false };
    }
    
    // Single token whole word matching
    if (regexPatterns.wholeWord) {
      if (regexPatterns.wholeWord.test(searchableText)) {
        return { matches: true, matchDetails: { type: 'wholeWord' } };
      }
      return { matches: false };
    }
    
    // Multi-word AND matching
    if (regexPatterns.andTerms) {
      if (regexPatterns.andTerms.test(searchableText)) {
        return { matches: true, matchDetails: { type: 'andTerms' } };
      }
      return { matches: false };
    }
    
    return { matches: false };
  }

  scoreMatch(article: LawArticle, queryMeta: QueryMeta): number {
    const { regexPatterns, isArticlePattern, articleNumber } = queryMeta;
    let score = 0;
    
    const searchableText = this.getNormalizedSearchableText(article);
    const normalizedTitle = this.normalize(article.title);
    const normalizedArticleLabel = this.normalize(article.articleNumberLabel || '');
    
    // Article pattern scoring (highest priority)
    if (isArticlePattern && articleNumber !== undefined) {
      // Exact article number match gets highest score
      if (article.article === articleNumber) {
        score += 1000;
      }
      
      // Title starts with article pattern
      if (regexPatterns.articleStartPattern && regexPatterns.articleStartPattern.test(normalizedTitle)) {
        score += 800;
      }
      
      // Article pattern in title
      if (regexPatterns.articlePattern && regexPatterns.articlePattern.test(normalizedTitle)) {
        score += 600;
      }
      
      // Article pattern in text
      if (regexPatterns.articlePattern && regexPatterns.articlePattern.test(searchableText)) {
        score += 400;
      }
      
      return score;
    }
    
    // Quoted phrase scoring
    if (regexPatterns.quotedPhrase) {
      // Title contains exact phrase
      if (regexPatterns.quotedPhrase.test(normalizedTitle)) {
        score += 500;
      }
      // Text contains exact phrase
      else if (regexPatterns.quotedPhrase.test(searchableText)) {
        score += 300;
      }
      return score;
    }
    
    // Single token scoring
    if (regexPatterns.wholeWord) {
      // Title contains whole word
      if (regexPatterns.wholeWord.test(normalizedTitle)) {
        score += 400;
      }
      // Text contains whole word
      else if (regexPatterns.wholeWord.test(searchableText)) {
        score += 200;
      }
      return score;
    }
    
    // Multi-word AND scoring
    if (regexPatterns.andTerms) {
      // All terms in title
      if (regexPatterns.andTerms.test(normalizedTitle)) {
        score += 300;
      }
      // All terms in text
      else if (regexPatterns.andTerms.test(searchableText)) {
        score += 150;
      }
      return score;
    }
    
    return score;
  }

  private normalize(text: string): string {
    if (this.normalizedCache.has(text)) {
      return this.normalizedCache.get(text)!;
    }
    
    const normalized = text
      .normalize('NFD') // Unicode normalization
      .replace(/\p{Diacritic}/gu, '') // Remove diacritics
      .toLowerCase()
      .replace(/\s+/g, ' ') // Collapse multiple spaces
      .trim();
    
    this.normalizedCache.set(text, normalized);
    return normalized;
  }

  private getNormalizedSearchableText(article: LawArticle): string {
    const searchableFields = [
      article.title,
      article.text,
      article.chapter,
      article.part,
      ...article.tags
    ].filter(Boolean);
    
    return this.normalize(searchableFields.join(' '));
  }

  private escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private applyFilters(results: SearchResult[], filters?: { chapter?: string; part?: string; tags?: string[]; lawSource?: string }): SearchResult[] {
    if (!filters) return results;

    let filteredResults = results;

    if (filters.chapter) {
      filteredResults = filteredResults.filter(result => 
        result.chapter.toLowerCase().includes(filters.chapter!.toLowerCase())
      );
    }

    if (filters.part) {
      filteredResults = filteredResults.filter(result => 
        result.part.toLowerCase().includes(filters.part!.toLowerCase())
      );
    }

    if (filters.tags && filters.tags.length > 0) {
      filteredResults = filteredResults.filter(result =>
        filters.tags!.some(tag => 
          result.tags.some(articleTag => 
            articleTag.toLowerCase().includes(tag.toLowerCase())
          )
        )
      );
    }

    if (filters.lawSource) {
      filteredResults = filteredResults.filter(result => 
        result.lawSource === filters.lawSource
      );
    }

    return filteredResults;
  }


  getArticleByNumber(articleNumber: number): LawArticle | undefined {
    return this.articles.find(article => article.article === articleNumber);
  }

  getAllArticles(): LawArticle[] {
    return this.articles;
  }

  clearSearchCache(): void {
    this.normalizedCache.clear();
  }

  getQuickFilters() {
    const tags = new Set<string>();
    const chapters = new Set<string>();
    const parts = new Set<string>();
    
    this.articles.forEach(article => {
      article.tags.forEach(tag => tags.add(tag));
      if (article.chapter) chapters.add(article.chapter);
      if (article.part) parts.add(article.part);
    });

    return {
      popularTags: ['rights', 'freedom', 'citizenship', 'justice', 'education', 'assembly', 'government', 'constitution'],
      allTags: Array.from(tags).sort(),
      chapters: Array.from(chapters).sort(),
      parts: Array.from(parts).sort(),
    };
  }
}

export const lawSearch = new LawSearch();

// Utility function to highlight search terms in text
export function highlightSearchTerms(text: string, query: string): string {
  if (!query.trim()) return text;
  
  let highlightedText = text;
  const exactQuery = query.trim();
  const queryMeta = lawSearch.buildQueryMeta(exactQuery);
  
  if (queryMeta.isArticlePattern && queryMeta.articleNumber !== undefined) {
    // Highlight article patterns
    const articleRegex = new RegExp(`\\b(article\\s*${queryMeta.articleNumber})(?=[^\\d]|$)`, 'gi');
    highlightedText = highlightedText.replace(articleRegex, '<mark class="exact-search">$1</mark>');
  } else if (queryMeta.isQuoted) {
    // Highlight quoted phrases
    const phraseRegex = new RegExp(`(${queryMeta.normalizedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    highlightedText = highlightedText.replace(phraseRegex, '<mark class="exact-search">$1</mark>');
  } else if (queryMeta.tokens.length === 1) {
    // Highlight single tokens as whole words
    const token = queryMeta.tokens[0];
    const wholeWordRegex = new RegExp(`\\b(${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b`, 'gi');
    highlightedText = highlightedText.replace(wholeWordRegex, '<mark class="exact-search">$1</mark>');
  } else {
    // Highlight multi-word terms
    queryMeta.tokens.forEach(token => {
      const wholeWordRegex = new RegExp(`(?<!<mark[^>]*>)\\b(${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b(?![^<]*</mark>)`, 'gi');
      highlightedText = highlightedText.replace(wholeWordRegex, '<mark class="exact-match">$1</mark>');
    });
  }
  
  return highlightedText;
}

// Local storage utilities for recent searches
export const searchHistory = {
  add(query: string) {
    if (!query.trim()) return;
    
    const history = this.get();
    const newHistory = [query, ...history.filter(q => q !== query)].slice(0, 5);
    localStorage.setItem('law-search-history', JSON.stringify(newHistory));
  },

  get(): string[] {
    try {
      return JSON.parse(localStorage.getItem('law-search-history') || '[]');
    } catch {
      return [];
    }
  },

  clear() {
    localStorage.removeItem('law-search-history');
  }
};