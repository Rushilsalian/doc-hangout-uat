import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
// import { usePWA } from "@/hooks/usePWA";
// import PWAInstallBanner from "@/components/PWAInstallBanner";
import LoadingScreen from "@/components/LoadingScreen";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Collaborate from "./pages/Collaborate";
import Communities from "./pages/Communities";
import About from "./pages/About";
import Safety from "./pages/Safety";
import AIFeatures from "./pages/AIFeatures";
import Messages from "./pages/Messages";
import GroupChat from "./pages/GroupChat";
import GroupInvite from "./pages/GroupInvite";
import Leaderboard from "./pages/Leaderboard";
import Search from "./pages/Search";
import Profile from "./pages/Profile";
import SavedPosts from "./pages/SavedPosts";
import ProfileCompletion from "./pages/ProfileCompletion";
import { Verification } from "./pages/Verification";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const App = () => {
  // usePWA(); // Initialize PWA functionality
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/collaborate" element={<ProtectedRoute><Collaborate /></ProtectedRoute>} />
            <Route path="/communities" element={<ProtectedRoute><Communities /></ProtectedRoute>} />
            <Route path="/about" element={<About />} />
            <Route path="/safety" element={<Safety />} />
            <Route path="/ai-features" element={<AIFeatures />} />
            <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
            <Route path="/group-chat/:groupId" element={<ProtectedRoute><GroupChat /></ProtectedRoute>} />
            <Route path="/group-invite/:token" element={<GroupInvite />} />
            <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
            <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/profile/:userId" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/saved-posts" element={<ProtectedRoute><SavedPosts /></ProtectedRoute>} />
            <Route path="/verification" element={<ProtectedRoute><Verification /></ProtectedRoute>} />
            <Route path="/profile-completion" element={<ProfileCompletion />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        {/* <PWAInstallBanner /> */}
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
