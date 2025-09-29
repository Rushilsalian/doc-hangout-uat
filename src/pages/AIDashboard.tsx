import { useState, useEffect } from 'react';
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Brain, Activity, TrendingUp, Sparkles, Zap, CheckCircle } from "lucide-react";
import AISummaryList from '@/components/AISummaryList';
import { useAI } from '@/hooks/useAI';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const AIDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalSummaries: 0,
    totalAnalyses: 0,
    avgConfidence: 0,
    topTopics: 0
  });

  const { loading } = useAI();

  useEffect(() => {
    loadRealStats();
  }, []);

  const loadRealStats = async () => {
    try {
      const { data: summaries } = await supabase
        .from('ai_summaries')
        .select('id');
      
      const { data: analyses } = await supabase
        .from('analyses')
        .select('score');
      
      const avgConfidence = analyses && analyses.length > 0 
        ? Math.round(analyses.reduce((sum, a) => sum + a.score, 0) / analyses.length * 100)
        : 0;
      
      setStats({
        totalSummaries: summaries?.length || 0,
        totalAnalyses: analyses?.length || 0,
        avgConfidence,
        topTopics: 0
      });
    } catch (error) {
      setStats({
        totalSummaries: 0,
        totalAnalyses: 0,
        avgConfidence: 0,
        topTopics: 0
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3 mb-4">
              <h1 className="text-4xl font-bold flex items-center gap-3">
                <Brain className="h-10 w-10 text-primary" />
                AI Medical Dashboard
              </h1>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Active
              </Badge>
            </div>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Welcome back, {user?.user_metadata?.display_name || user?.email}! 
              Access your comprehensive AI-powered medical tools and analytics.
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">AI Summaries</p>
                    <p className="text-3xl font-bold">{stats.totalSummaries.toLocaleString()}</p>
                  </div>
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Content Analyses</p>
                    <p className="text-3xl font-bold">{stats.totalAnalyses.toLocaleString()}</p>
                  </div>
                  <Activity className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg Confidence</p>
                    <p className="text-3xl font-bold">{stats.avgConfidence}%</p>
                  </div>
                  <Brain className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Trending Topics</p>
                    <p className="text-3xl font-bold">{stats.topTopics}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Summaries Dashboard */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold mb-2">AI Summary Dashboard</h2>
            <p className="text-muted-foreground">
              View and manage all AI-generated medical summaries
            </p>
          </div>
          <AISummaryList />
        </div>
      </div>
    </div>
  );
};

export default AIDashboard;