import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSubdomain } from '@/hooks/useSubdomain';

export interface AgencySettings {
  id: string;
  user_id: string;
  agency_name: string | null;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  contact_email: string | null;
  contact_phone: string | null;
  custom_domain: string | null;
  hero_title: string;
  hero_subtitle: string;
  about_content: string | null;
  services_enabled: boolean;
  features_enabled: boolean;
  testimonials_enabled: boolean;
  pricing_enabled: boolean;
  custom_css: string | null;
  meta_title: string | null;
  meta_description: string | null;
  favicon_url: string | null;
  hide_powered_by: boolean;
}

interface WhiteLabelContextType {
  agencySettings: AgencySettings | null;
  loading: boolean;
  error: string | null;
  isWhiteLabel: boolean;
  subdomain: string | null;
}

const WhiteLabelContext = createContext<WhiteLabelContextType | undefined>(undefined);

export const useWhiteLabel = () => {
  const context = useContext(WhiteLabelContext);
  if (context === undefined) {
    throw new Error('useWhiteLabel must be used within a WhiteLabelProvider');
  }
  return context;
};

interface WhiteLabelProviderProps {
  children: React.ReactNode;
}

export const WhiteLabelProvider: React.FC<WhiteLabelProviderProps> = ({ children }) => {
  const [agencySettings, setAgencySettings] = useState<AgencySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { subdomain, isSubdomain, isValid } = useSubdomain();

  useEffect(() => {
    const fetchAgencySettings = async () => {
      // Validate subdomain before fetching
      if (!isSubdomain || !subdomain || !isValid) {
        if (subdomain && !isValid) {
          console.error(`[Production] Invalid subdomain format: "${subdomain}"`);
          setError('Invalid subdomain format. Please use lowercase letters, numbers, and hyphens only.');
        } else {
          console.log('[Production] Not a white-label subdomain, using main site');
        }
        setLoading(false);
        return;
      }

      console.log(`[Production] Initializing white-label site for subdomain: "${subdomain}"`);

      try {
        setLoading(true);
        setError(null);

        // First get the subdomain record with retry logic
        let subdomainAttempts = 3;
        let subdomainData = null;
        let lastSubdomainError = null;

        while (subdomainAttempts > 0 && !subdomainData) {
          const { data, error } = await supabase
            .from('agency_subdomains')
            .select('user_id, is_active')
            .eq('subdomain', subdomain)
            .eq('is_active', true)
            .maybeSingle();

          if (error) {
            lastSubdomainError = error;
            console.warn(`[Production] Subdomain lookup attempt failed (${subdomainAttempts} left):`, error);
            subdomainAttempts--;
            if (subdomainAttempts > 0) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          } else {
            subdomainData = data;
            break;
          }
        }

        if (lastSubdomainError && !subdomainData) {
          throw new Error(`Database connection issue. Please try again later. (Error: ${lastSubdomainError.message})`);
        }

        if (!subdomainData) {
          throw new Error(`Subdomain "${subdomain}" not found. Please verify the URL or contact support.`);
        }

        console.log(`[Production] Found subdomain mapping for user: ${subdomainData.user_id}`);

        // Then get the agency settings with retry logic
        let settingsAttempts = 3;
        let settingsData = null;
        let lastSettingsError = null;

        while (settingsAttempts > 0 && !settingsData) {
          const { data, error } = await supabase
            .from('agency_settings')
            .select('*')
            .eq('user_id', subdomainData.user_id)
            .maybeSingle();

          if (error) {
            lastSettingsError = error;
            console.warn(`[Production] Settings lookup attempt failed (${settingsAttempts} left):`, error);
            settingsAttempts--;
            if (settingsAttempts > 0) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          } else {
            settingsData = data;
            break;
          }
        }

        if (lastSettingsError && !settingsData) {
          throw new Error(`Unable to load agency configuration. Please try again later.`);
        }

        if (!settingsData) {
          throw new Error(`This subdomain is not configured yet. Please contact the agency owner to complete setup.`);
        }

        console.log('[Production] Successfully loaded white-label configuration:', {
          agency: settingsData.agency_name,
          hasLogo: !!settingsData.logo_url,
          theme: { primary: settingsData.primary_color, secondary: settingsData.secondary_color }
        });
        
        setAgencySettings(settingsData as unknown as AgencySettings);
      } catch (err) {
        console.error('[Production] White-label initialization failed:', err);
        setError(err instanceof Error ? err.message : 'Failed to load site configuration');
      } finally {
        setLoading(false);
      }
    };

    fetchAgencySettings();
  }, [subdomain, isSubdomain, isValid]);

  // Apply custom CSS when agency settings are loaded
  useEffect(() => {
    if (agencySettings?.custom_css) {
      const styleElement = document.createElement('style');
      styleElement.textContent = agencySettings.custom_css;
      styleElement.id = 'white-label-custom-css';
      document.head.appendChild(styleElement);

      return () => {
        const existingStyle = document.getElementById('white-label-custom-css');
        if (existingStyle) {
          existingStyle.remove();
        }
      };
    }
  }, [agencySettings?.custom_css]);

  // Update CSS custom properties for theming
  useEffect(() => {
    if (agencySettings) {
      const root = document.documentElement;
      root.style.setProperty('--primary', agencySettings.primary_color);
      root.style.setProperty('--secondary', agencySettings.secondary_color);
    }
  }, [agencySettings?.primary_color, agencySettings?.secondary_color]);

  // Update meta tags including Open Graph
  useEffect(() => {
    if (agencySettings) {
      const title = agencySettings.meta_title || agencySettings.agency_name || 'Professional Services';
      const description = agencySettings.meta_description || agencySettings.hero_subtitle || 'Professional services tailored to your needs';
      const imageUrl = agencySettings.logo_url || 'https://62eb24a0-3b9f-47a0-8b49-ae0cf07064b6.lovableproject.com/lovable-uploads/beb43643-f60c-4358-b759-a24b6f4678d5.png';
      
      // Update document title
      if (title) {
        document.title = title;
      }
      
      // Update meta description
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        document.head.appendChild(metaDescription);
      }
      metaDescription.setAttribute('content', description);

      // Update Open Graph tags
      const updateMetaTag = (property: string, content: string) => {
        let meta = document.querySelector(`meta[property="${property}"]`);
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('property', property);
          document.head.appendChild(meta);
        }
        meta.setAttribute('content', content);
      };

      updateMetaTag('og:title', title);
      updateMetaTag('og:description', description);
      updateMetaTag('og:image', imageUrl);
      updateMetaTag('og:type', 'website');

      // Update Twitter tags
      const updateTwitterTag = (name: string, content: string) => {
        let meta = document.querySelector(`meta[name="${name}"]`);
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('name', name);
          document.head.appendChild(meta);
        }
        meta.setAttribute('content', content);
      };

      updateTwitterTag('twitter:title', title);
      updateTwitterTag('twitter:description', description);
      updateTwitterTag('twitter:image', imageUrl);
      updateTwitterTag('twitter:card', 'summary_large_image');

      // Update favicon
      if (agencySettings.favicon_url) {
        let favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
        if (!favicon) {
          favicon = document.createElement('link');
          favicon.rel = 'icon';
          document.head.appendChild(favicon);
        }
        favicon.href = agencySettings.favicon_url;
      }
    }
  }, [agencySettings]);

  const value: WhiteLabelContextType = {
    agencySettings,
    loading,
    error,
    isWhiteLabel: isSubdomain,
    subdomain
  };

  return (
    <WhiteLabelContext.Provider value={value}>
      {children}
    </WhiteLabelContext.Provider>
  );
};