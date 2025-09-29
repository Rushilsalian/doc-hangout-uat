import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search as SearchIcon, Clock, TrendingUp, Users, MessageSquare, Star } from "lucide-react";
import { globalSearch, SearchFilters } from '@/api/search';
import { useAI } from '@/hooks/useAI';
import IntelligentSearch from '@/components/IntelligentSearch';

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState<any>({ posts: [], communities: [], users: [] });
  const [loading, setLoading] = useState(false);
  const [useAISearch, setUseAISearch] = useState(true);
  const [filters, setFilters] = useState<SearchFilters>({
    timeRange: 'all',
    sortBy: 'recent',
    category: 'all'
  });
  const { intelligentSearch } = useAI();

  const performSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      let searchResults;
      if (useAISearch) {
        const aiResults = await intelligentSearch(query, { contentType: 'all' });
        // Convert AI results to expected format
        searchResults = {
          posts: aiResults.filter(r => r.result_type === 'post'),
          communities: aiResults.filter(r => r.result_type === 'community'),
          users: aiResults.filter(r => r.result_type === 'user'),
          errors: { posts: null, communities: null, users: null }
        };
      } else {
        searchResults = await globalSearch(query, filters);
      }
      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
      setResults({ posts: [], communities: [], users: [] });
    } finally {
      setLoading(false);
    }
    
    setSearchParams({ q: query });
  };

  useEffect(() => {
    if (query) {
      performSearch();
    }
  }, [filters]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch();
  };

  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'General': return 'text-yellow-600 bg-yellow-100';
      case 'Captain': return 'text-blue-600 bg-blue-100';
      case 'Sergeant': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-8">
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 px-2 sm:px-4">
          {/* Search Form */}
          <Card>
            <CardContent className="p-4 sm:p-6">
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search posts, communities, and users..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                {/* Filters */}
                <div className="flex flex-wrap gap-2 sm:gap-4">
                  <Select value={filters.timeRange} onValueChange={(value: any) => setFilters(prev => ({ ...prev, timeRange: value }))}>
                    <SelectTrigger className="w-24 sm:w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="24h">Last 24h</SelectItem>
                      <SelectItem value="week">Last Week</SelectItem>
                      <SelectItem value="month">Last Month</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={filters.sortBy} onValueChange={(value: any) => setFilters(prev => ({ ...prev, sortBy: value }))}>
                    <SelectTrigger className="w-24 sm:w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Recent</SelectItem>
                      <SelectItem value="popular">Popular</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={filters.category} onValueChange={(value: any) => setFilters(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger className="w-32 sm:w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="exam">Exams</SelectItem>
                      <SelectItem value="second_opinion">Second Opinion</SelectItem>
                      <SelectItem value="non_medical">Non-Medical</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Searching...' : 'Search'}
                  </Button>
                </div>
                
                {/* AI Search Toggle */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="ai-search"
                    checked={useAISearch}
                    onChange={(e) => setUseAISearch(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="ai-search" className="text-sm font-medium flex items-center gap-1">
                    <Brain className="h-4 w-4 text-primary" />
                    AI-Powered Search
                  </label>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Results */}
          {query && (
            <Tabs defaultValue="posts" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="posts" className="text-xs sm:text-sm">Posts ({results.posts?.length || 0})</TabsTrigger>
                <TabsTrigger value="communities" className="text-xs sm:text-sm">Communities ({results.communities?.length || 0})</TabsTrigger>
                <TabsTrigger value="users" className="text-xs sm:text-sm">Users ({results.users?.length || 0})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="posts" className="space-y-4">
                {results.posts?.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <p className="text-muted-foreground">No posts found</p>
                    </CardContent>
                  </Card>
                ) : (
                  results.posts?.map((post: any) => (
                    <Card key={post.id}>
                      <CardContent className="p-4 sm:p-6">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <h3 className="text-lg font-semibold">{post.title}</h3>
                            <Badge variant="outline">{post.category}</Badge>
                          </div>
                          <p className="text-muted-foreground text-sm">{post.content.slice(0, 200)}...</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs">
                                  {post.author?.display_name?.[0] || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <span>{post.author?.display_name || 'Anonymous'}</span>
                            </div>
                            <span>•</span>
                            <span>{post.community?.name || 'General'}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              {post.upvotes - post.downvotes}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
              
              <TabsContent value="communities" className="space-y-4">
                {results.communities?.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <p className="text-muted-foreground">No communities found</p>
                    </CardContent>
                  </Card>
                ) : (
                  results.communities?.map((community: any) => (
                    <Card key={community.id}>
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                            <Users className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{community.name}</h3>
                            <p className="text-sm text-muted-foreground">{community.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
              
              <TabsContent value="users" className="space-y-4">
                {results.users?.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <p className="text-muted-foreground">No users found</p>
                    </CardContent>
                  </Card>
                ) : (
                  results.users?.map((user: any) => (
                    <Card key={user.id}>
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback>{user.display_name?.[0] || 'U'}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{user.display_name || 'Anonymous'}</h3>
                              <Badge className={`${getRankColor(user.rank)} flex items-center gap-1`}>
                                <Star className="h-3 w-3" />
                                {user.rank}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {user.specialization} • {user.institution}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
};

export default Search;