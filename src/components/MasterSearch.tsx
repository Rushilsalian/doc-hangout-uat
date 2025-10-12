import { useState, useRef, useEffect } from 'react';
import { Search, Users, MessageSquare, TrendingUp, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { globalSearch } from '@/api/search';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface SearchResult {
  posts: any[];
  communities: any[];
  users: any[];
}

const MasterSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult>({ posts: [], communities: [], users: [] });
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults({ posts: [], communities: [], users: [] });
      setShowResults(false);
      return;
    }

    setLoading(true);
    try {
      const searchResults = await globalSearch(searchQuery, { timeRange: 'all', sortBy: 'recent' });
      setResults({
        posts: searchResults.posts.slice(0, 3),
        communities: searchResults.communities.slice(0, 3),
        users: searchResults.users.slice(0, 3)
      });
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
      setResults({ posts: [], communities: [], users: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    if (value.trim()) {
      const timeoutId = setTimeout(() => performSearch(value), 300);
      return () => clearTimeout(timeoutId);
    } else {
      setShowResults(false);
    }
  };

  const handleResultClick = (type: 'post' | 'community' | 'user', id: string) => {
    setShowResults(false);
    setQuery('');
    
    switch (type) {
      case 'post':
        // Navigate to the main page with post highlighted or to communities page
        navigate(`/communities`);
        break;
      case 'community':
        navigate(`/communities`);
        break;
      case 'user':
        navigate(`/profile/${id}`);
        break;
    }
  };

  const handleViewAll = () => {
    setShowResults(false);
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const totalResults = results.posts.length + results.communities.length + results.users.length;

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search everything..."
          value={query}
          onChange={handleInputChange}
          className="pl-10 bg-white/90 backdrop-blur-sm border-ghibli-nature/20 focus:border-ghibli-nature"
        />
      </div>

      {showResults && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 max-h-96 overflow-y-auto shadow-lg">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Searching...
              </div>
            ) : totalResults === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No results found
              </div>
            ) : (
              <div className="space-y-1">
                {/* Posts */}
                {results.posts.length > 0 && (
                  <div>
                    <div className="px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/50 flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      Posts
                    </div>
                    {results.posts.map((post) => (
                      <div
                        key={post.id}
                        onClick={() => handleResultClick('post', post.id)}
                        className="px-3 py-2 hover:bg-muted/50 cursor-pointer border-b border-border/50"
                      >
                        <div className="font-medium text-sm truncate">{post.title}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <span>{post.author?.display_name || 'Anonymous'}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {post.upvotes - post.downvotes}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Communities */}
                {results.communities.length > 0 && (
                  <div>
                    <div className="px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/50 flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      Communities
                    </div>
                    {results.communities.map((community) => (
                      <div
                        key={community.id}
                        onClick={() => handleResultClick('community', community.id)}
                        className="px-3 py-2 hover:bg-muted/50 cursor-pointer border-b border-border/50"
                      >
                        <div className="font-medium text-sm">{community.name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {community.description}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Users */}
                {results.users.length > 0 && (
                  <div>
                    <div className="px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/50 flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      People
                    </div>
                    {results.users.map((user) => (
                      <div
                        key={user.id}
                        onClick={() => handleResultClick('user', user.id)}
                        className="px-3 py-2 hover:bg-muted/50 cursor-pointer border-b border-border/50"
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {user.display_name?.[0] || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <span className="font-medium text-sm truncate">
                                {user.display_name || 'Anonymous'}
                              </span>
                              {user.rank && (
                                <Badge variant="outline" className="text-xs px-1 py-0">
                                  <Star className="h-2 w-2 mr-1" />
                                  {user.rank}
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {user.specialization}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* View All Results */}
                <div
                  onClick={handleViewAll}
                  className="px-3 py-2 text-center text-sm text-primary hover:bg-muted/50 cursor-pointer font-medium border-t"
                >
                  View all results for "{query}"
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MasterSearch;