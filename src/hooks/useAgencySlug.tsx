import { useState, useEffect } from 'react';

export interface AgencySlugInfo {
  slug: string | null;
  isAgency: boolean;
  isValid: boolean;
}

// Validate agency slug format (alphanumeric, hyphens, lowercase, 2-63 chars)
const isValidSlug = (slug: string): boolean => {
  const slugRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
  return slugRegex.test(slug) && slug.length >= 2 && slug.length <= 63;
};

// Reserved paths that should not be treated as agency slugs
const RESERVED_PATHS = [
  'auth',
  'dashboard',
  'admin',
  'services',
  'features',
  'pricing',
  'about',
  'contact',
  'resources',
  'privacy-policy',
  'terms-of-service',
  'cart',
  'reset-password',
  'sign-in',
  'sign-up',
  'kyc-aml-policy',
];

export const useAgencySlug = (): AgencySlugInfo => {
  const [slugInfo, setSlugInfo] = useState<AgencySlugInfo>({
    slug: null,
    isAgency: false,
    isValid: false
  });

  useEffect(() => {
    const updateSlugInfo = () => {
      const pathname = window.location.pathname;
      const pathParts = pathname.split('/').filter(part => part.length > 0);
      
      // Extract the first path segment as potential agency slug
      const potentialSlug = pathParts[0]?.toLowerCase();
      
      // Check if this is a reserved path (main site routes)
      const isReservedPath = potentialSlug && RESERVED_PATHS.includes(potentialSlug);
      
      // Determine if this is an agency path
      let slug: string | null = null;
      let isAgency = false;
      
      if (potentialSlug && !isReservedPath) {
        slug = potentialSlug;
        isAgency = true;
      }
      
      // Validate slug format
      const isValid = slug ? isValidSlug(slug) : false;
      
      console.log('Agency slug detection:', { 
        pathname,
        pathParts,
        potentialSlug,
        isReservedPath,
        slug,
        isAgency: isAgency && isValid,
        isValid
      });
      
      // Warn if invalid slug format
      if (slug && !isValid) {
        console.warn(`Invalid agency slug format: "${slug}". Slugs must be 2-63 characters, lowercase alphanumeric with hyphens.`);
      }
      
      setSlugInfo({
        slug: isValid ? slug : null,
        isAgency: isAgency && isValid,
        isValid
      });
    };

    updateSlugInfo();
    
    // Listen for popstate events (browser back/forward)
    window.addEventListener('popstate', updateSlugInfo);
    
    return () => {
      window.removeEventListener('popstate', updateSlugInfo);
    };
  }, []);

  return slugInfo;
};