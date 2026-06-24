export type LegalDocumentSlug = "privacy-policy" | "terms-of-use";

export interface LegalDocument {
  slug: LegalDocumentSlug;
  title: string;
  eyebrow: string;
  summary: string;
  lastUpdated: string;
  effectiveDate: string;
  intro: string[];
  highlights: string[];
  sections: LegalSection[];
  relatedDocument: {
    href: `/${LegalDocumentSlug}`;
    label: string;
  };
}

export interface LegalSection {
  id: string;
  title: string;
  blocks: LegalBlock[];
}

export type LegalBlock =
  | {
      type: "paragraph";
      text: string;
    }
  | {
      type: "list";
      items: string[];
    }
  | {
      type: "table";
      columns: string[];
      rows: string[][];
    };

const lastUpdated = "June 16, 2026";

export const legalDocuments: Record<LegalDocumentSlug, LegalDocument> = {
  "terms-of-use": {
    slug: "terms-of-use",
    title: "Terms of Use",
    eyebrow: "Legal",
    summary:
      "The rules for using Capsule Zero, including accounts, wardrobe content, AI-assisted recommendations, marketplace links, coins, and paid digital features.",
    lastUpdated,
    effectiveDate: "Effective when published",
    relatedDocument: {
      href: "/privacy-policy",
      label: "Privacy Policy",
    },
    intro: [
      "These Terms of Use govern access to and use of Capsule Zero, including our website, web application, mobile applications, account features, wardrobe tools, upload flows, marketplace import features, semantic search, capsule methodology, coin balance, and any related services we provide.",
      "By creating an account, accessing the service, uploading content, buying coins, or using any paid or free feature, you agree to these Terms. If you use Capsule Zero on behalf of another person or organization, you confirm that you have authority to accept these Terms for them.",
      "Capsule Zero is a pre-launch product. The operating legal entity, registered address, and dedicated legal contact details must be confirmed before production publication. These Terms are drafted as the product baseline and should be reviewed by local counsel before commercial launch.",
    ],
    highlights: [
      "You keep ownership of your wardrobe photos, item data, and other content, but you give us the rights needed to operate the service.",
      "Capsule Zero provides wardrobe, color, and style recommendations. It does not guarantee fashion outcomes, resale outcomes, marketplace availability, or professional advice.",
      "Coins are digital in-app credits with no cash value. Mobile apps for v0.1 show balance only and do not sell coins.",
      "Third-party stores, payment processors, app stores, background-removal providers, and linked websites have their own terms.",
    ],
    sections: [
      {
        id: "who-we-are",
        title: "1. Who We Are",
        blocks: [
          {
            type: "paragraph",
            text: "Capsule Zero is a premium fashion-tech platform for building and managing capsule wardrobes. In these Terms, \"Capsule Zero\", \"we\", \"us\", and \"our\" mean the Capsule Zero operating entity identified on the service before public launch.",
          },
          {
            type: "paragraph",
            text: "The product is developed from Buenos Aires for a global audience. Unless mandatory consumer protection laws provide otherwise, these Terms are intended to be governed by the laws of Argentina once the operating entity details are finalized.",
          },
        ],
      },
      {
        id: "eligibility",
        title: "2. Eligibility",
        blocks: [
          {
            type: "paragraph",
            text: "You must be at least 16 years old, or the minimum age required in your country to use online services, to use Capsule Zero. If you are under 18, you may use the service only with permission from a parent or legal guardian.",
          },
          {
            type: "paragraph",
            text: "You must be at least 18 and legally capable of entering into a binding contract to buy coins or other paid digital features.",
          },
        ],
      },
      {
        id: "accounts",
        title: "3. Accounts and Security",
        blocks: [
          {
            type: "list",
            items: [
              "Provide accurate account, profile, billing, and contact information.",
              "Keep your login credentials confidential and do not share your account.",
              "Tell us promptly if you suspect unauthorized access or a security issue.",
              "You are responsible for activity under your account unless caused by our breach of these Terms or applicable law.",
            ],
          },
          {
            type: "paragraph",
            text: "Stage 1 authentication is email/password. Google OAuth and Apple Sign-In may be added later under additional provider terms and platform rules.",
          },
        ],
      },
      {
        id: "service",
        title: "4. The Capsule Zero Service",
        blocks: [
          {
            type: "paragraph",
            text: "Capsule Zero helps you digitize wardrobe items, group them into capsules, evaluate color compatibility, generate outfit and shopping suggestions, manage item statuses such as favorites, for sale, for repair, and uncapsulated, and measure Outfit Productivity Ratio.",
          },
          {
            type: "paragraph",
            text: "Our methodology, compatibility rules, interface, copy, design system, software, data models, and product names are protected by intellectual property laws. You may use them only as part of the service and as allowed by these Terms.",
          },
        ],
      },
      {
        id: "user-content",
        title: "5. Your Content",
        blocks: [
          {
            type: "paragraph",
            text: "Your content includes wardrobe photos, avatar images, item names, colors, categories, marketplace links, preferences, feedback, support messages, search queries, notes, and any other material you submit or generate through the service.",
          },
          {
            type: "paragraph",
            text: "You keep ownership of your content. You grant Capsule Zero a worldwide, non-exclusive, royalty-free license to host, store, reproduce, process, transform, display, transmit, and create technical derivatives of your content solely to provide, secure, improve, and support the service.",
          },
          {
            type: "list",
            items: [
              "Only upload content you own or have permission to use.",
              "Do not upload photos of children, government IDs, payment cards, intimate imagery, illegal content, or content that infringes another person's rights.",
              "Avoid uploading unnecessary sensitive information, including health, biometric, ethnicity, religion, political, or similar data.",
              "If an image includes another person, you are responsible for having their permission where required.",
            ],
          },
        ],
      },
      {
        id: "ai-recommendations",
        title: "6. AI-Assisted and Methodology-Based Output",
        blocks: [
          {
            type: "paragraph",
            text: "Capsule Zero may use algorithms, automated classification, semantic search, color rules, and AI-assisted features to suggest item categories, colors, outfit combinations, capsule gaps, shopping ideas, and image improvements.",
          },
          {
            type: "paragraph",
            text: "Recommendations may be incomplete, inaccurate, unavailable, or unsuitable for your preferences, body, event, culture, budget, climate, or wardrobe. The service is designed to suggest and explain, not to dictate. You remain responsible for your decisions.",
          },
          {
            type: "paragraph",
            text: "We do not promise that any output will increase resale value, guarantee outfit compatibility, identify an item perfectly, find a live marketplace product, or satisfy dress codes or professional standards.",
          },
        ],
      },
      {
        id: "marketplace-links",
        title: "7. Marketplace Links and Third-Party Services",
        blocks: [
          {
            type: "paragraph",
            text: "The service may let you import item information from marketplace links or view third-party websites, providers, processors, or stores. Third-party services are not controlled by Capsule Zero and may be subject to separate terms, privacy policies, pricing, availability, taxes, shipping, return, and moderation rules.",
          },
          {
            type: "paragraph",
            text: "Unless we explicitly say otherwise, Capsule Zero is not the seller of marketplace goods, does not guarantee product authenticity, size, price, availability, delivery, refund, repair, resale, or seller performance, and is not responsible for third-party content or transactions.",
          },
        ],
      },
      {
        id: "shared-catalog",
        title: "8. Shared Catalog and Public Items",
        blocks: [
          {
            type: "paragraph",
            text: "Some features may use a shared catalog, public search, or community-derived item data. Personal wardrobe entries and private uploads are not public by default. If you choose to submit or publish item data to a shared catalog, you must have the rights to do so and we may review, edit, reject, remove, or moderate that content.",
          },
          {
            type: "paragraph",
            text: "Catalog data may be approximate. Do not rely on it as a guarantee of product identity, condition, price, ownership, intellectual-property status, safety, or availability.",
          },
        ],
      },
      {
        id: "paid-features",
        title: "9. Coins and Paid Digital Features",
        blocks: [
          {
            type: "paragraph",
            text: "Capsule Zero v0.1 uses one-time coin packs rather than subscriptions. Coins may be used for paid digital actions such as additional capsules or editorial photo enhancement. Coin packs, pricing, included features, and taxes may vary by country, campaign, platform, or time.",
          },
          {
            type: "list",
            items: [
              "Coins are not money, stored value, cryptocurrency, or a gift card.",
              "Coins have no cash value, are non-transferable, and cannot be sold, assigned, or exchanged outside Capsule Zero.",
              "Coins are credited only after payment confirmation or approved internal adjustment.",
              "We may refuse, reverse, or suspend suspicious, fraudulent, abusive, or technically invalid coin activity.",
            ],
          },
          {
            type: "paragraph",
            text: "Web purchases may be processed by Lava.top or another payment provider. We do not store full payment card details on our servers. Mobile apps for v0.1 are read-only for coin balance and transaction status and do not include external payment links or in-app purchase prompts.",
          },
        ],
      },
      {
        id: "refunds",
        title: "10. Refunds, Cancellations, and Chargebacks",
        blocks: [
          {
            type: "paragraph",
            text: "Refunds for digital coins and digital services are available only where required by law, where we confirm a duplicate payment, where a technical error solely caused by Capsule Zero prevented delivery, or where we expressly approve a refund. We may deny refunds for coins or digital services that have been used, spent, consumed, transferred, or obtained through abuse, unless mandatory law requires otherwise.",
          },
          {
            type: "paragraph",
            text: "If you believe a payment error occurred, contact support before initiating a chargeback. Unjustified chargebacks, fraudulent disputes, or payment abuse may lead to account restriction, feature suspension, reversal of coin credits, or recovery of amounts owed where permitted by law.",
          },
        ],
      },
      {
        id: "acceptable-use",
        title: "11. Acceptable Use",
        blocks: [
          {
            type: "paragraph",
            text: "You may not use Capsule Zero for illegal, harmful, deceptive, infringing, abusive, or security-compromising activity. In particular, you may not:",
          },
          {
            type: "list",
            items: [
              "violate laws, consumer protection rules, sanctions, export rules, intellectual-property rights, privacy rights, or publicity rights;",
              "scrape, crawl, harvest, copy, resell, or bulk extract data, images, outputs, or catalog content without written permission;",
              "reverse engineer, bypass, overload, interfere with, or test the vulnerability of the service except through an approved security process;",
              "upload malware, spam, misleading marketplace data, counterfeit listings, or content that impersonates another person or brand;",
              "use the service to build or train a competing product, dataset, model, or recommendation system without our written permission;",
              "attempt to obtain unauthorized access to another account, private wardrobe, payment flow, provider account, or admin feature.",
            ],
          },
        ],
      },
      {
        id: "availability",
        title: "12. Availability and Changes",
        blocks: [
          {
            type: "paragraph",
            text: "We may modify, suspend, discontinue, rename, limit, or replace features, providers, coin packs, mobile availability, APIs, methodology details, or design elements at any time. We will try to avoid materially reducing paid features that you already purchased, unless needed for law, security, abuse prevention, provider changes, or product integrity.",
          },
          {
            type: "paragraph",
            text: "We may run beta, preview, mock-first, or experimental features. These may be less stable, may change quickly, and may produce test or fixture-backed results until a real provider integration is enabled.",
          },
        ],
      },
      {
        id: "suspension",
        title: "13. Suspension and Termination",
        blocks: [
          {
            type: "paragraph",
            text: "We may suspend or terminate access, remove content, limit features, reverse credits, or refuse transactions if we reasonably believe that you violated these Terms, created risk for other users or Capsule Zero, failed payment verification, infringed rights, abused a provider, or used the service unlawfully.",
          },
          {
            type: "paragraph",
            text: "You may stop using the service at any time and may request account deletion where available. Certain records may be retained where required for security, legal compliance, accounting, dispute resolution, or fraud prevention.",
          },
        ],
      },
      {
        id: "disclaimers",
        title: "14. Disclaimers",
        blocks: [
          {
            type: "paragraph",
            text: "To the maximum extent permitted by law, Capsule Zero is provided on an \"as is\" and \"as available\" basis. We disclaim warranties of merchantability, fitness for a particular purpose, non-infringement, uninterrupted availability, accuracy, and error-free operation.",
          },
          {
            type: "paragraph",
            text: "Nothing in these Terms limits statutory rights that cannot be waived under applicable consumer law.",
          },
        ],
      },
      {
        id: "liability",
        title: "15. Limitation of Liability",
        blocks: [
          {
            type: "paragraph",
            text: "To the maximum extent permitted by law, Capsule Zero will not be liable for indirect, incidental, special, consequential, exemplary, or punitive damages; loss of profit, revenue, data, goodwill, wardrobe value, resale value, outfit opportunity, or business interruption; or third-party provider actions.",
          },
          {
            type: "paragraph",
            text: "To the maximum extent permitted by law, our total liability for claims related to the service will not exceed the greater of the amount you paid to Capsule Zero for the affected paid feature in the three months before the event giving rise to the claim or USD 100.",
          },
        ],
      },
      {
        id: "indemnity",
        title: "16. Indemnity",
        blocks: [
          {
            type: "paragraph",
            text: "Where permitted by law, you will indemnify and hold Capsule Zero harmless from claims, losses, liabilities, damages, costs, and expenses arising from your content, your misuse of the service, your marketplace activity, your violation of these Terms, or your violation of another person's rights.",
          },
        ],
      },
      {
        id: "law-disputes",
        title: "17. Governing Law and Disputes",
        blocks: [
          {
            type: "paragraph",
            text: "Please contact us first so we can try to resolve concerns informally. Most issues can be solved through support, refunds required by law, data-rights handling, or account review.",
          },
          {
            type: "paragraph",
            text: "Unless mandatory consumer protection law provides otherwise, these Terms are governed by the laws of Argentina and disputes may be brought in the competent courts of the Autonomous City of Buenos Aires. If you live in a country or region that gives you mandatory local consumer rights, those rights remain available to you.",
          },
        ],
      },
      {
        id: "changes",
        title: "18. Changes to These Terms",
        blocks: [
          {
            type: "paragraph",
            text: "We may update these Terms from time to time. If changes are material, we will provide notice through the service, email, or another reasonable method. The updated Terms apply from the effective date shown. Continuing to use Capsule Zero after the effective date means you accept the updated Terms.",
          },
        ],
      },
      {
        id: "contact",
        title: "19. Contact",
        blocks: [
          {
            type: "paragraph",
            text: "Legal contact, operating entity name, and registered address must be inserted before public launch. Until then, use the product support channel designated by Capsule Zero for legal, billing, or account questions.",
          },
        ],
      },
    ],
  },
  "privacy-policy": {
    slug: "privacy-policy",
    title: "Privacy Policy",
    eyebrow: "Privacy",
    summary:
      "How Capsule Zero collects, uses, shares, stores, and protects personal data across the website, app, wardrobe tools, uploads, marketplace import, AI-assisted recommendations, and coins.",
    lastUpdated,
    effectiveDate: "Effective when published",
    relatedDocument: {
      href: "/terms-of-use",
      label: "Terms of Use",
    },
    intro: [
      "This Privacy Policy explains how Capsule Zero processes personal data when you visit our website, create an account, use our web or mobile applications, upload wardrobe content, import marketplace links, search the catalog, buy or spend coins, contact support, or otherwise interact with us.",
      "We aim to process data in a privacy-conscious way: personal wardrobe content is private by default, color and outfit recommendations should be explainable, and optional features should collect only what they need.",
      "This is a pre-launch policy baseline. The controller's final legal entity name, registered address, privacy email, and any local representative details must be confirmed before production publication.",
    ],
    highlights: [
      "We process wardrobe photos, item data, profile preferences, and account data to provide the service.",
      "We do not sell personal data, and private wardrobe uploads are not public by default.",
      "We may use providers for hosting, storage, authentication, payments, analytics, support, marketplace parsing, background removal, and email.",
      "You can request access, correction, deletion, export, objection, restriction, and withdrawal of consent where applicable.",
    ],
    sections: [
      {
        id: "controller",
        title: "1. Controller and Contact",
        blocks: [
          {
            type: "paragraph",
            text: "Capsule Zero is the controller of personal data processed for account administration, product operation, support, security, analytics, billing administration, and product improvement. The final operating entity, registered address, privacy contact email, and any required EU/UK or other representative details must be added before public launch.",
          },
          {
            type: "paragraph",
            text: "For production, privacy requests should be routed to a dedicated privacy contact such as privacy@[confirmed-domain]. Until that contact is confirmed, use the support channel designated by Capsule Zero.",
          },
        ],
      },
      {
        id: "scope",
        title: "2. Scope",
        blocks: [
          {
            type: "paragraph",
            text: "This Policy applies to the Capsule Zero website, web app, mobile apps, account features, wardrobe and capsule tools, upload flows, marketplace import, semantic search, paid coin features, support, analytics, and service communications.",
          },
          {
            type: "paragraph",
            text: "It does not replace privacy notices of third-party stores, payment providers, app stores, social login providers, analytics providers, background-removal providers, or websites you choose to visit from Capsule Zero.",
          },
        ],
      },
      {
        id: "data-we-collect",
        title: "3. Personal Data We Collect",
        blocks: [
          {
            type: "table",
            columns: ["Category", "Examples"],
            rows: [
              [
                "Account and identity data",
                "Name, email, password authentication data, account ID, language, country, city, login state, recovery events.",
              ],
              [
                "Profile and preference data",
                "Avatar, sizes, style preferences, notification settings, security preferences, optional profile fields.",
              ],
              [
                "Wardrobe and capsule data",
                "Item photos, categories, colors, brands, materials, notes, item statuses, favorites, for-sale/for-repair flags, capsule palette, outfits, OPR, gap suggestions.",
              ],
              [
                "Upload and image-processing data",
                "Original images, processed images, thumbnails, metadata, upload status, background-removal status, retry information.",
              ],
              [
                "Marketplace and catalog data",
                "Marketplace URLs, parsed item candidates, source site metadata, semantic search queries, public catalog interactions.",
              ],
              [
                "Billing and coin data",
                "Coin balance, coin ledger, pack selection, invoice ID, payment status, refund or chargeback status, tax or invoice data where needed. We do not store full payment card numbers.",
              ],
              [
                "Device and usage data",
                "IP address, device type, browser, operating system, app version, pages viewed, feature usage, logs, cookies, local storage, approximate region, security events.",
              ],
              [
                "Communications",
                "Support messages, feedback, survey responses, legal requests, and related metadata.",
              ],
            ],
          },
        ],
      },
      {
        id: "sensitive-data",
        title: "4. Sensitive Data and Photos",
        blocks: [
          {
            type: "paragraph",
            text: "Capsule Zero is not designed to collect special-category or sensitive data such as health, biometric identifiers, ethnicity, religion, political views, intimate images, government IDs, payment cards, or children's data. Please do not upload that information.",
          },
          {
            type: "paragraph",
            text: "Wardrobe photos may accidentally reveal people, bodies, rooms, locations, or other personal details. We process those images only to provide requested features such as storage, thumbnail generation, item display, category or color assistance, and optional image enhancement. We do not intentionally identify people or create biometric templates.",
          },
        ],
      },
      {
        id: "sources",
        title: "5. Sources of Data",
        blocks: [
          {
            type: "list",
            items: [
              "You provide data directly when you create an account, upload photos, fill in profile fields, import links, search, buy coins, or contact us.",
              "We collect data automatically from your browser, device, app, cookies, local storage, and server logs.",
              "We may receive data from service providers, payment processors, marketplace parsing tools, authentication providers, app stores, background-removal providers, analytics tools, or other users if you interact through shared features.",
            ],
          },
        ],
      },
      {
        id: "purposes",
        title: "6. Why We Process Personal Data",
        blocks: [
          {
            type: "table",
            columns: ["Purpose", "Data", "Typical lawful basis"],
            rows: [
              [
                "Provide accounts and authentication",
                "Account, login, session, recovery, profile data",
                "Contract; legitimate interests; legal obligations",
              ],
              [
                "Operate wardrobe, capsule, upload, and recommendation features",
                "Wardrobe, photos, item metadata, color data, preferences, search data",
                "Contract; user request; legitimate interests",
              ],
              [
                "Process coins, invoices, refunds, and fraud checks",
                "Billing, coin ledger, payment status, device/security data",
                "Contract; legal obligations; legitimate interests",
              ],
              [
                "Support and communicate with you",
                "Contact details, support messages, account status",
                "Contract; legitimate interests; consent where required",
              ],
              [
                "Improve, debug, secure, and monitor the service",
                "Usage data, logs, errors, device data, limited analytics",
                "Legitimate interests; consent where required",
              ],
              [
                "Marketing and product updates",
                "Email, preferences, country, usage signals",
                "Consent; legitimate interests where permitted",
              ],
              [
                "Comply with law and enforce rights",
                "Relevant account, billing, logs, communications, legal request data",
                "Legal obligations; legitimate interests",
              ],
            ],
          },
          {
            type: "paragraph",
            text: "Where GDPR or similar law applies, the lawful basis depends on context. If we rely on consent, you may withdraw consent at any time without affecting prior processing.",
          },
        ],
      },
      {
        id: "ai-processing",
        title: "7. AI, Automation, and Recommendations",
        blocks: [
          {
            type: "paragraph",
            text: "We may process item photos, colors, categories, preferences, and wardrobe metadata through automated tools to classify items, remove backgrounds, improve images, suggest compatible colors, generate outfits, calculate OPR, identify gaps, and power semantic search.",
          },
          {
            type: "paragraph",
            text: "We do not use automated processing to make decisions that produce legal or similarly significant effects about you. Recommendations are advisory and can be accepted, ignored, edited, or replaced by you.",
          },
          {
            type: "paragraph",
            text: "We do not permit third-party AI or image-processing providers to use your private wardrobe photos to train their general models unless we disclose that use and obtain any required consent.",
          },
        ],
      },
      {
        id: "sharing",
        title: "8. How We Share Personal Data",
        blocks: [
          {
            type: "paragraph",
            text: "We share personal data only as needed to operate, secure, support, analyze, improve, and monetize the service, or as required by law. Categories of recipients may include:",
          },
          {
            type: "list",
            items: [
              "hosting, infrastructure, database, authentication, and storage providers, such as Supabase and Vercel or similar providers;",
              "payment and billing providers, such as Lava.top or replacement processors;",
              "background-removal, image-processing, marketplace parsing, catalog search, email, analytics, logging, support, and security providers;",
              "app stores or mobile platform providers when you install or use mobile apps;",
              "third-party marketplaces or websites when you choose to open, import, or interact with them;",
              "professional advisors, insurers, auditors, banks, or authorities where needed for legal, tax, security, dispute, or compliance purposes;",
              "successors or potential successors in a merger, acquisition, financing, restructuring, sale of assets, or similar transaction.",
            ],
          },
          {
            type: "paragraph",
            text: "We do not sell personal data. We do not share private wardrobe uploads with other users unless you choose a feature that makes content public or shared.",
          },
        ],
      },
      {
        id: "international-transfers",
        title: "9. International Transfers",
        blocks: [
          {
            type: "paragraph",
            text: "Capsule Zero is intended for global use and may process data in countries other than your own, including Argentina, the United States, the European Economic Area, and countries where our providers operate. Privacy laws in those countries may differ from yours.",
          },
          {
            type: "paragraph",
            text: "Where required, we use appropriate safeguards such as contractual protections, standard contractual clauses, transfer impact assessments, provider due diligence, and technical security measures.",
          },
        ],
      },
      {
        id: "cookies",
        title: "10. Cookies and Similar Technologies",
        blocks: [
          {
            type: "paragraph",
            text: "We may use cookies, local storage, device identifiers, SDKs, pixels, and similar technologies for necessary site operation, session management, language preference, security, analytics, product improvement, and marketing where enabled.",
          },
          {
            type: "list",
            items: [
              "Strictly necessary technologies support login, security, routing, language, and core app behavior.",
              "Preference technologies remember settings such as language and cookie choices.",
              "Analytics and performance technologies help us understand product usage and diagnose issues.",
              "Marketing technologies, if introduced, will be subject to consent and opt-out controls where required.",
            ],
          },
          {
            type: "paragraph",
            text: "You can control cookies through browser or device settings. Blocking cookies may affect login, language switching, dashboard access, or other features. Where required by law, we will request consent for optional cookies and allow you to update preferences.",
          },
        ],
      },
      {
        id: "retention",
        title: "11. Retention",
        blocks: [
          {
            type: "paragraph",
            text: "We keep personal data only as long as reasonably necessary for the purposes described in this Policy, unless a longer period is required or permitted by law.",
          },
          {
            type: "table",
            columns: ["Data", "Typical retention"],
            rows: [
              [
                "Account and profile data",
                "For the life of the account, then a limited deletion and backup period unless retention is required.",
              ],
              [
                "Wardrobe photos and item data",
                "Until you delete them or close your account, subject to backup, security, and legal retention.",
              ],
              [
                "Coin ledger, invoices, tax, refund, and payment records",
                "As needed for accounting, tax, fraud prevention, disputes, and legal compliance, often up to 7 years depending on law.",
              ],
              [
                "Security logs and technical logs",
                "Usually up to 12 months, unless needed longer for incidents, abuse, or legal claims.",
              ],
              [
                "Support and legal requests",
                "As long as needed to handle the request and preserve records for disputes or compliance.",
              ],
            ],
          },
        ],
      },
      {
        id: "security",
        title: "12. Security",
        blocks: [
          {
            type: "paragraph",
            text: "We use reasonable technical and organizational measures designed to protect personal data, including access controls, provider security reviews, authentication safeguards, private storage rules, server-side processing for sensitive provider calls, and separation between private wardrobe assets and public catalog assets.",
          },
          {
            type: "paragraph",
            text: "No online service is completely secure. You are responsible for keeping your credentials private, using secure devices, and telling us if you believe your account has been compromised.",
          },
        ],
      },
      {
        id: "rights",
        title: "13. Your Privacy Rights",
        blocks: [
          {
            type: "paragraph",
            text: "Depending on where you live, you may have rights to access, correct, delete, export, restrict, or object to processing of your personal data, withdraw consent, opt out of marketing, opt out of certain profiling or targeted advertising, appeal a privacy decision, or lodge a complaint with a supervisory authority.",
          },
          {
            type: "paragraph",
            text: "We may need to verify your identity and account ownership before fulfilling a request. Some requests may be limited by legal exceptions, security requirements, backup retention, fraud prevention, accounting obligations, or the rights of others.",
          },
          {
            type: "paragraph",
            text: "We will not discriminate against you for exercising privacy rights, but deleting or restricting necessary data may make some features unavailable.",
          },
        ],
      },
      {
        id: "regional-notices",
        title: "14. Regional Notices",
        blocks: [
          {
            type: "paragraph",
            text: "If you are in the EEA, UK, Switzerland, or a similar jurisdiction, you may have GDPR-style rights and may contact your local supervisory authority. If you are in California or another US state with privacy laws, you may have additional rights regarding categories of data, deletion, correction, portability, opt-outs, and non-discrimination.",
          },
          {
            type: "paragraph",
            text: "Capsule Zero does not sell personal data. If we later engage in targeted advertising or cross-context behavioral advertising that is considered a sale or share under applicable law, we will provide the required notices and opt-out mechanism.",
          },
        ],
      },
      {
        id: "children",
        title: "15. Children",
        blocks: [
          {
            type: "paragraph",
            text: "Capsule Zero is not intended for children under 16. We do not knowingly collect personal data from children under 16. If you believe a child has provided personal data to us, contact us so we can take appropriate action.",
          },
        ],
      },
      {
        id: "third-party-links",
        title: "16. Third-Party Links",
        blocks: [
          {
            type: "paragraph",
            text: "The service may contain links to marketplaces, brands, social networks, app stores, payment providers, support tools, or other third-party websites and services. We are not responsible for their privacy practices. Review their policies before sharing data or making purchases.",
          },
        ],
      },
      {
        id: "changes",
        title: "17. Changes to This Policy",
        blocks: [
          {
            type: "paragraph",
            text: "We may update this Policy from time to time. If changes are material, we will provide notice through the service, email, or another reasonable method. The updated Policy applies from the date shown above unless the notice says otherwise.",
          },
        ],
      },
      {
        id: "contact",
        title: "18. Contact",
        blocks: [
          {
            type: "paragraph",
            text: "Before public launch, Capsule Zero must publish its final privacy email, operating entity name, registered address, and any required representative or data protection contact. Use the designated support channel for privacy, account, upload, billing, or legal requests until then.",
          },
        ],
      },
    ],
  },
};
