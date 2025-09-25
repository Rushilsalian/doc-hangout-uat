import { useState, useEffect } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useAuth } from '@/hooks/useAuth';
import { Stethoscope, Mail, Lock, User } from 'lucide-react';
import { ForgotPasswordDialog } from '@/components/ForgotPasswordDialog';

const Auth = () => {
  const { user, signIn, signUp, signInWithOAuth, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get the intended destination from location state, default to profile-completion
  const from = location.state?.from?.pathname || '/profile-completion';
  
  // Form states
  const [signInData, setSignInData] = useState({ email: '', password: '' });
  const [signUpData, setSignUpData] = useState({ 
    email: '', 
    password: '', 
    confirmPassword: '',
    displayName: '',
    // Medical knowledge questions (compulsory)
    question1Answer: '',
    question2Answer: ''
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !loading) {
      navigate(from, { replace: true });
    }
  }, [user, loading, navigate, from]);
  
  if (user && !loading) {
    return null; // Prevent flash while redirecting
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const { error } = await signIn(signInData.email, signInData.password);
    
    if (error) {
      setError(error.message);
      setIsLoading(false);
    }
    // Don't set loading to false here if successful - let useEffect handle redirect
  };

  const handleOAuthSignIn = async (provider: 'google' | 'facebook') => {
    setError(null);
    setIsLoading(true);
    
    const { error } = await signInWithOAuth(provider);
    
    if (error) {
      console.error(`${provider} OAuth error:`, error);
      if (error.message?.includes('Provider not found')) {
        setError(`${provider.charAt(0).toUpperCase() + provider.slice(1)} sign-in is not configured yet. Please use email/password login or contact support.`);
      } else {
        setError(`Failed to sign in with ${provider}. Please try again or use email/password login.`);
      }
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (signUpData.password !== signUpData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (signUpData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    // Check medical knowledge questions (compulsory for all users)
    if (signUpData.question1Answer !== 'B' || signUpData.question2Answer !== 'C') {
      setError('Please answer the medical knowledge questions correctly');
      return;
    }

    setIsLoading(true);
    const { error } = await signUp(signUpData.email, signUpData.password, signUpData.displayName);
    
    if (error) {
      setError(error.message);
    } else {
      setError(null);
      // Show success message with instructions
      alert('Account created successfully! Please check your email for a confirmation link. After confirming your email, you will be able to log in and complete your profile.');
    }
    setIsLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-secondary/30 to-background flex items-center justify-center">
        <div className="text-center">
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
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/30 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-4xl mx-auto">
        <Card className="shadow-strong w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center text-xl">Access Your Account</CardTitle>
          </CardHeader>
          <CardContent>
            {/* OAuth Buttons */}
            <div className="space-y-3 mb-6">
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => handleOAuthSignIn('google')}
                disabled={isLoading}
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => handleOAuthSignIn('facebook')}
                disabled={isLoading}
              >
                <svg className="w-4 h-4 mr-2" fill="#1877F2" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Continue with Facebook
              </Button>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
              </div>
            </div>
            
            <Tabs defaultValue="signin" className="w-full mt-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="doctor@hospital.com"
                        className="pl-10"
                        value={signInData.email}
                        onChange={(e) => setSignInData(prev => ({ ...prev, email: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signin-password"
                        type="password"
                        placeholder="Enter your password"
                        className="pl-10"
                        value={signInData.password}
                        onChange={(e) => setSignInData(prev => ({ ...prev, password: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                   <div className="flex justify-end">
                     <ForgotPasswordDialog>
                       <Button type="button" variant="link" size="sm" className="text-xs p-0 h-auto">
                         Forgot password?
                       </Button>
                     </ForgotPasswordDialog>
                   </div>
                   <Button type="submit" className="w-full" disabled={isLoading}>
                     {isLoading ? 'Signing In...' : 'Sign In'}
                   </Button>
                 </form>
               </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  {/* Basic account information */}
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="doctor@hospital.com"
                          className="pl-10"
                          value={signUpData.email}
                          onChange={(e) => setSignUpData(prev => ({ ...prev, email: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="display-name">Display Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="display-name"
                          placeholder="Dr. John Smith"
                          className="pl-10"
                          value={signUpData.displayName}
                          onChange={(e) => setSignUpData(prev => ({ ...prev, displayName: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="Enter your password"
                          className="pl-10"
                          value={signUpData.password}
                          onChange={(e) => setSignUpData(prev => ({ ...prev, password: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="confirm-password"
                          type="password"
                          placeholder="Confirm your password"
                          className="pl-10"
                          value={signUpData.confirmPassword}
                          onChange={(e) => setSignUpData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Medical Knowledge Questions (Compulsory for all users) */}
                  <div>
                    <h3 className="font-semibold mb-3 text-sm">Medical Knowledge Verification</h3>
                    <p className="text-xs text-muted-foreground mb-4">
                      Please answer these questions to verify your medical knowledge.
                    </p>
                    
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">
                          1. The most common type of anemia worldwide is:
                        </Label>
                        <div className="space-y-2">
                          {[
                            { value: 'A', label: 'Megaloblastic anemia' },
                            { value: 'B', label: 'Iron deficiency anemia' },
                            { value: 'C', label: 'Aplastic anemia' },
                            { value: 'D', label: 'Hemolytic anemia' }
                          ].map((option) => (
                            <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="radio"
                                name="question1"
                                value={option.value}
                                checked={signUpData.question1Answer === option.value}
                                onChange={(e) => setSignUpData(prev => ({ ...prev, question1Answer: e.target.value }))}
                                className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                                required
                              />
                              <span className="text-sm">{option.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">
                          2. The causative agent of tuberculosis is:
                        </Label>
                        <div className="space-y-2">
                          {[
                            { value: 'A', label: 'Mycobacterium leprae' },
                            { value: 'B', label: 'Mycobacterium avium' },
                            { value: 'C', label: 'Mycobacterium tuberculosis' },
                            { value: 'D', label: 'Mycoplasma pneumoniae' }
                          ].map((option) => (
                            <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="radio"
                                name="question2"
                                value={option.value}
                                checked={signUpData.question2Answer === option.value}
                                onChange={(e) => setSignUpData(prev => ({ ...prev, question2Answer: e.target.value }))}
                                className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                                required
                              />
                              <span className="text-sm">{option.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
            
            {error && (
              <Alert className="mt-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <p className="text-xs text-muted-foreground text-center mt-4">
              By creating an account, you agree to our Terms of Service and Privacy Policy.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;