import { useState, useEffect } from 'react';

export interface SubdomainInfo {
  subdomain: string | null;
  isSubdomain: boolean;
  hostname: string;
}

export const useSubdomain = (): SubdomainInfo => {
  const [subdomainInfo, setSubdomainInfo] = useState<SubdomainInfo>({
    subdomain: null,
    isSubdomain: false,
    hostname: ''
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
    
    // Only treat as subdomain if:
    // 1. Has subdomain parameter (dev mode), OR
    // 2. Is a real subdomain (not Lovable project domain)
    const isRealSubdomain = parts.length > 2 && !isLovableProject && !isLocalDev;
    const subdomain = isRealSubdomain ? parts[0] : null;
    
    console.log('Subdomain detection:', { 
      hostname, 
      parts, 
      isLovableProject, 
      isLocalDev, 
      devSubdomain, 
      isRealSubdomain, 
      subdomain 
    });
    
    setSubdomainInfo({
      subdomain: devSubdomain || subdomain,
      isSubdomain: !!devSubdomain || isRealSubdomain,
      hostname
    });
  }, [window.location.search]); // Add dependency on search params

  return subdomainInfo;
};