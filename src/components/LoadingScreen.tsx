import { Stethoscope } from "lucide-react";
import ghibliCollaboration from "@/assets/ghibli-collaboration.jpg";

export const LoadingScreen = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/30 to-background flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <img src={ghibliCollaboration} alt="" className="w-full h-full object-cover" />
      </div>
      <div className="text-center relative z-10">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Stethoscope className="h-8 w-8 text-primary animate-pulse" />
          <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Doc Community
          </span>
        </div>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading your medical community...</p>
      </div>
    </div>
  );
};

export default LoadingScreen;