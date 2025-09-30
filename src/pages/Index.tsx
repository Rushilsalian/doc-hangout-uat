import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import CommunityPreview from "@/components/CommunityPreview";
import AuthSection from "@/components/AuthSection";
import TrendingPosts from "@/components/TrendingPosts";
import TrendingTopics from "@/components/TrendingTopics";
import { FriendRequestNotifications } from "@/components/FriendRequestNotifications";
import { useAuth } from "@/hooks/useAuth";
import diningImage from "@/assets/doc-hangout-dining.webp";
import girlImage from "@/assets/doc-hangout-girl.webp";
import worldImage from "@/assets/doc-hangout-world.webp";

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        {user ? (
          <div className="container py-4 sm:py-8 px-2 sm:px-4">
            <div className="grid lg:grid-cols-3 gap-4 sm:gap-8">
              <div className="lg:col-span-2 space-y-3 sm:space-y-4">
                <FriendRequestNotifications />
                <CommunityPreview />
              </div>
              <div className="lg:col-span-1 hidden lg:block space-y-4">
                <TrendingPosts />
                <TrendingTopics limit={5} showGrowthRate={false} />
              </div>
            </div>
          </div>
        ) : (
          <div className="container py-8 sm:py-16 px-2 sm:px-4">
            <div className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8">
              <h2 className="text-2xl sm:text-3xl font-bold">Welcome to Doc Hangout</h2>
              <p className="text-lg sm:text-xl text-muted-foreground px-2">
                A secure, professional platform where verified medical professionals connect, collaborate, and share knowledge.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mt-8 sm:mt-12">
                <div className="space-y-3 sm:space-y-4 p-4 text-center">
                  <img src={worldImage} alt="Global medical community" className="w-16 h-16 sm:w-20 sm:h-20 rounded-full mx-auto object-cover shadow-md" />
                  <h3 className="text-lg sm:text-xl font-semibold">Verified Community</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    Join a community of verified medical professionals with automated credential verification.
                  </p>
                </div>
                
                <div className="space-y-3 sm:space-y-4 p-4 text-center">
                  <img src={diningImage} alt="Medical collaboration" className="w-16 h-16 sm:w-20 sm:h-20 rounded-full mx-auto object-cover shadow-md" />
                  <h3 className="text-lg sm:text-xl font-semibold">Collaborate Safely</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    Discuss cases, share insights, and get second opinions in a HIPAA-compliant environment.
                  </p>
                </div>
                
                <div className="space-y-3 sm:space-y-4 p-4 text-center">
                  <img src={girlImage} alt="Medical professional" className="w-16 h-16 sm:w-20 sm:h-20 rounded-full mx-auto object-cover shadow-md" />
                  <h3 className="text-lg sm:text-xl font-semibold">Specialty Focus</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">
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
