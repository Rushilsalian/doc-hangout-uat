import { useState } from 'react';
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Sparkles, Search, TrendingUp, Zap, Activity, Lock, LogIn } from "lucide-react";
import AIInsights from '@/components/AIInsights';
import AISummary from '@/components/AISummary';
import TrendingTopics from '@/components/TrendingTopics';
import IntelligentSearch from '@/components/IntelligentSearch';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';
import { SmartSummaryDemo, ClinicalInsightsDemo, IntelligentSearchDemo, TrendingAnalysisDemo } from '@/components/AIFeatureDemo';
import ghibliMedicalBg from '@/assets/ghibli-medical-bg.jpg';

const AIFeatures = () => {
  const { user } = useAuth();
  const [activeDemo, setActiveDemo] = useState<string | null>(null);

  const demoContent = {
    summary: {
      postId: 'demo-post-1',
      content: `A 65-year-old male patient presents with acute chest pain radiating to the left arm, accompanied by shortness of breath and diaphoresis. ECG shows ST-elevation in leads II, III, and aVF, suggesting an inferior wall myocardial infarction. Initial troponin levels are elevated at 15.2 ng/mL. The patient has a history of hypertension and diabetes mellitus type 2. Current medications include metformin 1000mg BID and lisinopril 10mg daily. Blood pressure on admission is 160/95 mmHg, heart rate 110 bpm. The patient was immediately started on dual antiplatelet therapy with aspirin 325mg and clopidogrel 600mg loading dose, followed by atorvastatin 80mg daily. Emergency cardiac catheterization revealed 95% occlusion of the right coronary artery, which was successfully treated with percutaneous coronary intervention and drug-eluting stent placement. Post-procedure, the patient was stable with resolution of chest pain and normalization of ST-segments on follow-up ECG.`
    }
  };

  return (
    <div className="min-h-screen bg-background relative">
      <div className="absolute inset-0 opacity-5">
        <img src={ghibliMedicalBg} alt="" className="w-full h-full object-cover" />
      </div>
      <Header />
      <div className="container py-8 relative z-10">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header Section */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold">AI-Powered Medical Features</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Experience cutting-edge AI technology designed specifically for healthcare professionals. 
              Get intelligent insights, automated summaries, and enhanced search capabilities.
            </p>
          </div>

          {/* Feature Overview Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-primary/20 hover:border-primary/40 transition-colors">
              <CardContent className="p-6 text-center">
                <Sparkles className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold mb-2">Smart Summaries</h3>
                <p className="text-sm text-muted-foreground">
                  AI-generated summaries of complex medical discussions
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-primary/20 hover:border-primary/40 transition-colors">
              <CardContent className="p-6 text-center">
                <Brain className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold mb-2">Clinical Insights</h3>
                <p className="text-sm text-muted-foreground">
                  Evidence-based treatment recommendations and drug interactions
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-primary/20 hover:border-primary/40 transition-colors">
              <CardContent className="p-6 text-center">
                <Search className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold mb-2">Intelligent Search</h3>
                <p className="text-sm text-muted-foreground">
                  Natural language search with medical context understanding
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-primary/20 hover:border-primary/40 transition-colors">
              <CardContent className="p-6 text-center">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold mb-2">Trending Analysis</h3>
                <p className="text-sm text-muted-foreground">
                  Real-time analysis of trending medical topics and discussions
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Direct Access - Only show for non-logged in users */}
          {!user && (
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-semibold">AI-Powered Medical Features</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Access our comprehensive suite of AI tools designed specifically for healthcare professionals
              </p>
              <Link to="/auth">
                <Button size="lg">
                  <LogIn className="h-5 w-5 mr-2" />
                  Sign In to Access AI Features
                </Button>
              </Link>
            </div>
          )}

          {/* Benefits Section */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-semibold mb-4">Why Choose AI-Powered Features?</h2>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <Zap className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <h3 className="font-semibold mb-2">Faster Decision Making</h3>
                  <p className="text-sm text-muted-foreground">
                    Get instant insights and summaries to make informed clinical decisions quickly
                  </p>
                </div>
                <div className="text-center">
                  <Activity className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <h3 className="font-semibold mb-2">Evidence-Based</h3>
                  <p className="text-sm text-muted-foreground">
                    All AI recommendations are based on current medical literature and guidelines
                  </p>
                </div>
                <div className="text-center">
                  <Brain className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <h3 className="font-semibold mb-2">Continuous Learning</h3>
                  <p className="text-sm text-muted-foreground">
                    AI models continuously improve with new medical research and user interactions
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Call to Action */}
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-semibold">Ready to Experience AI-Powered Medicine?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Join thousands of healthcare professionals already using our AI features to enhance their practice and improve patient outcomes.
            </p>
            <div className="flex justify-center gap-4">
              {user ? (
                <>
                  <Link to="/ai-dashboard">
                    <Button size="lg">
                      <Brain className="h-5 w-5 mr-2" />
                      Go to AI Dashboard
                    </Button>
                  </Link>
                  <Link to="/">
                    <Button size="lg" variant="outline">
                      Start Collaborating
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  {/* <Link to="/auth">
                    <Button size="lg">
                      <LogIn className="h-5 w-5 mr-2" />
                      Sign In to Access AI Features
                    </Button>
                  </Link> */}
                  <Link to="/about">
                    <Button size="lg" variant="outline">
                      Learn More
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIFeatures;