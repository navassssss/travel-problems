# **AMANAH — Complete Zakat Management Workflow**

**Concept:** A community-driven Zakat management platform connecting Zakat givers, eligible recipients, Mahallus and administrators through a transparent, verified system.

## **1. User Registration and Mahallu Assignment**

Both Zakat givers and recipients can register.

**User Registration**

Personal details, residential location and supporting documents

**Mahallu Identification**

Check whether the user belongs to a registered Mahallu

**Existing Mahallu**

Assign as regular member

**No Mahallu**

Find geographically relevant Mahallu and assign as virtual member

**Mahallu Verification**

Assigned Mahallu administrator verifies identity and submitted information

**Verified User**

Access to applicable platform services

If no suitable Mahallu exists, the user enters a Superadmin-managed unassigned queue.

## **2. Recipient Discovery Without Registration**

Zakat givers can find potential recipients without registering.

1. Select a region or Mahallu.
2. Enter the Zakat amount available.
3. System identifies potential recipients using verified, anonymised regional data.
4. Display recipient needs, assistance requirements and priority.
5. Giver selects a recipient.
6. Proceed with either handover method:

- **Manual handover:** Giver directly gives Zakat, records the amount and recipient, and submits the transaction. Recipient confirms receipt through the platform.
- **Platform payment:** Giver transfers Zakat through the platform's payment mechanism. The transaction is recorded against the recipient.

Recipient identities and sensitive information remain protected during discovery.

## **3. Zakat Contribution**

Two ways to contribute Zakat:

**A. Platform Contribution**

- Giver transfers Zakat through the platform's designated collection mechanism.
- Contribution is recorded in the financial ledger.
- Committee manages subsequent allocation and distribution.

**B. Manual Contribution**

- Giver directly hands over Zakat to the committee.
- Giver or authorised committee member records the amount.
- Transaction is recorded as a manual contribution.
- Committee confirms receipt.

## **4. Zakat Eligibility and Rightfulness Verification**

Administrative verification of recipients and transactions.

1. Review recipient registration and documents.
2. Verify financial circumstances and household needs.
3. Assess applicable Zakat eligibility categories.
4. Detect duplicate registrations and suspicious applications.
5. Approve, reject or request additional verification.
6. Record the verification decision and its justification.

Religious eligibility decisions should follow policies approved by qualified scholars.

## **5. Zakat Calculator**

Provide Zakat calculation facilities for:

- Cash and bank balances.
- Gold and silver.
- Business assets and inventory.
- Investments, where applicable.
- Liabilities and eligible deductions.
- Nisab and Hawl considerations.

Display the calculation breakdown and applicable assumptions.

## **6. Multilingual Zakat Chatbot**

A domain-specific knowledge assistant.

**Languages:**

- Malayalam
- English
- Arabic
- Additional regional languages

**Capabilities:**

- Zakat rules and eligibility.
- Nisab and Hawl explanations.
- Zakat calculation guidance.
- Frequently asked questions.
- Religious knowledge with references.
- Platform usage assistance.

The chatbot should distinguish scholarly disagreements and avoid presenting itself as a religious authority.

## **7. Transaction and Distribution Management**

Track the complete financial lifecycle.

- Contributions received.
- Direct giver-to-recipient handovers.
- Platform-mediated payments.
- Committee allocations.
- Recipient acceptance.
- Pending and disputed transactions.
- Remaining organisational Zakat balance.

Maintain separate ledgers for organisational collections and direct transfers.

## **8. Mahallu Admin Dashboard**

Each Mahallu administrator manages their assigned Mahallu.

- View registered regular and virtual members.
- Verify givers and recipients.
- Review recipient applications.
- Manage field volunteers.
- Verify manual contributions and handovers.
- Review regional Zakat requirements.
- Monitor collections and distributions.
- Generate financial and beneficiary reports.

## **9. Superadmin Dashboard**

Platform-wide administration.

- Create and manage Mahallus.
- Approve Mahallu registrations.
- Create and assign Mahallu administrators.
- Manage users and Mahallu assignments.
- Manage unassigned users and virtual memberships.
- Monitor platform-wide contributions and distributions.
- View Mahallu-wise performance.
- Review complaints and disputes.
- Monitor suspicious activities.
- Access platform-wide audit logs.
- Manage chatbot knowledge sources and platform configuration.

Superadmin manages the platform, but does not automatically override religious eligibility decisions.

## **10. Overall user-role hierarchy**

| Role            | Primary responsibility              |
| --------------- | ----------------------------------- |
| Superadmin      | Entire platform                     |
| Mahallu Admin   | Assigned Mahallu                    |
| Finance Officer | Financial records                   |
| Field Volunteer | Registration and field verification |
| Giver           | Contribute and distribute Zakat     |
| Recipient       | Apply for and receive Zakat         |

## **11. Complete system overview**

**SUPERADMIN**

Platform-wide governance and oversight

**MAHALLU NETWORK**

Regular members · Virtual members · Local verification

**Zakat Givers**

Calculate · Contribute · Discover recipients

**Zakat Recipients**

Register · Verify · Receive assistance

**TRANSPARENT ZAKAT MANAGEMENT**

Collection · Verification · Allocation · Distribution · Reporting

## **12. Four-hour MVP priorities**

| Priority | Features                                 |
| -------- | ---------------------------------------- |
| P0       | Registration and Mahallu assignment      |
| P0       | Regular and virtual membership           |
| P0       | Mahallu verification                     |
| P0       | Recipient discovery                      |
| P0       | Manual handover and recipient acceptance |
| P0       | Contribution recording                   |
| P0       | Admin and Superadmin dashboards          |
| P0       | Basic Zakat calculator                   |
| P1       | Payment gateway                          |
| P1       | Multilingual chatbot                     |
| P2       | Advanced matching and analytics          |
| P2       | Offline field operations                 |

**Core value proposition:** Amanah connects Zakat givers with verified recipients, enables direct and committee-managed distribution, and provides transparent oversight across multiple Mahallus.
