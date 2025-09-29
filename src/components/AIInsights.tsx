import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Brain, AlertTriangle, CheckCircle, Search } from 'lucide-react';
import { useAI } from '@/hooks/useAI';
import { MedicalInsight } from '@/services/aiService';

interface AIInsightsProps {
  query?: string;
  onInsightSelect?: (insight: MedicalInsight) => void;
}

const AIInsights = ({ query: initialQuery = '', onInsightSelect }: AIInsightsProps) => {
  const [query, setQuery] = useState(initialQuery);
  const [insights, setInsights] = useState<MedicalInsight[]>([]);
  const { loading, getMedicalInsights } = useAI();

  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  const handleSearch = async (searchQuery: string = query) => {
    if (!searchQuery.trim()) return;
    
    const results = await getMedicalInsights(searchQuery);
    setInsights(results);
  };

  const getEvidenceColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.8) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (confidence >= 0.6) return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    return <AlertTriangle className="h-4 w-4 text-red-600" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          Clinical AI Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Enter symptoms, conditions, or treatments..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={() => handleSearch()} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>

        {insights.length > 0 && (
          <div className="space-y-3">
            {insights.map((insight, index) => (
              <Card key={index} className="border-l-4 border-l-primary">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-lg">{insight.condition}</h4>
                      <div className="flex items-center gap-2">
                        {getConfidenceIcon(insight.confidence)}
                        <Badge className={getEvidenceColor(insight.evidence_level)}>
                          {insight.evidence_level} evidence
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <h5 className="font-medium text-sm text-muted-foreground mb-2">Recommended Treatments:</h5>
                      <div className="flex flex-wrap gap-1">
                        {insight.treatments.map((treatment, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {treatment}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {insight.interactions.length > 0 && (
                      <div>
                        <h5 className="font-medium text-sm text-muted-foreground mb-2">Drug Interactions:</h5>
                        <div className="space-y-1">
                          {insight.interactions.map((interaction, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              <AlertTriangle className="h-3 w-3 text-amber-500" />
                              <span className="text-amber-700">{interaction}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-muted-foreground">
                        Confidence: {Math.round(insight.confidence * 100)}%
                      </span>
                      {onInsightSelect && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => onInsightSelect(insight)}
                        >
                          Use Insight
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && insights.length === 0 && query && (
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No clinical insights found for "{query}"</p>
            <p className="text-sm">Try different medical terms or conditions</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIInsights;