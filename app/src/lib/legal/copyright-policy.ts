import type { LegalDocument } from "../legal-content";
import {
  policyEffectiveDate,
  policyIpEmail,
  policyLastUpdated,
  relatedPolicy,
} from "./policy-shared";

export const copyrightPolicy: LegalDocument = {
  slug: "copyright-policy",
  title: "Copyright & Intellectual Property Policy",
  eyebrow: "Rights",
  summary:
    "How rights holders report content, users respond, and Capsule Zero addresses repeat infringement and matching copies.",
  lastUpdated: policyLastUpdated,
  effectiveDate: policyEffectiveDate,
  relatedDocument: relatedPolicy(
    "/community-guidelines",
    "Community Guidelines",
  ),
  intro: [],
  highlights: [],
  sections: [
    {
      id: "scope",
      title: "1. Scope and User Responsibility",
      blocks: [
        {
          type: "paragraph",
          text: "Capsule Zero respects copyright, trademark, design, publicity, and other intellectual-property rights. Users may submit only content they own, are authorized to use, or are otherwise legally permitted to submit. Giving credit, linking to a source, purchasing an item, or finding an image online does not by itself create permission to copy or publish it.",
        },
        {
          type: "paragraph",
          text: "This Policy is incorporated into the Terms of Use and applies to content stored, linked, indexed, displayed, or made available through the Service. The shared user-import pool remains unavailable until its compliance specification, operational controls, and external legal review are complete.",
        },
      ],
    },
    {
      id: "copyright-notice",
      title: "2. Copyright Infringement Notice",
      blocks: [
        {
          type: "paragraph",
          text: `A copyright owner or authorized agent may send a written notice to ${policyIpEmail}. To let us locate and assess the claim, include:`,
        },
        {
          type: "list",
          items: [
            "your physical or electronic signature;",
            "identification of the copyrighted work, or a representative list when one notice covers multiple works;",
            "identification and location of the allegedly infringing material, including each Capsule Zero URL, item ID, image identifier, or other information reasonably sufficient for us to locate it;",
            "your mailing address, telephone number, email address, and relationship to the rights holder;",
            "a statement that you have a good-faith belief that the disputed use is not authorized by the owner, its agent, or the law, including any applicable exception or limitation; and",
            "a statement that the notice is accurate and, under penalty of perjury where applicable, that you are the owner or authorized to act for the owner of the allegedly infringed exclusive right.",
          ],
        },
      ],
    },
    {
      id: "other-rights",
      title: "3. Trademark, Design, Counterfeit, and Other IP Notices",
      blocks: [
        {
          type: "paragraph",
          text: `For trademark, trade dress, design, database, publicity, counterfeit, or other IP concerns, write to ${policyIpEmail}. Identify the right and its jurisdiction or registration where applicable; the specific content and location; why the use infringes or creates confusion; your contact details and authority; and the accuracy, good-faith, and signature confirmations described above. We may request supporting registrations, product-authentication evidence, purchase records, or authorization documents.`,
        },
      ],
    },
    {
      id: "our-response",
      title: "4. What We Do With a Notice",
      blocks: [
        {
          type: "paragraph",
          text: "We will review sufficiently complete notices and act expeditiously where required. Action may include removing or disabling access, limiting distribution, restricting a region, preserving relevant records, applying a strike, or requesting more information. We may send the notice and the reporter's identity and contact details to the user who submitted the content, subject to lawful privacy and safety redactions.",
        },
        {
          type: "paragraph",
          text: "We may decline or defer action when a notice is incomplete, cannot identify the content, is not submitted by a rights holder or authorized agent, lacks a valid legal basis, fails to consider an apparent exception, or appears fraudulent or abusive. A policy decision is not a court judgment about ownership or infringement.",
        },
      ],
    },
    {
      id: "counter-notice",
      title: "5. Copyright Counter-Notice",
      blocks: [
        {
          type: "paragraph",
          text: `If your content was removed following a copyright notice and you believe removal resulted from mistake or misidentification, send a written counter-notice to ${policyIpEmail}. Use this process only for copyright removals and only if you can make every required statement truthfully. Include:`,
        },
        {
          type: "list",
          items: [
            "your physical or electronic signature;",
            "identification of the removed material and the location where it appeared before removal or disablement;",
            "a statement under penalty of perjury that you have a good-faith belief the material was removed or disabled because of mistake or misidentification;",
            "your name, mailing address, telephone number, and email address; and",
            "where the U.S. DMCA applies, your consent to the jurisdiction required by 17 U.S.C. § 512(g), and your agreement to accept service of process from the person who submitted the original notice or that person's agent.",
          ],
        },
        {
          type: "paragraph",
          text: "We may forward a complete counter-notice, including contact information, to the reporting party. Do not submit a counter-notice merely because you disagree with the law, cannot make the required statements, or want a strike removed; use the general appeal route in the Enforcement & Appeals Policy instead.",
        },
      ],
    },
    {
      id: "restoration",
      title: "6. Restoration After a Counter-Notice",
      blocks: [
        {
          type: "paragraph",
          text: "Where the U.S. DMCA applies and we receive a valid counter-notice, we may restore the material or cease disabling access 10 to 14 business days after receipt. We will not restore it through that process if the original reporting party timely informs us that it filed an action in the competent court or, where applicable, before the Copyright Claims Board seeking an order to restrain the disputed activity. Outside that process, restoration timing and remedies depend on applicable law and our review.",
        },
      ],
    },
    {
      id: "repeat-infringers",
      title: "7. Repeat-Infringer Policy",
      blocks: [
        {
          type: "paragraph",
          text: "Capsule Zero adopts and reasonably implements a repeat-infringer policy. We may record strikes when content is removed following a sufficiently complete IP notice or when we otherwise obtain reliable knowledge of infringement. In appropriate circumstances, we restrict, suspend, or terminate users who repeatedly infringe or are repeatedly the subject of valid infringement notices. A single serious, deliberate, commercial-scale, evasive, or clearly unlawful violation may justify immediate termination.",
        },
        {
          type: "paragraph",
          text: "We consider the number, timing, severity, reliability, and outcome of notices; successful counter-notices or appeals; evidence of authorization; attempts to re-upload or evade controls; and other relevant context. A strike may be removed after a valid counter-notice, successful appeal, withdrawal, or other evidence. A terminated user may not create another account without written permission.",
        },
      ],
    },
    {
      id: "matching-measures",
      title: "8. Matching Copies and Technical Measures",
      blocks: [
        {
          type: "paragraph",
          text: "Where technically and legally appropriate, we may use image hashes, source and provenance records, identifiers, blocklists, rights-holder reference files, or other matching tools to identify identical or materially matching copies and prevent repeated uploads. Matching can produce false positives or miss resized, cropped, transformed, or otherwise altered files, so it does not replace a sufficiently precise notice or contextual review.",
        },
        {
          type: "paragraph",
          text: "Where U.S. safe-harbor law applies, we accommodate and do not interfere with standard technical measures that meet the requirements of 17 U.S.C. § 512(i). Nothing in this statement promises that a particular industry measure exists, applies to Capsule Zero, or can identify every infringement.",
        },
      ],
    },
    {
      id: "false-reports",
      title: "9. Good Faith, Misrepresentation, and Abuse",
      blocks: [
        {
          type: "paragraph",
          text: "Notices and counter-notices must be accurate and submitted in good faith. Knowingly making a material misrepresentation that content is infringing or was removed by mistake may expose the sender to legal and financial liability. We may reject, rate-limit, or suspend access to reporting channels for fraudulent, automated, repetitive, threatening, or clearly baseless submissions, while preserving reporting access required by law.",
        },
      ],
    },
    {
      id: "contact-status",
      title: "10. Contact and Launch Status",
      blocks: [
        {
          type: "paragraph",
          text: `IP notices and counter-notices: ${policyIpEmail}. This address is Capsule Zero's current public IP contact point. Publication of this Policy does not state that Capsule Zero has registered a U.S. Copyright Office designated agent or completed any other jurisdiction-specific filing. Those steps, operational takedown controls, and external legal review remain launch gates for the future shared user-import pool.`,
        },
      ],
    },
  ],
};
