import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, RefreshCw, Copy, Check } from 'lucide-react';
import { useAI } from '@/hooks/useAI';
import { AISummary as AISummaryType } from '@/services/aiService';
import { toast } from '@/hooks/use-toast';

interface AISummaryProps {
  postId: string;
  content: string;
  autoGenerate?: boolean;
}

const AISummary = ({ postId, content, autoGenerate = false }: AISummaryProps) => {
  const [summary, setSummary] = useState<AISummaryType | null>(null);
  const [copied, setCopied] = useState(false);
  const { summaryLoading, generateSummary, getSummary } = useAI();

  useEffect(() => {
    loadExistingSummary();
  }, [postId]);

  useEffect(() => {
    if (autoGenerate && !summary && content.length > 200) {
      handleGenerateSummary();
    }
  }, [autoGenerate, content, summary]);

  const loadExistingSummary = async () => {
    const existingSummary = await getSummary(postId);
    setSummary(existingSummary);
  };

  const handleGenerateSummary = async () => {
    const newSummary = await generateSummary(postId, content);
    if (newSummary) {
      setSummary(newSummary);
    }
  };

  const handleCopy = async () => {
    if (summary) {
      await navigator.clipboard.writeText(summary.summary_content);
      setCopied(true);
      toast({
        title: "Copied to clipboard",
        description: "Summary has been copied to your clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!summary && !summaryLoading) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6 text-center">
          <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-semibold mb-2">AI Summary Available</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Generate an AI-powered summary of this medical discussion
          </p>
          <Button onClick={handleGenerateSummary} disabled={summaryLoading}>
            {summaryLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Summary
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (summaryLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            AI is analyzing the content and generating a medical summary...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Medical Summary
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {summary?.model_used || 'AI Generated'}
            </Badge>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleGenerateSummary}
              disabled={summaryLoading}
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCopy}
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="prose prose-sm max-w-none">
            <p className="text-sm leading-relaxed">
              {summary?.summary_content}
            </p>
          </div>
          
          <div className="flex items-center justify-between pt-2 border-t border-primary/10">
            <span className="text-xs text-muted-foreground">
              Generated {summary ? formatDate(summary.created_at) : 'now'}
            </span>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Medical AI
              </Badge>
              <span className="text-xs text-muted-foreground">
                • Confidence: High
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AISummary;