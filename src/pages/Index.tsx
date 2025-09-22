import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, FileText, AlertCircle } from 'lucide-react';
import SearchBar from '@/components/SearchBar';
import ResultCard from '@/components/ResultCard';
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
        performSearch(query);
      } else {
        // Show only first 4 articles when no search query
        setResults(articles.slice(0, 4).map(article => ({ ...article })));
      }
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [query, filters, articles]);

  useEffect(() => {
    return debouncedSearch;
  }, [debouncedSearch]);

  const performSearch = (searchQuery: string) => {
    setIsSearching(true);
    // Clear previous results immediately to show fresh search
    setResults([]);
    
    try {
      const searchResults = lawSearch.search(searchQuery, filters);
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
        <div className="container mx-auto px-4 py-16 lg:py-24">
          <div className="text-center space-y-6 mb-12">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-medium">
              <FileText className="h-4 w-4" />
              Republic of South Sudan
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold tracking-tight">
              South Sudan Laws Finder
            </h1>
            <p className="text-xl lg:text-2xl text-white/90 max-w-3xl mx-auto">
              Instant search across the Transitional Constitution of South Sudan. No login required.
            </p>
          </div>
          
          <SearchBar
            query={query}
            onQueryChange={setQuery}
            onSearch={handleSearch}
            onFilterChange={handleFilterChange}
            isLoading={isSearching}
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
                  {results.length} exact match{results.length !== 1 ? 'es' : ''} for "{query}"
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
                Our search looks for precise matches to ensure you find the most relevant legal information.
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
