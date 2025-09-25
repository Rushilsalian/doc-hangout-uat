import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import CommunityPreview from "@/components/CommunityPreview";
import AuthSection from "@/components/AuthSection";
import TrendingPosts from "@/components/TrendingPosts";
import { FriendRequestNotifications } from "@/components/FriendRequestNotifications";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        {user ? (
          <div className="container py-8">
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <FriendRequestNotifications />
                <CommunityPreview />
              </div>
              <div className="lg:col-span-1">
                <TrendingPosts />
              </div>
            </div>
          </div>
        ) : (
          <div className="container py-16">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <h2 className="text-3xl font-bold">Welcome to Doc Hangout</h2>
              <p className="text-xl text-muted-foreground">
                A secure, professional platform where verified medical professionals connect, collaborate, and share knowledge.
              </p>
              
              <div className="grid md:grid-cols-3 gap-8 mt-12">
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-2xl">🏥</span>
                  </div>
                  <h3 className="text-xl font-semibold">Verified Community</h3>
                  <p className="text-muted-foreground">
                    Join a community of verified medical professionals with automated credential verification.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-2xl">💬</span>
                  </div>
                  <h3 className="text-xl font-semibold">Collaborate Safely</h3>
                  <p className="text-muted-foreground">
                    Discuss cases, share insights, and get second opinions in a HIPAA-compliant environment.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <h3 className="text-xl font-semibold">Specialty Focus</h3>
                  <p className="text-muted-foreground">
                    Connect with specialists in your field and explore other medical disciplines.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        <AuthSection />
      </main>
    </div>
  );
};

export default Index;
