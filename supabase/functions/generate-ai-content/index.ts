import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { serviceType, description, userId, generationId } = await req.json();

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Generating content for service: ${serviceType}, user: ${userId}`);

    // Define service-specific prompts and content types
    const serviceConfig = {
      // Design Services
      'social-media-graphics': {
        contentType: 'combo',
        textPrompt: `Create engaging social media graphics copy for: ${description}. Include platform-specific text, hashtags, and engaging captions.`,
        imagePrompt: `Create vibrant, engaging social media graphics for: ${description}. Modern, eye-catching design optimized for social platforms.`
      },
      'logo-branding': {
        contentType: 'image',
        textPrompt: null,
        imagePrompt: `Create a modern, professional logo design for: ${description}. Clean, minimalist style with strong brand identity. Vector-style design with clear typography.`
      },
      'print-design': {
        contentType: 'combo',
        textPrompt: `Create print design copy and specifications for: ${description}. Include layout guidelines, text content, and design requirements.`,
        imagePrompt: `Create professional print design materials for: ${description}. High-quality, print-ready design with proper formatting.`
      },
      'illustrations': {
        contentType: 'image',
        textPrompt: null,
        imagePrompt: `Create a custom illustration for: ${description}. Professional, high-quality artwork with modern style and vibrant colors.`
      },
      'packaging-design': {
        contentType: 'image',
        textPrompt: null,
        imagePrompt: `Create professional packaging design for: ${description}. Attractive, market-ready packaging with clear branding and product information.`
      },

      // Video Content
      'short-form-video': {
        contentType: 'text',
        textPrompt: `Create a short-form video editing concept and script for: ${description}. Include shot sequences, timing, transitions, and text overlays for platforms like TikTok and Instagram Reels.`,
        imagePrompt: null
      },
      'long-form-video': {
        contentType: 'text',
        textPrompt: `Create a comprehensive long-form video editing plan for: ${description}. Include detailed structure, chapter markers, visual elements, and production guidelines.`,
        imagePrompt: null
      },
      'motion-graphics': {
        contentType: 'text',
        textPrompt: `Create a motion graphics concept and storyboard for: ${description}. Include animation sequences, timing, visual effects, and technical specifications.`,
        imagePrompt: null
      },
      'video-ads': {
        contentType: 'text',
        textPrompt: `Create a video advertisement concept and script for: ${description}. Include storyboard, call-to-action, target audience considerations, and platform optimization.`,
        imagePrompt: null
      },
      'animated-explainers': {
        contentType: 'text',
        textPrompt: `Create an animated explainer video concept for: ${description}. Include script, visual style guide, character descriptions, and scene breakdown.`,
        imagePrompt: null
      },

      // Web Development
      'website-design': {
        contentType: 'combo',
        textPrompt: `Create a comprehensive website design concept for: ${description}. Include site structure, page layouts, content strategy, and user experience guidelines.`,
        imagePrompt: `Create modern website design mockups for: ${description}. Clean, professional layouts with intuitive navigation and responsive design.`
      },
      'landing-pages': {
        contentType: 'combo',
        textPrompt: `Create a high-converting landing page copy and structure for: ${description}. Include headlines, value propositions, call-to-actions, and conversion optimization elements.`,
        imagePrompt: `Create compelling landing page design mockups for: ${description}. Focus on conversion optimization and clear visual hierarchy.`
      },
      'ui-ux-design': {
        contentType: 'combo',
        textPrompt: `Create UI/UX design specifications for: ${description}. Include user flow, wireframes, interface guidelines, and usability considerations.`,
        imagePrompt: `Create modern UI/UX design mockups for: ${description}. Intuitive interface design with excellent user experience.`
      },
      'figma-prototypes': {
        contentType: 'combo',
        textPrompt: `Create Figma prototype specifications for: ${description}. Include interactive elements, user flows, component systems, and prototyping guidelines.`,
        imagePrompt: `Create Figma prototype designs for: ${description}. Interactive, professional prototypes with detailed components.`
      },
      'responsive-design': {
        contentType: 'combo',
        textPrompt: `Create responsive design guidelines for: ${description}. Include breakpoints, mobile-first approach, and cross-device optimization strategies.`,
        imagePrompt: `Create responsive design mockups for: ${description}. Multi-device layouts optimized for desktop, tablet, and mobile.`
      },

      // Marketing Materials
      'email-templates': {
        contentType: 'text',
        textPrompt: `Create professional email template content for: ${description}. Include subject lines, engaging copy, call-to-actions, and HTML structure guidelines.`,
        imagePrompt: null
      },
      'presentations': {
        contentType: 'text',
        textPrompt: `Create a comprehensive presentation outline for: ${description}. Include slide titles, key points, speaker notes, and visual design recommendations.`,
        imagePrompt: null
      },
      'brochures': {
        contentType: 'combo',
        textPrompt: `Create brochure content and structure for: ${description}. Include compelling copy, information hierarchy, and layout specifications.`,
        imagePrompt: `Create professional brochure design for: ${description}. Clean, informative layout with excellent visual presentation.`
      },
      'flyers': {
        contentType: 'combo',
        textPrompt: `Create eye-catching flyer content for: ${description}. Include headlines, key information, call-to-actions, and design specifications.`,
        imagePrompt: `Create vibrant, attention-grabbing flyer design for: ${description}. Bold, impactful design that stands out.`
      },
      'sales-materials': {
        contentType: 'text',
        textPrompt: `Create compelling sales materials for: ${description}. Include value propositions, key benefits, objection handling, and persuasive copy.`,
        imagePrompt: null
      },

      // E-commerce Solutions
      'amazon-a-plus': {
        contentType: 'combo',
        textPrompt: `Create Amazon A+ content copy for: ${description}. Include product features, benefits, brand story, and SEO-optimized descriptions.`,
        imagePrompt: `Create Amazon A+ content graphics for: ${description}. Professional, conversion-focused visuals that highlight product benefits.`
      },
      'product-photography': {
        contentType: 'image',
        textPrompt: null,
        imagePrompt: `Create professional product photography concepts for: ${description}. High-quality, commercial-grade images with proper lighting and composition.`
      },
      'storefront-design': {
        contentType: 'combo',
        textPrompt: `Create e-commerce storefront strategy for: ${description}. Include layout recommendations, product organization, and conversion optimization.`,
        imagePrompt: `Create attractive e-commerce storefront designs for: ${description}. Professional, conversion-focused online store layouts.`
      },
      'listing-optimization': {
        contentType: 'text',
        textPrompt: `Create optimized product listing content for: ${description}. Include SEO keywords, compelling descriptions, bullet points, and conversion elements.`,
        imagePrompt: null
      },
      'product-mockups': {
        contentType: 'image',
        textPrompt: null,
        imagePrompt: `Create realistic product mockups for: ${description}. Professional presentation in real-world contexts and usage scenarios.`
      },

      // Print & Packaging
      'business-cards': {
        contentType: 'image',
        textPrompt: null,
        imagePrompt: `Create professional business card designs for: ${description}. Clean, memorable design that represents the brand effectively.`
      },
      'labels': {
        contentType: 'image',
        textPrompt: null,
        imagePrompt: `Create product label designs for: ${description}. Clear, attractive labels that meet regulatory requirements and brand standards.`
      },
      'banners': {
        contentType: 'image',
        textPrompt: null,
        imagePrompt: `Create large format banner designs for: ${description}. High-impact, readable design optimized for viewing distance.`
      },
      'signage-design': {
        contentType: 'image',
        textPrompt: null,
        imagePrompt: `Create professional signage designs for: ${description}. Clear, functional design that provides excellent visibility and information.`
      }
    };

    const config = serviceConfig[serviceType as keyof typeof serviceConfig];
    if (!config) {
      throw new Error(`Unsupported service type: ${serviceType}`);
    }

    let generatedContent = null;
    let imageUrl = null;

    // Helper function for retry with exponential backoff
    const retryWithBackoff = async (fn: () => Promise<Response>, maxRetries = 3) => {
      for (let i = 0; i < maxRetries; i++) {
        try {
          const response = await fn();
          if (response.ok) return response;
          
          // Check for rate limit error
          if (response.status === 429) {
            const waitTime = Math.pow(2, i) * 1000; // 1s, 2s, 4s
            console.log(`Rate limited, waiting ${waitTime}ms before retry ${i + 1}`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
          
          // For other errors, throw immediately
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        } catch (error) {
          if (i === maxRetries - 1) throw error;
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
      }
      throw new Error('Max retries exceeded');
    };

    // Generate text content if needed
    if (config.textPrompt) {
      const textResponse = await retryWithBackoff(() => 
        fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: 'You are a professional marketing and design assistant. Create high-quality, engaging content.' },
              { role: 'user', content: config.textPrompt }
            ],
            max_tokens: 1000,
            temperature: 0.7,
          }),
        })
      );

      const textData = await textResponse.json();
      generatedContent = textData.choices[0].message.content;
    }

    // Generate image if needed
    if (config.imagePrompt) {
      const imageResponse = await retryWithBackoff(() =>
        fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'dall-e-3',
            prompt: config.imagePrompt,
            n: 1,
            size: '1024x1024',
            quality: 'standard',
          }),
        })
      );

      const imageData = await imageResponse.json();
      imageUrl = imageData.data[0].url;
    }

    // Update the generation record with results as draft
    const { error: updateError } = await supabase
      .from('ai_generations')
      .update({
        generated_content: generatedContent,
        image_url: imageUrl,
        status: 'draft',
        updated_at: new Date().toISOString(),
      })
      .eq('id', generationId);

    if (updateError) {
      console.error('Error updating generation:', updateError);
      throw new Error('Failed to save generation results');
    }

    console.log(`Successfully generated content for generation ${generationId}`);

    return new Response(
      JSON.stringify({
        success: true,
        generatedContent,
        imageUrl,
        contentType: config.contentType,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-ai-content function:', error);
    
    // Update the generation record to failed status
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { serviceType, description, userId, generationId } = await req.json().catch(() => ({}));
    
    if (generationId) {
      await supabase
        .from('ai_generations')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', generationId);
    }
    
    // Provide specific error messages for common issues
    let errorMessage = 'Failed to generate content';
    if (error.message.includes('429') || error.message.includes('Too Many Requests')) {
      errorMessage = 'OpenAI API rate limit exceeded. Please try again in a few moments.';
    } else if (error.message.includes('Bad Request')) {
      errorMessage = 'Invalid request to OpenAI API. Please check your input and try again.';
    } else if (error.message.includes('OpenAI API key not configured')) {
      errorMessage = 'OpenAI API key is not configured. Please contact support.';
    }
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage, 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});