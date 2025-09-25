import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Sparkles, Search, TrendingUp } from "lucide-react";

const AIFeatures = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center">AI-Powered Features</h1>
          
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Smart Summaries
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  AI automatically generates concise summaries of complex medical discussions, 
                  highlighting key points and treatment recommendations.
                </p>
                <Button variant="outline" size="sm" onClick={() => window.open('/collaborate', '_blank')}>Try Now</Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-primary" />
                  Intelligent Search
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Find relevant cases and discussions using natural language queries. 
                  Search by symptoms, conditions, or treatment approaches.
                </p>
                <Button variant="outline" size="sm" onClick={() => window.open('/search', '_blank')}>Search Cases</Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  Clinical Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Get AI-powered insights on treatment patterns, drug interactions, 
                  and evidence-based recommendations from medical literature.
                </p>
                <Button variant="outline" size="sm" onClick={() => window.open('/leaderboard', '_blank')}>View Insights</Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Trending Topics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Stay updated with trending medical topics and emerging discussions 
                  across all specialty communities.
                </p>
                <Button variant="outline" size="sm" onClick={() => window.open('/', '_blank')}>See Trends</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIFeatures;