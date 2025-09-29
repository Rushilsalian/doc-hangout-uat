import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, LogIn, Brain, Sparkles, Search, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AIFeaturePreviewProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  demoContent?: React.ReactNode;
}

const AIFeaturePreview = ({ 
  title, 
  description, 
  icon, 
  features, 
  demoContent 
}: AIFeaturePreviewProps) => {
  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
      <CardHeader className="relative">
        <CardTitle className="flex items-center gap-3">
          {icon}
          {title}
          <Badge variant="secondary" className="ml-auto">
            <Lock className="h-3 w-3 mr-1" />
            Login Required
          </Badge>
        </CardTitle>
        <p className="text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="relative space-y-4">
        {/* Feature List */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Key Features:</h4>
          <ul className="space-y-1">
            {features.map((feature, index) => (
              <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Demo Content (Blurred) */}
        {demoContent && (
          <div className="relative">
            <div className="blur-sm pointer-events-none opacity-60">
              {demoContent}
            </div>
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
              <div className="text-center space-y-3">
                <Lock className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="text-sm font-medium">Sign in to access this feature</p>
                <Link to="/auth">
                  <Button size="sm">
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Call to Action */}
        <div className="pt-4 border-t">
          <Link to="/auth">
            <Button className="w-full">
              <LogIn className="h-4 w-4 mr-2" />
              Sign In to Try {title}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

// Pre-configured preview components
export const SmartSummaryPreview = () => (
  <AIFeaturePreview
    title="Smart Summaries"
    description="AI-powered summaries of complex medical discussions"
    icon={<Sparkles className="h-5 w-5 text-primary" />}
    features={[
      "Automatic content summarization",
      "Medical terminology focus",
      "Key points extraction",
      "Treatment recommendations highlight"
    ]}
    demoContent={
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-3 bg-gray-100 rounded w-full"></div>
        <div className="h-3 bg-gray-100 rounded w-5/6"></div>
        <div className="h-3 bg-gray-100 rounded w-2/3"></div>
      </div>
    }
  />
);

export const IntelligentSearchPreview = () => (
  <AIFeaturePreview
    title="Intelligent Search"
    description="Natural language search with medical context understanding"
    icon={<Search className="h-5 w-5 text-primary" />}
    features={[
      "Natural language queries",
      "Medical context understanding",
      "Relevance scoring",
      "Cross-specialty search"
    ]}
    demoContent={
      <div className="space-y-3">
        <div className="h-10 bg-gray-200 rounded"></div>
        <div className="space-y-2">
          <div className="h-16 bg-gray-100 rounded"></div>
          <div className="h-16 bg-gray-100 rounded"></div>
          <div className="h-16 bg-gray-100 rounded"></div>
        </div>
      </div>
    }
  />
);

export const ClinicalInsightsPreview = () => (
  <AIFeaturePreview
    title="Clinical Insights"
    description="Evidence-based treatment recommendations and drug interactions"
    icon={<Brain className="h-5 w-5 text-primary" />}
    features={[
      "Treatment recommendations",
      "Drug interaction alerts",
      "Evidence-based insights",
      "Clinical guidelines"
    ]}
    demoContent={
      <div className="space-y-3">
        <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        <div className="grid grid-cols-2 gap-2">
          <div className="h-6 bg-gray-100 rounded"></div>
          <div className="h-6 bg-gray-100 rounded"></div>
          <div className="h-6 bg-gray-100 rounded"></div>
          <div className="h-6 bg-gray-100 rounded"></div>
        </div>
        <div className="h-12 bg-amber-50 border border-amber-200 rounded"></div>
      </div>
    }
  />
);

export const TrendingAnalysisPreview = () => (
  <AIFeaturePreview
    title="Trending Analysis"
    description="Real-time analysis of trending medical topics and discussions"
    icon={<TrendingUp className="h-5 w-5 text-primary" />}
    features={[
      "Real-time topic analysis",
      "Sentiment tracking",
      "Growth rate monitoring",
      "Specialty-specific trends"
    ]}
    demoContent={
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
            </div>
            <div className="h-4 bg-gray-100 rounded w-8"></div>
          </div>
        ))}
      </div>
    }
  />
);

export default AIFeaturePreview;