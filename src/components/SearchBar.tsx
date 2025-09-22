import { useState, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface SearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  onSearch: (query: string) => void;
  onFilterChange: (filters: { tags?: string[]; part?: string; chapter?: string; lawSource?: string }) => void;
  isLoading?: boolean;
}

const QUICK_FILTERS = [
  { label: 'Bill of Rights', tag: 'bill of rights' },
  { label: 'Human Rights', tag: 'human rights' },
  { label: 'Citizenship', tag: 'citizenship' },
  { label: 'Government', tag: 'government' },
  { label: 'Executive', tag: 'executive' },
  { label: 'Legislature', tag: 'legislature' },
  { label: 'Judiciary', tag: 'judiciary' },
  { label: 'Freedom of Expression', tag: 'freedom of expression' },
  { label: 'Education', tag: 'education' },
  { label: 'Security', tag: 'security' }
];

const LAW_SOURCE_FILTERS = [
  { label: 'Constitution', lawSource: 'Laws of South Sudan' },
  { label: 'Penal Code', lawSource: 'Penal Code Act South Sudan 2008' }
];

export default function SearchBar({ 
  query, 
  onQueryChange, 
  onSearch, 
  onFilterChange,
  isLoading = false 
}: SearchBarProps) {
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [activeLawSource, setActiveLawSource] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
    }
  };

  const handleInputFocus = () => {
    // Position cursor at the end of the text when focusing (like Google)
    setTimeout(() => {
      if (inputRef.current) {
        const length = inputRef.current.value.length;
        inputRef.current.setSelectionRange(length, length);
        // Ensure the input is focused and cursor is visible
        inputRef.current.focus();
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle Escape key to clear search
    if (e.key === 'Escape') {
      clearQuery();
    }
    // Handle Ctrl+A to select all text
    if (e.key === 'a' && e.ctrlKey) {
      e.preventDefault();
      inputRef.current?.select();
    }
    // Handle Enter key to search (already handled by form submit)
    // Allow normal cursor movement and text editing
  };

  const handleInputClick = () => {
    // Select all text when clicking in the search bar (like Google)
    if (inputRef.current && inputRef.current.value) {
      inputRef.current.select();
    }
  };

  const handleFilterToggle = (tag: string) => {
    // Put the filter term in the search bar and perform search
    onQueryChange(tag);
    onSearch(tag);
    
    // Clear any existing filters since we're now searching by keyword
    setActiveFilters([]);
    setActiveLawSource('');
    onFilterChange({ tags: [], lawSource: undefined });
  };

  const handleLawSourceToggle = (lawSource: string) => {
    const newLawSource = activeLawSource === lawSource ? '' : lawSource;
    setActiveLawSource(newLawSource);
    onFilterChange({ tags: activeFilters, lawSource: newLawSource || undefined });
  };

  const clearQuery = () => {
    onQueryChange('');
    // Focus and position cursor at the beginning after clearing
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(0, 0);
      }
    }, 0);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Main Search */}
      <form onSubmit={handleSubmit} className="relative">
        <div 
          className="relative flex items-center"
          onClick={() => inputRef.current?.focus()}
        >
          <Search className="absolute left-4 h-5 w-5 text-muted-foreground z-10" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search law articles by keyword or number (e.g., 'freedom', 'Article 23', 'citizenship')"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyDown}
            onClick={handleInputClick}
            className="pl-12 pr-24 h-14 text-lg rounded-xl border-2 border-border focus:border-primary transition-colors bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-0"
            autoComplete="off"
            spellCheck="false"
          />
          {query && (
            <button
              type="button"
              onClick={clearQuery}
              className="absolute right-20 p-1 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
              title="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <Button
            type="submit"
            size="lg"
            className="absolute right-2 top-2 bottom-2 px-6 rounded-lg"
            disabled={isLoading}
          >
            Search
          </Button>
        </div>
      </form>

      {/* Quick Filter Tags */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-muted-foreground mr-2 py-2">Quick filters:</span>
        {QUICK_FILTERS.map((filter) => (
          <Badge
            key={filter.tag}
            variant={activeFilters.includes(filter.tag) ? "default" : "outline"}
            className="cursor-pointer transition-colors hover:bg-primary/10"
            onClick={() => handleFilterToggle(filter.tag)}
          >
            {filter.label}
          </Badge>
        ))}
        {(activeFilters.length > 0 || activeLawSource) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setActiveFilters([]);
              setActiveLawSource('');
              onFilterChange({ tags: [] });
            }}
            className="h-6 text-xs"
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Law Source Filters */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-muted-foreground mr-2 py-2">Law sources:</span>
        {LAW_SOURCE_FILTERS.map((filter) => (
          <Badge
            key={filter.lawSource}
            variant={activeLawSource === filter.lawSource ? "default" : "outline"}
            className="cursor-pointer transition-colors hover:bg-primary/10"
            onClick={() => handleLawSourceToggle(filter.lawSource)}
          >
            {filter.label}
          </Badge>
        ))}
      </div>
    </div>
  );
}