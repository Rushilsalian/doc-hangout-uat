import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, Info, Brain } from 'lucide-react';
import { useAI } from '@/hooks/useAI';
import { AIAnalysis } from '@/services/aiService';

interface ContentAnalyzerProps {
  content: string;
  onAnalysisComplete?: (analysis: AIAnalysis | null) => void;
  autoAnalyze?: boolean;
}

const ContentAnalyzer = ({ 
  content, 
  onAnalysisComplete, 
  autoAnalyze = true 
}: ContentAnalyzerProps) => {
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [medicalTermsCount, setMedicalTermsCount] = useState(0);
  const [readabilityScore, setReadabilityScore] = useState(0);
  const { analysisLoading, analyzeContent } = useAI();

  useEffect(() => {
    if (content.length > 50 && autoAnalyze) {
      performAnalysis();
    } else {
      setAnalysis(null);
      setMedicalTermsCount(0);
      setReadabilityScore(0);
    }
  }, [content, autoAnalyze]);

  const performAnalysis = async () => {
    if (!content.trim()) return;

    // Perform AI analysis
    const aiAnalysis = await analyzeContent(content);
    setAnalysis(aiAnalysis);
    
    // Calculate medical terms
    const medicalTerms = extractMedicalTerms(content);
    setMedicalTermsCount(medicalTerms.length);
    
    // Calculate readability
    const readability = calculateReadability(content);
    setReadabilityScore(readability);
    
    if (onAnalysisComplete) {
      onAnalysisComplete(aiAnalysis);
    }
  };

  const extractMedicalTerms = (text: string): string[] => {
    const medicalKeywords = [
      'diagnosis', 'treatment', 'symptoms', 'patient', 'condition',
      'medication', 'therapy', 'clinical', 'medical', 'disease',
      'syndrome', 'pathology', 'prognosis', 'etiology', 'epidemiology',
      'pharmacology', 'radiology', 'cardiology', 'neurology', 'oncology',
      'pediatrics', 'surgery', 'anesthesia', 'emergency', 'intensive',
      'acute', 'chronic', 'benign', 'malignant', 'inflammatory'
    ];

    const words = text.toLowerCase().split(/\s+/);
    return words.filter(word => 
      medicalKeywords.some(keyword => word.includes(keyword))
    );
  };

  const calculateReadability = (text: string): number => {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const syllables = words.reduce((count, word) => {
      return count + countSyllables(word);
    }, 0);

    if (sentences.length === 0 || words.length === 0) return 0;

    // Simplified Flesch Reading Ease Score
    const avgWordsPerSentence = words.length / sentences.length;
    const avgSyllablesPerWord = syllables / words.length;
    
    const score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
    return Math.max(0, Math.min(100, score));
  };

  const countSyllables = (word: string): number => {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    
    const vowels = 'aeiouy';
    let syllableCount = 0;
    let previousWasVowel = false;
    
    for (let i = 0; i < word.length; i++) {
      const isVowel = vowels.includes(word[i]);
      if (isVowel && !previousWasVowel) {
        syllableCount++;
      }
      previousWasVowel = isVowel;
    }
    
    // Handle silent 'e'
    if (word.endsWith('e')) {
      syllableCount--;
    }
    
    return Math.max(1, syllableCount);
  };

  const getSentimentIcon = (label: string) => {
    switch (label) {
      case 'positive':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'negative':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const getSentimentColor = (label: string) => {
    switch (label) {
      case 'positive':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'negative':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getReadabilityLevel = (score: number) => {
    if (score >= 90) return { level: 'Very Easy', color: 'text-green-600' };
    if (score >= 80) return { level: 'Easy', color: 'text-green-500' };
    if (score >= 70) return { level: 'Fairly Easy', color: 'text-yellow-600' };
    if (score >= 60) return { level: 'Standard', color: 'text-orange-600' };
    if (score >= 50) return { level: 'Fairly Difficult', color: 'text-red-500' };
    if (score >= 30) return { level: 'Difficult', color: 'text-red-600' };
    return { level: 'Very Difficult', color: 'text-red-700' };
  };

  if (!content || content.length < 50) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-4 text-center text-sm text-muted-foreground">
          <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Start typing to see AI content analysis...</p>
        </CardContent>
      </Card>
    );
  }

  if (analysisLoading) {
    return (
      <Card>
        <CardContent className="p-4 text-center">
          <Brain className="h-8 w-8 mx-auto mb-2 animate-pulse text-primary" />
          <p className="text-sm text-muted-foreground">Analyzing content...</p>
        </CardContent>
      </Card>
    );
  }

  const readabilityInfo = getReadabilityLevel(readabilityScore);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Brain className="h-4 w-4 text-primary" />
          Content Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sentiment Analysis */}
        {analysis && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Sentiment:</span>
            <Badge className={`${getSentimentColor(analysis.label)} flex items-center gap-1`}>
              {getSentimentIcon(analysis.label)}
              {analysis.label} ({Math.round(analysis.score * 100)}%)
            </Badge>
          </div>
        )}

        {/* Medical Content */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Medical Terms:</span>
          <Badge variant="outline" className="text-xs">
            {medicalTermsCount} found
          </Badge>
        </div>

        {/* Readability Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Readability:</span>
            <span className={`text-sm font-medium ${readabilityInfo.color}`}>
              {readabilityInfo.level}
            </span>
          </div>
          <Progress value={readabilityScore} className="h-2" />
          <p className="text-xs text-muted-foreground">
            Score: {Math.round(readabilityScore)}/100
          </p>
        </div>

        {/* Content Stats */}
        <div className="grid grid-cols-3 gap-4 pt-2 border-t">
          <div className="text-center">
            <div className="text-lg font-semibold">{content.split(/\s+/).length}</div>
            <div className="text-xs text-muted-foreground">Words</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold">
              {content.split(/[.!?]+/).filter(s => s.trim().length > 0).length}
            </div>
            <div className="text-xs text-muted-foreground">Sentences</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold">{content.length}</div>
            <div className="text-xs text-muted-foreground">Characters</div>
          </div>
        </div>

        {/* Recommendations */}
        {medicalTermsCount > 0 && readabilityScore < 50 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800">Readability Suggestion</p>
                <p className="text-amber-700">
                  Consider simplifying complex medical terms for broader understanding.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ContentAnalyzer;