# Reference Party Implementation - Quick Start Guide

## For Your 50 Failed Import Rows

These are the transaction types that were failing because they didn't have traditional vendors. Now they're fully supported!

---

## ✅ Example 1: Land Agreement (Expense Head 1141)

**Your CSV Row:**
```
voucher_type: Debit
date: 2026-05-15
amount: 500000
expense_head_name: Land Signing Money
expense_head_id: 1141
vendor_name: [LEAVE EMPTY]
reference_party_type: INDIVIDUAL
reference_party_name: Muhammad Ali Khan
particulars: Agreement with land owner for Plot #5, Non-Refundable
```

**Result:**
- ✅ Imports successfully
- 💾 Stored as:
  - `vendor_id: null`
  - `reference_party_type: INDIVIDUAL`
  - `reference_party_name: Muhammad Ali Khan`
- 📊 Reports show: "Land Signing Money - Muhammad Ali Khan - 500,000"

---

## ✅ Example 2: Government Fee/License

**Your CSV Row:**
```
voucher_type: Debit
date: 2026-05-20
amount: 25000
expense_head_name: Government Registration Fee
expense_head_id: [appropriate code]
vendor_name: [LEAVE EMPTY]
reference_party_type: GOVERNMENT
reference_party_name: Bangladesh Land Registry
particulars: Land registration and license fee
```

**Result:**
- ✅ Imports successfully
- 💾 Stored as:
  - `vendor_id: null`
  - `reference_party_type: GOVERNMENT`
  - `reference_party_name: Bangladesh Land Registry`

---

## ✅ Example 3: Legal Services (One-Time Consultant)

**Your CSV Row:**
```
voucher_type: Debit
date: 2026-05-10
amount: 15000
expense_head_name: Legal Consulting
expense_head_id: [appropriate code]
vendor_name: [LEAVE EMPTY]
reference_party_type: INDIVIDUAL
reference_party_name: Advocate Karim Ahmed
particulars: Legal consultation for land dispute resolution
```

**Result:**
- ✅ Imports successfully
- 💾 Stored as:
  - `vendor_id: null`
  - `reference_party_type: INDIVIDUAL`
  - `reference_party_name: Advocate Karim Ahmed`

---

## ✅ Example 4: Traditional Material Purchase (Still Works!)

**Your CSV Row:**
```
voucher_type: Debit
date: 2026-05-12
amount: 100000
expense_head_name: Cement Purchase
expense_head_id: [material code]
vendor_name: ABC Trading Company
reference_party_type: [AUTO-FILLS: VENDOR]
reference_party_name: [LEAVE EMPTY]
particulars: Cement for foundation work
```

**Result:**
- ✅ Imports successfully (vendor-based as before)
- 💾 Stored as:
  - `vendor_id: 5` (ABC Trading Company)
  - `reference_party_type: VENDOR`
  - `reference_party_name: null`

---

## 📋 CSV Template for Re-Import

Save this as `transactions_import.csv` and fill in your data:

```csv
voucher_type,date,amount,project_name,expense_head_name,vendor_name,reference_party_type,reference_party_name,particulars,bank_account_title,bill_no,is_confirmed
Debit,2026-05-15,500000,Kuddus Nur's Heaven,Land Signing Money,,INDIVIDUAL,Muhammad Ali Khan,Agreement with land owner - Plot #5,Main Cash,LAND-001,true
Debit,2026-05-20,25000,Kuddus Nur's Heaven,Government Registration Fee,,GOVERNMENT,Bangladesh Land Registry,Land registration fee,Main Cash,GOV-001,true
Debit,2026-05-10,15000,Kuddus Nur's Heaven,Legal Consulting,,INDIVIDUAL,Advocate Karim Ahmed,Legal consultation for land dispute,Main Cash,LEGAL-001,true
Debit,2026-05-12,100000,Kuddus Nur's Heaven,Cement Purchase,ABC Trading Company,VENDOR,,Cement for foundation,Main Cash,MAT-001,true
```

---

## 🎯 Reference Party Types

Use these values in `reference_party_type` column:

| Type | Use For | Example |
|------|---------|---------|
| **VENDOR** | Registered suppliers | ABC Trading Company |
| **INDIVIDUAL** | People (land owners, consultants, workers) | Muhammad Ali Khan |
| **GOVERNMENT** | Government agencies/authorities | Bangladesh Land Registry |
| **ENTITY** | Companies, partnerships, orgs | World Bank, NGO |
| **EMPLOYEE** | Company staff | Abdul Hasan (Engineer) |
| **CONTRACTOR** | Construction/service contractors | XYZ Construction Ltd |
| **OTHER** | Anything else | Miscellaneous Party |

---

## 🔧 Using the UI Form

When creating a transaction via the web interface:

1. **Select Expense Head**
   - System auto-detects party requirements

2. **Vendor Section** (if required)
   - Shows if expense head allows vendors
   - Optional for "Generic Consulting" types
   - Required for "Material Purchase" types

3. **Party Information** (if required)
   - Shows if expense head requires party name
   - Mandatory for "Land" and "Government Fee" types

4. **Fill Details & Submit**
   - System validates automatically
   - Shows helpful error messages

---

## 📊 Example Audit Trail Reports

### Before (Failed - Rejected):
```
50 rows failed to import
Reason: No vendor found for transaction
```

### After (Success):
```
50 rows imported successfully

By Party Type:
- INDIVIDUAL: 25 rows (Land owners, consultants) - 500,000 BDT
- GOVERNMENT: 15 rows (Licenses, fees) - 150,000 BDT
- OTHER: 10 rows (Miscellaneous) - 75,000 BDT

By Expense Head:
- Land Signing Money (1141): 20 rows
- Government Fees (6001): 15 rows
- Legal Services (5001): 10 rows
- Professional Services (5002): 5 rows
```

---

## ❓ FAQ

**Q: Do I need to add a vendor for land owner payments?**
A: No! Leave vendor_name empty and use reference_party_name instead.

**Q: Can I still import vendor-based transactions?**
A: Yes, exactly as before. The system is backward compatible.

**Q: What if I don't know the vendor or party name?**
A: Use meaningful descriptions:
- Land owner: "Property Owner - Plot #5"
- Government: "Government of Bangladesh"
- Unknown individual: "Third Party - Land Related"

**Q: How do I handle advances to contractors?**
A: 
```
reference_party_type: CONTRACTOR
reference_party_name: XYZ Construction Company Ltd
```

**Q: Will existing data break?**
A: No! Migration script safely adds new columns. All existing vendor-based transactions continue working.

---

## 🚀 Next Steps

1. **Prepare CSV** - Use the template above
2. **Run Migration** - Execute: `ts-node scripts/run-018-reference-party-migration.ts`
3. **Re-Import Data** - Your 50 failed rows should now pass
4. **Verify Results** - Check that all amounts imported correctly
5. **Optional: Configure Rules** - Add expense head rules for better automation

---

## 💡 Pro Tips

### Consistency in Party Names
Use consistent naming for the same parties:
- ✅ Good: "Muhammad Ali Khan" every time
- ❌ Bad: "M. A. Khan", "Muhammad Ali", "Khan"

### Meaningful Descriptions
```
particulars: "Land agreement - Khulna Project, Plot #5, Non-refundable advance"
```
vs
```
particulars: "land"
```

### Group Related Transactions
When importing multiple related payments:
```
reference_party_name: Muhammad Ali Khan
particulars: Agreement signed 2026-05-15
bill_no: LAND-KHULNA-001

reference_party_name: Muhammad Ali Khan
particulars: Additional payment for same plot
bill_no: LAND-KHULNA-002
```

---

## 📞 Support

If import still fails, check:
1. ✓ `reference_party_type` is one of the valid types above
2. ✓ `expense_head_name` exactly matches your Chart of Accounts
3. ✓ Date format is YYYY-MM-DD
4. ✓ Amount is a valid number
5. ✓ Either `vendor_name` OR `reference_party_name` is filled (not both empty)
