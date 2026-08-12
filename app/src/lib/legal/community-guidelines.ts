import type { LegalDocument } from "../legal-content";
import {
  policyEffectiveDate,
  policyLastUpdated,
  policyLegalEmail,
  relatedPolicy,
} from "./policy-shared";

export const communityGuidelines: LegalDocument = {
  slug: "community-guidelines",
  title: "Community Guidelines",
  eyebrow: "Safety",
  summary:
    "Rules for content and conduct across Capsule Zero wardrobe, catalog, search, link, and future sharing features.",
  lastUpdated: policyLastUpdated,
  effectiveDate: policyEffectiveDate,
  relatedDocument: relatedPolicy(
    "/enforcement-policy",
    "Enforcement & Appeals Policy",
  ),
  intro: [],
  highlights: [],
  sections: [
    {
      id: "purpose-scope",
      title: "1. Purpose and Scope",
      blocks: [
        {
          type: "paragraph",
          text: "Capsule Zero helps people build useful wardrobes without making the Service unsafe, unlawful, deceptive, or hostile. These Community Guidelines are our acceptable-use rules and are incorporated into the Terms of Use. They apply to every user, account, and type of content or behavior, including private wardrobe uploads, any future public contribution, source links, catalog data, item names and metadata, comments, messages, reports, appeals, and AI-generated or manipulated content.",
        },
        {
          type: "paragraph",
          text: "Context matters. We may allow material for education, documentation, criticism, news, safety, or another lawful public-interest purpose while limiting its distribution or adding a warning. A contextual exception never permits child sexual abuse material, non-consensual intimate imagery, trafficking, credible threats, or other content that the law requires us to remove or report.",
        },
      ],
    },
    {
      id: "responsibility",
      title: "2. Your Responsibility",
      blocks: [
        {
          type: "paragraph",
          text: "You are solely responsible for content you submit and for having every permission, consent, license, and legal basis needed to submit it. Content must comply with these Guidelines, the Terms, the Copyright & Intellectual Property Policy, and applicable law. A source link, credit, disclaimer, or statement that you found an image online does not by itself give you the right to upload or share it.",
        },
      ],
    },
    {
      id: "intellectual-property",
      title: "3. Intellectual property, counterfeit items, and other rights",
      blocks: [
        {
          type: "list",
          items: [
            "Do not upload or link to content that infringes copyright, trademark, design, database, publicity, privacy, trade-secret, or other rights unless a license or legal exception applies.",
            "Do not offer, promote, mislabel, or create catalog records for counterfeit, stolen, fraudulently branded, or unlawfully imported goods.",
            "Do not remove or falsify authorship, provenance, rights-management information, watermarks, source links, product identity, or authenticity information.",
            "Do not use another person's name, image, likeness, wardrobe, or private information without the permission or other legal basis required where you live.",
          ],
        },
        {
          type: "paragraph",
          text: "Rights holders and their authorized agents should use our Copyright & Intellectual Property Policy. We may remove content, restrict accounts, preserve relevant records, or apply our repeat-infringer policy even when a dispute is not resolved by a court.",
        },
      ],
    },
    {
      id: "sexual-intimate",
      title: "4. Sexual, Intimate, and Non-Consensual Content",
      blocks: [
        {
          type: "list",
          items: [
            "Do not submit sexually explicit content, visible intimate body parts, sexual services, fetish content, or content primarily intended for sexual arousal.",
            "Do not create, threaten, solicit, or distribute non-consensual intimate imagery, upskirting, down-blousing, hidden-camera material, sextortion, or instructions and tools intended to produce such abuse, including so-called nudifier services.",
            "Do not use wardrobe or body images to sexualize, shame, coerce, harass, or exploit another person.",
          ],
        },
      ],
    },
    {
      id: "child-safety",
      title: "5. Child safety",
      blocks: [
        {
          type: "paragraph",
          text: "Capsule Zero has zero tolerance for child sexual exploitation or conduct that endangers minors. Do not upload child sexual abuse material; sexualized images or descriptions of minors; grooming, solicitation, sextortion, or sexual remarks directed at minors; instructions that facilitate contact for exploitation; or content that intentionally places an otherwise ordinary image of a minor in a sexual context. We may report suspected exploitation to competent authorities or child-protection organizations as required by law.",
        },
        {
          type: "paragraph",
          text: "The Service is not intended for children under 16. Do not upload photographs of children to a wardrobe item, profile, source page, comment, or message. A parent or guardian who discovers an image or account involving a child may contact us for urgent review.",
        },
      ],
    },
    {
      id: "privacy",
      title: "6. Privacy and Personal Information",
      blocks: [
        {
          type: "list",
          items: [
            "Do not expose government identifiers, home addresses, private contact details, account credentials, financial information, medical records, precise location, or other sensitive or confidential information.",
            "Do not post photographs of a private person without the consent or legal basis required for that use.",
            "Do not dox, stalk, blackmail, surveil, threaten to expose, buy, sell, or solicit another person's private data.",
            "Do not upload payment cards, identity documents, biometric templates, or sensitive personal data that Capsule Zero does not need to provide the Service.",
          ],
        },
      ],
    },
    {
      id: "hate-harassment",
      title: "7. Hate, Harassment, and Body Shaming",
      blocks: [
        {
          type: "paragraph",
          text: "Do not attack, dehumanize, exclude, threaten, or promote discrimination against people based on actual or perceived race, color, caste, ethnicity, national origin, immigration status, religion, sex, gender identity, sexual orientation, disability, medical condition, age, body type, weight, pregnancy, or another protected or vulnerable characteristic. Hate groups and accounts dedicated to hateful activity are not allowed.",
        },
        {
          type: "paragraph",
          text: "Do not bully, sexually harass, repeatedly target, degrade, shame, or make unwanted sexual remarks about another person. Fashion criticism and fit guidance must not become body shaming, eating-disorder encouragement, or attacks on a person's identity, health, means, or appearance.",
        },
      ],
    },
    {
      id: "self-harm-health",
      title: "8. Self-Harm, Eating Disorders, and Harmful Health Claims",
      blocks: [
        {
          type: "paragraph",
          text: "Do not display, encourage, instruct, assist, glorify, sell products for, or mock suicide, self-injury, substance abuse, or eating disorders. Do not use styling, sizing, body-shape, wellness, or shopping content to promote starvation, purging, dangerous weight loss, false cures, medically unsupported treatments, or other claims likely to cause physical or psychological harm.",
        },
      ],
    },
    {
      id: "regulated-harmful",
      title: "9. Regulated Goods, Dangerous Activities, and Exploitation",
      blocks: [
        {
          type: "list",
          items: [
            "Do not offer, manufacture, facilitate, or promote illegal drugs, unauthorized medicines, tobacco or nicotine products, firearms, ammunition, explosives, chemical or biological weapons, or instructions for evading applicable controls.",
            "Do not promote dangerous challenges, instructions likely to cause serious injury, hacking or security bypass, or products and services designed for deception or privacy invasion.",
            "Do not facilitate human trafficking, slavery, forced labor, sexual exploitation, organ trading, animal fighting, trade in protected wildlife, or goods derived from illegal exploitation.",
            "Do not sell stolen accounts, credentials, financial data, identity documents, or counterfeit currency.",
          ],
        },
      ],
    },
    {
      id: "violence",
      title: "10. Violence, Threats, and Dangerous Actors",
      blocks: [
        {
          type: "paragraph",
          text: "Do not make credible threats, incite violence, glorify serious harm, publish graphic violence without a legitimate contextual purpose, or support, praise, recruit for, represent, or materially assist terrorist organizations, violent extremists, gangs, mass attackers, or other dangerous actors. Accounts operated by or principally supporting such actors are not allowed.",
        },
      ],
    },
    {
      id: "deception",
      title: "11. Scams, Harmful Misinformation, and Impersonation",
      blocks: [
        {
          type: "list",
          items: [
            "Do not run phishing, financial, shopping, resale, authenticity, shipping, prize, employment, or account-recovery scams.",
            "Do not fabricate or materially manipulate content in a way likely to cause harm, fraud, panic, discrimination, unsafe health decisions, or interference with civic participation.",
            "Do not impersonate a person, brand, retailer, rights holder, Capsule Zero representative, or organization, or falsely imply an affiliation, endorsement, verification, or source relationship.",
            "Do not misstate price, condition, material, size, brand, stock, provenance, repair history, sustainability, or availability where the information could mislead another person.",
          ],
        },
      ],
    },
    {
      id: "commercial-spam",
      title: "12. Spam, manipulation, and deceptive commercial behavior",
      blocks: [
        {
          type: "paragraph",
          text: "Do not create repetitive, irrelevant, scraped, or low-value content to manipulate ranking, search, saves, clicks, recommendations, referral revenue, or other metrics. Do not operate fake or coordinated accounts, buy or sell engagement, hide a destination through deceptive redirects, stuff irrelevant keywords, evade blocklists, or repeatedly re-upload removed material.",
        },
        {
          type: "paragraph",
          text: "If Capsule Zero later enables commercial, sponsored, branded, merchant, or affiliate content, it must be clearly and prominently disclosed, comply with applicable advertising and consumer law, add genuine value, use authentic accounts, and never imply Capsule Zero's endorsement without written permission. Pay-per-click or affiliate structures do not excuse infringement, spam, deception, or artificial traffic. No such program is currently active.",
        },
      ],
    },
    {
      id: "security",
      title: "13. Platform Security and Access",
      blocks: [
        {
          type: "paragraph",
          text: "Do not gain or attempt unauthorized access; scrape, crawl, bulk-download, or collect content through an unapproved method; bypass security, rate limits, moderation, robots directives, domain blocks, or access controls; reverse engineer the Service except where law makes that restriction unenforceable; transmit malware; overload or disrupt systems; test vulnerabilities outside an authorized process; harvest personal data; or sell, transfer, or share account access.",
        },
      ],
    },
    {
      id: "reporting-enforcement",
      title: "14. Reporting and Enforcement",
      blocks: [
        {
          type: "paragraph",
          text: `Report content that may violate these Guidelines or applicable law to ${policyLegalEmail}. Submit reports in good faith, identify the specific content, explain the concern, and provide contact information where needed to assess the report. Copyright and other IP complaints follow the separate Copyright & Intellectual Property Policy.`,
        },
        {
          type: "paragraph",
          text: "Under the Enforcement & Appeals Policy, we may block submission, remove or limit content, disable features, restrict a link or domain, add a warning, preserve evidence, or restrict, suspend, or terminate an account. Serious violations may result in immediate action; repeated lower-severity violations may escalate. Where appropriate or required by law, affected users can appeal. We may restrict fraudulent, baseless, repetitive, or abusive reports and appeals.",
        },
      ],
    },
  ],
};
