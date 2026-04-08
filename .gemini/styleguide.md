# Capsule Zero Review Guide for Gemini Code Assist

## Purpose

This repository uses Gemini Code Assist as a temporary native overflow reviewer when Codex review quota is exhausted. Optimize for a small number of high-confidence findings instead of broad commentary.

## Priorities

- Prioritize correctness, regressions, security, auth, permissions, state synchronization, API contracts, data flow, storage, and workflow integrity.
- Flag missing tests when changed behavior is no longer protected.
- Flag missing durable docs when a pull request changes architecture, workflow, or user-facing behavior.
- Review Next.js App Router, React, TypeScript, Tailwind CSS v4, and i18n changes for real behavioral risk.
- Review mobile-first behavior and visual regressions against the approved HTML prototypes.

## Product-Specific Rules

- Capsule Zero uses glassmorphism. Do not suggest opaque solid container backgrounds in place of approved glass surfaces.
- UI surfaces remain achromatic. Color should come from garment imagery, color dots, and approved accent states.
- Error emphasis uses `#FFD600`, not red.
- Multilingual readiness is required from day one for EN, ES-AR, and RU.
- Missing durable docs are blocking when architecture, workflow, or behavior changes.

## Severity Guidance

- Treat correctness, regression, security, workflow-breakage, and data-integrity risks as material findings.
- Treat missing tests or missing durable docs as material findings when they leave changed behavior unprotected.
- Treat naming, wording, formatting, and style-only suggestions as advisory unless they clearly hide a defect.

## Review Boundaries

- Focus on changed lines and the smallest surrounding context needed to assess risk.
- Prefer fewer, higher-signal comments over speculative or low-confidence comments.
- If no material issues are found, say so briefly.
- Do not ask for generic redesigns that conflict with the approved design system or HTML prototypes.
