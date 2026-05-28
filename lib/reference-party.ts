/**
 * Reference Party Types and Constants
 * Used for transactions that don't involve traditional vendors (e.g., government fees, land owner payments)
 */

export enum ReferencePartyType {
  VENDOR = "VENDOR",
  INDIVIDUAL = "INDIVIDUAL",
  GOVERNMENT = "GOVERNMENT",
  ENTITY = "ENTITY",
  EMPLOYEE = "EMPLOYEE",
  CONTRACTOR = "CONTRACTOR",
  OTHER = "OTHER",
}

export const REFERENCE_PARTY_TYPE_LABELS: Record<ReferencePartyType, string> = {
  [ReferencePartyType.VENDOR]: "Vendor",
  [ReferencePartyType.INDIVIDUAL]: "Individual",
  [ReferencePartyType.GOVERNMENT]: "Government",
  [ReferencePartyType.ENTITY]: "Business Entity",
  [ReferencePartyType.EMPLOYEE]: "Employee",
  [ReferencePartyType.CONTRACTOR]: "Contractor",
  [ReferencePartyType.OTHER]: "Other",
};

export const REFERENCE_PARTY_TYPE_DESCRIPTIONS: Record<ReferencePartyType, string> = {
  [ReferencePartyType.VENDOR]: "Traditional supplier or vendor",
  [ReferencePartyType.INDIVIDUAL]: "Private individual (e.g., land owner, consultant)",
  [ReferencePartyType.GOVERNMENT]: "Government agency or authority",
  [ReferencePartyType.ENTITY]: "Company, partnership, or other business entity",
  [ReferencePartyType.EMPLOYEE]: "Company employee (for advances, bonuses)",
  [ReferencePartyType.CONTRACTOR]: "Construction or service contractor",
  [ReferencePartyType.OTHER]: "Other type of party",
};

/**
 * Determine if vendor_id is required for a given reference party type
 */
export function isVendorRequired(partyType: ReferencePartyType): boolean {
  return partyType === ReferencePartyType.VENDOR;
}

/**
 * Determine if reference_party_name is required for a given reference party type
 */
export function isReferencePartyNameRequired(partyType: ReferencePartyType): boolean {
  return partyType !== ReferencePartyType.VENDOR;
}

/**
 * Get the appropriate field label based on party type
 */
export function getPartyLabel(partyType: ReferencePartyType | null): string {
  if (!partyType) return "Vendor/Party";
  return REFERENCE_PARTY_TYPE_LABELS[partyType] || "Party";
}

/**
 * Validate transaction party data
 * Ensures that either vendor_id or reference_party_name is provided
 */
export interface TransactionPartyData {
  vendor_id?: number | null;
  reference_party_type?: ReferencePartyType | null;
  reference_party_name?: string | null;
}

export function validateTransactionParty(partyData: TransactionPartyData): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check that at least one party identifier is provided
  if (!partyData.vendor_id && !partyData.reference_party_name) {
    errors.push("Either vendor or reference party name must be provided");
  }

  // If reference_party_name is provided, reference_party_type must be set
  if (partyData.reference_party_name && !partyData.reference_party_type) {
    errors.push("Reference party type must be specified when party name is provided");
  }

  // If reference_party_type is set, it must be a valid type
  if (partyData.reference_party_type && !Object.values(ReferencePartyType).includes(partyData.reference_party_type)) {
    errors.push(`Invalid reference party type: ${partyData.reference_party_type}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Expense head categories that define how parties should be handled
 */
export enum ExpenseHeadPartyRule {
  VENDOR_REQUIRED = "VENDOR_REQUIRED",
  VENDOR_OPTIONAL = "VENDOR_OPTIONAL",
  REFERENCE_PARTY_ONLY = "REFERENCE_PARTY_ONLY",
}

/**
 * Keywords to identify expense head types
 * Maps expense head names to their party rules
 */
export const EXPENSE_HEAD_PARTY_RULES: Record<string, ExpenseHeadPartyRule> = {
  // Land & Agreement Related
  "land": ExpenseHeadPartyRule.REFERENCE_PARTY_ONLY,
  "signing": ExpenseHeadPartyRule.REFERENCE_PARTY_ONLY,
  "agreement": ExpenseHeadPartyRule.REFERENCE_PARTY_ONLY,
  
  // Government Related
  "government": ExpenseHeadPartyRule.REFERENCE_PARTY_ONLY,
  "registry": ExpenseHeadPartyRule.REFERENCE_PARTY_ONLY,
  "fee": ExpenseHeadPartyRule.REFERENCE_PARTY_ONLY,
  "tax": ExpenseHeadPartyRule.REFERENCE_PARTY_ONLY,
  "license": ExpenseHeadPartyRule.REFERENCE_PARTY_ONLY,
  
  // Professional Services
  "professional": ExpenseHeadPartyRule.VENDOR_OPTIONAL,
  "consultant": ExpenseHeadPartyRule.VENDOR_OPTIONAL,
  "legal": ExpenseHeadPartyRule.VENDOR_OPTIONAL,
  "accounting": ExpenseHeadPartyRule.VENDOR_OPTIONAL,
  
  // Material Purchase (Traditional)
  "material": ExpenseHeadPartyRule.VENDOR_REQUIRED,
  "supply": ExpenseHeadPartyRule.VENDOR_REQUIRED,
  "purchase": ExpenseHeadPartyRule.VENDOR_REQUIRED,
};

/**
 * Determine party rule for an expense head name
 */
export function getExpenseHeadPartyRule(expenseHeadName: string): ExpenseHeadPartyRule {
  const lowerName = expenseHeadName.toLowerCase();
  
  for (const [keyword, rule] of Object.entries(EXPENSE_HEAD_PARTY_RULES)) {
    if (lowerName.includes(keyword)) {
      return rule;
    }
  }
  
  // Default to vendor optional for unknown expense heads
  return ExpenseHeadPartyRule.VENDOR_OPTIONAL;
}
