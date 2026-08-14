# AI Engineering Agent Instructions

> **This file is an execution adapter for the project's AI agent.**
>
> The authoritative product-quality rules live in `AI_PRODUCT_ENGINEERING_CONSTITUTION.md`.
> Read and obey that document before implementing or reviewing any feature.

## Mandatory behavior

1. Read the constitution before coding.
2. Inspect the existing project before proposing changes.
3. Never assume that "build passes" means "feature is complete".
4. Follow BEFORE BUILD, DURING BUILD, and AFTER BUILD gates.
5. Do not silently invent material requirements.
6. Do not implement only the happy path.
7. Treat states, errors, accessibility, responsive behavior, security, data integrity, performance, reliability, and regression as part of the feature.
8. Reuse existing architecture and design-system patterns.
9. Actively attempt to break your own implementation.
10. Distinguish IMPLEMENTED, VERIFIED, ASSUMED, and NOT TESTED.
11. Never claim tests or verification that were not actually performed.
12. Do not declare DONE while unresolved P0/P1 issues remain.
13. Produce the mandatory final quality report from the constitution.

## STOP conditions

Stop and ask for clarification when:

- A missing requirement materially changes product behavior.
- Two requirements conflict and no precedence is defined.
- A destructive or irreversible action is ambiguous.
- A security-sensitive behavior is ambiguous.
- A data-loss risk cannot be resolved safely.
- The requested implementation conflicts materially with existing architecture.
- You cannot verify a critical acceptance criterion.

## Completion rule

A task is complete only when the applicable Product Quality Gates have passed and the final report has been produced.

**User outcome > feature completion > code elegance.**
