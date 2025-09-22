import Fuse from 'fuse.js';

export interface LawArticle {
  article: number;
  title: string;
  chapter: string;
  part: string;
  text: string;
  tags: string[];
  lawSource?: string;
}

export interface SearchResult extends LawArticle {
  score?: number;
  matches?: any[];
}

class LawSearch {
  private fuse: Fuse<LawArticle> | null = null;
  private articles: LawArticle[] = [];

  private readonly fuseOptions = {
    keys: [
      { name: 'title', weight: 0.3 },
      { name: 'text', weight: 0.4 },
      { name: 'tags', weight: 0.2 },
      { name: 'chapter', weight: 0.05 },
      { name: 'part', weight: 0.05 },
    ],
    threshold: 0.4,
    includeMatches: true,
    includeScore: true,
    minMatchCharLength: 2,
    findAllMatches: true,
  };

  async initialize() {
    try {
      const response = await fetch('/law.json');
      this.articles = await response.json();
      this.fuse = new Fuse(this.articles, this.fuseOptions);
      return this.articles;
    } catch (error) {
      console.error('Failed to load law data:', error);
      return [];
    }
  }

  search(query: string, filters?: { chapter?: string; part?: string; tags?: string[]; lawSource?: string }): SearchResult[] {
    if (!this.fuse || !query.trim()) {
      // Show only first 4 articles when no search is performed
      return this.articles.slice(0, 4).map(article => ({ ...article }));
    }

    // Clean and normalize the search query
    const cleanQuery = query.trim();
    if (!cleanQuery) {
      return this.articles.slice(0, 4).map(article => ({ ...article }));
    }

    // Handle article number searches (e.g., "23", "Article 23", "Art 23")
    const articleNumberMatch = cleanQuery.match(/(?:article|art\.?)\s*(\d+)|^(\d+)$/i);
    if (articleNumberMatch) {
      const articleNum = parseInt(articleNumberMatch[1] || articleNumberMatch[2]);
      const exactArticle = this.articles.find(article => article.article === articleNum);
      
      if (exactArticle) {
        // Return only the exact article match
        return [{ ...exactArticle, score: 0 }];
      } else {
        // Return empty array if article number not found
        return [];
      }
    }

    // Find exact keyword matches only
    const exactMatches: SearchResult[] = [];
    
    // Search through all articles for exact matches
    for (const article of this.articles) {
      if (this.hasExactSearchTerm(article, cleanQuery)) {
        exactMatches.push({
          ...article,
          score: 0,
          matches: undefined,
        });
      }
    }
    
    // Sort exact matches by relevance (title matches first, then by article number)
    let results = exactMatches.sort((a, b) => {
      // Prioritize matches in title
      const aTitleMatch = a.title.toLowerCase().includes(cleanQuery.toLowerCase());
      const bTitleMatch = b.title.toLowerCase().includes(cleanQuery.toLowerCase());
      
      if (aTitleMatch && !bTitleMatch) return -1;
      if (!aTitleMatch && bTitleMatch) return 1;
      
      // If both or neither have title matches, sort by article number
      return a.article - b.article;
    });

    // Apply filters
    if (filters?.chapter) {
      results = results.filter(result => 
        result.chapter.toLowerCase().includes(filters.chapter!.toLowerCase())
      );
    }

    if (filters?.part) {
      results = results.filter(result => 
        result.part.toLowerCase().includes(filters.part!.toLowerCase())
      );
    }

    if (filters?.tags && filters.tags.length > 0) {
      results = results.filter(result =>
        filters.tags!.some(tag => 
          result.tags.some(articleTag => 
            articleTag.toLowerCase().includes(tag.toLowerCase())
          )
        )
      );
    }

    if (filters?.lawSource) {
      results = results.filter(result => 
        result.lawSource === filters.lawSource
      );
    }

    return results;
  }

  private hasExactSearchTerm(article: LawArticle, exactQuery: string): boolean {
    // Create searchable text from all relevant fields
    const searchableText = `${article.title} ${article.text} ${article.tags.join(' ')} ${article.chapter} ${article.part}`.toLowerCase();
    
    // Clean and normalize the query
    const normalizedQuery = exactQuery.toLowerCase().trim();
    if (!normalizedQuery) return false;
    
    // Split query into words, filtering out empty strings
    const queryWords = normalizedQuery.split(/\s+/).filter(word => word.length > 0);
    
    if (queryWords.length === 1) {
      // Single word: must be exact word match with word boundaries
      const word = queryWords[0];
      const exactWordRegex = new RegExp(`\\b${this.escapeRegex(word)}\\b`, 'gi');
      return exactWordRegex.test(searchableText);
    } else {
      // Multi-word queries: prioritize exact phrase matches
      
      // First, check for exact phrase match (most important)
      if (searchableText.includes(normalizedQuery)) {
        return true;
      }
      
      // Second, check if all words appear as exact word matches in the same order
      // This helps find related concepts that appear together
      const allWordsPresent = queryWords.every(word => {
        const exactWordRegex = new RegExp(`\\b${this.escapeRegex(word)}\\b`, 'gi');
        return exactWordRegex.test(searchableText);
      });
      
      if (allWordsPresent) {
        // Additional check: ensure words appear in reasonable proximity
        // This prevents matches where words are scattered across the entire text
        return this.wordsInProximity(searchableText, queryWords);
      }
      
      return false;
    }
  }

  private escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private wordsInProximity(text: string, words: string[]): boolean {
    // Find positions of all words
    const wordPositions: number[] = [];
    
    for (const word of words) {
      const regex = new RegExp(`\\b${this.escapeRegex(word)}\\b`, 'gi');
      let match;
      while ((match = regex.exec(text)) !== null) {
        wordPositions.push(match.index);
      }
    }
    
    if (wordPositions.length < words.length) {
      return false; // Not all words found
    }
    
    // Sort positions
    wordPositions.sort((a, b) => a - b);
    
    // Check if words appear within a reasonable distance (500 characters)
    // This allows for some flexibility while maintaining relevance
    const maxDistance = 500;
    
    for (let i = 0; i < wordPositions.length - 1; i++) {
      if (wordPositions[i + 1] - wordPositions[i] > maxDistance) {
        return false;
      }
    }
    
    return true;
  }

  private calculateWordMatchScore(article: LawArticle, searchTerms: string[]): number {
    let score = 0;
    const text = `${article.title} ${article.text} ${article.tags.join(' ')}`.toLowerCase();
    
    searchTerms.forEach(term => {
      // Exact word match (highest priority)
      const exactWordRegex = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      const exactMatches = (text.match(exactWordRegex) || []).length;
      score += exactMatches * 10; // High weight for exact word matches
      
      // Partial word match (lower priority)
      const partialMatches = (text.match(new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length;
      score += (partialMatches - exactMatches) * 2; // Lower weight for partial matches
      
      // Title matches get extra points
      if (article.title.toLowerCase().includes(term)) {
        score += 5;
      }
      
      // Tag matches get extra points
      if (article.tags.some(tag => tag.toLowerCase().includes(term))) {
        score += 3;
      }
    });
    
    return score;
  }

  getArticleByNumber(articleNumber: number): LawArticle | undefined {
    return this.articles.find(article => article.article === articleNumber);
  }

  getAllArticles(): LawArticle[] {
    return this.articles;
  }

  // Clear any cached search state (if needed in the future)
  clearSearchCache(): void {
    // Currently no caching, but this method is here for future use
    // if we implement search result caching
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
  const queryWords = exactQuery.split(/\s+/).filter(word => word.length > 0);
  
  if (queryWords.length === 1) {
    // Single word: highlight only exact word boundary matches
    const exactWordRegex = new RegExp(`\\b(${queryWords[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b`, 'gi');
    highlightedText = highlightedText.replace(exactWordRegex, '<mark class="exact-match">$1</mark>');
  } else {
    // Multi-word: first try exact phrase match
    const exactPhraseRegex = new RegExp(`(${exactQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    highlightedText = highlightedText.replace(exactPhraseRegex, '<mark class="exact-search">$1</mark>');
    
    // If no exact phrase found, highlight individual exact word matches
    if (!highlightedText.includes('<mark class="exact-search">')) {
      queryWords.forEach(term => {
        const exactWordRegex = new RegExp(`(?<!<mark[^>]*>)\\b(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b(?![^<]*</mark>)`, 'gi');
        highlightedText = highlightedText.replace(exactWordRegex, '<mark class="exact-match">$1</mark>');
      });
    }
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