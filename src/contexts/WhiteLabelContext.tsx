import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSubdomain } from '@/hooks/useSubdomain';

export interface AgencySettings {
  id: string;
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
  const { subdomain, isSubdomain } = useSubdomain();

  useEffect(() => {
    const fetchAgencySettings = async () => {
      if (!isSubdomain || !subdomain) {
        console.log('Not a subdomain or no subdomain found:', { isSubdomain, subdomain });
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log('Fetching agency settings for subdomain:', subdomain);

        // First get the subdomain record
        const { data: subdomainData, error: subdomainError } = await supabase
          .from('agency_subdomains')
          .select('user_id')
          .eq('subdomain', subdomain)
          .eq('is_active', true)
          .maybeSingle();

        console.log('Subdomain query result:', { subdomainData, subdomainError });

        if (subdomainError) {
          throw new Error(`Subdomain lookup failed: ${subdomainError.message}`);
        }

        if (!subdomainData) {
          throw new Error(`Subdomain "${subdomain}" not found or inactive. Please contact your agency to activate your subdomain.`);
        }

        // Then get the agency settings for this user
        const { data: settingsData, error: settingsError } = await supabase
          .from('agency_settings')
          .select('*')
          .eq('user_id', subdomainData.user_id)
          .maybeSingle();

        console.log('Settings query result:', { settingsData, settingsError });

        if (settingsError) {
          throw new Error(`Agency settings lookup failed: ${settingsError.message}`);
        }

        if (!settingsData) {
          throw new Error(`Agency settings not configured for subdomain "${subdomain}". Please contact your agency to complete setup.`);
        }

        console.log('Successfully loaded agency settings:', settingsData);
        setAgencySettings(settingsData);
      } catch (err) {
        console.error('Error fetching agency settings:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchAgencySettings();
  }, [subdomain, isSubdomain]);

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