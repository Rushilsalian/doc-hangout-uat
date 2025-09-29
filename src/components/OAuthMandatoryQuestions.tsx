import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface QuestionData {
  question1Answer: string;
  question2Answer: string;
}

const OAuthMandatoryQuestions = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [questionData, setQuestionData] = useState<QuestionData>({
    question1Answer: '',
    question2Answer: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-secondary/30 to-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate answers
    if (questionData.question1Answer !== 'B' || questionData.question2Answer !== 'C') {
      setError('Please answer the medical knowledge questions correctly');
      return;
    }

    if (!user) {
      setError('User not authenticated');
      return;
    }

    setIsLoading(true);
    try {
      // Store the answers in the user's profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          medical_verification_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      toast({
        title: "Verification Complete",
        description: "Medical knowledge verification completed successfully.",
      });

      // Redirect to profile completion
      navigate('/profile-completion', { replace: true });
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to save verification. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/30 to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-strong">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Medical Knowledge Verification</CardTitle>
          <p className="text-muted-foreground">
            Please answer these questions to verify your medical knowledge and complete your registration.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
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
                        checked={questionData.question1Answer === option.value}
                        onChange={(e) => setQuestionData(prev => ({ ...prev, question1Answer: e.target.value }))}
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
                        checked={questionData.question2Answer === option.value}
                        onChange={(e) => setQuestionData(prev => ({ ...prev, question2Answer: e.target.value }))}
                        className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                        required
                      />
                      <span className="text-sm">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <Alert>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Verifying...' : 'Complete Verification'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default OAuthMandatoryQuestions;