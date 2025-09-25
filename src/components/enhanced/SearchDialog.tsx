import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, X } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useSearch } from '@/hooks/useSearch';
import { formatDistanceToNow } from 'date-fns';
import { cn } from "@/lib/utils";

interface SearchDialogProps {
  trigger?: React.ReactNode;
}

export const SearchDialog = ({ trigger }: SearchDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [contentType, setContentType] = useState<'all' | 'posts' | 'communities' | 'users'>('all');
  const { results, loading, search, clearResults } = useSearch();
  const navigate = useNavigate();

  useEffect(() => {
    if (query.trim()) {
      const timeoutId = setTimeout(() => {
        search(query, contentType);
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      clearResults();
    }
  }, [query, contentType, search, clearResults]);

  const handleResultClick = (result: any) => {
    setIsOpen(false);
    
    // Navigate based on result type
    if (result.result_type === 'post') {
      navigate(`/post/${result.id}`);
    } else if (result.result_type === 'community') {
      navigate(`/communities/${result.id}`);
    } else if (result.result_type === 'user') {
      navigate(`/profile/${result.id}`);
    }
  };

  const getResultTypeColor = (type: string) => {
    switch (type) {
      case 'post':
        return 'bg-blue-100 text-blue-800';
      case 'community':
        return 'bg-green-100 text-green-800';
      case 'user':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="gap-2">
      <Search className="h-4 w-4" />
      Search
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[80vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Search</DialogTitle>
        </DialogHeader>
        
        <div className="p-6 pt-4 space-y-4">
          {/* Search Input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search posts, communities, users..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10"
                autoFocus
              />
              {query && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuery('')}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            {/* Filter */}
            <Select value={contentType} onValueChange={(value: any) => setContentType(value)}>
              <SelectTrigger className="w-32">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="posts">Posts</SelectItem>
                <SelectItem value="communities">Communities</SelectItem>
                <SelectItem value="users">Users</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Results */}
          <ScrollArea className="h-96">
            {loading ? (
              <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                Searching...
              </div>
            ) : results.length === 0 ? (
              query.trim() ? (
                <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                  No results found for "{query}"
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                  Start typing to search
                </div>
              )
            ) : (
              <div className="space-y-2">
                {results.map((result) => (
                  <div
                    key={`${result.result_type}-${result.id}`}
                    className="p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50"
                    onClick={() => handleResultClick(result)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge 
                            variant="secondary" 
                            className={cn("text-xs", getResultTypeColor(result.result_type))}
                          >
                            {result.result_type}
                          </Badge>
                          {result.author_name && (
                            <span className="text-xs text-muted-foreground">
                              by {result.author_name}
                            </span>
                          )}
                        </div>
                        
                        <h4 className="font-medium text-sm line-clamp-1 mb-1">
                          {result.title}
                        </h4>
                        
                        {result.content && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                            {result.content}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>
                            {formatDistanceToNow(new Date(result.created_at))} ago
                          </span>
                          <span>•</span>
                          <span>
                            {Math.round(result.relevance_score * 100)}% match
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {results.length === 50 && (
                  <div className="text-center py-2 text-xs text-muted-foreground">
                    Showing first 50 results. Try refining your search for better results.
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};