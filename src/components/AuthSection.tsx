import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  FileText, 
  UserCheck, 
  Sparkles, 
  Lock,
  Award
} from "lucide-react";
import { Link } from 'react-router-dom';
import ghibliMedicalBg from "@/assets/ghibli-medical-bg.jpg";

const verificationSteps = [
  {
    icon: FileText,
    title: "Medical License Verification",
    description: "Upload your medical license or provide license number for automated verification"
  },
  {
    icon: UserCheck,
    title: "Professional Profile",
    description: "Complete your profile with specialization, experience, and institution details"
  },
  {
    icon: Shield,
    title: "Security Review",
    description: "Our team reviews and verifies all applications within 24-48 hours"
  },
  {
    icon: Award,
    title: "Community Access",
    description: "Join verified medical professionals in secure, professional discussions"
  }
];

const features = [
  {
    icon: Lock,
    title: "HIPAA Compliant Platform",
    description: "Enterprise-grade security ensures patient privacy and data protection"
  },
  {
    icon: Sparkles,
    title: "AI-Powered Insights",
    description: "Get intelligent summaries, research suggestions, and case recommendations"
  },
  {
    icon: Shield,
    title: "Verified Community",
    description: "Connect only with licensed, verified medical professionals"
  }
];

const AuthSection = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-secondary/30 to-background relative">
      <div className="absolute inset-0 opacity-10">
        <img src={ghibliMedicalBg} alt="" className="w-full h-full object-cover" />
      </div>
      <div className="container relative z-10">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            <Shield className="h-3 w-3 mr-1" />
            Professional Verification Required
          </Badge>
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Join the Most Trusted Medical Community
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Our rigorous verification process ensures you're connecting with legitimate medical professionals 
            in a secure, compliant environment.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h3 className="text-2xl font-bold mb-8">Simple Verification Process</h3>
            <div className="space-y-6">
              {verificationSteps.map((step, index) => {
                const IconComponent = step.icon;
                return (
                  <div key={index} className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <IconComponent className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold mb-2">{step.title}</h4>
                      <p className="text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <Card className="shadow-strong">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Get Started Today</CardTitle>
              <p className="text-muted-foreground">
                Join thousands of verified medical professionals
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {features.map((feature, index) => {
                  const IconComponent = feature.icon;
                  return (
                    <div key={index} className="flex gap-3">
                      <IconComponent className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h5 className="font-medium">{feature.title}</h5>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="space-y-3">
                <Link to="/auth" className="block">
                  <Button variant="hero" size="lg" className="w-full">
                    <UserCheck className="h-5 w-5" />
                    Start Verification Process
                  </Button>
                </Link>
                <Link to="/verification" className="block">
                  <Button variant="outline" size="lg" className="w-full">
                    Learn More About Verification
                  </Button>
                </Link>
              </div>
              
              <p className="text-xs text-muted-foreground text-center">
                By joining, you agree to our Terms of Service and Privacy Policy. 
                Platform complies with HIPAA and medical privacy regulations.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default AuthSection;