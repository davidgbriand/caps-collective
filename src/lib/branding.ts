/**
 * Branding Constants
 * 
 * This file contains configurable text and branding elements for the Caps Collective portal.
 * Update these values to change branding across the application.
 */

export const BRANDING = {
  // Portal name
  portalName: 'Caps Collective',

  // Organization
  organization: 'Vancouver Whitecaps FC',

  // Page titles
  pageTitle: 'Caps Collective - Community Relationship Mapping',
  pageDescription: 'Connect skills, relationships, and community needs',

  // Hero section text
  // TODO: Pending final copy from client - update this text when provided
  heroTagline: 'Community-Powered Connections',
  heroDescription: `Parents who bring intention, expertise, and meaningful resources
partner with us to build the most elite high-performance
pathway in the country—strengthening the environment
their child relies on to grow and excel.
"Build Their Future with Us."`,

  // Call to action buttons
  ctaJoin: 'Join Caps Collective',
  ctaSignIn: 'Sign In',

  // Footer
  footerText: '© 2025 Whitecaps London. All rights reserved.',

  // Alt text for logos
  logoAlt: 'Whitecaps FC',
} as const;

// Feature cards on landing page
// TODO: Pending final copy from client - update these descriptions when provided
export const LANDING_FEATURES = [
  {
    icon: '⚽',
    title: 'Share Your Skills',
    description: 'List your professional skills and choose how you want to help — pro bono, discount, or advice.',
    color: 'bg-[#00245D]',
  },
  {
    icon: '🤝',
    title: 'Map Connections',
    description: 'Document your network of organizations and key contacts across different sectors.',
    color: 'bg-[#99D6EA]',
  },
  {
    icon: '🏆',
    title: 'Match & Connect',
    description: 'Get matched to community needs based on your skills and connections using our AI-powered matching.',
    color: 'bg-[#00245D]',
  },
] as const;

// Stats displayed on landing page (currently showing goals, not real-time data)
// TODO: Add admin toggle to switch between "Goals" and "Real Stats"
export const LANDING_STATS = [
  { number: '1,500+', label: 'Community Members' },
  { number: '3,500+', label: 'Skills Mapped' },
  { number: '175+', label: 'Connections Made' },
] as const;

