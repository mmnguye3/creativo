# White-Label Production Setup Guide

## Overview
This guide walks you through deploying your white-label multi-tenant platform to production with custom domain and wildcard subdomain support.

## Prerequisites
- A custom domain (e.g., `youragency.com`)
- Access to your domain registrar's DNS settings
- Lovable project with white-label features implemented
- Admin access to your Lovable project

## Step-by-Step Setup

### 1. Domain Setup in Lovable

1. Navigate to your Lovable project
2. Click **Project Settings** → **Domains**
3. Click **Connect Domain**
4. Enter your domain name (e.g., `youragency.com`)
5. Follow the on-screen instructions to add DNS records

### 2. DNS Configuration at Your Domain Registrar

Add the following DNS records at your domain registrar (e.g., Namecheap, GoDaddy, Cloudflare):

#### Required A Records:

```
Type: A
Name: @
Value: 185.158.133.1
TTL: 3600
```

```
Type: A
Name: www
Value: 185.158.133.1
TTL: 3600
```

```
Type: A
Name: *
Value: 185.158.133.1
TTL: 3600
```

**Important:** The wildcard A record (`*`) is critical for subdomain routing. It allows any subdomain (e.g., `client1.youragency.com`, `agency2.youragency.com`) to resolve to your Lovable application.

### 3. Verify DNS Propagation

DNS changes can take 24-48 hours to propagate globally. Check propagation status:

1. Visit [DNSChecker.org](https://dnschecker.org)
2. Enter your domain name
3. Select "A" record type
4. Verify the IP shows as `185.158.133.1` globally

### 4. SSL Certificate Provisioning

Lovable automatically provisions SSL certificates for:
- Your root domain (`youragency.com`)
- WWW subdomain (`www.youragency.com`)
- All wildcard subdomains (`*.youragency.com`)

**Timeline:** SSL certificates are typically provisioned within 1-24 hours after DNS propagation completes.

**Note:** If you have CAA records on your domain, ensure they allow Let's Encrypt for SSL certificate issuance.

## How the White-Label System Works

### Subdomain Detection

The application automatically detects subdomains in two modes:

**Development Mode:**
- Uses URL parameters: `https://yourproject.lovableproject.com?subdomain=client1`
- Perfect for testing before DNS is configured
- Click "External Link" icon in Subdomain Management to test

**Production Mode:**
- Uses actual subdomains: `https://client1.youragency.com`
- Automatically activated once DNS is configured
- No code changes needed - the system detects the mode automatically

### Data Flow

1. User visits `client1.youragency.com`
2. Application detects subdomain `client1`
3. Queries `agency_subdomains` table to find associated `user_id`
4. Fetches agency settings from `agency_settings` table
5. Applies custom branding (logo, colors, content)
6. Renders white-labeled site

### Subdomain Validation

Subdomains must follow these rules:
- 3-63 characters long
- Lowercase letters, numbers, and hyphens only
- Must start and end with alphanumeric character
- Cannot be `www` or `api` (reserved)

## Admin Workflow

### Creating a Subdomain for a Client

1. Log in to your admin dashboard
2. Navigate to **Subdomain Management**
3. Click **Create Subdomain**
4. Fill in the form:
   - **Subdomain Name:** Client's subdomain (e.g., "client1")
   - **Select User:** The agency owner's account
   - **Agency Name:** Display name (optional)
5. Click **Create Subdomain**
6. The subdomain is immediately active

### Client Access

Share the subdomain URL with your client:
- **During setup:** `https://yourproject.lovableproject.com?subdomain=client1`
- **After DNS setup:** `https://client1.youragency.com`

### Managing Subdomains

From the Subdomain Management table, you can:
- **Toggle Status:** Enable/disable subdomains with the switch
- **View:** Click external link icon to open the white-label site
- **Delete:** Remove subdomains permanently

## Testing Checklist

### Pre-Production (Development Mode)
- [ ] Create test subdomain in admin dashboard
- [ ] Access via URL parameter (`?subdomain=test`)
- [ ] Verify agency settings load correctly
- [ ] Test contact form submission
- [ ] Test order/cart functionality
- [ ] Check custom branding (logo, colors, content)
- [ ] Verify responsive design on mobile

### Post-Production (Live Subdomains)
- [ ] Verify DNS propagation complete (DNSChecker.org)
- [ ] Access root domain (`youragency.com`)
- [ ] Access www subdomain (`www.youragency.com`)
- [ ] Access test subdomain (`test.youragency.com`)
- [ ] Verify SSL certificate is active (https with green padlock)
- [ ] Test multiple subdomains from different devices
- [ ] Monitor Supabase logs for any errors
- [ ] Check Edge Function logs for contact form submissions

## Performance Optimization

### Caching Strategy

The current implementation fetches agency settings on each page load with retry logic. For high-traffic scenarios, consider:

1. **Browser Caching:** Settings are cached in React state during the session
2. **Retry Logic:** Automatic retries (3 attempts) for database queries
3. **Error Handling:** User-friendly error messages with recovery suggestions

### Monitoring

Monitor these metrics in production:

1. **Supabase Dashboard:**
   - Query performance (slow queries)
   - Database connections
   - RLS policy performance

2. **Edge Function Logs:**
   - Contact form submissions
   - Error rates
   - Response times

3. **Browser Console:**
   - Subdomain detection logs
   - Agency settings fetch logs
   - Any JavaScript errors

## Troubleshooting

### Subdomain Not Loading

**Symptom:** Visiting `client1.youragency.com` shows an error

**Solutions:**
1. Verify DNS propagation is complete (DNSChecker.org)
2. Check wildcard A record (`*`) is configured
3. Verify subdomain exists in `agency_subdomains` table
4. Check `is_active` is set to `true`
5. Clear browser cache and try incognito mode

### Wrong Agency Settings Showing

**Symptom:** Subdomain shows incorrect branding

**Solutions:**
1. Verify subdomain → user_id mapping in `agency_subdomains`
2. Check agency settings in `agency_settings` for that user_id
3. Clear browser cache
4. Check browser console for subdomain detection logs

### SSL Certificate Not Working

**Symptom:** Browser shows "Not Secure" warning

**Solutions:**
1. Wait 24-48 hours after DNS propagation
2. Check CAA records allow Let's Encrypt
3. Verify all A records point to correct IP (185.158.133.1)
4. Contact Lovable support if issue persists after 48 hours

### Database Errors

**Symptom:** "Failed to load agency configuration" error

**Solutions:**
1. Check Supabase connection status
2. Verify RLS policies allow public reads for agency_settings
3. Check database logs in Supabase dashboard
4. Ensure user_id exists in both tables

## Security Considerations

### Row-Level Security (RLS)

The following RLS policies are already in place:

**agency_subdomains:**
- Users can only modify their own subdomains
- Admins have full access
- Public can read active subdomains (required for white-label)

**agency_settings:**
- Users can only modify their own settings
- Public can read settings (required for white-label display)
- Sensitive data is protected at the application level

### Best Practices

1. **Never expose sensitive data** in agency_settings that should be private
2. **Validate subdomain format** on both client and server (already implemented)
3. **Monitor admin actions** in Subdomain Management
4. **Use HTTPS only** (enforced by Lovable)
5. **Implement rate limiting** for high-traffic scenarios

## Post-Launch Maintenance

### Regular Tasks

1. **Weekly:**
   - Check SSL certificate status
   - Review error logs
   - Monitor database performance

2. **Monthly:**
   - Review active subdomains
   - Clean up inactive/test subdomains
   - Check Supabase usage metrics

3. **As Needed:**
   - Add new subdomains for clients
   - Update agency settings
   - Respond to client support requests

## Support Resources

- **Lovable Documentation:** [docs.lovable.dev](https://docs.lovable.dev)
- **Custom Domains Guide:** See project documentation
- **Supabase Documentation:** [supabase.com/docs](https://supabase.com/docs)
- **DNS Help:** DNSChecker.org for propagation status

## Summary

Your white-label platform is production-ready with:
- ✅ Automatic subdomain detection (dev & production)
- ✅ Robust error handling with retries
- ✅ Subdomain validation
- ✅ SSL certificate support
- ✅ Performance optimizations
- ✅ Security best practices

**Next Steps:**
1. Configure DNS at your domain registrar
2. Wait for DNS propagation (24-48 hours)
3. Test subdomains thoroughly
4. Start onboarding clients!

---

*Last Updated: 2025-10-10*
