import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Brain, Loader2, Star, TrendingUp, Users } from 'lucide-react';
import { useAI } from '@/hooks/useAI';
import { useNavigate } from 'react-router-dom';

interface SearchResult {
  id: string;
  title: string;
  content: string;
  result_type: 'post' | 'community' | 'user';
  author_name?: string;
  created_at: string;
  relevance_score: number;
  ai_relevance_score?: number;
  upvotes?: number;
  downvotes?: number;
  rank?: string;
  specialization?: string;
  institution?: string;
}

interface IntelligentSearchProps {
  initialQuery?: string;
  onResultSelect?: (result: SearchResult) => void;
  showFilters?: boolean;
}

const IntelligentSearch = ({ 
  initialQuery = '', 
  onResultSelect,
  showFilters = true 
}: IntelligentSearchProps) => {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const { loading, intelligentSearch } = useAI();
  const navigate = useNavigate();

  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  const handleSearch = async (searchQuery: string = query) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    const searchResults = await intelligentSearch(searchQuery, {
      contentType: activeTab === 'all' ? undefined : activeTab
    });
    
    setResults(searchResults);
  };

  const handleResultClick = (result: SearchResult) => {
    if (onResultSelect) {
      onResultSelect(result);
    }
    // Remove navigation for demo purposes
  };

  const getRelevanceColor = (score: number) => {
    if (score >= 0.8) return 'bg-green-100 text-green-800';
    if (score >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'General': return 'text-yellow-600 bg-yellow-100';
      case 'Captain': return 'text-blue-600 bg-blue-100';
      case 'Sergeant': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const filterResults = (type: string) => {
    if (type === 'all') return results;
    return results.filter(result => result.result_type === type);
  };

  const getResultCounts = () => {
    return {
      all: results.length,
      posts: results.filter(r => r.result_type === 'post').length,
      communities: results.filter(r => r.result_type === 'community').length,
      users: results.filter(r => r.result_type === 'user').length
    };
  };

  const counts = getResultCounts();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          AI-Powered Medical Search
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search with natural language (e.g., 'chest pain in elderly patients')"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10"
            />
          </div>
          <Button onClick={() => handleSearch()} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>

        {showFilters && results.length > 0 && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
              <TabsTrigger value="posts">Posts ({counts.posts})</TabsTrigger>
              <TabsTrigger value="communities">Communities ({counts.communities})</TabsTrigger>
              <TabsTrigger value="users">Users ({counts.users})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-3 mt-4">
              {filterResults(activeTab).map((result) => (
                <Card 
                  key={result.id} 
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg mb-1">{result.title}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {result.content.substring(0, 150)}...
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Badge className={getRelevanceColor(result.ai_relevance_score || result.relevance_score)}>
                            AI: {Math.round((result.ai_relevance_score || result.relevance_score) * 100)}%
                          </Badge>
                          <Badge variant="outline">
                            {result.result_type}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {result.result_type === 'post' && (
                          <>
                            {result.author_name && (
                              <div className="flex items-center gap-2">
                                <Avatar className="h-5 w-5">
                                  <AvatarFallback className="text-xs">
                                    {result.author_name[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <span>{result.author_name}</span>
                              </div>
                            )}
                            {(result.upvotes !== undefined || result.downvotes !== undefined) && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <TrendingUp className="h-3 w-3" />
                                  {(result.upvotes || 0) - (result.downvotes || 0)}
                                </span>
                              </>
                            )}
                          </>
                        )}

                        {result.result_type === 'user' && (
                          <>
                            {result.rank && (
                              <Badge className={`${getRankColor(result.rank)} flex items-center gap-1`}>
                                <Star className="h-3 w-3" />
                                {result.rank}
                              </Badge>
                            )}
                            {result.specialization && (
                              <>
                                <span>•</span>
                                <span>{result.specialization}</span>
                              </>
                            )}
                            {result.institution && (
                              <>
                                <span>•</span>
                                <span>{result.institution}</span>
                              </>
                            )}
                          </>
                        )}

                        {result.result_type === 'community' && (
                          <div className="flex items-center gap-2">
                            <Users className="h-3 w-3" />
                            <span>Medical Community</span>
                          </div>
                        )}

                        <span>•</span>
                        <span>{new Date(result.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        )}

        {!loading && results.length === 0 && query && (
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No results found for "{query}"</p>
            <p className="text-sm">Try different medical terms or be more specific</p>
          </div>
        )}

        {loading && (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              AI is analyzing your query and finding relevant medical content...
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default IntelligentSearch;