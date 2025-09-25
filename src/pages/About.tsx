import Header from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Users, Brain, CheckCircle } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center">About Doc Hangout</h1>
          
          <Card className="mb-8">
            <CardContent className="p-8">
              <p className="text-lg text-muted-foreground mb-6">
                Doc Hangout is the coolest spot for verified medical professionals to connect, 
                collaborate, and share knowledge in a secure, HIPAA-compliant environment.
              </p>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <Shield className="h-6 w-6 text-primary mt-1" />
                    <div>
                      <h3 className="font-semibold mb-2">Verified Professionals Only</h3>
                      <p className="text-sm text-muted-foreground">
                        Every member is verified through medical license validation and institutional verification.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <Users className="h-6 w-6 text-primary mt-1" />
                    <div>
                      <h3 className="font-semibold mb-2">Specialty Communities</h3>
                      <p className="text-sm text-muted-foreground">
                        Connect with peers in your specialty through dedicated hangout rooms.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <Brain className="h-6 w-6 text-primary mt-1" />
                    <div>
                      <h3 className="font-semibold mb-2">AI-Powered Insights</h3>
                      <p className="text-sm text-muted-foreground">
                        Get intelligent summaries and insights to enhance your medical discussions.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <CheckCircle className="h-6 w-6 text-primary mt-1" />
                    <div>
                      <h3 className="font-semibold mb-2">HIPAA Compliant</h3>
                      <p className="text-sm text-muted-foreground">
                        All discussions are secured and compliant with medical privacy regulations.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default About;