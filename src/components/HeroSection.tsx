import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, Brain } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import heroGif from "@/assets/doc-hangout.gif";
import teamImage from "@/assets/doc-hangout-team.webp";
import discussionImage from "@/assets/doc-hangout-discussion.webp";
import worldImage from "@/assets/doc-hangout-world.webp";
import girlImage from "@/assets/doc-hangout-girl.webp";
import PlatformStats from "@/components/PlatformStats";

const HeroSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const handleJoinHangout = () => {
    if (user) {
      navigate('/collaborate');
    } else {
      navigate('/auth', { state: { defaultTab: 'signup' } });
    }
  };
  
  return (
    <section className="relative py-12 sm:py-20 lg:py-32 overflow-hidden bg-ghibli-gradient">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-ghibli-nature/10 via-background to-ghibli-sky/10" />
      
      <div className="container relative px-4">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="space-y-6 lg:space-y-8 text-center lg:text-left">
            <div className="space-y-4">
              <Badge variant="secondary" className="w-fit mx-auto lg:mx-0">
                <Shield className="h-3 w-3 mr-1" />
                <span className="text-xs sm:text-sm">Verified Medical Professionals Only</span>
              </Badge>
              
              <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold tracking-tight leading-relaxed">
                Where Doctors
                <span className="bg-gradient-to-r from-ghibli-nature to-ghibli-sky bg-clip-text text-transparent block leading-relaxed pb-2">
                  Hang Out
                </span>
              </h1>
              
              <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-lg mx-auto lg:mx-0">
                The coolest spot for verified doctors to chill, share cases, discuss treatments, 
                and collaborate on medical breakthroughs. Enhanced with AI-powered insights.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
              <Button variant="ghibli" size="lg" onClick={handleJoinHangout} className="w-full sm:w-auto">
                <Users className="h-5 w-5 mr-2" />
                {user ? 'Go to Hangout' : 'Join the Hangout'}
              </Button>
              <Button variant="professional" size="lg" onClick={() => navigate('/ai-features')} className="w-full sm:w-auto border-ghibli-nature/30 text-ghibli-nature hover:bg-ghibli-nature hover:text-white">
                <Brain className="h-5 w-5 mr-2" />
                Explore AI Features
              </Button>
            </div>

            <PlatformStats />
          </div>

          <div className="relative order-first lg:order-last">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl lg:rounded-3xl blur-2xl lg:blur-3xl" />
            <div className="relative">
              <img
                src={heroGif}
                alt="Doc Hangout in action"
                className="rounded-xl shadow-strong w-full h-48 sm:h-64 object-cover"
              />
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-ghibli-nature/20 text-center">
          <p className="text-sm text-muted-foreground">
            Developed By{" "}
            <a 
              href="https://rushils-salian.vercel.app/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-ghibli-nature hover:text-ghibli-sky transition-colors font-medium"
            >
              TechSpeeX
            </a>
            {" & "}
            <a 
              href="https://www.kanhaiyasuthar.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-ghibli-nature hover:text-ghibli-sky transition-colors font-medium"
            >
              Team
            </a>
          </p>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;