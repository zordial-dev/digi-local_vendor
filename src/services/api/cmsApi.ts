import { getApiBaseUrl, safeFetch } from './config';
import { SupportContactInfo, CmsPageData, CmsPageSummary } from './types';

// Default static fallback contacts
export const DEFAULT_SUPPORT_CONTACTS: SupportContactInfo = {
  phone: '+91 800-562-5999',
  email: 'support@digilocal.in',
  toll_free: '1800-123-4567',
  whatsapp: '+91 80056 25999',
  address: 'DigiLocal Tech Hub, Tower B, Sector 62, Noida, UP - 201309',
  working_hours: 'Monday to Saturday | 9:00 AM - 8:00 PM IST',
  updated_at: '2026-08-14T10:30:00.000Z',
};

// Default static fallback CMS pages
export const DEFAULT_CMS_PAGES: Record<string, CmsPageData> = {
  'help-support': {
    slug: 'help-support',
    title: 'Help & Support Center',
    meta_description: 'Official DigiLocal Help & Support, FAQ, Order Assistance, and Customer Service Contacts.',
    content: `# DigiLocal Help & Support Center\n\nWelcome to the DigiLocal Help & Support Center. We are here to assist residential vendors, merchants, and society residents with any inquiries.\n\n## 📞 Quick Contact Information\n- **Helpline Phone**: +91 800-562-5999\n- **Official Email**: support@digilocal.in\n- **Toll-Free Support**: 1800-123-4567\n- **WhatsApp Support**: +91 80056 25999\n- **Working Hours**: Monday to Saturday | 9:00 AM - 8:00 PM IST\n\n## ❓ Frequently Asked Questions\n\n### 1. How are vendor payouts settled?\nAll completed order payments are settled automatically on a **T+1 schedule** directly into your verified bank account.\n\n### 2. How do I add or update store products?\nGo to the **Menu** tab in your vendor terminal, tap **+ Add Product**, enter item name, price, stock, and upload photos.\n\n### 3. How do I verify my vendor registration?\nEnsure you complete OTP verification for your registered mobile number and upload your shop and bank account details.`,
    phone: '+91 800-562-5999',
    email: 'support@digilocal.in',
    contact: DEFAULT_SUPPORT_CONTACTS,
    updated_at: '2026-08-14T10:30:00.000Z',
  },
  'about-us': {
    slug: 'about-us',
    title: 'About DigiLocal',
    meta_description: 'Learn about DigiLocal, India premier hyperlocal enclave e-commerce and residential merchant ecosystem.',
    content: `# About DigiLocal\n\nDigiLocal is India's leading **Hyperlocal Enclave E-Commerce Platform**, designed specifically to connect residential societies, gated communities, and apartment complexes with trusted local neighborhood vendors.\n\n## 🎯 Our Mission\nEmpowering local neighborhood stores and micro-entrepreneurs with modern B2B vendor terminals, real-time inventory management, automated billing, and direct society order delivery.\n\n## 🌟 Core Values\n- **Hyperlocal Convenience**: Direct grocery, dairy, and essential deliveries within minutes.\n- **Vendor Empowerment**: Zero platform friction, automated daily settlements, and verified society access.\n- **Data Security**: Enterprise-grade encryption and privacy protection for all merchants and residents.`,
    phone: '+91 800-562-5999',
    email: 'support@digilocal.in',
    contact: DEFAULT_SUPPORT_CONTACTS,
    updated_at: '2026-08-14T10:30:00.000Z',
  },
  'privacy-policy': {
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    meta_description: 'DigiLocal Privacy Policy detailing data protection, encryption, user consent, and security standards.',
    content: `# DigiLocal Privacy Policy\n\n**Effective Date**: August 14, 2026\n\nDigiLocal ("we", "us", or "our") values your trust and is committed to protecting your personal information. This Privacy Policy details how we collect, store, and process vendor and customer data.\n\n## 1. Information We Collect\n- **Merchant Account Information**: Vendor name, store name, phone number, email address, shop address, and society location.\n- **Financial & Settlement Data**: Bank account number, IFSC code, and GSTIN/PAN details for automated payout disbursements.\n\n## 2. How We Use Information\n- Processing customer orders and notifying vendors in real-time.\n- Facilitating automated T+1 bank payouts and generating GST-compliant invoices.\n- Authenticating accounts securely via SMS OTP.\n\n## 3. Data Protection & Security\nAll credentials and financial records are encrypted using industry-standard AES-256 protocols. We never sell, rent, or trade your personal data to third parties.`,
    phone: '+91 800-562-5999',
    email: 'support@digilocal.in',
    contact: DEFAULT_SUPPORT_CONTACTS,
    updated_at: '2026-08-14T10:30:00.000Z',
  },
  'terms-conditions': {
    slug: 'terms-conditions',
    title: 'Terms & Conditions',
    meta_description: 'DigiLocal Terms & Conditions of Service for residents, customers, and vendor merchants.',
    content: `# DigiLocal Terms & Conditions\n\n**Effective Date**: August 14, 2026\n\nBy registering as a vendor partner or using the DigiLocal Vendor Terminal application, you agree to comply with the following Terms and Conditions.\n\n## 1. Vendor Obligations\n- Vendors must provide accurate pricing, stock availability, and genuine product descriptions.\n- Orders accepted must be prepared and fulfilled in a timely manner according to society guidelines.\n\n## 2. Settlement & Fees\n- Payouts are transferred automatically to the vendor's verified bank account on a T+1 settlement cycle.\n- Any applicable annual platform subscription fees or transaction processing fees are disclosed transparently.\n\n## 3. Account Termination\nDigiLocal reserves the right to suspend or terminate accounts that engage in fraudulent activities, counterfeit items, or repeated order cancellations.`,
    phone: '+91 800-562-5999',
    email: 'support@digilocal.in',
    contact: DEFAULT_SUPPORT_CONTACTS,
    updated_at: '2026-08-14T10:30:00.000Z',
  },
};

/**
 * 1. Fetch Support Contact Details
 * Route: GET /api/cms/contacts (or /api/support/contact-info)
 */
export const getSupportContactsApi = async (): Promise<SupportContactInfo> => {
  const baseUrl = getApiBaseUrl();
  try {
    const { res, data } = await safeFetch(`${baseUrl}/cms/contacts`);
    if (res.ok && data?.success && data?.data) {
      return data.data;
    }
    // Try fallback alias endpoint
    const aliasRes = await safeFetch(`${baseUrl}/support/contact-info`);
    if (aliasRes.res.ok && aliasRes.data?.success && aliasRes.data?.data) {
      return aliasRes.data.data;
    }
  } catch (err) {
    console.warn('⚠️ [CMS API] Failed to fetch live support contacts, using fallback:', err);
  }
  return DEFAULT_SUPPORT_CONTACTS;
};

/**
 * Convenience alias for getSupportContactsApi
 */
export const fetchSupportContacts = getSupportContactsApi;

/**
 * 2. Fetch Help & Support Page
 * Route: GET /api/help-support (or /api/cms/pages/help-support)
 */
export const getHelpSupportApi = async (): Promise<CmsPageData> => {
  const baseUrl = getApiBaseUrl();
  try {
    const { res, data } = await safeFetch(`${baseUrl}/help-support`);
    if (res.ok && data?.success && data?.data) {
      return data.data;
    }
    const pageRes = await safeFetch(`${baseUrl}/cms/pages/help-support`);
    if (pageRes.res.ok && pageRes.data?.success && pageRes.data?.data) {
      return pageRes.data.data;
    }
  } catch (err) {
    console.warn('⚠️ [CMS API] Failed to fetch Help & Support page, using fallback:', err);
  }
  return DEFAULT_CMS_PAGES['help-support'];
};

export const fetchHelpSupport = getHelpSupportApi;

/**
 * 3. Fetch About Us Page
 * Route: GET /api/about-us (or /api/cms/pages/about-us)
 */
export const getAboutUsApi = async (): Promise<CmsPageData> => {
  const baseUrl = getApiBaseUrl();
  try {
    const { res, data } = await safeFetch(`${baseUrl}/about-us`);
    if (res.ok && data?.success && data?.data) {
      return data.data;
    }
    const pageRes = await safeFetch(`${baseUrl}/cms/pages/about-us`);
    if (pageRes.res.ok && pageRes.data?.success && pageRes.data?.data) {
      return pageRes.data.data;
    }
  } catch (err) {
    console.warn('⚠️ [CMS API] Failed to fetch About Us page, using fallback:', err);
  }
  return DEFAULT_CMS_PAGES['about-us'];
};

export const fetchAboutUs = getAboutUsApi;

/**
 * 4. Fetch Privacy Policy Document
 * Route: GET /api/privacy-policy (or /api/cms/pages/privacy-policy)
 */
export const getPrivacyPolicyApi = async (): Promise<CmsPageData> => {
  const baseUrl = getApiBaseUrl();
  try {
    const { res, data } = await safeFetch(`${baseUrl}/privacy-policy`);
    if (res.ok && data?.success && data?.data) {
      return data.data;
    }
    const pageRes = await safeFetch(`${baseUrl}/cms/pages/privacy-policy`);
    if (pageRes.res.ok && pageRes.data?.success && pageRes.data?.data) {
      return pageRes.data.data;
    }
  } catch (err) {
    console.warn('⚠️ [CMS API] Failed to fetch Privacy Policy page, using fallback:', err);
  }
  return DEFAULT_CMS_PAGES['privacy-policy'];
};

export const fetchPrivacyPolicy = getPrivacyPolicyApi;

/**
 * 5. Fetch Terms & Conditions Document
 * Route: GET /api/terms-conditions (or /api/cms/pages/terms-conditions)
 */
export const getTermsConditionsApi = async (): Promise<CmsPageData> => {
  const baseUrl = getApiBaseUrl();
  try {
    const { res, data } = await safeFetch(`${baseUrl}/terms-conditions`);
    if (res.ok && data?.success && data?.data) {
      return data.data;
    }
    const pageRes = await safeFetch(`${baseUrl}/cms/pages/terms-conditions`);
    if (pageRes.res.ok && pageRes.data?.success && pageRes.data?.data) {
      return pageRes.data.data;
    }
  } catch (err) {
    console.warn('⚠️ [CMS API] Failed to fetch Terms & Conditions page, using fallback:', err);
  }
  return DEFAULT_CMS_PAGES['terms-conditions'];
};

export const fetchTermsConditions = getTermsConditionsApi;

/**
 * 6. List All Available CMS Pages
 * Route: GET /api/cms/pages
 */
export const getCmsPagesApi = async (): Promise<CmsPageSummary[]> => {
  const baseUrl = getApiBaseUrl();
  try {
    const { res, data } = await safeFetch(`${baseUrl}/cms/pages`);
    if (res.ok && data?.success && Array.isArray(data?.data)) {
      return data.data;
    }
  } catch (err) {
    console.warn('⚠️ [CMS API] Failed to list CMS pages, using fallback list:', err);
  }
  return Object.values(DEFAULT_CMS_PAGES).map(p => ({
    slug: p.slug,
    title: p.title,
    meta_description: p.meta_description,
    updated_at: p.updated_at,
  }));
};

export const fetchCmsPages = getCmsPagesApi;

/**
 * 7. Fetch Any CMS Page by Slug
 * Route: GET /api/cms/pages/:slug
 */
export const getCmsPageBySlugApi = async (slug: string): Promise<CmsPageData> => {
  const baseUrl = getApiBaseUrl();
  try {
    const { res, data } = await safeFetch(`${baseUrl}/cms/pages/${slug}`);
    if (res.ok && data?.success && data?.data) {
      return data.data;
    }
  } catch (err) {
    console.warn(`⚠️ [CMS API] Failed to fetch page [${slug}], using fallback:`, err);
  }
  return DEFAULT_CMS_PAGES[slug] || {
    slug,
    title: slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    content: `# ${slug}\n\nContent for this page is being updated.`,
    phone: DEFAULT_SUPPORT_CONTACTS.phone,
    email: DEFAULT_SUPPORT_CONTACTS.email,
    contact: DEFAULT_SUPPORT_CONTACTS,
    updated_at: new Date().toISOString(),
  };
};

export const fetchCmsPageBySlug = getCmsPageBySlugApi;

/**
 * 8. Update CMS Page Content (Admin)
 * Route: PUT /api/cms/pages/:slug (or /api/admin/cms/pages/:slug)
 */
export const updateCmsPageApi = async (
  slug: string,
  pageData: { title?: string; content?: string; meta_description?: string },
  adminToken?: string
): Promise<{ success: boolean; message?: string; data?: CmsPageData }> => {
  const baseUrl = getApiBaseUrl();
  const headers: Record<string, string> = {};
  if (adminToken) {
    headers['Authorization'] = `Bearer ${adminToken}`;
  }

  const { res, data } = await safeFetch(`${baseUrl}/cms/pages/${slug}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(pageData),
  });

  if (!res.ok) {
    throw new Error(data?.message || `Failed to update CMS page [${slug}]`);
  }
  return data;
};

/**
 * 9. Update Support Contact Details (Admin)
 * Route: PUT /api/cms/contacts (or /api/admin/cms/contacts)
 */
export const updateSupportContactsApi = async (
  contactData: Partial<SupportContactInfo>,
  adminToken?: string
): Promise<{ success: boolean; message?: string; data?: SupportContactInfo }> => {
  const baseUrl = getApiBaseUrl();
  const headers: Record<string, string> = {};
  if (adminToken) {
    headers['Authorization'] = `Bearer ${adminToken}`;
  }

  const { res, data } = await safeFetch(`${baseUrl}/cms/contacts`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(contactData),
  });

  if (!res.ok) {
    throw new Error(data?.message || 'Failed to update support contact details');
  }
  return data;
};
