import type { LegalDocument } from "../legal-content";
import { legalContacts } from "./contacts";

const lastUpdated = "August 13, 2026";
const effectiveDate = "July 24, 2026";
const operatingEntity = "Capsule Zero S.A.S.";
const registeredOffice =
  "Ciudad Autónoma de Buenos Aires, Argentina";
const {
  productDomain,
  privacyEmail,
  legalEmail,
  supportEmail,
  ipEmail: ipNoticeEmail,
} = legalContacts;

const termsEffectiveJuly24: LegalDocument = {
    slug: "terms-of-use",
    title: "Terms of Use",
    eyebrow: "Legal",
    summary:
      "The binding contract between you and Capsule Zero S.A.S. governing accounts, wardrobe content, AI-assisted recommendations, semantic search, mobile apps, current free access, gated future features, and your statutory consumer rights.",
    lastUpdated,
    effectiveDate,
    relatedDocument: {
      href: "/privacy-policy",
      label: "Privacy Policy",
    },
    intro: [
      `These Terms of Use ("Terms") form a binding contract between you and ${operatingEntity}, a company incorporated under the laws of the Argentine Republic with registered office in ${registeredOffice} ("Capsule Zero", "we", "us", "our"). They govern your access to and use of the Capsule Zero website at ${productDomain}, the Capsule Zero web application, our iOS and Android mobile applications, account features, wardrobe and capsule tools, photo upload and image-processing flows, semantic search, the Capsule Zero preset catalog, support, and any related services we provide (together, the "Service"). Section 7 separately identifies a future feature that is not part of the current Service.`,
      "By creating an account, signing in, uploading content, or using the Service, you confirm that you have read these Terms, that you accept them, and that you have the legal capacity to enter into this contract. If you use the Service on behalf of another person, organization, or legal entity, you confirm that you have authority to accept these Terms on their behalf, and references to \"you\" include both you and that person or entity.",
      "These Terms apply in addition to the separate Privacy Policy, any product-specific notices we surface in the Service (for example, age-gates or content-moderation notices), and any mandatory consumer-protection rules that apply where you live.",
    ],
    highlights: [
      "You keep ownership of your wardrobe photos and content; we receive a limited license needed to operate, secure, and improve the Service.",
      "Capsule Zero recommends; it does not dictate. AI-assisted output is advisory and is not a substitute for professional, medical, financial, or legal advice.",
      "Capsule Zero is currently free to use and has no active checkout or payment flow; we will publish updated terms before introducing monetization.",
      "Consumers in the EEA, UK, and other jurisdictions keep their statutory rights; nothing in these Terms limits mandatory consumer protections.",
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
            type: "list",
            items: [
              "Upload only content you own, that you have permission to upload, or that you are otherwise legally permitted to share.",
              "Do not upload photos of children, government IDs, payment cards, intimate imagery, illegal content, hate speech, threats, harassment, biometric templates, or content that infringes the rights of any third party.",
              "Do not upload sensitive personal data that is not needed for the Service, including health data, ethnicity, religion, political opinions, sexual orientation, or trade-union membership.",
              "If a photograph contains another identifiable person, you confirm that you have any consent or other legal basis required to upload that image and to allow us to process it.",
              "Do not upload counterfeit listings, misleading product information, or deceptive third-party product metadata.",
              "We do not pre-screen Your Content, but we may review, refuse, hide, remove, watermark, demote, or otherwise moderate Your Content where we reasonably believe it violates these Terms, our acceptable use rules, or applicable law.",
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
            text: "Third-party stores, retailers, marketplaces, social networks, app stores, and other third-party services (\"Third-Party Services\") are not controlled by Capsule Zero. Your use of any Third-Party Service is subject to that service's own terms and privacy policy. Capsule Zero is not the seller, manufacturer, importer, repair partner, resale broker, or warranty provider for third-party items.",
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
        title: "13. Intellectual Property and Notice-and-Action Procedure",
        blocks: [
          {
            type: "paragraph",
            text: "Capsule Zero respects intellectual property rights and complies with applicable notice-and-action obligations, including the U.S. Digital Millennium Copyright Act (DMCA) and the EU Digital Services Act (Regulation (EU) 2022/2065).",
          },
          {
            type: "paragraph",
            text: "If you are a rights holder and you believe that content available through the Service infringes your copyright, trademark, design right, or other intellectual property right, please send a notice to " + ipNoticeEmail + " that includes (a) your name, contact details, and the right you hold; (b) sufficient identification of the protected work or right; (c) sufficient identification of the allegedly infringing content (including a URL or item ID); (d) a statement made in good faith that the use is not authorized; (e) a statement, under penalty of perjury where applicable, that the information is accurate and that you are authorized to act; and (f) your electronic or physical signature.",
          },
          {
            type: "paragraph",
            text: "We will review valid notices and may remove, disable, or restrict access to the affected content. We may also notify the user who submitted the content and, where applicable, give them a chance to submit a counter-notice. Repeat infringers may have their accounts suspended or terminated.",
          },
          {
            type: "paragraph",
            text: "Other illegal-content notices, including hate speech, terrorism, child sexual abuse material, non-consensual intimate imagery, scams, counterfeit listings, or violations of the EU Digital Services Act, can be sent to " + legalEmail + ". We will act on valid notices in a timely, diligent, non-arbitrary, and objective manner, and we will inform the notifier and, where appropriate, the affected user of our decision.",
          },
        ],
      },
      {
        id: "acceptable-use",
        title: "14. Acceptable Use and Content Moderation",
        blocks: [
          {
            type: "paragraph",
            text: "You agree not to use the Service for illegal, harmful, deceptive, infringing, abusive, or security-compromising activity. In particular, you may not:",
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
            text: "We operate the Service in line with the content-moderation principles of the EU Digital Services Act and similar regimes. We may apply content-moderation measures, including content removal, demotion, account restriction, age-gating, or geographic restriction, where reasonably necessary to comply with law, protect users, or protect the integrity of the Service. We will explain content-moderation decisions to affected users where required by law and provide an internal complaint mechanism via " + supportEmail + ".",
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
  };

export const currentTermsDocument: LegalDocument = {
  ...termsEffectiveJuly24,
  intro: [
    ...termsEffectiveJuly24.intro,
    "Administrative contact points, the product domain, and the discontinued EU online-dispute-resolution reference were corrected on August 13, 2026 without changing the substantive Terms effective July 24, 2026.",
  ],
};
