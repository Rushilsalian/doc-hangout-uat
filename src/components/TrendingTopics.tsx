import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Minus, RefreshCw, Loader2 } from 'lucide-react';
import { useAI } from '@/hooks/useAI';
import { TrendingTopic } from '@/services/aiService';
import { useNavigate } from 'react-router-dom';

interface TrendingTopicsProps {
  limit?: number;
  showGrowthRate?: boolean;
  onTopicClick?: (topic: string) => void;
}

const TrendingTopics = ({ 
  limit = 10, 
  showGrowthRate = true, 
  onTopicClick 
}: TrendingTopicsProps) => {
  const [topics, setTopics] = useState<TrendingTopic[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { loading, getTrendingTopics } = useAI();
  const navigate = useNavigate();

  useEffect(() => {
    loadTrendingTopics();
  }, []);

  const loadTrendingTopics = async () => {
    const trendingData = await getTrendingTopics();
    setTopics(trendingData.slice(0, limit));
    setLastUpdated(new Date());
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return <TrendingUp className="h-3 w-3 text-green-600" />;
      case 'negative':
        return <TrendingDown className="h-3 w-3 text-red-600" />;
      default:
        return <Minus className="h-3 w-3 text-gray-600" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'negative':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getGrowthColor = (growthRate: number) => {
    if (growthRate > 50) return 'text-green-600';
    if (growthRate > 20) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const handleTopicClick = (topic: string) => {
    if (onTopicClick) {
      onTopicClick(topic);
    } else {
      navigate(`/search?q=${encodeURIComponent(topic)}`);
    }
  };

  const formatLastUpdated = () => {
    if (!lastUpdated) return '';
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastUpdated.getTime()) / 1000 / 60);
    
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return lastUpdated.toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Trending Medical Topics
          </CardTitle>
          <Button
            size="sm"
            variant="ghost"
            onClick={loadTrendingTopics}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3" />
            )}
          </Button>
        </div>
        {lastUpdated && (
          <p className="text-xs text-muted-foreground">
            Updated {formatLastUpdated()}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {loading && topics.length === 0 ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-100 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {topics.map((topic, index) => (
              <div
                key={topic.topic}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => handleTopicClick(topic.topic)}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium capitalize">{topic.topic}</span>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getSentimentColor(topic.sentiment)}`}
                      >
                        {getSentimentIcon(topic.sentiment)}
                        {topic.sentiment}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{topic.mentions} mentions</span>
                      {showGrowthRate && (
                        <span className={getGrowthColor(topic.growth_rate)}>
                          +{topic.growth_rate}% growth
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">
                    {topic.mentions}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    posts
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && topics.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No trending topics found</p>
            <p className="text-sm">Check back later for medical trends</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TrendingTopics;