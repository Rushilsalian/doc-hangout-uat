import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface SearchResult {
  result_type: 'post' | 'community' | 'user';
  id: string;
  title: string;
  content: string;
  author_name: string | null;
  created_at: string;
  relevance_score: number;
}

export const useSearch = () => {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastQuery, setLastQuery] = useState('');

  const search = async (
    query: string, 
    contentType: 'all' | 'posts' | 'communities' | 'users' = 'all'
  ) => {
    if (!query.trim()) {
      setResults([]);
      setLastQuery('');
      return;
    }

    try {
      setLoading(true);
      setLastQuery(query);

      const { data, error } = await supabase
        .rpc('search_content', {
          search_term: query.trim(),
          content_type: contentType
        });

      if (error) throw error;

      setResults((data || []) as SearchResult[]);
    } catch (error) {
      console.error('Error searching:', error);
      toast({
        title: "Search Error",
        description: "Failed to perform search",
        variant: "destructive"
      });
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setResults([]);
    setLastQuery('');
  };

  return {
    results,
    loading,
    lastQuery,
    search,
    clearResults
  };
};