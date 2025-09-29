import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, Sparkles, Search, TrendingUp, CheckCircle, AlertTriangle, Info } from 'lucide-react';

export const SmartSummaryDemo = () => (
  <Card className="border-primary/20">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        AI Medical Summary Demo
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="p-4 bg-muted/50 rounded-lg">
        <h4 className="font-medium mb-2">Original Medical Case (Sample):</h4>
        <p className="text-sm text-muted-foreground leading-relaxed">
          "A 65-year-old male patient presents with acute chest pain radiating to the left arm, 
          accompanied by shortness of breath and diaphoresis. ECG shows ST-elevation in leads II, III, and aVF, 
          suggesting an inferior wall myocardial infarction. Initial troponin levels are elevated at 15.2 ng/mL..."
        </p>
      </div>
      
      <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h4 className="font-medium">AI-Generated Summary:</h4>
          <Badge variant="secondary" className="text-xs">95% Confidence</Badge>
        </div>
        <p className="text-sm leading-relaxed">
          <strong>Key Points:</strong> 65-year-old male with acute inferior STEMI. ECG confirms ST-elevation in inferior leads. 
          Elevated troponin (15.2 ng/mL) indicates myocardial damage. <strong>Treatment:</strong> Emergency PCI with stent placement successful. 
          <strong>Outcome:</strong> Patient stable with symptom resolution.
        </p>
      </div>
    </CardContent>
  </Card>
);

export const ClinicalInsightsDemo = () => (
  <Card className="border-primary/20">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Brain className="h-5 w-5 text-primary" />
        Clinical AI Insights Demo
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="p-4 bg-muted/50 rounded-lg">
        <h4 className="font-medium mb-2">Query: "chest pain elderly patient"</h4>
      </div>
      
      <div className="space-y-3">
        <div className="p-3 border rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h5 className="font-medium">Acute Coronary Syndrome</h5>
            <Badge className="bg-green-100 text-green-800">High Evidence</Badge>
          </div>
          <div className="space-y-2">
            <div>
              <span className="text-sm font-medium">Treatments:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                <Badge variant="outline" className="text-xs">Aspirin</Badge>
                <Badge variant="outline" className="text-xs">Clopidogrel</Badge>
                <Badge variant="outline" className="text-xs">Statin therapy</Badge>
              </div>
            </div>
            <div className="flex items-start gap-2 p-2 bg-amber-50 border border-amber-200 rounded">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
              <div className="text-sm">
                <span className="font-medium text-amber-800">Drug Interaction:</span>
                <span className="text-amber-700 ml-1">Monitor for bleeding with warfarin + aspirin combination</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

export const IntelligentSearchDemo = () => (
  <Card className="border-primary/20">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Search className="h-5 w-5 text-primary" />
        Intelligent Search Demo
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="p-4 bg-muted/50 rounded-lg">
        <h4 className="font-medium mb-2">Natural Language Query:</h4>
        <p className="text-sm">"Show me cases about hypertension treatment in diabetic patients"</p>
      </div>
      
      <div className="space-y-3">
        {[
          {
            title: "Managing Hypertension in Type 2 Diabetes",
            relevance: 94,
            type: "post",
            author: "Dr. Sarah Chen"
          },
          {
            title: "ACE Inhibitors vs ARBs in Diabetic Hypertension",
            relevance: 89,
            type: "post", 
            author: "Dr. Michael Rodriguez"
          },
          {
            title: "Cardiology - Diabetes & Hypertension",
            relevance: 85,
            type: "community",
            author: "Community"
          }
        ].map((result, index) => (
          <div key={index} className="p-3 border rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h5 className="font-medium text-sm">{result.title}</h5>
                <p className="text-xs text-muted-foreground mt-1">
                  by {result.author} • {result.type}
                </p>
              </div>
              <Badge className="bg-blue-100 text-blue-800 text-xs">
                AI: {result.relevance}%
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

export const TrendingAnalysisDemo = () => (
  <Card className="border-primary/20">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-primary" />
        Trending Analysis Demo
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="space-y-3">
        {[
          { topic: "COVID-19 Variants", mentions: 156, sentiment: "neutral", growth: 23 },
          { topic: "Telemedicine", mentions: 134, sentiment: "positive", growth: 45 },
          { topic: "Mental Health", mentions: 98, sentiment: "positive", growth: 12 },
          { topic: "AI Diagnostics", mentions: 87, sentiment: "positive", growth: 67 },
          { topic: "Vaccine Research", mentions: 76, sentiment: "neutral", growth: 8 }
        ].map((trend, index) => (
          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-semibold text-primary">
                {index + 1}
              </div>
              <div>
                <span className="font-medium text-sm">{trend.topic}</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">{trend.mentions} mentions</span>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${
                      trend.sentiment === 'positive' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {trend.sentiment === 'positive' ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <Info className="h-3 w-3 mr-1" />
                    )}
                    {trend.sentiment}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-green-600">+{trend.growth}%</div>
              <div className="text-xs text-muted-foreground">growth</div>
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

export default {
  SmartSummaryDemo,
  ClinicalInsightsDemo,
  IntelligentSearchDemo,
  TrendingAnalysisDemo
};