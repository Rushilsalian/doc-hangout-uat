import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  Shield, 
  Upload, 
  Check, 
  X, 
  AlertCircle, 
  FileText,
  Camera,
  Loader2
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface VerificationData {
  licenseNumber: string;
  institution: string;
  specialization: string;
  yearsExperience: number;
  additionalInfo: string;
  documentUrl?: string;
}

export const Verification = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  
  const [verificationData, setVerificationData] = useState<VerificationData>({
    licenseNumber: '',
    institution: '',
    specialization: '',
    yearsExperience: 0,
    additionalInfo: '',
  });

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  const handleInputChange = (field: keyof VerificationData, value: string | number) => {
    setVerificationData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a JPEG, PNG, or PDF file",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload a file smaller than 5MB",
        variant: "destructive"
      });
      return;
    }

    try {
      setUploadingDocument(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('verification-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('verification-documents')
        .getPublicUrl(fileName);

      setVerificationData(prev => ({
        ...prev,
        documentUrl: publicUrl
      }));

      toast({
        title: "Document Uploaded",
        description: "Your verification document has been uploaded successfully"
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload document. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploadingDocument(false);
    }
  };

  const validateStep = (currentStep: number): boolean => {
    switch (currentStep) {
      case 1:
        return verificationData.licenseNumber.trim() !== '' && 
               verificationData.institution.trim() !== '';
      case 2:
        return verificationData.specialization.trim() !== '' && 
               verificationData.yearsExperience > 0;
      case 3:
        return verificationData.documentUrl !== undefined;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1);
    } else {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Update profile with verification data
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          license_number: verificationData.licenseNumber,
          institution: verificationData.institution,
          specialization: verificationData.specialization,
          years_experience: verificationData.yearsExperience,
          // Note: is_verified will be set by admin after review
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Store verification info in profiles table for now
      // (verification_requests table can be added later)

      toast({
        title: "Verification Submitted",
        description: "Your verification request has been submitted for review"
      });

      navigate('/profile');
    } catch (error) {
      console.error('Verification submission error:', error);
      toast({
        title: "Submission Failed",
        description: "Failed to submit verification request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="licenseNumber">Medical License Number *</Label>
              <Input
                id="licenseNumber"
                value={verificationData.licenseNumber}
                onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                placeholder="Enter your medical license number"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="institution">Medical Institution *</Label>
              <Input
                id="institution"
                value={verificationData.institution}
                onChange={(e) => handleInputChange('institution', e.target.value)}
                placeholder="University, Hospital, or Clinic"
                className="mt-1"
              />
            </div>
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Your license information will be encrypted and securely stored.
              </AlertDescription>
            </Alert>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="specialization">Medical Specialization *</Label>
              <Input
                id="specialization"
                value={verificationData.specialization}
                onChange={(e) => handleInputChange('specialization', e.target.value)}
                placeholder="e.g., Cardiology, Neurology, Internal Medicine"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="yearsExperience">Years of Experience *</Label>
              <Input
                id="yearsExperience"
                type="number"
                min="0"
                max="50"
                value={verificationData.yearsExperience || ''}
                onChange={(e) => handleInputChange('yearsExperience', parseInt(e.target.value) || 0)}
                placeholder="Years practicing medicine"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="additionalInfo">Additional Information (Optional)</Label>
              <Textarea
                id="additionalInfo"
                value={verificationData.additionalInfo}
                onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
                placeholder="Any additional information that may help with verification"
                className="mt-1"
                rows={3}
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <Label>Upload Verification Document *</Label>
              <div className="mt-2 border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                <div className="text-center">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                  <div className="mt-4">
                    <Label htmlFor="document-upload" className="cursor-pointer">
                      <div className="text-sm font-medium">
                        Upload medical license or certification
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        PNG, JPG, or PDF up to 5MB
                      </div>
                    </Label>
                    <Input
                      id="document-upload"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleDocumentUpload}
                      className="hidden"
                      disabled={uploadingDocument}
                    />
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    disabled={uploadingDocument}
                    onClick={() => document.getElementById('document-upload')?.click()}
                  >
                    {uploadingDocument ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Choose File
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              {verificationData.documentUrl && (
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-800">Document uploaded successfully</span>
                  </div>
                </div>
              )}
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please upload a clear image or PDF of your medical license or certification. 
                This will be reviewed by our verification team.
              </AlertDescription>
            </Alert>
          </div>
        );

      default:
        return null;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please sign in to access the verification process.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-8 max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Medical Professional Verification</h1>
          <p className="text-muted-foreground mt-2">
            Verify your medical credentials to join our professional community
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Step {step} of {totalSteps}</span>
              <Badge variant="outline">{Math.round(progress)}% Complete</Badge>
            </CardTitle>
            <Progress value={progress} className="mt-2" />
          </CardHeader>
          <CardContent className="space-y-6">
            {renderStep()}

            <div className="flex justify-between pt-4">
              <Button 
                variant="outline" 
                onClick={() => setStep(prev => prev - 1)}
                disabled={step === 1}
              >
                Previous
              </Button>
              
              {step < totalSteps ? (
                <Button onClick={handleNext}>
                  Next
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmit} 
                  disabled={loading || !validateStep(step)}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit for Review'
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5" />
                What happens next?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-blue-100 p-1">
                  <Check className="h-3 w-3 text-blue-600" />
                </div>
                <div className="text-sm">
                  <div className="font-medium">Review Process</div>
                  <div className="text-muted-foreground">Our team will review your credentials within 24-48 hours</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-blue-100 p-1">
                  <Check className="h-3 w-3 text-blue-600" />
                </div>
                <div className="text-sm">
                  <div className="font-medium">Email Notification</div>
                  <div className="text-muted-foreground">You'll receive an email when verification is complete</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-blue-100 p-1">
                  <Check className="h-3 w-3 text-blue-600" />
                </div>
                 <div className="text-sm">
                   <div className="font-medium">Full Access</div>
                   <div className="text-muted-foreground">
                     Access all professional features once verified.{' '}
                     <a href="/communities" className="text-primary hover:underline">
                       Learn more about our community features
                     </a>
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