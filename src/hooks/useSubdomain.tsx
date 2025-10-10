import { useState, useEffect } from 'react';

export interface SubdomainInfo {
  subdomain: string | null;
  isSubdomain: boolean;
  hostname: string;
  isValid: boolean;
}

// Validate subdomain format (alphanumeric, hyphens, lowercase)
const isValidSubdomain = (subdomain: string): boolean => {
  const subdomainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
  return subdomainRegex.test(subdomain) && subdomain.length >= 3 && subdomain.length <= 63;
};

export const useSubdomain = (): SubdomainInfo => {
  const [subdomainInfo, setSubdomainInfo] = useState<SubdomainInfo>({
    subdomain: null,
    isSubdomain: false,
    hostname: '',
    isValid: false
  });

  useEffect(() => {
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    
    // Check if this is a Lovable project domain (should NOT be treated as white-label)
    const isLovableProject = hostname.includes('lovableproject.com') || hostname.includes('lovable.app');
    const isLocalDev = hostname.includes('localhost') || hostname.includes('127.0.0.1');
    
    // For development/testing, check for subdomain parameter
    const urlParams = new URLSearchParams(window.location.search);
    const devSubdomain = urlParams.get('subdomain');
    
    let subdomain: string | null = null;
    let isRealSubdomain = false;
    
    // Development mode: use URL parameter
    if (devSubdomain) {
      subdomain = devSubdomain.toLowerCase();
      isRealSubdomain = false;
    }
    // Production mode: detect from hostname
    else if (!isLovableProject && !isLocalDev && parts.length >= 3) {
      // For example: subdomain.yourdomain.com has 3 parts
      // subdomain.yourdomain.co.uk has 4 parts (handle country TLDs)
      const potentialSubdomain = parts[0];
      
      // Exclude common non-subdomain prefixes
      if (potentialSubdomain !== 'www' && potentialSubdomain !== 'api') {
        subdomain = potentialSubdomain.toLowerCase();
        isRealSubdomain = true;
      }
    }
    
    // Validate subdomain format
    const isValid = subdomain ? isValidSubdomain(subdomain) : false;
    
    console.log('Subdomain detection:', { 
      hostname, 
      parts, 
      isLovableProject, 
      isLocalDev, 
      devSubdomain, 
      isRealSubdomain, 
      subdomain,
      isValid,
      mode: devSubdomain ? 'development' : isRealSubdomain ? 'production' : 'main-site'
    });
    
    // Warn if invalid subdomain format
    if (subdomain && !isValid) {
      console.warn(`Invalid subdomain format: "${subdomain}". Subdomains must be 3-63 characters, lowercase alphanumeric with hyphens.`);
    }
    
    setSubdomainInfo({
      subdomain: isValid ? subdomain : null,
      isSubdomain: isValid && (!!devSubdomain || isRealSubdomain),
      hostname,
      isValid
    });
  }, []);

  return subdomainInfo;
};