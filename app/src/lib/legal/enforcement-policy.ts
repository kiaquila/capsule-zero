import type { LegalDocument } from "../legal-content";
import {
  policyEffectiveDate,
  policyLastUpdated,
  policyLegalEmail,
  policySupportEmail,
  relatedPolicy,
} from "./policy-shared";

export const enforcementPolicy: LegalDocument = {
  slug: "enforcement-policy",
  title: "Enforcement & Appeals Policy",
  eyebrow: "Process",
  summary:
    "How Capsule Zero detects potential violations, takes proportionate action, explains decisions, and reviews appeals.",
  lastUpdated: policyLastUpdated,
  effectiveDate: policyEffectiveDate,
  relatedDocument: relatedPolicy(
    "/copyright-policy",
    "Copyright & Intellectual Property Policy",
  ),
  intro: [],
  highlights: [],
  sections: [
    {
      id: "scope",
      title: "1. Scope",
      blocks: [
        {
          type: "paragraph",
          text: "This Policy explains how Capsule Zero enforces the Terms of Use, Community Guidelines, Copyright & Intellectual Property Policy, and applicable law. It applies to content, accounts, links, domains, catalog records, metadata, comments, messages, reports, appeals, and attempts to evade an earlier action. Different laws and product surfaces may require different procedures.",
        },
      ],
    },
    {
      id: "detection",
      title: "2. How We Identify Potential Violations",
      blocks: [
        {
          type: "paragraph",
          text: "We may identify potential violations through automated tools, manual review, and hybrid review. Signals can include user or rights-holder reports, trusted notices, image or file matching, source and link reputation, metadata, account history, behavioral patterns, model or rule-based scores, law-enforcement or regulator requests, and our own investigations.",
        },
        {
          type: "paragraph",
          text: "Automated systems may block a submission, score content, limit a feature, find matching material, or refer an item for human review. Human reviewers may assess material discovered internally or through a report. In a hybrid action, a reviewer may decide one item violates policy and automated systems may apply that decision to matching items. These methods can make mistakes; where appropriate or required by law, users can appeal.",
        },
        {
          type: "paragraph",
          text: "We do not promise to review all content before or after submission. The use of moderation, recommendations, classification, semantic search, or matching does not mean Capsule Zero endorses, owns, or has verified user content.",
        },
      ],
    },
    {
      id: "actions",
      title: "3. Actions We May Take",
      blocks: [
        {
          type: "list",
          items: [
            "reject or block a submission, import, link, message, search, or account action;",
            "remove or disable access to content, or limit distribution so it is excluded from search, recommendations, shared catalogs, or discovery surfaces;",
            "add a label, warning, age gate, sensitivity screen, source notice, or other contextual restriction;",
            "restrict features, sharing, uploads, comments, messages, recommendations, commercial tools, or access from a region;",
            "block or restrict a URL, source, hash, identifier, retailer, merchant, advertiser, domain, device, or account;",
            "issue a warning or strike, require verification or corrective action, suspend access, or terminate an account;",
            "preserve relevant records, cooperate with a lawful process, or report content where the law requires it; and",
            "reverse, narrow, or expand an earlier action when new information warrants it.",
          ],
        },
      ],
    },
    {
      id: "proportionality",
      title: "4. How We Choose an Action",
      blocks: [
        {
          type: "paragraph",
          text: "We consider the applicable law or policy, severity and likelihood of harm, context and public interest, vulnerability of affected people, intent, scale, repetition, account history, commercial motivation, reliability of the evidence, feasibility of a narrower measure, and attempts to conceal, repeat, or evade the conduct. We may act immediately and without prior warning in emergencies, for severe violations, to preserve security or evidence, or where notice would create harm or violate law.",
        },
      ],
    },
    {
      id: "reports",
      title: "5. Reports and Notice-and-Action",
      blocks: [
        {
          type: "paragraph",
          text: `Anyone may report specific allegedly illegal or policy-violating content to ${policyLegalEmail}. A useful report identifies the exact content and location, explains the legal or policy basis, includes supporting information, and provides contact details where needed. IP notices follow the Copyright & Intellectual Property Policy. We acknowledge and decide sufficiently precise notices as required by applicable law.`,
        },
        {
          type: "paragraph",
          text: "A report does not guarantee removal. We may remove content under law, under our policies, under both, or not at all. Where a law is local, we may restrict access only in the relevant territory. We may ask for more information and may consider reports from competent authorities, recognized trusted flaggers, subject-matter experts, and industry safety tools according to applicable law.",
        },
      ],
    },
    {
      id: "notice-reasons",
      title: "6. Notice and Statement of Reasons",
      blocks: [
        {
          type: "paragraph",
          text: "Where appropriate or required by law, we notify the affected user of a restriction and provide a clear statement of reasons. That notice may identify the content, action, territorial scope and duration; whether the decision was based on law, contract, or both; the facts and circumstances relied on; whether automated means materially contributed; and available appeal or redress options.",
        },
        {
          type: "paragraph",
          text: "We may limit or delay details when disclosure would expose a reporter, child, victim, investigator, confidential method, trade secret, security measure, legal restriction, or ongoing investigation, or would make evasion materially easier.",
        },
      ],
    },
    {
      id: "appeals",
      title: "7. Appeals and Restoration",
      blocks: [
        {
          type: "paragraph",
          text: `Where an appeal is available, send it to ${policySupportEmail} using the account email and include the decision or content identifier, the reason you believe the decision was wrong, and supporting evidence. We review eligible appeals in a timely, non-discriminatory manner and use appropriately qualified human oversight where required. An appeal may uphold, reverse, or modify the original action.`,
        },
        {
          type: "paragraph",
          text: "Where applicable, users may also use a certified out-of-court dispute-settlement body, contact a competent regulator or Digital Services Coordinator, or seek judicial redress. Copyright counter-notices and their conditional restoration timetable are governed by the Copyright & Intellectual Property Policy, not this general appeal route.",
        },
      ],
    },
    {
      id: "repeat-severe",
      title: "8. Repeated and Severe Violations",
      blocks: [
        {
          type: "paragraph",
          text: "Repeated violations may escalate from warning to strike, feature restriction, suspension, and termination. We may remove an account after a single severe violation, including child sexual exploitation, credible threats, terrorism, non-consensual intimate imagery, trafficking, serious fraud, malicious compromise, or deliberate commercial-scale infringement. An account, device, domain, or associated account used to evade an action may receive the same or stronger restriction.",
        },
      ],
    },
    {
      id: "report-abuse",
      title: "9. Misuse of Reporting and Appeals",
      blocks: [
        {
          type: "paragraph",
          text: "Do not make fraudulent, threatening, knowingly false, clearly baseless, repetitive, automated, or bad-faith reports or appeals. To address abuse of reports or appeals, we may request verification, consolidate duplicates, rate-limit submissions, reject unsupported requests, or temporarily restrict a submitter's access to a channel, while preserving access required by law. False IP notices and counter-notices may also create legal and financial liability.",
        },
      ],
    },
    {
      id: "records",
      title: "10. Records, Quality, and Policy Changes",
      blocks: [
        {
          type: "paragraph",
          text: "We may retain reports, decisions, evidence, strikes, appeals, and related records for security, consistency, audit, dispute, fraud-prevention, and legal purposes under the Privacy Policy. We may use quality review, reviewer guidance, testing, error measurement, and aggregated transparency reporting to improve moderation. Enforcement methods evolve as the Service, abuse patterns, technology, and law change.",
        },
        {
          type: "paragraph",
          text: "No system detects every violation or avoids every error. Failure to act in one case does not waive our right to act in another. We may update these practices and will provide notice of material contractual changes where required.",
        },
      ],
    },
    {
      id: "current-status",
      title: "11. Current Product Status",
      blocks: [
        {
          type: "paragraph",
          text: "The shared user-import pool, public user catalog, affiliate program, and user-to-user marketplace are not currently available. This Policy establishes the contractual moderation framework but does not activate those features or substitute for the compliance specification, operational controls, or external legal review required before launch.",
        },
      ],
    },
  ],
};
