import { useState, useCallback } from 'react';
import { aiService, AISummary, AIAnalysis, MedicalInsight, TrendingTopic } from '@/services/aiService';
import { toast } from '@/hooks/use-toast';

export const useAI = () => {
  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  const generateSummary = useCallback(async (postId: string, content: string): Promise<AISummary | null> => {
    setSummaryLoading(true);
    try {
      const summary = await aiService.generateSummary(postId, content);
      if (summary) {
        toast({
          title: "AI Summary Generated",
          description: "Content has been successfully summarized",
        });
      }
      return summary;
    } catch (error) {
      toast({
        title: "Summary Error",
        description: "Failed to generate AI summary",
        variant: "destructive"
      });
      return null;
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  const getSummary = useCallback(async (postId: string): Promise<AISummary | null> => {
    try {
      return await aiService.getSummary(postId);
    } catch (error) {
      console.error('Error fetching summary:', error);
      return null;
    }
  }, []);

  const analyzeContent = useCallback(async (text: string): Promise<AIAnalysis | null> => {
    setAnalysisLoading(true);
    try {
      const analysis = await aiService.analyzeContent(text);
      return analysis;
    } catch (error) {
      toast({
        title: "Analysis Error",
        description: "Failed to analyze content",
        variant: "destructive"
      });
      return null;
    } finally {
      setAnalysisLoading(false);
    }
  }, []);

  const getMedicalInsights = useCallback(async (query: string): Promise<MedicalInsight[]> => {
    setLoading(true);
    try {
      const insights = await aiService.getMedicalInsights(query);
      return insights;
    } catch (error) {
      toast({
        title: "Insights Error",
        description: "Failed to get medical insights",
        variant: "destructive"
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getTrendingTopics = useCallback(async (): Promise<TrendingTopic[]> => {
    setLoading(true);
    try {
      const topics = await aiService.getTrendingTopics();
      return topics;
    } catch (error) {
      toast({
        title: "Trending Error",
        description: "Failed to get trending topics",
        variant: "destructive"
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const intelligentSearch = useCallback(async (query: string, filters: any = {}): Promise<any[]> => {
    setLoading(true);
    try {
      const results = await aiService.intelligentSearch(query, filters);
      return results;
    } catch (error) {
      toast({
        title: "Search Error",
        description: "Failed to perform intelligent search",
        variant: "destructive"
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    summaryLoading,
    analysisLoading,
    generateSummary,
    getSummary,
    analyzeContent,
    getMedicalInsights,
    getTrendingTopics,
    intelligentSearch
  };
};