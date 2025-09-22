import { useState } from 'react';
import { ChevronDown, ChevronUp, Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { SearchResult, highlightSearchTerms } from '@/lib/search';

interface ResultCardProps {
  result: SearchResult;
  query: string;
  isExpanded?: boolean;
  onToggleExpand: () => void;
}

export default function ResultCard({ 
  result, 
  query, 
  isExpanded = false, 
  onToggleExpand
}: ResultCardProps) {
  const { toast } = useToast();
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggleExpand = () => {
    setIsAnimating(true);
    onToggleExpand();
    
    // Update URL hash when expanding
    if (!isExpanded) {
      window.history.replaceState(
        null, 
        '', 
        `${window.location.pathname}${window.location.search}#article-${result.article}`
      );
    }
    
    setTimeout(() => setIsAnimating(false), 300);
  };

  const shareWebsite = async () => {
    const url = `${window.location.origin}${window.location.pathname}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'South Sudan Laws Finder',
          text: 'Find and search South Sudan laws and legal documents',
          url: url,
        });
      } else {
        // Fallback to copying to clipboard
        await navigator.clipboard.writeText(url);
        toast({
          title: "Website link copied",
          description: "Website link copied to clipboard",
        });
      }
    } catch (error) {
      console.error('Failed to share:', error);
      toast({
        title: "Failed to share",
        description: "Could not share website link",
        variant: "destructive",
      });
    }
  };

  const copyText = async () => {
    const text = `Article ${result.article}: ${result.title}\n\n${result.text}`;
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Text copied",
        description: "Article text copied to clipboard",
      });
    } catch (error) {
      console.error('Failed to copy text:', error);
      toast({
        title: "Failed to copy",
        description: "Could not copy text to clipboard",
        variant: "destructive",
      });
    }
  };


  const getSnippet = (text: string, maxLength: number = 200): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <Card 
      id={`article-${result.article}`}
      className={`group transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 cursor-pointer hover:border-primary/20 ${
        isAnimating ? 'scale-[0.99]' : ''
      } print-article`}
      onClick={handleToggleExpand}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 
              className="text-lg font-semibold leading-tight group-hover:text-primary transition-colors"
              dangerouslySetInnerHTML={{
                __html: `Article ${result.article} — ${highlightSearchTerms(result.title, query)}`
              }}
            />
            <p className="text-sm text-muted-foreground mt-1">
              {result.lawSource && <span className="font-medium text-blue-600">{result.lawSource}</span>}
              {result.lawSource && result.part && <span> • </span>}
              {result.part && <span className="font-medium">{result.part}</span>}
              {result.part && result.chapter && <span> • </span>}
              {result.chapter}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleToggleExpand();
            }}
            className="shrink-0 no-print"
            aria-label={isExpanded ? "Collapse article" : "Expand article"}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        {/* Tags */}
        {result.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {result.tags.map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {/* Snippet or Full Text */}
        <div 
          className={`prose prose-sm max-w-none transition-all duration-300 ${
            isExpanded ? 'line-clamp-none' : 'line-clamp-3'
          }`}
          dangerouslySetInnerHTML={{
            __html: highlightSearchTerms(
              isExpanded ? result.text : getSnippet(result.text),
              query
            )
          }}
        />

        {/* Action Buttons */}
        {isExpanded && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border no-print">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                copyText();
              }}
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy Text
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                shareWebsite();
              }}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Share Website
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}