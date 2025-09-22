import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, FileText, AlertCircle } from 'lucide-react';
import SearchBar from '@/components/SearchBar';
import ResultCard from '@/components/ResultCard';
import { Badge } from '@/components/ui/badge';
import { lawSearch, SearchResult, LawArticle } from '@/lib/search';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [expandedArticles, setExpandedArticles] = useState<Set<number>>(new Set());
  const [filters, setFilters] = useState<{ tags?: string[]; part?: string; chapter?: string; lawSource?: string }>({});
  const [articles, setArticles] = useState<LawArticle[]>([]);
  const { toast } = useToast();

  // Initialize search and handle deep linking
  useEffect(() => {
    const initializeApp = async () => {
      try {
        const loadedArticles = await lawSearch.initialize();
        console.log('Loaded articles:', loadedArticles.length);
        setArticles(loadedArticles);
        
        // Always clear search on refresh - show only first 4 articles
        setQuery('');
        setResults(loadedArticles.slice(0, 4).map(article => ({ ...article })));
        setSearchParams({}); // Clear URL parameters

        // Handle deep linking to specific article
        const hash = window.location.hash;
        if (hash.startsWith('#article-')) {
          const articleNumber = parseInt(hash.replace('#article-', ''));
          if (articleNumber) {
            setExpandedArticles(new Set([articleNumber]));
            setTimeout(() => {
              document.getElementById(`article-${articleNumber}`)?.scrollIntoView({ 
                behavior: 'smooth',
                block: 'center'
              });
            }, 100);
          }
        }
      } catch (error) {
        console.error('Failed to initialize app:', error);
        toast({
          title: "Error loading law data",
          description: "Failed to load law data. Please refresh the page.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  // Debounced search
  const debouncedSearch = useMemo(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim()) {
        // Check if this is an article number search - if so, don't run debounced search
        const articleNumberMatch = query.trim().match(/(?:article|art\.?)\s*(\d+)|^(\d+)$/i);
        if (!articleNumberMatch) {
          performSearch(query);
        }
      } else {
        // Show only first 4 articles when no search query
        setResults(articles.slice(0, 4).map(article => ({ ...article })));
      }
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [query, articles]);

  useEffect(() => {
    return debouncedSearch;
  }, [debouncedSearch]);

  // Handle filter changes separately to avoid interfering with article number searches
  useEffect(() => {
    if (query.trim()) {
      // Check if this is an article number search - if so, don't re-run with filters
      const articleNumberMatch = query.trim().match(/(?:article|art\.?)\s*(\d+)|^(\d+)$/i);
      if (!articleNumberMatch) {
        performSearch(query);
      }
    }
  }, [filters]);

  const performSearch = (searchQuery: string) => {
    console.log('performSearch called with:', searchQuery);
    setIsSearching(true);
    // Clear previous results immediately to show fresh search
    setResults([]);
    
    try {
      const searchResults = lawSearch.search(searchQuery, filters, false); // Always use exact search
      console.log('Search results received:', searchResults.length, 'articles');
      setResults(searchResults);
      
      // Update URL without triggering a page reload
      if (searchQuery.trim()) {
        setSearchParams({ q: searchQuery });
      } else {
        setSearchParams({});
      }
    } catch (error) {
      console.error('Search failed:', error);
      toast({
        title: "Search failed",
        description: "An error occurred while searching. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    // Clear results immediately when user starts typing a new search
    if (searchQuery.trim() !== query.trim()) {
      setResults([]);
    }
    
    // For article number searches, perform search immediately
    const articleNumberMatch = searchQuery.trim().match(/(?:article|art\.?)\s*(\d+)|^(\d+)$/i);
    if (articleNumberMatch) {
      console.log('Immediate article search for:', searchQuery);
      performSearch(searchQuery);
    }
  };

  const handleToggleExpand = (articleNumber: number) => {
    const newExpanded = new Set(expandedArticles);
    if (newExpanded.has(articleNumber)) {
      newExpanded.delete(articleNumber);
    } else {
      newExpanded.add(articleNumber);
    }
    setExpandedArticles(newExpanded);
  };

  const handleFilterChange = (newFilters: { tags?: string[]; part?: string; chapter?: string }) => {
    setFilters(newFilters);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading Law Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-brand to-brand-light text-white">
        <div className="container mx-auto px-4 py-8 sm:py-12 md:py-16 lg:py-24 hero-mobile">
          <div className="text-center space-y-4 sm:space-y-6 mb-8 sm:mb-10 md:mb-12">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium">
              <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Republic of South Sudan</span>
              <span className="xs:hidden">South Sudan</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold tracking-tight leading-tight hero-title-mobile">
              South Sudan Laws Finder
            </h1>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-white/90 max-w-3xl mx-auto px-2 hero-subtitle-mobile text-mobile-safe">
              Instant search across the Transitional Constitution of South Sudan. No login required.
            </p>
          </div>
          
          <SearchBar
            query={query}
            onQueryChange={setQuery}
            onSearch={handleSearch}
            onFilterChange={handleFilterChange}
            isLoading={isSearching}
            resultCount={results.length}
          />
        </div>
      </div>

      {/* Results Section */}
      <div className="container mx-auto px-4 py-8">
        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-semibold">
              {query ? (
                <>
                  {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
                </>
              ) : (
                `First ${results.length} articles`
              )}
            </h2>
            {isSearching && (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            )}
          </div>
        </div>

        {/* Results List */}
        {results.length > 0 ? (
          <div className="space-y-4">
            {results.map((result) => (
              <ResultCard
                key={result.article}
                result={result}
                query={query}
                isExpanded={expandedArticles.has(result.article)}
                onToggleExpand={() => handleToggleExpand(result.article)}
              />
            ))}
          </div>
        ) : query.trim() ? (
          <div className="text-center py-12 space-y-6">
            <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto" />
            <div className="space-y-3">
              <h3 className="text-xl font-semibold">No exact matches found</h3>
              <p className="text-muted-foreground max-w-lg mx-auto">
                No articles found containing the exact keywords "{query}". 
                Try removing quotes or using different search terms.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-6 max-w-2xl mx-auto">
              <h4 className="font-medium mb-3">Search Tips:</h4>
              <ul className="text-sm text-muted-foreground space-y-2 text-left">
                <li>• Try searching for specific legal terms (e.g., "citizenship", "human rights")</li>
                <li>• Search by article number (e.g., "Article 25" or just "25")</li>
                <li>• Use exact keywords that appear in the law text</li>
                <li>• Check spelling and try alternative terms</li>
              </ul>
            </div>
          </div>
        ) : null}
      </div>

      {/* Footer */}
      <footer className="border-t border-border mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Transitional Constitution of the Republic of South Sudan, 2011 • Law Finder</p>
          <p className="mt-2">
            Built for easy access to constitutional articles and legal provisions
          </p>
          <div className="mt-4 pt-4 border-t border-border/50">
            <p className="font-medium text-foreground">Developed by Belednai Technology</p>
            <p className="mt-1 text-xs text-muted-foreground/80">
              This site is not sponsored by government, it was a voluntary work by Belednai Technology
            </p>
            <p className="mt-1">
              <a href="https://www.belednai.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                www.belednai.com
              </a>
            </p>
            <p className="mt-1">Call: 0928446544</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
