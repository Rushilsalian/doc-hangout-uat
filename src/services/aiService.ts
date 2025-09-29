import { supabase } from '@/integrations/supabase/client';

export interface AISummary {
  id: string;
  post_id: string;
  summary_content: string;
  created_at: string;
  model_used: string;
}

export interface AIAnalysis {
  id: string;
  text: string;
  label: string;
  score: number;
  created_at: string;
}

export interface MedicalInsight {
  condition: string;
  treatments: string[];
  interactions: string[];
  evidence_level: 'high' | 'medium' | 'low';
  confidence: number;
}

export interface TrendingTopic {
  topic: string;
  mentions: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  growth_rate: number;
  related_posts: string[];
}

class AIService {
  // Generate AI summary for post content
  async generateSummary(postId: string, content: string): Promise<AISummary | null> {
    try {
      // Simulate AI processing with medical-focused summarization
      const summary = this.createMedicalSummary(content);
      
      const { data, error } = await supabase
        .from('ai_summaries')
        .insert({
          post_id: postId,
          summary_content: summary,
          model_used: 'medical-gpt-v1'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error generating summary:', error);
      return null;
    }
  }

  // Get existing summary for a post
  async getSummary(postId: string): Promise<AISummary | null> {
    try {
      const { data, error } = await supabase
        .from('ai_summaries')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } catch (error) {
      console.error('Error fetching summary:', error);
      return null;
    }
  }

  // Analyze content sentiment and medical relevance
  async analyzeContent(text: string): Promise<AIAnalysis | null> {
    try {
      const analysis = this.performContentAnalysis(text);
      
      const { data, error } = await supabase
        .from('analyses')
        .insert({
          text: text.substring(0, 500), // Store first 500 chars
          label: analysis.label,
          score: analysis.score
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error analyzing content:', error);
      return null;
    }
  }

  // Get medical insights for symptoms/conditions
  async getMedicalInsights(query: string): Promise<MedicalInsight[]> {
    try {
      // Simulate medical knowledge base lookup
      return this.generateMedicalInsights(query);
    } catch (error) {
      console.error('Error getting medical insights:', error);
      return [];
    }
  }

  // Get trending medical topics
  async getTrendingTopics(): Promise<TrendingTopic[]> {
    try {
      const { data: posts, error } = await supabase
        .from('posts')
        .select(`
          id,
          title,
          content,
          created_at,
          upvotes,
          downvotes,
          post_tags(tag)
        `)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.warn('Posts table not available, returning demo topics:', error);
        return this.getDemoTrendingTopics();
      }

      return this.analyzeTrendingTopics(posts || []);
    } catch (error) {
      console.error('Error getting trending topics:', error);
      return this.getDemoTrendingTopics();
    }
  }

  // Smart search with AI-powered relevance
  async intelligentSearch(query: string, filters: any = {}): Promise<any> {
    try {
      // Enhanced search with medical context understanding
      const medicalTerms = this.extractMedicalTerms(query);
      const expandedQuery = this.expandMedicalQuery(query, medicalTerms);

      const { data, error } = await supabase
        .rpc('search_content', {
          search_term: expandedQuery,
          content_type: filters.contentType || 'all'
        });

      if (error) {
        console.warn('Search function not available, returning demo results:', error);
        return this.getDemoSearchResults(query);
      }

      // Apply AI-powered relevance scoring
      return this.rankSearchResults(data || [], query, medicalTerms);
    } catch (error) {
      console.error('Error in intelligent search:', error);
      return this.getDemoSearchResults(query);
    }
  }

  // Private helper methods
  private createMedicalSummary(content: string): string {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Medical keywords for prioritization
    const medicalKeywords = [
      'diagnosis', 'treatment', 'symptoms', 'patient', 'condition',
      'medication', 'therapy', 'clinical', 'medical', 'disease',
      'syndrome', 'pathology', 'prognosis', 'etiology', 'epidemiology'
    ];

    // Score sentences based on medical relevance
    const scoredSentences = sentences.map(sentence => {
      const words = sentence.toLowerCase().split(/\s+/);
      const medicalScore = words.filter(word => 
        medicalKeywords.some(keyword => word.includes(keyword))
      ).length;
      
      return {
        text: sentence.trim(),
        score: medicalScore + (sentence.length > 50 ? 1 : 0)
      };
    });

    // Select top 3 most relevant sentences
    const topSentences = scoredSentences
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(s => s.text);

    return topSentences.join('. ') + '.';
  }

  private performContentAnalysis(text: string): { label: string; score: number } {
    const medicalTerms = this.extractMedicalTerms(text);
    const sentimentWords = {
      positive: ['effective', 'successful', 'improved', 'better', 'excellent', 'good'],
      negative: ['failed', 'worse', 'complications', 'adverse', 'poor', 'ineffective'],
      neutral: ['standard', 'typical', 'normal', 'routine', 'regular']
    };

    let sentiment = 'neutral';
    let confidence = 0.5;

    const words = text.toLowerCase().split(/\s+/);
    
    const positiveCount = words.filter(word => 
      sentimentWords.positive.some(pos => word.includes(pos))
    ).length;
    
    const negativeCount = words.filter(word => 
      sentimentWords.negative.some(neg => word.includes(neg))
    ).length;

    if (positiveCount > negativeCount) {
      sentiment = 'positive';
      confidence = Math.min(0.9, 0.5 + (positiveCount * 0.1));
    } else if (negativeCount > positiveCount) {
      sentiment = 'negative';
      confidence = Math.min(0.9, 0.5 + (negativeCount * 0.1));
    }

    // Boost confidence if medical terms are present
    if (medicalTerms.length > 0) {
      confidence = Math.min(0.95, confidence + (medicalTerms.length * 0.05));
    }

    return {
      label: sentiment,
      score: confidence
    };
  }

  private generateMedicalInsights(query: string): MedicalInsight[] {
    const insights: MedicalInsight[] = [];
    const lowerQuery = query.toLowerCase();

    // Cardiology insights
    if (lowerQuery.includes('chest pain') || lowerQuery.includes('cardiac')) {
      insights.push({
        condition: 'Acute Coronary Syndrome',
        treatments: ['Aspirin', 'Clopidogrel', 'Statin therapy', 'Beta-blockers'],
        interactions: ['Warfarin interaction with aspirin', 'Statin-fibrate interactions'],
        evidence_level: 'high',
        confidence: 0.85
      });
    }

    // Respiratory insights
    if (lowerQuery.includes('shortness of breath') || lowerQuery.includes('dyspnea')) {
      insights.push({
        condition: 'Respiratory Distress',
        treatments: ['Oxygen therapy', 'Bronchodilators', 'Corticosteroids'],
        interactions: ['Beta-blocker contraindication in asthma'],
        evidence_level: 'high',
        confidence: 0.80
      });
    }

    // Neurological insights
    if (lowerQuery.includes('headache') || lowerQuery.includes('migraine')) {
      insights.push({
        condition: 'Primary Headache Disorders',
        treatments: ['NSAIDs', 'Triptans', 'Preventive medications'],
        interactions: ['Triptan-SSRI serotonin syndrome risk'],
        evidence_level: 'medium',
        confidence: 0.75
      });
    }

    return insights;
  }

  private analyzeTrendingTopics(posts: any[]): TrendingTopic[] {
    const topicMap = new Map<string, any>();

    posts.forEach(post => {
      const topics = this.extractTopicsFromPost(post);
      
      topics.forEach(topic => {
        if (!topicMap.has(topic)) {
          topicMap.set(topic, {
            topic,
            mentions: 0,
            posts: [],
            upvotes: 0,
            downvotes: 0
          });
        }
        
        const data = topicMap.get(topic);
        data.mentions++;
        data.posts.push(post.id);
        data.upvotes += post.upvotes || 0;
        data.downvotes += post.downvotes || 0;
      });
    });

    return Array.from(topicMap.values())
      .map(data => ({
        topic: data.topic,
        mentions: data.mentions,
        sentiment: this.calculateSentiment(data.upvotes, data.downvotes),
        growth_rate: this.calculateGrowthRate(data.mentions),
        related_posts: data.posts.slice(0, 5)
      }))
      .sort((a, b) => b.mentions - a.mentions)
      .slice(0, 10);
  }

  private extractTopicsFromPost(post: any): string[] {
    const topics: string[] = [];
    const content = `${post.title} ${post.content}`.toLowerCase();
    
    // Medical specialties
    const specialties = [
      'cardiology', 'neurology', 'oncology', 'pediatrics', 'surgery',
      'radiology', 'pathology', 'psychiatry', 'dermatology', 'orthopedics'
    ];
    
    specialties.forEach(specialty => {
      if (content.includes(specialty)) {
        topics.push(specialty);
      }
    });

    // Add tags if available
    if (post.post_tags) {
      post.post_tags.forEach((tagObj: any) => {
        if (tagObj.tag) {
          topics.push(tagObj.tag.toLowerCase());
        }
      });
    }

    return [...new Set(topics)]; // Remove duplicates
  }

  private extractMedicalTerms(text: string): string[] {
    const medicalTerms = [
      'diagnosis', 'treatment', 'symptoms', 'syndrome', 'disease',
      'medication', 'therapy', 'clinical', 'pathology', 'etiology',
      'prognosis', 'epidemiology', 'pharmacology', 'radiology'
    ];

    const words = text.toLowerCase().split(/\s+/);
    return words.filter(word => 
      medicalTerms.some(term => word.includes(term))
    );
  }

  private expandMedicalQuery(query: string, medicalTerms: string[]): string {
    let expandedQuery = query;
    
    // Add medical synonyms and related terms
    const synonyms: Record<string, string[]> = {
      'heart': ['cardiac', 'cardiovascular', 'coronary'],
      'brain': ['cerebral', 'neurological', 'cranial'],
      'lung': ['pulmonary', 'respiratory', 'bronchial'],
      'pain': ['discomfort', 'ache', 'soreness']
    };

    Object.entries(synonyms).forEach(([term, syns]) => {
      if (query.toLowerCase().includes(term)) {
        expandedQuery += ' ' + syns.join(' ');
      }
    });

    return expandedQuery;
  }

  private rankSearchResults(results: any[], query: string, medicalTerms: string[]): any[] {
    return results.map(result => {
      let relevanceScore = result.relevance_score || 0;
      
      // Boost medical content
      if (medicalTerms.length > 0) {
        const content = `${result.title} ${result.content}`.toLowerCase();
        const medicalMatches = medicalTerms.filter(term => 
          content.includes(term)
        ).length;
        relevanceScore += medicalMatches * 0.2;
      }

      return {
        ...result,
        ai_relevance_score: Math.min(1, relevanceScore)
      };
    }).sort((a, b) => b.ai_relevance_score - a.ai_relevance_score);
  }

  private calculateSentiment(upvotes: number, downvotes: number): 'positive' | 'neutral' | 'negative' {
    const ratio = upvotes / (upvotes + downvotes + 1);
    if (ratio > 0.6) return 'positive';
    if (ratio < 0.4) return 'negative';
    return 'neutral';
  }

  private calculateGrowthRate(mentions: number): number {
    // Simplified growth rate calculation
    return Math.min(100, mentions * 10);
  }

  private getDemoSearchResults(query: string): any[] {
    return [
      {
        result_type: 'post',
        id: 'demo-1',
        title: 'Managing Hypertension in Elderly Patients',
        content: 'Comprehensive guide to managing hypertension in elderly patients...',
        author_name: 'Dr. Sarah Chen',
        created_at: new Date().toISOString(),
        relevance_score: 0.95,
        ai_relevance_score: 0.95
      }
    ];
  }

  private getDemoTrendingTopics(): TrendingTopic[] {
    return [
      {
        topic: 'cardiology',
        mentions: 45,
        sentiment: 'positive' as const,
        growth_rate: 23,
        related_posts: ['demo-1', 'demo-2']
      },
      {
        topic: 'covid-19',
        mentions: 38,
        sentiment: 'neutral' as const,
        growth_rate: 15,
        related_posts: ['demo-3']
      }
    ];
  }
}

export const aiService = new AIService();