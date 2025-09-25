import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useAuth } from '@/hooks/useAuth';
import { AvatarUpload } from '@/components/AvatarUpload';
import { FileText, Building, User, Camera, Upload } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ProfileData {
  specialization: string;
  institution: string;
  license_number: string;
  years_experience: string;
  bio: string;
  avatar_url: string | null;
}

const ProfileCompletion = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<ProfileData>({
    specialization: '',
    institution: '',
    license_number: '',
    years_experience: '',
    bio: '',
    avatar_url: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);

  useEffect(() => {
    // Calculate completion percentage
    const fields = Object.entries(profileData);
    const filledFields = fields.filter(([key, value]) => {
      if (key === 'avatar_url') return value !== null;
      return value.trim() !== '';
    });
    
    const percentage = Math.round((filledFields.length / fields.length) * 100);
    setCompletionPercentage(percentage);
  }, [profileData]);

  useEffect(() => {
    // Load existing profile data if available
    const loadProfile = async () => {
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('specialization, institution, license_number, years_experience, bio, avatar_url')
        .eq('id', user.id)
        .single();

      if (data) {
        setProfileData({
          specialization: data.specialization || '',
          institution: data.institution || '',
          license_number: data.license_number || '',
          years_experience: data.years_experience?.toString() || '',
          bio: data.bio || '',
          avatar_url: data.avatar_url
        });
      }
    };

    loadProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const updateData = {
        specialization: profileData.specialization || null,
        institution: profileData.institution || null,
        license_number: profileData.license_number || null,
        years_experience: profileData.years_experience ? parseInt(profileData.years_experience) : null,
        bio: profileData.bio || null,
        avatar_url: profileData.avatar_url
      };

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: "Your profile has been saved successfully.",
      });

      if (completionPercentage === 100) {
        navigate('/collaborate');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/30 to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-strong">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
          <p className="text-muted-foreground">
            Help us personalize your experience by completing your professional profile.
          </p>
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span>Profile Completion</span>
              <span>{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Upload */}
          <div className="text-center">
            <Label className="text-sm font-medium mb-3 block">Profile Picture</Label>
            <AvatarUpload
              currentAvatar={profileData.avatar_url}
              displayName={user.email?.split('@')[0] || 'User'}
              onAvatarUpdate={(url) => setProfileData(prev => ({ ...prev, avatar_url: url }))}
              size="lg"
            />
          </div>

          {/* Medical Specialty */}
          <div className="space-y-2">
            <Label>Medical Specialty</Label>
            <Select 
              value={profileData.specialization} 
              onValueChange={(value) => setProfileData(prev => ({ ...prev, specialization: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your specialty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cardiology">Cardiology</SelectItem>
                <SelectItem value="neurology">Neurology</SelectItem>
                <SelectItem value="radiology">Radiology</SelectItem>
                <SelectItem value="orthopedics">Orthopedics</SelectItem>
                <SelectItem value="pediatrics">Pediatrics</SelectItem>
                <SelectItem value="surgery">Surgery</SelectItem>
                <SelectItem value="internal-medicine">Internal Medicine</SelectItem>
                <SelectItem value="emergency">Emergency Medicine</SelectItem>
                <SelectItem value="psychiatry">Psychiatry</SelectItem>
                <SelectItem value="dermatology">Dermatology</SelectItem>
                <SelectItem value="ophthalmology">Ophthalmology</SelectItem>
                <SelectItem value="anesthesiology">Anesthesiology</SelectItem>
                <SelectItem value="pathology">Pathology</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Institution */}
          <div className="space-y-2">
            <Label htmlFor="institution">Medical Institution</Label>
            <div className="relative">
              <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="institution"
                placeholder="Hospital/Clinic name"
                className="pl-10"
                value={profileData.institution}
                onChange={(e) => setProfileData(prev => ({ ...prev, institution: e.target.value }))}
              />
            </div>
          </div>

          {/* License Number */}
          <div className="space-y-2">
            <Label htmlFor="license">Medical License Number</Label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="license"
                placeholder="e.g., MD123456"
                className="pl-10"
                value={profileData.license_number}
                onChange={(e) => setProfileData(prev => ({ ...prev, license_number: e.target.value }))}
              />
            </div>
          </div>

          {/* Years of Experience */}
          <div className="space-y-2">
            <Label htmlFor="experience">Years of Experience</Label>
            <Input
              id="experience"
              type="number"
              placeholder="e.g., 5"
              value={profileData.years_experience}
              onChange={(e) => setProfileData(prev => ({ ...prev, years_experience: e.target.value }))}
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Professional Bio</Label>
            <textarea
              id="bio"
              placeholder="Tell us about your professional background and interests..."
              className="w-full px-3 py-2 border border-input rounded-md text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              value={profileData.bio}
              onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
            />
          </div>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1" 
              onClick={() => navigate('/collaborate')}
            >
              Skip for Now
            </Button>
            <Button 
              className="flex-1" 
              onClick={handleSave}
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            You can update your profile information at any time from your profile page.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileCompletion;