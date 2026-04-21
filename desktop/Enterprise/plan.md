# FreeRota Enterprise Feature Plan

## Goal

FreeRota Enterprise should turn the current product into a version that larger organisations can trust for governance, scale, security, and support. Based on the attached enterprise mockup, the positioning is already pointed in the right direction: complex org structures, distributed teams, and compliance-heavy environments where schedule data integrity matters.[1]

## Product Positioning

The enterprise tier should be framed as the version of FreeRota for multi-site businesses, franchise groups, healthcare providers, staffing agencies, hospitality groups, and other operations that need stronger controls than a standard rota product. The message in the mockup suggests three pillars already worth keeping: identity and access, regional controls, and dedicated support.[1]

That gives the enterprise offer a clear value proposition. It is not just “more features”; it is reduced operational risk, safer access to schedule data, easier compliance, and better implementation confidence for larger customers.[1]

## Who It Is For

The enterprise feature set should target organisations with at least one of these characteristics:

- Multiple departments, sites, or legal entities
- Regional or country-based data handling requirements
- Managers who should only see part of the organisation
- Need for auditability around rota changes
- Requirement for onboarding support, SLAs, or named support contacts
- Security review before purchase

In practice, the buyer is likely an operations lead, HR lead, workforce planning manager, or IT/security stakeholder rather than a single shift manager.[1]

## Core Enterprise Pillars

### Identity and Access

This should be the foundation of the enterprise plan. The UI copy in the mockup refers to SAML, OAuth, and role policies, so the roadmap should include SSO, SCIM or managed provisioning later, and a proper role-based access control model.[1]

The minimum useful version is role-based access control with custom roles and scoped permissions. A company should be able to decide who can create schedules, publish schedules, edit approved shifts, export data, manage locations, manage users, and view payroll-related information.

Recommended capabilities:

- SSO with SAML/OIDC for enterprise login
- Role-based access control with custom roles
- Location, team, and department-level permission scopes
- Approval-based actions for sensitive changes
- Optional enforced 2FA for privileged accounts
- Session and login audit visibility

### Regional Controls

The mockup points to region-aware data handling and residency options. This should become a real product area rather than a marketing phrase. Enterprise customers need confidence about where data lives, how regional rules are applied, and who can access cross-region information.[1]

Recommended capabilities:

- Region selection at organisation setup
- Logical separation of data by region or tenant
- Rules to restrict managers to specific regions
- Configurable retention policies for rota and audit records
- Export controls for sensitive operational data
- Compliance documentation page in-app or in sales collateral

### Dedicated Support

The enterprise design also highlights priority channels and implementation guidance. This matters because enterprise buyers often care as much about rollout risk as raw features.[1]

Recommended capabilities:

- Priority support SLA
- Named customer success or implementation contact
- Assisted onboarding and data migration support
- Enterprise help centre content
- Quarterly business reviews for top-tier accounts
- Incident communication workflow for critical issues

## Feature Set to Build

The enterprise plan should feel coherent, so the feature set should be packaged around administration, security, governance, and rollout.

### Administration

Admin capabilities should help a central team manage a large account without contacting FreeRota support for every structural change.

Build:

- Organisation hierarchy: company > region > site > department > team
- Central admin console for user, site, and policy management
- Custom role editor
- Bulk user import and bulk assignment tools
- Account-wide settings with site-level overrides
- Enterprise plan usage dashboard

### Security and Compliance

This is where the plan becomes genuinely enterprise-grade rather than just a larger SMB tier.

Build:

- SSO first, SCIM second
- Audit log for schedule creation, edits, approvals, and deletions
- IP allowlisting as a later-stage feature
- Data export logs
- 2FA enforcement for admins
- Policy-based approval for high-impact rota changes
- Security settings page for admins

### Governance and Control

Governance is likely the strongest differentiator if FreeRota wants to sell into larger, compliance-sensitive teams.

Build:

- Version history for rota changes
- Approval workflow before publishing or republishing schedules
- Change reason requirement for sensitive edits
- Locked schedules after payroll cutoff or deadline
- Regional visibility controls
- Standard reporting for who changed what and when

### Scale and Reliability

Enterprise customers expect the product to work across larger structures and heavier usage.

Build:

- Multi-site scheduling performance improvements
- High-volume import/export support
- Background jobs for heavy admin actions
- Status page and incident communication process
- Enterprise-grade backup and recovery policy

## Suggested Packaging

A simple packaging model keeps the sales motion clearer.

| Tier       | What it includes                                                               |
| ---------- | ------------------------------------------------------------------------------ |
| Pro        | Advanced scheduling, reporting, standard support                               |
| Business   | Multi-site tools, stronger admin controls, advanced reports                    |
| Enterprise | SSO, custom roles, audit logs, regional controls, approvals, dedicated support |

The enterprise tier should avoid looking like a random feature dump. It should read as the control layer for complex organisations.[1]

## Recommended MVP

The first enterprise release should focus on the smallest set of features that materially changes who can buy the product.

MVP scope:

1. Organisation hierarchy
2. Custom roles and permission scopes
3. SSO
4. Audit log
5. Approval workflow for rota publishing and critical edits
6. Regional or site-based visibility restrictions
7. Priority support workflow

This MVP is enough to support an enterprise landing page claim that FreeRota is suitable for larger governed teams, without overbuilding too early.[1]

## Phase 2

After MVP, the next wave should deepen procurement readiness and admin efficiency.

Phase 2 scope:

- SCIM or automated provisioning
- Data residency options by region
- Advanced policy engine
- Account activity reporting
- Bulk migration toolkit
- API access for enterprise integrations
- More formal SLA/reporting features

## Technical Design Notes

From the attached application screenshot, FreeRota appears to be organised as a multi-part codebase with backend, desktop, mobile, shared, and docs areas. That suggests the enterprise plan should be designed as a cross-cutting capability set rather than a single module.[2]

Practical implementation direction:

- Put permission checks server-side first, not just in UI
- Represent org structure explicitly in the data model
- Treat enterprise policies as account-level configuration
- Make audit events append-only
- Keep enterprise feature flags separate from plan enforcement logic
- Design APIs around scoped access from the start

## Data Model Additions

Likely model additions include:

- organisations
- regions
- sites
- departments
- teams
- roles
- role_permissions
- user_role_assignments
- policy_rules
- audit_events
- support_entitlements

If the current app is single-workspace oriented, this is probably the biggest architecture change required.[2]

## UX Areas Needed

To make enterprise feel complete, there should be a dedicated admin experience rather than hidden settings.

Key UI surfaces:

- Enterprise overview page
- Org structure manager
- Roles and permissions screen
- SSO/configuration page
- Audit log explorer
- Policy/approval settings
- Support and SLA page

The existing enterprise marketing style is strong: dark, minimal, high-trust, operationally serious. The product UI for enterprise admin should follow the same tone so the promise on the website matches the experience in the app.[2][1]

## Risks

The main delivery risk is trying to ship “enterprise” as a branding exercise without enforcing governance in the backend. Enterprise buyers will quickly test permission boundaries, auditability, and reliability, so these parts need to be real before broad promotion.

A second risk is building too many security features before solving the org model. If hierarchy and permission scopes are weak, SSO alone will not make the product enterprise-ready.

## Build Order

The cleanest order is:

1. Org hierarchy model
2. Permission system and scoped roles
3. Audit log infrastructure
4. Approval workflows
5. SSO
6. Enterprise admin UI
7. Support operations and SLA workflows
8. Region/data governance controls

This sequence reduces rework because most later features depend on account structure and access control already being correct.

## Delivery Brief

If this is going into implementation planning, the core brief is: build FreeRota Enterprise as a governance layer over scheduling, aimed at multi-site and compliance-sensitive organisations. The first release should prioritise org hierarchy, scoped access, auditability, approvals, and SSO, with dedicated support as part of the commercial offer.[2][1]

Sources
[1] Antigravity-FreeRota.jpeg https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/images/772847312/9cb3f918-f638-4cc6-abec-0a59d6c83d3e/Antigravity-FreeRota.jpeg
[2] image.jpeg https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/images/772847312/77971aca-99d6-4fff-8de8-5520951779be/image.jpeg
