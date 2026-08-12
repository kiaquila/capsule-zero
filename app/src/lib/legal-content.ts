export type LegalDocumentSlug =
  | "privacy-policy"
  | "terms-of-use"
  | "community-guidelines"
  | "copyright-policy"
  | "enforcement-policy";

type CoreLegalDocumentSlug = "privacy-policy" | "terms-of-use";

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

const lastUpdated = "July 24, 2026";
const effectiveDate = "July 24, 2026";

const operatingEntity = "Capsule Zero S.A.S.";
const registeredOffice =
  "Ciudad Autónoma de Buenos Aires, Argentina";
const productDomain = "capsulezero.com";
const privacyEmail = "privacy@capsulezero.com";
const legalEmail = "legal@capsulezero.com";
const supportEmail = "support@capsulezero.com";
const dpoEmail = "dpo@capsulezero.com";
const ipNoticeEmail = "ip@capsulezero.com";

export const legalDocuments: Record<CoreLegalDocumentSlug, LegalDocument> = {
  "terms-of-use": {
    slug: "terms-of-use",
    title: "Terms of Use",
    eyebrow: "Legal",
    summary:
      "The binding contract between you and Capsule Zero S.A.S. governing accounts, wardrobe content, AI-assisted recommendations, semantic search, mobile apps, current free access, gated future features, and your statutory consumer rights.",
    lastUpdated: "August 12, 2026",
    effectiveDate: "August 12, 2026",
    relatedDocument: {
      href: "/privacy-policy",
      label: "Privacy Policy",
    },
    intro: [
      `These Terms of Use ("Terms") form a binding contract between you and ${operatingEntity}, a company incorporated under the laws of the Argentine Republic with registered office in ${registeredOffice} ("Capsule Zero", "we", "us", "our"). They govern your access to and use of the Capsule Zero website at ${productDomain}, the Capsule Zero web application, our iOS and Android mobile applications, account features, wardrobe and capsule tools, photo upload and image-processing flows, semantic search, the Capsule Zero preset catalog, support, and any related services we provide (together, the "Service"). Section 7 separately identifies a future feature that is not part of the current Service.`,
      "By creating an account, signing in, uploading content, or using the Service, you confirm that you have read these Terms, that you accept them, and that you have the legal capacity to enter into this contract. If you use the Service on behalf of another person, organization, or legal entity, you confirm that you have authority to accept these Terms on their behalf, and references to \"you\" include both you and that person or entity.",
      "These Terms include and incorporate by reference our Community Guidelines, Copyright & Intellectual Property Policy, and Enforcement & Appeals Policy. They also apply with our separate Privacy Policy, product-specific notices we surface in the Service (for example, age gates or content-moderation notices), and mandatory consumer-protection rules that apply where you live. You may not use the Service to do, submit, link to, or share anything contrary to those policies, and you may not attempt to circumvent them.",
    ],
    highlights: [
      "You keep ownership of your wardrobe photos and content; we receive a limited license needed to operate, secure, and improve the Service.",
      "Capsule Zero recommends; it does not dictate. AI-assisted output is advisory and is not a substitute for professional, medical, financial, or legal advice.",
      "Capsule Zero is currently free to use and has no active checkout or payment flow; we will publish updated terms before introducing monetization.",
      "Consumers in the EEA, UK, and other jurisdictions keep their statutory rights; nothing in these Terms limits mandatory consumer protections.",
      "Reports, removals, appeals, and repeat-infringer action follow our published Copyright & IP and Enforcement & Appeals policies.",
    ],
    sections: [
      {
        id: "who-we-are",
        title: "1. Who We Are and How to Reach Us",
        blocks: [
          {
            type: "paragraph",
            text: `${operatingEntity} operates the Service. Our registered office is ${registeredOffice}. For commercial, contractual, and IP correspondence, contact ${legalEmail}. For day-to-day product questions, contact ${supportEmail}. For privacy requests, contact ${privacyEmail} (see the Privacy Policy for the full data-rights process).`,
          },
          {
            type: "paragraph",
            text: "Capsule Zero is a premium fashion-tech platform that helps you digitize wardrobe items, group them into capsules using a proprietary color and category methodology, generate outfit ideas, manage item lifecycle states (favorites, for sale, for repair, uncapsulated), and measure the Outfit Productivity Ratio (OPR). The Service is not a marketplace, a retailer, a stylist agency, a resale platform, or a financial product. We do not sell physical garments and we are not a party to any sale or rental of items between users or between users and third parties.",
          },
        ],
      },
      {
        id: "eligibility",
        title: "2. Eligibility and Age Requirements",
        blocks: [
          {
            type: "paragraph",
            text: "The Service is intended for adults. By using the Service you confirm that you meet the minimum age requirement that applies where you live, including any minimum age set under your country's data-protection law. As a baseline:",
          },
          {
            type: "list",
            items: [
              "You must be at least 16 years old to create an account or otherwise use the Service. Where local law sets a higher digital-consent age (for example, certain EU Member States), that higher age applies.",
              "You must be at least 18 years old (or the age of majority in your country, if higher) to accept these Terms on behalf of another person or organization.",
              "If you are between 16 and the age of majority, you may use the Service only if your parent or legal guardian has reviewed and accepted these Terms on your behalf.",
              "We do not knowingly allow children under 16 to use the Service. If we learn that a child under the applicable minimum age has used the Service, we will close the account and delete the associated personal data, as further described in the Privacy Policy.",
            ],
          },
          {
            type: "paragraph",
            text: "We may, at any time and without notice, require you to verify your age or identity, including in connection with account-security or content-moderation decisions. We may suspend or terminate your account if you cannot verify that you meet the eligibility requirements.",
          },
        ],
      },
      {
        id: "accounts",
        title: "3. Accounts, Authentication, and Security",
        blocks: [
          {
            type: "paragraph",
            text: "To use most of the Service you need an account. You can register with an email address and password or, where supported, via Google or Apple single sign-on. Account creation, sign-in, password reset, and session management are documented in the Service.",
          },
          {
            type: "list",
            items: [
              "Provide accurate, current, and complete account, profile, and contact information, and keep it up to date.",
              "Keep your login credentials and any second-factor secrets confidential. You are responsible for all activity carried out under your account, except activity caused by our breach of these Terms or by applicable mandatory law.",
              "Do not share, transfer, sell, lease, or sublicense your account or access credentials. Each account is personal to a single human user.",
              "Notify us promptly at " + supportEmail + " if you suspect unauthorized access, credential compromise, or other security incident affecting your account.",
              "We may require you to re-authenticate, complete additional verification, refresh your password, or rotate session tokens at any time to protect the Service or you.",
            ],
          },
          {
            type: "paragraph",
            text: "Single sign-on via Google or Apple is subject to those providers' separate terms. If your social-login provider revokes our access, you may lose the ability to sign in until you switch to another supported sign-in method.",
          },
        ],
      },
      {
        id: "service",
        title: "4. The Capsule Zero Service",
        blocks: [
          {
            type: "paragraph",
            text: "Capsule Zero provides digital tools that help you build and manage capsule wardrobes. Core features include photo upload with automated background removal, search across Capsule Zero preset items, color-compatibility analysis based on the Capsule Zero color methodology, category and palette guidance, outfit generation, gap analysis, and the OPR metric.",
          },
          {
            type: "paragraph",
            text: "All Capsule Zero methodology, including the color compatibility matrix, the achromatic-connector model, the OPR formula, the category taxonomy, the outfit-generation algorithm, the gap-analysis logic, our prompt and policy infrastructure, our design system, our copy, our software, our APIs, our data models, our trademarks, our trade dress, and any related intellectual property (the \"Capsule Zero IP\") is owned by Capsule Zero or licensed to us. We grant you a limited, revocable, non-exclusive, non-transferable, non-sublicensable license to access and use the Capsule Zero IP solely through the Service, only for your personal, non-commercial wardrobe planning, and only in compliance with these Terms.",
          },
          {
            type: "paragraph",
            text: "We may launch new features, retire old features, retire mobile platforms, change supported languages, change supported regions, and change how recommendations are produced. We will give reasonable notice of material changes where required by law. Any future monetization will require updated terms and consumer notices before a purchase is available.",
          },
        ],
      },
      {
        id: "user-content",
        title: "5. Your Content and Your License to Us",
        blocks: [
          {
            type: "paragraph",
            text: "\"Your Content\" means everything you upload, submit, generate, edit, label, classify, search for, or otherwise provide through the Service. This includes wardrobe photographs, avatar images, item names, brands, materials, categories, color tags, notes, capsule configurations, outfits, preferences, ratings, search queries, support messages, and feedback.",
          },
          {
            type: "paragraph",
            text: "You retain all ownership and intellectual property rights in Your Content. By making Your Content available through the Service, you grant Capsule Zero a worldwide, non-exclusive, royalty-free, sublicensable (only to our subprocessors strictly to provide the Service to you) license to host, store, cache, reproduce, transmit, transcode, resize, watermark for security purposes, generate thumbnails of, process for background removal or image enhancement, run color and category analysis on, embed for semantic search, and otherwise technically process Your Content solely to operate, secure, support, troubleshoot, and improve the Service for you. This license ends when you delete the relevant content or close your account, except for backup, security, fraud-prevention, dispute-resolution, audit, and legal-retention copies that we may keep for the periods described in the Privacy Policy.",
          },
          {
            type: "paragraph",
            text: "If you choose to publish item data into the shared catalog, send content to support, or otherwise make content available beyond your private wardrobe, you grant us the additional rights reasonably necessary to display, share, moderate, and operate that feature. We will describe any such additional sharing in the relevant feature surface.",
          },
          {
            type: "paragraph",
            text: "When a feature permits you to make Your Content available to other users, you grant Capsule Zero, our affiliates and service providers, and the users who receive it a non-exclusive, worldwide, royalty-free license to host, store, cache, reproduce, display, save, transmit, and distribute that content only as reasonably necessary to operate, secure, moderate, and provide that feature. You receive no automatic right to payment or revenue sharing from that use. Any broader commercial or derivative-use license must be disclosed in updated terms before the feature is activated. You cannot grant rights you do not have, and this license does not make Capsule Zero the owner of Your Content.",
          },
          {
            type: "paragraph",
            text: "For content submitted at your direction, Capsule Zero acts as a neutral intermediary. You are solely responsible for Your Content and its accuracy, legality, source, and the permissions attached to it. We do not review all content before or after submission and do not endorse User Content posted by other users. To the maximum extent permitted by law, we are not responsible or liable to third parties for that content merely because it is stored, indexed, recommended, displayed, or technically processed by the Service.",
          },
          {
            type: "list",
            items: [
              "Upload only content you own, that you have permission to upload, or that you are otherwise legally permitted to share.",
              "Do not upload photos of children, government IDs, payment cards, intimate imagery, illegal content, hate speech, threats, harassment, biometric templates, or content that infringes the rights of any third party.",
              "Do not upload sensitive personal data that is not needed for the Service, including health data, ethnicity, religion, political opinions, sexual orientation, or trade-union membership.",
              "If a photograph contains another identifiable person, you confirm that you have any consent or other legal basis required to upload that image and to allow us to process it.",
              "Do not upload counterfeit listings, misleading product information, or deceptive third-party product metadata.",
              "We do not review all Your Content, but we may use automated tools, manual review, or hybrid review to refuse, hide, remove, restrict, label, watermark, demote, or otherwise moderate it where we reasonably believe it violates these Terms, an incorporated policy, or applicable law, or where action is necessary to protect Capsule Zero or its users.",
            ],
          },
        ],
      },
      {
        id: "ai-recommendations",
        title: "6. AI-Assisted Output, Methodology, and Transparency",
        blocks: [
          {
            type: "paragraph",
            text: "Capsule Zero uses algorithms, automated classification, vector and semantic search, color-compatibility rules, and AI-assisted features to suggest item categories, dominant colors, outfit combinations, capsule palettes, gap analysis, shopping ideas, and image enhancements (together, \"AI-Assisted Output\"). AI-Assisted Output is generated automatically and is informed by the Capsule Zero methodology, by your data, and by Capsule Zero preset items.",
          },
          {
            type: "paragraph",
            text: "You acknowledge that AI-Assisted Output is probabilistic, advisory, and may be inaccurate, incomplete, outdated, unsuitable for your body, preferences, climate, dress code, culture, budget, or event. AI-Assisted Output is not professional fashion advice, not a medical or psychological assessment, not legal advice, not investment advice, and not a guarantee of resale value, authenticity, suitability, or marketplace availability. You remain solely responsible for your decisions, including what to buy, sell, repair, or wear.",
          },
          {
            type: "paragraph",
            text: "Capsule Zero does not make decisions about you that produce legal effects or similarly significant effects on you solely through automated processing within the meaning of Article 22 of the EU GDPR. Where automated tooling is used to recommend, classify, or rank, you can override, correct, or replace the result. If you wish to challenge an automated outcome that materially affects you (for example, an automated content removal decision), contact " + supportEmail + " to request human review.",
          },
          {
            type: "paragraph",
            text: "Where we use third-party AI or image-processing providers (for example, for background removal, image enhancement, or vector search), we use them under contract for the sole purpose of providing the Service to you. We do not knowingly allow those providers to use your private wardrobe content to train their general-purpose foundation models. If we change this position, we will update this section and obtain any consent required by law before doing so.",
          },
        ],
      },
      {
        id: "marketplace-links",
        title: "7. Marketplace Import Gate and Third-Party Services",
        blocks: [
          {
            type: "paragraph",
            text: "Marketplace link import and the shared user-import catalog are not currently available. We will not activate them unless and until a dedicated compliance-scheme specification and an external legal review are complete and all required launch controls are in place. Until then, you can upload photographs you are entitled to use or choose Capsule Zero-owned preset catalog items.",
          },
          {
            type: "paragraph",
            text: "If marketplace link import is activated after those conditions are satisfied, we will update these Terms and the Privacy Policy before launch to describe the supported flow, user responsibilities, notice-and-takedown controls, repeat-infringer policy, data processing, and any third-party providers. The platform will not generate additional derivative copies of a third-party image, and each imported image will retain a link to its source.",
          },
          {
            type: "paragraph",
            text: "Third-party stores, retailers, marketplaces, social networks, app stores, advertisers, and other third-party services (\"Third-Party Services\") are not owned or controlled by Capsule Zero. A link, recommendation, search result, item card, or future commercial disclosure does not mean that we endorse or guarantee a third party, its content, products, prices, availability, practices, or services. You access and purchase from Third-Party Services at your own risk and subject to their own terms and privacy policies. To the maximum extent permitted by law, Capsule Zero has no liability arising from your access to, use of, or purchase from them. Capsule Zero is not the seller, manufacturer, importer, repair partner, resale broker, or warranty provider for third-party items.",
          },
        ],
      },
      {
        id: "shared-catalog",
        title: "8. Shared Catalog, Semantic Search, and Public Items",
        blocks: [
          {
            type: "paragraph",
            text: "Capsule Zero preset catalog items use imagery produced and owned by Capsule Zero. Personal wardrobe content is private by default. The separate shared user-import pool described in Section 7 remains unavailable while its compliance and legal launch conditions are open.",
          },
          {
            type: "paragraph",
            text: "If a future shared contribution feature is activated, its updated terms and in-product notice will explain the rights required to submit content, the limited rights granted to Capsule Zero, how source links are preserved, and how submissions may be moderated or removed.",
          },
          {
            type: "paragraph",
            text: "Catalog data is approximate. Items, brands, prices, materials, colors, sizes, and availability may be inaccurate, outdated, or unavailable in your country. Do not rely on the catalog as a guarantee of authenticity, condition, intellectual-property status, safety, or marketplace availability.",
          },
        ],
      },
      {
        id: "paid-features",
        title: "9. Current Free Access and Future Monetization",
        blocks: [
          {
            type: "paragraph",
            text: "Capsule Zero does not currently sell subscriptions, coins, credits, or other paid digital features, and no payment provider is active for the Service.",
          },
          {
            type: "paragraph",
            text: "If Capsule Zero introduces a paid product, we will publish updated Terms, an updated Privacy Policy, pricing, purchase disclosures, and any required consumer notices before checkout becomes available. Your continued use of the current free Service does not accept or waive terms for a future purchase.",
          },
        ],
      },
      {
        id: "payments",
        title: "10. No Current Payments, Pricing, Taxes, or Invoices",
        blocks: [
          {
            type: "paragraph",
            text: "Capsule Zero has no active checkout, does not request a payment method, does not charge for the Service, and does not issue purchase invoices or tax receipts. Purchases you make directly from a third-party store or marketplace remain governed by that third party's terms, pricing, taxes, and consumer protections.",
          },
        ],
      },
      {
        id: "refunds",
        title: "11. Future Purchases and Consumer Rights",
        blocks: [
          {
            type: "paragraph",
            text: "Because Capsule Zero does not currently accept payments, there is no Capsule Zero purchase to cancel or refund. If we later introduce a paid product, the updated purchase terms will explain pricing, delivery, cancellation, refunds, and applicable rights of withdrawal before you buy. Nothing in these Terms limits mandatory consumer-protection rights that apply where you live.",
          },
        ],
      },
      {
        id: "platforms",
        title: "12. Mobile Applications and App Store Terms",
        blocks: [
          {
            type: "paragraph",
            text: "If you download or use the Capsule Zero mobile application from the Apple App Store or Google Play Store, you also agree to the relevant platform's end-user terms (including the Apple Licensed Application End User License Agreement and the Google Play Terms of Service). In case of any conflict between those platform terms and these Terms in respect of your use of the mobile application on that platform, the platform terms control to the minimum extent necessary.",
          },
          {
            type: "list",
            items: [
              "The mobile applications are licensed, not sold, to you. The license is personal, non-transferable, and limited to use on Apple- or Google-branded devices that you own or control, in accordance with the applicable platform's usage rules.",
              "Apple and Google are not parties to these Terms and are not responsible for the mobile application or its content. To the extent permitted by law, Apple and Google are third-party beneficiaries of the platform-required provisions only.",
              "Maintenance and support obligations for the mobile application are owed by Capsule Zero, not by Apple or Google.",
              "The mobile applications do not contain a Capsule Zero checkout, an external payment link, or an in-app purchase flow. Future monetization will require updated terms and platform-compliant purchase disclosures before it becomes available.",
              "If the mobile application fails to conform to any applicable warranty that cannot be disclaimed, you may notify Apple or Google for a refund of the purchase price (if any) of the app itself; any further claim relating to the app shall be governed by these Terms.",
            ],
          },
        ],
      },
      {
        id: "ip-takedown",
        title: "13. Intellectual Property, Reports, and Notice-and-Action",
        blocks: [
          {
            type: "paragraph",
            text: "Capsule Zero respects intellectual-property rights and maintains reporting and notice-and-action procedures under applicable law. Our incorporated Copyright & Intellectual Property Policy explains the information required in a rights notice, counter-notice procedure, restoration timing where the U.S. Digital Millennium Copyright Act (DMCA) applies, and our reasonably implemented repeat-infringer policy. Publication of that policy does not represent that any future shared-import feature has launched or that a jurisdiction-specific registration has been completed.",
          },
          {
            type: "paragraph",
            text: "Rights holders and authorized agents may report copyright, trademark, design-right, counterfeit, or other intellectual-property concerns to " + ipNoticeEmail + ". Anyone may report other allegedly illegal or policy-violating content to " + legalEmail + ". Reports and appeals must be made in good faith and contain enough information for us to identify the content, understand the basis, and contact the reporter. Fraudulent, baseless, automated, repetitive, or abusive submissions may be rejected or restricted and may carry legal consequences.",
          },
          {
            type: "paragraph",
            text: "We review sufficiently precise reports in a timely, diligent, objective, and non-arbitrary manner. We may remove or disable content, limit its distribution, restrict it geographically, suspend features, or suspend or terminate accounts and associated domains. Where appropriate or required by law, we notify the affected user, provide a statement of reasons, and offer a counter-notice or appeal route under the Copyright & IP and Enforcement & Appeals policies.",
          },
        ],
      },
      {
        id: "acceptable-use",
        title: "14. Acceptable Use and Content Moderation",
        blocks: [
          {
            type: "paragraph",
            text: "Our incorporated Community Guidelines define the content and conduct allowed on Capsule Zero. They apply to private and public uploads, links, catalog submissions, metadata, comments, messages, AI-generated or manipulated content, account behavior, and attempts to use the Service indirectly. Without limiting those Guidelines, you may not:",
          },
          {
            type: "list",
            items: [
              "violate any applicable law, consumer-protection rule, sanctions regime, export-control rule, anti-money-laundering rule, intellectual-property right, privacy right, publicity right, or contractual obligation;",
              "scrape, crawl, harvest, copy, resell, syndicate, sublicense, or bulk-extract data, images, AI-Assisted Output, embeddings, methodology elements, or catalog content without our prior written permission;",
              "reverse engineer, decompile, disassemble, derive source from, or attempt to extract weights, prompts, or methodology from the Service, except to the limited extent that such activity cannot be lawfully restricted under applicable law;",
              "bypass, disable, overload, attack, or test the vulnerability of the Service except through an approved coordinated-disclosure security process announced by Capsule Zero;",
              "upload malware, spyware, ransomware, phishing content, or scripts intended to harm any user, the Service, or any third party;",
              "upload misleading product information, counterfeit listings, illegal marketplace data, or content that impersonates another person, brand, or organization;",
              "use the Service to build, train, fine-tune, evaluate, benchmark, or improve any competing product, dataset, embedding store, model, or recommendation system, in whole or in part;",
              "attempt to obtain unauthorized access to another account, another user's wardrobe, provider accounts, internal moderation features, admin dashboards, or non-public APIs;",
              "use the Service to harass, dox, defraud, or otherwise harm any person.",
            ],
          },
          {
            type: "paragraph",
            text: "Our Enforcement & Appeals Policy describes how we detect and act on potential violations through automated tools, manual review, and hybrid approaches. Depending on context, severity, repetition, and risk, we may block submission, remove content, limit distribution or features, add labels or sensitivity screens, restrict a domain or account, preserve evidence, report matters where legally required, or suspend or terminate access. Where appropriate or required by law, we explain decisions and provide an internal appeal through " + supportEmail + ".",
          },
        ],
      },
      {
        id: "availability",
        title: "15. Availability, Updates, and Discontinuation",
        blocks: [
          {
            type: "paragraph",
            text: "We aim to keep the Service available and to ship improvements continuously. The Service is provided on an evolving basis. We may release updates, change features, change supported regions or languages, retire mobile platforms, change the supported set of social-login providers, or otherwise modify the Service.",
          },
          {
            type: "paragraph",
            text: "We may also schedule maintenance windows, throttle requests, restrict access during incidents, or temporarily suspend features. Where reasonably possible, we will give advance notice for planned downtime that materially affects you.",
          },
          {
            type: "paragraph",
            text: "If we permanently discontinue a feature, we will give reasonable notice where practical and preserve any mandatory rights or remedies that apply under law.",
          },
        ],
      },
      {
        id: "suspension",
        title: "16. Suspension, Termination, and Account Deletion",
        blocks: [
          {
            type: "paragraph",
            text: "We may suspend, restrict, or terminate your access to the Service, remove or disable Your Content, or rotate your credentials if we reasonably believe that (a) you violated these Terms or applicable law, (b) you created risk for other users, the Service, our providers, or us, or (c) action is required by law, court order, sanctions, or a competent authority.",
          },
          {
            type: "paragraph",
            text: "You may stop using the Service at any time, sign out, and request account closure through the Service or by writing to " + supportEmail + ". Account closure deletes your private wardrobe content and personal account data within 30 days of confirmation, subject to backup rotation, security log retention, sanctions screening, and dispute-resolution needs, as further described in the Privacy Policy.",
          },
          {
            type: "paragraph",
            text: "Sections that by their nature should survive termination will survive, including Sections 5 (ownership and license), 6 (AI disclaimers), 11 (consumer rights), 13 (IP notices), 17 (disclaimers), 18 (liability), 19 (indemnity), 20 (governing law), and 22 (contact).",
          },
        ],
      },
      {
        id: "disclaimers",
        title: "17. Disclaimers",
        blocks: [
          {
            type: "paragraph",
            text: "To the maximum extent permitted by applicable law, the Service, the Capsule Zero IP, the AI-Assisted Output, the preset catalog, and any other available feature are provided on an \"as is\" and \"as available\" basis. We disclaim all express and implied warranties of any kind, including warranties of merchantability, fitness for a particular purpose, non-infringement, accuracy of recommendations, completeness of catalog data, third-party availability, profitability, resale value, suitability for any specific event or dress code, uninterrupted operation, error-free operation, virus-free operation, and continued compatibility with any third-party service.",
          },
          {
            type: "paragraph",
            text: "Capsule Zero does not warrant the ownership, legality, accuracy, authenticity, safety, or suitability of User Content posted by other users. You may encounter content that is inaccurate, objectionable, misleading, infringing, illegal, or otherwise unsuitable. To the maximum extent permitted by law, Capsule Zero assumes no responsibility or liability for that content or for a third party's conduct merely because the Service hosts, recommends, links to, or displays it.",
          },
          {
            type: "paragraph",
            text: "Nothing in these Terms excludes or limits liability that cannot be excluded or limited under applicable law, including liability for death, personal injury caused by negligence, fraud, fraudulent misrepresentation, gross negligence, willful misconduct, or any other liability that cannot be waived under mandatory consumer law.",
          },
        ],
      },
      {
        id: "liability",
        title: "18. Limitation of Liability",
        blocks: [
          {
            type: "paragraph",
            text: "To the maximum extent permitted by applicable law, Capsule Zero, its affiliates, officers, directors, employees, agents, contractors, and licensors will not be liable for any indirect, incidental, special, consequential, exemplary, or punitive damages; any loss of profit, revenue, data, business, goodwill, wardrobe value, item value, resale value, outfit opportunity, or business interruption; or any damage caused by third-party providers, third-party marketplaces, app stores, or other third parties, even if we have been advised of the possibility of such damages.",
          },
          {
            type: "paragraph",
            text: "To the maximum extent permitted by applicable law, our total aggregate liability arising out of or in connection with these Terms or the current free Service will not exceed one hundred U.S. dollars (USD 100). This cap is cumulative and applies across all claims, theories of liability, and causes of action.",
          },
          {
            type: "paragraph",
            text: "If you are a consumer with mandatory rights under your local law that cannot be limited or excluded, the above limitations apply only to the extent permitted by that law.",
          },
        ],
      },
      {
        id: "indemnity",
        title: "19. Indemnity",
        blocks: [
          {
            type: "paragraph",
            text: "Where permitted by applicable law, you agree to defend, indemnify, and hold harmless Capsule Zero, its affiliates, and their respective officers, directors, employees, agents, and contractors from and against any claims, losses, liabilities, damages, costs, and expenses (including reasonable legal fees) arising out of or related to (a) Your Content, (b) your use or misuse of the Service, (c) your purchase, sale, repair, or resale of items referenced through any Third-Party Service, (d) your violation of these Terms, (e) your violation of any applicable law, or (f) your violation of any third party's rights, including intellectual-property, privacy, or publicity rights.",
          },
        ],
      },
      {
        id: "law-disputes",
        title: "20. Governing Law, Disputes, and Consumer Rights",
        blocks: [
          {
            type: "paragraph",
            text: "Before starting any formal proceeding, please contact us at " + supportEmail + " or " + legalEmail + " so that we can try to resolve your concern informally. We will respond in good faith.",
          },
          {
            type: "paragraph",
            text: "These Terms are governed by the laws of the Argentine Republic, without giving effect to any choice-of-law rules that would result in the application of the laws of another jurisdiction. The competent courts of the Autonomous City of Buenos Aires have non-exclusive jurisdiction over disputes arising under these Terms.",
          },
          {
            type: "paragraph",
            text: "Nothing in this section deprives you of the protection of mandatory consumer-protection rules that apply where you live. If you are a consumer in the EEA, UK, Switzerland, Brazil, or another jurisdiction with mandatory protective rules, you keep those rights, and you may also be entitled to bring proceedings in your local courts or use an available competent alternative-dispute-resolution body. The former European Commission online dispute-resolution platform was discontinued in 2025 and is not presented as an available redress channel.",
          },
        ],
      },
      {
        id: "changes",
        title: "21. Changes to These Terms",
        blocks: [
          {
            type: "paragraph",
            text: "We may update these Terms from time to time to reflect changes in the Service, in applicable law, in subprocessors, or in our business. If a change is material, we will give you advance notice through the Service, by email, or by another reasonable method, and we will update the \"Last updated\" and \"Effective\" dates above. Where required by law, material changes will take effect only after your continued use following the notice period, or after your explicit acceptance. Future monetization will require updated purchase terms and disclosures before checkout is available. If you do not accept the updated Terms, you may stop using the Service and close your account.",
          },
        ],
      },
      {
        id: "contact",
        title: "22. How to Contact Us",
        blocks: [
          {
            type: "paragraph",
            text: `Legal entity: ${operatingEntity}. Registered office: ${registeredOffice}. Legal contact: ${legalEmail}. Privacy contact: ${privacyEmail}. Support: ${supportEmail}. IP and takedown notices: ${ipNoticeEmail}.`,
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
      "How Capsule Zero S.A.S. collects, uses, shares, stores, and protects personal data across the website, web app, mobile apps, wardrobe tools, uploads, AI-assisted recommendations, support, and analytics — and how you can exercise your privacy rights.",
    lastUpdated,
    effectiveDate,
    relatedDocument: {
      href: "/terms-of-use",
      label: "Terms of Use",
    },
    intro: [
      `This Privacy Policy ("Policy") explains how ${operatingEntity} ("Capsule Zero", "we", "us") processes personal data when you visit ${productDomain}, create an account, use our web or mobile applications, upload wardrobe content, search Capsule Zero preset items, contact support, receive product communications, or otherwise interact with us.`,
      "Capsule Zero is a premium digital fashion-tech product. We aim to process personal data in a privacy-conscious way: private wardrobe content is private by default, AI-Assisted Output should be explainable, and optional features collect only what they need.",
      `This Policy applies in addition to the Terms of Use. For questions about this Policy, or to exercise any of the rights described below, contact our Privacy team at ${privacyEmail}. Our Data Protection Officer can be reached at ${dpoEmail}.`,
    ],
    highlights: [
      "We are the data controller for personal data processed to provide the Service.",
      "We do not sell personal data and we do not share it for cross-context behavioral advertising in the sense of U.S. state privacy laws.",
      "Private wardrobe content is private by default; it is not visible to other users unless you explicitly use a sharing feature.",
      "You have rights to access, correct, delete, port, restrict, and object to processing — see Section 13.",
    ],
    sections: [
      {
        id: "controller",
        title: "1. Controller, Data Protection Officer, and Representatives",
        blocks: [
          {
            type: "paragraph",
            text: `Data controller: ${operatingEntity}, with registered office in ${registeredOffice}. For all data-protection matters, contact ${privacyEmail}. Our Data Protection Officer can be reached at ${dpoEmail}.`,
          },
          {
            type: "paragraph",
            text: "Where required, Capsule Zero appoints local representatives to handle requests from data subjects and supervisory authorities under the EU GDPR (Article 27) and the UK GDPR. The current EU representative and UK representative contact details are published at " + productDomain + "/privacy-policy and are also available on request at " + privacyEmail + ".",
          },
        ],
      },
      {
        id: "scope",
        title: "2. Scope of This Policy",
        blocks: [
          {
            type: "paragraph",
            text: "This Policy applies to the Capsule Zero website, the Capsule Zero web application, our iOS and Android mobile applications, account and authentication flows, wardrobe and capsule tools, photo upload and image-processing flows, preset-catalog search, support channels, analytics, and product communications. Describing the gated future feature below does not make that feature active.",
          },
          {
            type: "paragraph",
            text: "Capsule Zero does not currently collect billing, invoice, or payment-provider data because no monetization or payment flow is active.",
          },
          {
            type: "paragraph",
            text: "Existing production profiles may still contain a dormant legacy coin-balance field initialized by our account system. It cannot be purchased, spent, or used to unlock features, and no coin transaction ledger is created while the hold remains active.",
          },
          {
            type: "paragraph",
            text: "This Policy does not replace the privacy notices of third-party services that you access from Capsule Zero, including third-party stores, marketplaces, social-login providers, app stores, analytics providers, customer-support providers, and image-processing providers. Each of those services has its own privacy notice that you should review.",
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
                "Name, email, password authentication data (hashed), account ID, language, country, city, login state, recovery and security events, social-login identifiers when you sign in via Google or Apple.",
              ],
              [
                "Profile and preference data",
                "Avatar, sizes, style preferences, notification settings, security preferences, optional profile fields.",
              ],
              [
                "Wardrobe and capsule data",
                "Item photos, categories, dominant colors, brands, materials, notes, item statuses (favorites, for sale, for repair, uncapsulated), capsule palettes, generated outfits, OPR scores, and gap suggestions.",
              ],
              [
                "Upload and image-processing data",
                "Original images, processed images, thumbnails, image-processing status, retry information, file metadata such as size and MIME type. We strip non-essential metadata where reasonable.",
              ],
              [
                "Gated marketplace import and catalog data",
                "Capsule Zero does not currently collect or process marketplace URLs, parsed item candidates, or marketplace source-site metadata because marketplace link import is disabled. Current catalog data is limited to your search queries and interactions with Capsule Zero preset items.",
              ],
              [
                "Dormant legacy profile data",
                "A coin-balance value initialized with the production profile for backward compatibility. No purchase, spend, invoice, refund, payment-method, payment-provider, or transaction-ledger data is created for it while monetization is on hold.",
              ],
              [
                "Device and usage data",
                "IP address, device type, operating system, browser, app version, pages viewed, feature usage, performance metrics, error logs, cookies and similar identifiers, local-storage entries, approximate region inferred from IP, and security events.",
              ],
              [
                "Communications data",
                "Support messages, feedback, survey responses, legal and privacy requests, and related metadata such as time, channel, and language.",
              ],
            ],
          },
        ],
      },
      {
        id: "sensitive-data",
        title: "4. Sensitive Data, Wardrobe Photos, and Biometrics",
        blocks: [
          {
            type: "paragraph",
            text: "Capsule Zero is not designed to collect special categories of personal data within the meaning of Article 9 of the EU GDPR (or equivalent local concepts), such as health information, racial or ethnic origin, religious or political views, genetic data, biometric identifiers used to uniquely identify a person, sexual orientation, or trade-union membership. Please do not upload such information.",
          },
          {
            type: "paragraph",
            text: "Wardrobe photos may incidentally show people, bodies, faces, rooms, or locations. We process those images only to provide the Service to you, including storage, thumbnail generation, item display, background removal, color and category analysis, and optional editorial enhancement. We do not intentionally identify individuals, do not create biometric templates, do not run facial-recognition, and do not use wardrobe photos for advertising profiling.",
          },
          {
            type: "paragraph",
            text: "We also do not knowingly collect personal data from children below the applicable digital-consent age (see Section 17).",
          },
        ],
      },
      {
        id: "sources",
        title: "5. Sources of Personal Data",
        blocks: [
          {
            type: "list",
            items: [
              "Directly from you, when you create an account, upload photos, fill in profile fields, search Capsule Zero preset items, or contact support.",
              "Automatically, from your browser, device, app, cookies, local storage, and our server-side logs.",
              "From service providers, including authentication providers, app stores, image-processing providers, analytics providers, and customer-support providers.",
              "From other users, only where they interact with you through shared features (for example, where a user submits an item to the shared catalog that you later interact with).",
            ],
          },
        ],
      },
      {
        id: "purposes",
        title: "6. Purposes, Legal Bases, and Necessity",
        blocks: [
          {
            type: "table",
            columns: ["Purpose", "Data used", "Lawful basis (EU/UK GDPR equivalents)"],
            rows: [
              [
                "Provide accounts, authentication, sessions, and recovery",
                "Account, login, session, recovery, profile, device data",
                "Performance of contract (Art. 6(1)(b) GDPR); legal obligations (Art. 6(1)(c)); legitimate interests in security (Art. 6(1)(f))",
              ],
              [
                "Operate wardrobe, capsule, upload, semantic search, and recommendation features",
                "Wardrobe content, photos, item metadata, color data, preferences, search data",
                "Performance of contract; legitimate interests in improving recommendations",
              ],
              [
                "Maintain backward compatibility while the legacy profile field is retired",
                "Dormant legacy balance and account ID",
                "Legitimate interests in safe migration and deprecation; the value is not used for purchases, feature access, recommendations, or automated decisions",
              ],
              [
                "Provide customer support",
                "Contact data, support messages, account status",
                "Performance of contract; legitimate interests in service quality; consent where required",
              ],
              [
                "Secure, monitor, debug, and improve the Service",
                "Usage data, logs, error reports, device data, limited analytics",
                "Legitimate interests in security and product quality; consent where required",
              ],
              [
                "Product communications and marketing",
                "Email, preferences, country, usage signals",
                "Consent (for marketing emails where required by law); legitimate interests for transactional and service messages",
              ],
              [
                "Comply with law, respond to lawful requests, and enforce our rights",
                "Account, logs, communications, content moderation records",
                "Legal obligations; legitimate interests; establishment, exercise, or defense of legal claims",
              ],
            ],
          },
          {
            type: "paragraph",
            text: "Where we rely on consent (for example, for non-essential cookies or for marketing emails in jurisdictions that require opt-in), you may withdraw consent at any time without affecting the lawfulness of prior processing. Withdrawing consent may make certain features unavailable.",
          },
        ],
      },
      {
        id: "ai-processing",
        title: "7. AI, Automated Processing, and Recommendations",
        blocks: [
          {
            type: "paragraph",
            text: "We use automated tooling, including AI models, to classify items, remove backgrounds, generate thumbnails, enhance images, suggest dominant colors, propose outfit combinations, calculate OPR, identify wardrobe gaps, and power semantic search. We refer to these outputs as \"AI-Assisted Output\".",
          },
          {
            type: "paragraph",
            text: "AI-Assisted Output is advisory. We do not use solely automated processing to make decisions that produce legal effects or similarly significant effects on you within the meaning of Article 22 of the EU GDPR. You can accept, ignore, edit, or replace any recommendation. If an automated content-moderation decision materially affects you, you can request human review by contacting " + supportEmail + ".",
          },
          {
            type: "paragraph",
            text: "Where we use third-party AI or image-processing providers (for example, for background removal, image enhancement, or vector search), we use them under contract and only to provide the Service to you. We do not knowingly allow those providers to use your private wardrobe content to train their general-purpose foundation models. If we change this position, we will update this Policy and obtain consent where required by law.",
          },
          {
            type: "paragraph",
            text: "We design our AI features to align with applicable AI-governance frameworks, including the EU AI Act, by giving you transparency, the ability to override automated suggestions, and clear human points of contact.",
          },
        ],
      },
      {
        id: "sharing",
        title: "8. Subprocessors and How We Share Personal Data",
        blocks: [
          {
            type: "paragraph",
            text: "We share personal data only as necessary to operate, secure, support, analyze, and improve the Service, or as required by law. The main categories of recipients are listed below. A current list of named subprocessors is available at " + productDomain + "/privacy-policy and can also be requested at " + privacyEmail + ".",
          },
          {
            type: "table",
            columns: ["Category of recipient", "Examples", "Purpose"],
            rows: [
              [
                "Hosting, database, authentication, storage",
                "Hetzner Cloud, Hetzner Object Storage",
                "Application hosting and compute, PostgreSQL database, self-hosted authentication, object storage",
              ],
              [
                "Image processing and AI",
                "Background-removal and image-enhancement providers, embedding and vector-search providers",
                "Upload pipeline, image cleanup, semantic search",
              ],
              [
                "Future marketplace import",
                "No current recipient",
                "No marketplace URL or source-site metadata is disclosed. If the gated feature is activated, we will update this Policy before collection or disclosure to any marketplace adapter provider begins.",
              ],
              [
                "Analytics, logging, error monitoring",
                "Privacy-conscious analytics and observability providers",
                "Product analytics, performance monitoring, debugging",
              ],
              [
                "Customer support and email",
                "Help-desk and transactional-email providers",
                "Support, account notifications, transactional emails",
              ],
              [
                "Mobile platforms",
                "Apple App Store, Google Play Store",
                "Distribution and basic platform-level telemetry",
              ],
              [
                "Professional advisors",
                "Auditors, lawyers, accountants, insurers, banks",
                "Compliance, audit, legal advice, tax, banking",
              ],
              [
                "Authorities",
                "Courts, regulators, law-enforcement",
                "Compliance with valid legal requests, defense of claims",
              ],
              [
                "Corporate transactions",
                "Successors, financing partners",
                "Merger, acquisition, financing, restructuring, or sale of assets",
              ],
            ],
          },
          {
            type: "paragraph",
            text: "We do not sell personal data, and we do not engage in cross-context behavioral advertising as those terms are defined under U.S. state privacy laws. Private wardrobe uploads are not shared with other users unless you explicitly use a sharing or catalog feature.",
          },
        ],
      },
      {
        id: "international-transfers",
        title: "9. International Transfers and Safeguards",
        blocks: [
          {
            type: "paragraph",
            text: "Capsule Zero is designed for global use. Personal data may be processed in countries other than the one where you live, including Argentina (our home jurisdiction), the United States, the European Economic Area, and other countries where our subprocessors operate. Privacy laws in those countries may differ from yours.",
          },
          {
            type: "paragraph",
            text: "Where personal data is transferred outside the EEA, the UK, or another jurisdiction with comparable rules, we use appropriate safeguards, including the European Commission's Standard Contractual Clauses (Decision 2021/914/EU), the UK International Data Transfer Addendum, transfer impact assessments, supplementary technical measures (such as encryption in transit and at rest), and provider due diligence. A copy of the applicable safeguards is available at " + privacyEmail + ".",
          },
          {
            type: "paragraph",
            text: "For transfers from Argentina, we comply with the international-transfer rules under Ley 25.326 and the requirements of the Agencia de Acceso a la Información Pública (AAIP).",
          },
        ],
      },
      {
        id: "cookies",
        title: "10. Cookies, Tracking, and Online Identifiers",
        blocks: [
          {
            type: "paragraph",
            text: "We use cookies, local storage, device identifiers, SDKs, pixels, and similar technologies (\"cookies\") for necessary site operation, session management, language preference, security, analytics, product improvement, and (where enabled with consent) marketing.",
          },
          {
            type: "list",
            items: [
              "Strictly necessary cookies support login, security, routing, language, and core app behavior. They cannot be switched off via the cookie banner.",
              "Preference cookies remember settings such as language, cookie choices, and dashboard layout.",
              "Analytics and performance cookies help us understand product usage and diagnose issues; we use these subject to consent in jurisdictions where consent is required for non-essential cookies.",
              "Marketing cookies, if introduced, are subject to consent, an opt-out mechanism (including Global Privacy Control signals where required), and the right to withdraw consent.",
            ],
          },
          {
            type: "paragraph",
            text: "Where required by law (for example, in the EEA/UK under the ePrivacy Directive and PECR), we ask for consent before placing non-essential cookies and we let you change your choices through the in-product cookie preferences. You can also control cookies through your browser or device settings. Blocking strictly necessary cookies may break login, language switching, and other core features.",
          },
        ],
      },
      {
        id: "retention",
        title: "11. Retention Periods",
        blocks: [
          {
            type: "paragraph",
            text: "We keep personal data only as long as reasonably necessary to fulfill the purposes described in this Policy, unless a longer period is required or permitted by law (for example, security, fraud-prevention, legal-hold, or dispute-resolution obligations).",
          },
          {
            type: "table",
            columns: ["Data", "Retention period"],
            rows: [
              [
                "Account and profile data",
                "For the life of your account. After account closure, we delete or anonymize active records within 30 days, subject to encrypted backup rotation that completes within an additional 90 days.",
              ],
              [
                "Dormant legacy profile balance",
                "Stored with the production profile until the field is removed or replaced, and deleted or anonymized on the same schedule as account and profile data. It is not retained as a financial transaction record.",
              ],
              [
                "Wardrobe photos and item data",
                "Until you delete them or close your account. Soft-deleted assets are purged from active systems within 30 days.",
              ],
              [
                "Security logs and technical logs",
                "Typically up to 12 months. Logs related to a security incident, abuse case, or legal claim may be retained for longer.",
              ],
              [
                "Support and legal requests",
                "Up to 5 years from the closure of the request, longer where needed to handle disputes or comply with legal-hold notices.",
              ],
              [
                "Content moderation records",
                "Up to 5 years, in line with EU Digital Services Act recordkeeping expectations.",
              ],
            ],
          },
        ],
      },
      {
        id: "security",
        title: "12. Security Measures",
        blocks: [
          {
            type: "paragraph",
            text: "We use reasonable technical and organizational measures designed to protect personal data, taking into account the state of the art, the cost of implementation, the nature, scope, and purposes of processing, and the risks to your rights and freedoms. Measures include:",
          },
          {
            type: "list",
            items: [
              "encryption in transit (TLS 1.2 or higher) and encryption at rest for personal data and uploaded media;",
              "row-level security and granular access controls on our database and storage layer;",
              "principle-of-least-privilege access management for staff, with role-based access controls and audit logging;",
              "subprocessor due diligence and contractual data-protection commitments;",
              "logging, monitoring, and alerting on security events;",
              "private storage rules separating private wardrobe assets from public catalog assets;",
              "secret rotation, secure software-development practices, and dependency monitoring;",
              "documented incident-response and breach-notification procedures.",
            ],
          },
          {
            type: "paragraph",
            text: "No online service is fully secure. You are responsible for keeping your credentials private, using strong passwords and (where available) multi-factor authentication, securing your devices, and promptly notifying " + supportEmail + " if you believe your account has been compromised.",
          },
        ],
      },
      {
        id: "rights",
        title: "13. Your Privacy Rights",
        blocks: [
          {
            type: "paragraph",
            text: "Depending on where you live, you have rights regarding your personal data. These typically include:",
          },
          {
            type: "list",
            items: [
              "access to the personal data we hold about you;",
              "rectification of inaccurate or incomplete personal data;",
              "deletion or erasure of personal data, subject to legal-retention exceptions;",
              "portability of personal data you provided to us, in a structured, machine-readable format, where applicable;",
              "restriction of processing in certain situations;",
              "objection to processing based on our legitimate interests, including objection to direct marketing at any time;",
              "withdrawal of consent at any time where we relied on consent;",
              "the right not to be subject to a decision based solely on automated processing that produces legal or similarly significant effects;",
              "the right to lodge a complaint with a supervisory authority.",
            ],
          },
          {
            type: "paragraph",
            text: "To exercise any of these rights, contact " + privacyEmail + " or use the in-product privacy controls where available. We may need to verify your identity and account ownership before responding. We will respond within the timeframes required by applicable law (generally within 30 days in the EEA/UK, extendable by up to 60 days where the request is complex).",
          },
          {
            type: "paragraph",
            text: "We will not discriminate against you for exercising your privacy rights. Note, however, that deleting or restricting essential personal data may make some features unavailable or may require us to close your account.",
          },
        ],
      },
      {
        id: "automated-decisions",
        title: "14. Automated Decision-Making and Profiling",
        blocks: [
          {
            type: "paragraph",
            text: "We do not make decisions about you that produce legal effects or similarly significant effects on you solely through automated processing within the meaning of Article 22 of the EU GDPR. We do use automated processing for content classification, recommendation ranking, semantic-search ordering, fraud-screening signals, and content moderation triage. You can request human review of any automated content-moderation decision that materially affects you by contacting " + supportEmail + ".",
          },
        ],
      },
      {
        id: "breach",
        title: "15. Data Breach Notification",
        blocks: [
          {
            type: "paragraph",
            text: "We maintain incident-response procedures designed to detect, investigate, and respond to personal-data breaches. Where a personal-data breach is likely to result in a risk to your rights and freedoms, we will notify the relevant supervisory authority and, where the risk is high, we will also notify affected users without undue delay, in accordance with applicable law (including Articles 33–34 of the EU GDPR and equivalent rules under Argentine Ley 25.326, U.S. state breach-notification laws, and Brazilian LGPD).",
          },
        ],
      },
      {
        id: "regional-notices",
        title: "16. Regional Notices",
        blocks: [
          {
            type: "paragraph",
            text: "European Economic Area, United Kingdom, and Switzerland. The data controller is " + operatingEntity + ". Processing of personal data is carried out in accordance with the EU GDPR, the UK GDPR, the UK Data Protection Act 2018, and the Swiss Federal Act on Data Protection. You may contact our Data Protection Officer at " + dpoEmail + " and you have the right to lodge a complaint with your national supervisory authority. Our EU and UK representatives are listed at " + productDomain + "/privacy-policy.",
          },
          {
            type: "paragraph",
            text: "Argentina. Processing is carried out in accordance with Ley 25.326 and its implementing rules. The competent supervisory authority is the Agencia de Acceso a la Información Pública (AAIP). You may exercise your rights of access, rectification, suppression, and update by contacting " + privacyEmail + ".",
          },
          {
            type: "paragraph",
            text: "Brazil. Processing is carried out in accordance with Lei Geral de Proteção de Dados (LGPD). Our data-protection officer (encarregado) can be reached at " + dpoEmail + ". The competent supervisory authority is the Autoridade Nacional de Proteção de Dados (ANPD).",
          },
          {
            type: "paragraph",
            text: "United States. If you are a resident of California, Virginia, Colorado, Connecticut, Utah, Texas, or another U.S. state that has enacted a comprehensive consumer-privacy law, you may have additional rights, including the right to know what categories and specific pieces of personal data we hold about you, the right to delete personal data, the right to correct inaccurate personal data, the right to portability, the right to limit the use of sensitive personal information, and the right to opt out of \"sale\" or \"sharing\" of personal data. Capsule Zero does not sell personal data and does not engage in cross-context behavioral advertising. To exercise your U.S. state privacy rights, contact " + privacyEmail + ". We will not discriminate against you for exercising these rights. We honor Global Privacy Control signals where required.",
          },
          {
            type: "paragraph",
            text: "Other jurisdictions. If you live in another jurisdiction with applicable privacy rules (for example, Canada (PIPEDA, Quebec Law 25), Australia (Privacy Act), South Africa (POPIA), or similar), please contact us at " + privacyEmail + " to exercise your rights.",
          },
        ],
      },
      {
        id: "children",
        title: "17. Children and Minors",
        blocks: [
          {
            type: "paragraph",
            text: "Capsule Zero is not intended for children under 16, and is not directed at children under 13 in any jurisdiction. We do not knowingly collect personal data from anyone below the applicable digital-consent age. If you believe a child has provided personal data to us, contact " + privacyEmail + " so that we can review and, where appropriate, delete the account and associated data.",
          },
        ],
      },
      {
        id: "third-party-links",
        title: "18. Third-Party Links",
        blocks: [
          {
            type: "paragraph",
            text: "The Service contains links to marketplaces, brands, social networks, app stores, support tools, and other third-party websites and services. We are not responsible for their privacy practices. Review their privacy notices before sharing personal data or making purchases.",
          },
        ],
      },
      {
        id: "changes",
        title: "19. Changes to This Policy",
        blocks: [
          {
            type: "paragraph",
            text: "We may update this Policy from time to time to reflect changes in the Service, in applicable law, or in our subprocessors. If a change is material, we will provide notice through the Service, by email, or by another reasonable method, and we will update the \"Last updated\" and \"Effective\" dates above. The updated Policy applies from the new effective date unless the notice says otherwise.",
          },
        ],
      },
      {
        id: "contact",
        title: "20. How to Contact Us",
        blocks: [
          {
            type: "paragraph",
            text: `Data controller: ${operatingEntity}. Registered office: ${registeredOffice}. Privacy contact: ${privacyEmail}. Data Protection Officer: ${dpoEmail}. Legal contact: ${legalEmail}. Support: ${supportEmail}.`,
          },
        ],
      },
    ],
  },
};
