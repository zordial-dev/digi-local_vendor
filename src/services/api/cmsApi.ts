import { getApiBaseUrl, safeFetch } from './config';
import { SupportContactInfo, CmsPageData, CmsPageSummary } from './types';

// Default static fallback contacts
export const DEFAULT_SUPPORT_CONTACTS: SupportContactInfo = {
  phone: '+91 94613 53008',
  email: 'products@zordial.com',
  toll_free: '+91 94613 53008',
  whatsapp: '+91 94613 53008',
  address: 'Near Tonk Road, Pratap Nagar, Jaipur, Rajasthan, India',
  working_hours: 'Monday to Saturday | 9:00 AM - 8:00 PM IST',
  updated_at: '2026-08-18T12:00:00.000Z',
};

// Default static fallback CMS pages
export const DEFAULT_CMS_PAGES: Record<string, CmsPageData> = {
  'help-support': {
    slug: 'help-support',
    title: 'Help & Support',
    meta_description: 'Official DigiLocal Vendor Help & Support, FAQs, Store Guides, and Customer Service Contacts.',
    content: `# Help & Support\n\n## We're Here to Help\nWelcome to DigiLocal Vendor. If you need assistance with your account, orders, payments, products, or any other feature of the DigiLocal Vendor app, our support team is here to help.\n\n## Common Help Topics\n\n### 1. Account & Login\n- Trouble logging in or receiving an OTP\n- Updating your mobile number or email address\n- Account verification issues\n- Password or account-security concerns\n\n### 2. Store & Profile\n- Updating store information\n- Changing store category or society details\n- Uploading or changing your store logo\n- Updating business or GST information\n\n### 3. Products & Catalogue\n- Adding or editing products\n- Updating prices\n- Setting product units such as kg, litre, packet, piece, etc.\n- Updating stock status\n- Uploading product images\n- Marking products as Out of Stock\n\n### 4. Orders\n- New order notifications\n- Accepting or rejecting orders\n- Updating order status\n- Preparing and completing orders\n- Delivery-related issues\n- Cancelled or disputed orders\n\n### 5. Payments & Payouts\n- Checking earnings\n- Viewing payout history\n- Bank-account verification\n- T+1 settlement queries\n- Missing or delayed payouts\n- Commission or platform-fee queries\n\n### 6. Customer Issues\nIf a customer reports a missing, incorrect, damaged, expired or defective product, please contact DigiLocal Support promptly and cooperate with the resolution process.\n\n---\n\n## Contact DigiLocal Support\n- **Email**: products@zordial.com\n- **Helpline**: +91 94613 53008\n- **Operating Entity**: Zordial Technologies Private Limited\n- **Platform**: DigiLocal Technologies\n- **Address**: Near Tonk Road, Pratap Nagar, Jaipur, Rajasthan, India\n\n### Support Query Guidelines\nPlease provide the following whenever applicable:\n- Vendor/store name\n- Registered mobile number\n- Order ID\n- Society name\n- Description of the issue\n- Relevant screenshots or photographs\n*This helps us resolve your issue faster.*\n\n> **Important Security Notice**: DigiLocal Support will never ask you to share your OTP, password, UPI PIN, ATM PIN or other confidential authentication credentials. For security reasons, do not share such information with anyone claiming to represent DigiLocal.`,
    phone: '+91 94613 53008',
    email: 'products@zordial.com',
    contact: DEFAULT_SUPPORT_CONTACTS,
    updated_at: '2026-08-18T12:00:00.000Z',
  },
  'about-us': {
    slug: 'about-us',
    title: 'About DigiLocal',
    meta_description: 'Learn about DigiLocal — powering local businesses, neighbourhood shops, and society commerce.',
    content: `# About DigiLocal\n\n## Powering Local Businesses Inside Communities\nDigiLocal is a hyperlocal digital commerce platform built to connect local vendors with residents of residential societies and gated communities.\n\nWe believe that the neighbourhood shops people already trust should have access to simple, modern digital tools without having to build their own technology.\n\nWith **DigiLocal Vendor**, local merchants can manage their business digitally—from products and inventory to customer orders, deliveries and payouts.\n\n---\n\n## What DigiLocal Does\nDigiLocal helps local vendors:\n- Create and manage their digital store;\n- Add products and manage pricing;\n- Define product quantities and units;\n- Update stock availability;\n- Receive instant customer orders;\n- Manage order status;\n- Track sales and earnings;\n- Receive automated payouts;\n- Serve customers within participating communities more efficiently.\n\n---\n\n## Built for Local Commerce\nDigiLocal is designed specifically for the unique needs of residential societies, gated communities and local neighbourhood commerce.\n\nInstead of relying only on traditional offline ordering, vendors can use DigiLocal to create a convenient digital connection with residents while continuing to operate their local businesses.\n\n---\n\n## Our Vision\nOur vision is to make local commerce faster, simpler and more connected.\n\nWe want residents to discover and order everyday essentials from trusted nearby businesses while giving local vendors the technology they need to grow their business digitally.\n\n---\n\n## Our Commitment\nWe aim to build DigiLocal around:\n- **Local First**: Supporting neighbourhood businesses and community-based commerce.\n- **Simple Technology**: Making digital tools easy for vendors to understand and use.\n- **Reliable Service**: Helping vendors respond to orders and serve customers efficiently.\n- **Transparency**: Providing clear information about orders, payments, payouts and platform services.\n- **Community Focus**: Building a digital ecosystem that works for vendors, residents and participating societies.\n\n---\n\n## DigiLocal Vendor\nDigiLocal Vendor is the merchant application developed for businesses participating in the DigiLocal ecosystem.\nThrough the Vendor app, merchants can manage their digital storefront and fulfil orders received from customers within participating communities.\n\n---\n\n## Operating Details\n- **Operated By**: Zordial Technologies Private Limited\n- **Brand**: DigiLocal Technologies\n- **Support Email**: products@zordial.com\n- **Helpline**: +91 94613 53008\n- **Address**: Near Tonk Road, Pratap Nagar, Jaipur, Rajasthan, India\n\n> *DigiLocal — Your Society. Your Vendor. Your Doorstep.*`,
    phone: '+91 94613 53008',
    email: 'products@zordial.com',
    contact: DEFAULT_SUPPORT_CONTACTS,
    updated_at: '2026-08-18T12:00:00.000Z',
  },
  'privacy-policy': {
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    meta_description: 'DigiLocal Vendor Privacy Policy detailing information collection, device permissions, customer data protection, and grievance redressal.',
    content: `# Privacy Policy\n\n**Effective Date**: 10/08/2026  \n**Last Updated**: 18/08/2026  \n\nThis Privacy Policy explains how **Zordial Technologies Private Limited**, operating the DigiLocal platform (“DigiLocal”, “we”, “us” or “our”), collects, uses, stores and protects information when you use the DigiLocal Vendor application (\`com.digilocal.vendor\`) and related services.\n\nDigiLocal Vendor is a merchant platform that enables local shops and suppliers operating within or servicing residential societies and gated communities to manage their stores, products, orders, customers and payouts.\n\nBy registering for or using DigiLocal Vendor, you acknowledge that you have read and understood this Privacy Policy.\n\n---\n\n## 1. Information We Collect\n\n### 1.1 Vendor Personal Information\nWe may collect:\n- Full name\n- Mobile number\n- Email address\n- Account credentials\n- OTP authentication information\n- Profile information\n- Vendor account and verification information\n\n### 1.2 Business Information\nWe may collect:\n- Store/business name\n- Shop address\n- Business category\n- Residential society name and Society ID\n- Store logo\n- Product catalogue\n- Product images\n- Business operating information\n\n### 1.3 Government and Tax Information\nWhere applicable, we may collect:\n- GSTIN\n- PAN\n- GST-related information\n- Other information reasonably required for business verification, taxation or legal compliance\n\n### 1.4 Banking and Payout Information\nFor vendor settlements, we may collect:\n- Account holder name\n- Bank account number\n- IFSC code\n- UPI ID\n- Payout and settlement information\n- Transaction references\n\n*Bank and payment information is used for legitimate payment and settlement purposes and may be shared with relevant payment, banking and settlement service providers.*\n\n---\n\n## 2. Customer Information Accessible to Vendors\nWhen a customer places an order through DigiLocal, a vendor may receive information necessary to fulfil that order, which may include:\n- Customer name\n- Customer phone number\n- Tower/block information\n- Flat/unit number\n- Delivery information\n- Ordered products\n- Quantity and unit\n- Order value\n- Order status\n\n### Vendor Data-Use Restrictions\nCustomer information provided to a vendor is strictly for fulfilling and supporting the relevant DigiLocal order.  \n**Vendors must NOT:**\n- Copy or permanently store customer information unnecessarily;\n- Sell or share customer information;\n- Use customer phone numbers for personal marketing;\n- Send unsolicited promotional messages;\n- Contact customers for unrelated business purposes;\n- Use flat/unit information for unauthorized purposes;\n- Export customer information from the Platform;\n- Share customer information with unauthorized persons.\n\n*Any misuse of customer information may result in account suspension or termination and may also lead to legal action where applicable.*\n\n---\n\n## 3. Device Permissions\nDepending on the features enabled in the application, DigiLocal Vendor may request access to:\n\n- **Notifications**:\n  - New order alerts\n  - Order status updates\n  - Payment notifications\n  - Important account notifications\n- **Alarm / Background Notification Features**:\n  - Certain Android permissions may be used to provide high-priority order alerts, including sound notifications or other permitted alert mechanisms when the application is running in the background.\n- **Microphone**:\n  - Microphone access may be used for voice-based product search and hands-free interactions.\n  - Audio may be processed to convert speech into text. We do not intend to permanently store voice recordings for unrelated purposes.\n- **Camera and Photos**:\n  - Upload store logos\n  - Upload product photographs\n  - Upload banners\n  - Submit photographs required for support or verification\n- **Technical Information**:\n  - IP address, device information, app version, device identifiers where permitted, Firebase Cloud Messaging (FCM) token, network status, crash/diagnostic logs, and authentication logs.\n\n---\n\n## 4. How We Use Information\nWe may use collected information to:\n- Create and manage vendor accounts;\n- Verify vendors and businesses;\n- Authenticate vendors using OTP or other security mechanisms;\n- Register vendors with participating societies;\n- Manage product catalogues;\n- Process customer orders and send order notifications;\n- Facilitate deliveries;\n- Calculate commissions and settlements;\n- Process T+1 payouts;\n- Provide customer and vendor support;\n- Detect fraud and unauthorized activity;\n- Maintain Platform security and improve DigiLocal services;\n- Communicate important service information;\n- Comply with applicable laws and regulatory requirements.\n\n---\n\n## 5. Third-Party Service Providers\nDigiLocal may use third-party providers including:\n- **Firebase / Google**: Firebase Cloud Messaging (FCM), Push notifications, and technical infrastructure.\n- **SMS Providers**: MSG91 or other authorized SMS gateways for OTP verification and transaction notifications.\n- **Payment and Banking Partners**: Process transaction information necessary for customer payments and vendor payouts.\n- **Cloud Infrastructure**: AWS, Google Cloud, Render or other authorized service providers for hosting and operating backend systems.\n\n---\n\n## 6. Data Security\nDigiLocal uses reasonable technical and organizational safeguards designed to protect personal and business information against unauthorized access, misuse, alteration, disclosure or loss (encryption, access controls, secure API communication, database monitoring). We do not guarantee that any electronic system can be completely secure.\n\n---\n\n## 7. Data Retention\nWe retain information only for as long as reasonably necessary for providing DigiLocal services, processing orders and payouts, maintaining transaction records, resolving disputes, preventing fraud, and meeting legal/tax obligations.\n\n---\n\n## 8. Vendor Rights\nSubject to applicable law, vendors may request information regarding their personal data and request correction or deletion where legally applicable. Certain records must be retained for tax and legal compliance.\n\n---\n\n## 9. Account Closure\nA vendor may request closure of their DigiLocal Vendor account by contacting support. Account closure is subject to completion of pending orders, payouts, and legal record retention.\n\n---\n\n## 10. Privacy Complaints and Grievances\n- **Email**: products@zordial.com\n- **Helpline**: +91 94613 53008\n- **Grievance Contact**: DigiLocal Technologies / Zordial Technologies Private Limited\n- **Address**: Near Tonk Road, Pratap Nagar, Jaipur, Rajasthan, India\n\n---\n\n## 11. Changes to This Privacy Policy\nWe may update this Privacy Policy from time to time. The updated policy will become effective from the date stated in the revised policy.\n\n---\n\n## 12. Governing Law\nThis Privacy Policy shall be governed by applicable laws of India.`,
    phone: '+91 94613 53008',
    email: 'products@zordial.com',
    contact: DEFAULT_SUPPORT_CONTACTS,
    updated_at: '2026-08-18T12:00:00.000Z',
  },
  'terms-conditions': {
    slug: 'terms-conditions',
    title: 'Terms & Conditions',
    meta_description: 'DigiLocal Vendor Terms & Conditions governing merchant onboarding, catalogue management, order fulfillment, T+1 payouts, and society compliance.',
    content: `# Terms & Conditions\n\n**Effective Date**: 10/08/2026  \n**Last Updated**: 18/08/2026  \n\nThese Terms & Conditions (“Terms”) govern your registration and use of the DigiLocal Vendor application and related services.\nDigiLocal is operated by **Zordial Technologies Private Limited** under the DigiLocal brand (“DigiLocal”, “we”, “us” or “our”).\n\nBy registering as a vendor or using DigiLocal Vendor, you agree to these Terms.\n\n---\n\n## 1. Vendor Eligibility\nTo register as a DigiLocal vendor, you must:\n- Be legally authorized to operate the relevant business;\n- Be authorized to sell within or service the registered society/community;\n- Provide accurate registration information;\n- Provide required business and statutory information;\n- Comply with applicable laws and society/RWA rules.\n*DigiLocal may verify the information provided during onboarding.*\n\n---\n\n## 2. Vendor Account\nYou are responsible for maintaining the security of your account. You must:\n- Keep OTPs and login credentials confidential;\n- Not allow unauthorized persons to use your account;\n- Keep your business information updated;\n- Immediately report suspected unauthorized access.\n*You are responsible for activity performed through your vendor account, except where applicable law provides otherwise.*\n\n---\n\n## 3. Business and Statutory Information\nVendors must provide accurate information including, where applicable: business name, owner/representative details, shop address, society info, GSTIN, PAN, bank account information, and required verification documents. Providing false or misleading information may result in immediate suspension or termination.\n\n---\n\n## 4. Product Catalogue\nVendors are responsible for ensuring that all products listed on DigiLocal are accurate and lawful. Listings must accurately state product name, description, selling price, MRP, quantity, pack size, availability, and clear units of measurement (e.g. 1 kg, 500 g, 1 litre, 500 ml, 1 packet, 1 piece, 1 box).\n\n---\n\n## 5. Product Quality\nVendors must supply genuine, safe and legally saleable products. Vendors must NOT knowingly list or sell expired products, counterfeit items, adulterated products, illegal goods, narcotics, unauthorized medicines, or hazardous chemicals. Food items must comply with applicable food safety standards and licences.\n\n---\n\n## 6. Stock Management\nVendors are responsible for maintaining accurate inventory information and promptly marking products as **In Stock** or **Out of Stock**. Repeated acceptance of orders for unavailable products may result in account review or suspension.\n\n---\n\n## 7. Order Processing\nOrders move through lifecycle stages: \`PENDING\` ➔ \`ACCEPTED\` ➔ \`PREPARING\` ➔ \`OUT FOR DELIVERY\` ➔ \`DELIVERED / COMPLETED\` (or \`CANCELLED\`). Vendors must respond to incoming order alerts promptly and fulfil accepted orders within the applicable service timeframe.\n\n---\n\n## 8. Order Cancellation\nA vendor may reject or cancel an order only where reasonably necessary (item unavailable, operational closure, safety issue, suspected fraud). Repeated unnecessary cancellations may result in account review, penalties or suspension.\n\n---\n\n## 9. Delivery and Society Rules\nVendors and their delivery personnel must strictly comply with applicable society/RWA rules (security check-in, gate-entry passes, visitor registration, delivery timings, parking rules, and resident safety standards).\n\n---\n\n## 10. Customer Information\nCustomer information displayed through DigiLocal is confidential. Vendors may use customer information solely to prepare, deliver, or resolve issues with the specific order. Vendors must NOT use customer contact details for independent marketing, unsolicited messaging, or unrelated commercial purposes.\n\n---\n\n## 11. Payments and Payouts\nFor eligible completed/delivered orders, vendor settlements are processed on a **T+1 basis** (targeted for processing on the next applicable business/settlement day, subject to banking holidays and dispute verification). Amounts payable may be adjusted for platform fees, commissions, processing charges, taxes, or dispute refunds.\n\n---\n\n## 12. Refunds and Disputes\nWhere a customer reports missing, incorrect, damaged, expired, defective items, or quantity discrepancies, DigiLocal may investigate. Where the issue is attributable to the vendor, the applicable refund or adjustment may be deducted from the vendor's settlement.\n\n---\n\n## 13. Platform Fees and Commission\nApplicable commissions, platform fees, or subscription charges are communicated transparently through the Platform and may be updated with appropriate prior notice.\n\n---\n\n## 14. Taxes\nVendors are responsible for their own tax and statutory obligations arising from their business, including providing accurate GSTIN details.\n\n---\n\n## 15. Prohibited Activities\nVendors must NOT upload false product info, manipulate prices/orders, create fraudulent orders, misuse resident information, sell prohibited goods, or attempt unauthorized access to DigiLocal systems.\n\n---\n\n## 16. Intellectual Property\nThe DigiLocal brand, logo, app design, and software interface are owned by Zordial Technologies Private Limited. Vendors must ensure their uploaded catalogue media does not infringe third-party intellectual property.\n\n---\n\n## 17. Account Suspension and Termination\nDigiLocal may suspend or terminate vendor accounts for repeated cancellations, non-fulfilment, counterfeit/expired items, data misuse, fraud, society rule violations, or breach of these Terms.\n\n---\n\n## 18. Platform Availability & 19. Limitation of Liability\nDigiLocal strives for high uptime but does not guarantee uninterrupted service during maintenance or outages. To the maximum extent permitted by law, DigiLocal is not liable for indirect or consequential losses.\n\n---\n\n## 20. Vendor Indemnity\nVendors agree to indemnify DigiLocal against claims, damages, or losses resulting from breach of these Terms, sale of prohibited goods, or misuse of customer data.\n\n---\n\n## 21. Changes to Terms\nDigiLocal may update these Terms from time to time. Continued use of the app constitutes acceptance of the revised Terms.\n\n---\n\n## 22. Support and Grievance Contact\n- **Email**: products@zordial.com\n- **Helpline**: +91 94613 53008\n- **Operating Entity**: Zordial Technologies Private Limited\n- **Brand**: DigiLocal Technologies\n- **Address**: Near Tonk Road, Pratap Nagar, Jaipur, Rajasthan, India\n\n---\n\n## 23. Governing Law & Jurisdiction\nThese Terms are governed by the laws of India. Disputes shall be subject to the exclusive jurisdiction of the competent courts of **Jaipur, Rajasthan**.\n\n---\n\n## 24. Severability\nIf any provision is found invalid or unenforceable, the remaining provisions remain in full force and effect.`,
    phone: '+91 94613 53008',
    email: 'products@zordial.com',
    contact: DEFAULT_SUPPORT_CONTACTS,
    updated_at: '2026-08-18T12:00:00.000Z',
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
