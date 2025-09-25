// Medical License Verification APIs
const NPI_API_URL = "https://npiregistry.cms.hhs.gov/api";

export interface VerificationResult {
  isValid: boolean;
  confidence: number;
  details: {
    licenseValid?: boolean;
    npiValid?: boolean;
    documentValid?: boolean;
    institutionValid?: boolean;
  };
  errors?: string[];
}

// Verify NPI (National Provider Identifier)
export const verifyNPI = async (npi: string): Promise<boolean> => {
  try {
    const response = await fetch(`${NPI_API_URL}/?number=${npi}&version=2.1`);
    const data = await response.json();
    return data.result_count > 0;
  } catch (error) {
    return false;
  }
};

// Verify medical license with state boards
export const verifyMedicalLicense = async (licenseNumber: string, state: string): Promise<boolean> => {
  const stateAPIs: { [key: string]: string } = {
    'CA': 'https://www.mbc.ca.gov/api/license-lookup',
    'NY': 'https://www.health.ny.gov/api/professional-lookup',
    'TX': 'https://www.tmb.state.tx.us/api/physician-lookup'
  };

  try {
    const apiUrl = stateAPIs[state];
    if (!apiUrl) return false;

    const response = await fetch(`${apiUrl}?license=${licenseNumber}`);
    const data = await response.json();
    return data.status === 'active' || data.valid === true;
  } catch (error) {
    return false;
  }
};

// Verify document using OCR
export const verifyDocument = async (file: File): Promise<{ valid: boolean; extractedData: any }> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/verify-document', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    return {
      valid: result.confidence > 0.8,
      extractedData: result.data
    };
  } catch (error) {
    return { valid: false, extractedData: null };
  }
};

// Main verification function
export const verifyDoctor = async (verificationData: {
  licenseNumber: string;
  npi?: string;
  state: string;
  institution: string;
  document: File;
}): Promise<VerificationResult> => {
  const results = {
    licenseValid: false,
    npiValid: false,
    documentValid: false,
    institutionValid: true // Assume valid for demo
  };

  const errors: string[] = [];

  try {
    const [licenseResult, npiResult, docResult] = await Promise.all([
      verifyMedicalLicense(verificationData.licenseNumber, verificationData.state),
      verificationData.npi ? verifyNPI(verificationData.npi) : Promise.resolve(true),
      verifyDocument(verificationData.document)
    ]);

    results.licenseValid = licenseResult;
    results.npiValid = npiResult;
    results.documentValid = docResult.valid;

    if (!licenseResult) errors.push('Medical license not found');
    if (verificationData.npi && !npiResult) errors.push('NPI number not valid');
    if (!docResult.valid) errors.push('Document verification failed');

  } catch (error) {
    errors.push('Verification service unavailable');
  }

  const validChecks = Object.values(results).filter(Boolean).length;
  const confidence = validChecks / 4;

  return {
    isValid: confidence >= 0.75,
    confidence,
    details: results,
    errors: errors.length > 0 ? errors : undefined
  };
};