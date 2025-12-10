# 📚 Accounting Module - Complete User Guide

## Table of Contents
1. [Getting Started](#getting-started)
2. [Finance Setup (Prerequisites)](#finance-setup-prerequisites)
3. [Accounting Vouchers](#accounting-vouchers)
4. [Reports](#reports)
5. [Common Scenarios](#common-scenarios)
6. [Troubleshooting](#troubleshooting)

---

## 🚀 Getting Started

Before using the accounting module, you **MUST** complete the Finance Setup. The accounting system depends on properly configured account types, account heads, and initial balances.

### Prerequisites Checklist
- [ ] Finance Types Created
- [ ] Account Heads Created
- [ ] Bank/Cash Accounts Created with Initial Balances
- [ ] Expense Heads Initial Balances Set (if applicable)

---

## 💰 Finance Setup (Prerequisites)

### Step 1: Create Account Types
**Path:** `Dashboard → Finance → Types`

Account types categorize your accounts based on accounting principles.

#### Default Account Types You Need:
1. **Assets** - Things your company owns (Cash, Bank, Inventory, Equipment)
2. **Liabilities** - Things your company owes (Loans, Payables)
3. **Equity** - Owner's investment and retained earnings
4. **Revenue** - Income from sales and services
5. **Expense** - Costs of running business

#### How to Create:
1. Click **"Add Type"**
2. Enter type name (e.g., "Assets", "Revenue", "Expense")
3. Check **"Is Active"** if you want to use it immediately
4. Click **"Save"**

**✅ Example:**
```
Name: Assets
Is Active: ✓
```

---

### Step 2: Create Account Heads
**Path:** `Dashboard → Finance → Heads`

Account heads are individual accounts under each type. This is where you create specific accounts for different purposes.

#### Common Account Heads Examples:

**Assets:**
- Cash in Hand
- Bank Account - DBBL
- Bank Account - City Bank
- Accounts Receivable

**Liabilities:**
- Accounts Payable
- Bank Loan
- Contractor Payables

**Equity:**
- Owner's Capital
- Retained Earnings

**Revenue:**
- Sales Revenue
- Service Income
- Rental Income

**Expense:**
- Salary Expense
- Rent Expense
- Utility Bills
- Transportation
- Office Supplies

#### How to Create:
1. Click **"Add Expense Head"**
2. **Head Name:** Enter descriptive name (e.g., "Grade Beam Construction - Contractor A")
3. **Type:** Select the appropriate type from dropdown (Assets/Liabilities/Revenue/Expense/Equity)
4. Check **"Is Active"**
5. Click **"Save"**

**✅ Example - Creating Contractor Account:**
```
Head Name: Grade Beam Construction - Contractor A
Type: Expense
Is Active: ✓
```

**✅ Example - Creating New Revenue Source:**
```
Head Name: Plot Booking Income
Type: Revenue
Is Active: ✓
```

---

### Step 3: Set Bank/Cash Initial Balances
**Path:** `Dashboard → Finance → Bank & Cash Accounts`

Set opening balances for your bank accounts and cash.

#### How to Set:
1. Click **"Add Bank/Cash Account"**
2. **Account Head:** Select from dropdown (must be created in Step 2)
3. **Initial Balance:** Enter opening balance amount
4. **Date:** Select the date from which accounting starts
5. **Is Confirmed:** Check this to activate the balance
6. Click **"Save"**

**✅ Example:**
```
Account Head: Cash in Hand
Initial Balance: 500000
Date: 2025-01-01
Is Confirmed: ✓
```

---

### Step 4: Set Expense Heads Initial Balances (Optional)
**Path:** `Dashboard → Finance → Initial Balances`

If you have project-specific expenses with opening balances, set them here.

#### How to Set:
1. Click **"Add Initial Balance"**
2. **Project:** Select project from dropdown
3. **Expense Head:** Select expense account
4. **Initial Balance:** Enter amount
5. **Date:** Select date
6. **Is Confirmed:** Check to activate
7. Click **"Save"**

**✅ Example:**
```
Project: KH Tower Phase 1
Expense Head: Grade Beam Construction - Contractor A
Initial Balance: 100000
Date: 2025-01-01
Is Confirmed: ✓
```

---

## 📝 Accounting Vouchers

### Debit Voucher (Payment Voucher)
**Path:** `Dashboard → Accounting → Debit Voucher`

Use when money **GOES OUT** from your business.

#### When to Use:
- Paying suppliers
- Paying contractors
- Paying salaries
- Paying bills
- Purchasing materials
- Any expense payment

#### How to Create:
1. Click **"Create Debit Voucher"**
2. **Date:** Select payment date
3. **Voucher No:** Auto-generated (or enter custom)
4. **Debit Account:** Select expense/asset account (where money goes)
5. **Credit Account:** Select bank/cash account (where money comes from)
6. **Amount:** Enter payment amount
7. **Narration:** Enter description
8. Click **"Save"**

**✅ Example - Paying Contractor:**
```
Date: 2025-12-11
Voucher No: DV-001
Debit: Grade Beam Construction - Contractor A (Expense)
Credit: Cash in Hand (Asset)
Amount: 50,000৳
Narration: Payment for grade beam work Phase 1
```

**✅ Example - Paying Salary:**
```
Date: 2025-12-11
Debit: Salary Expense (Expense)
Credit: Bank Account - DBBL (Asset)
Amount: 75,000৳
Narration: November 2025 staff salaries
```

---

### Credit Voucher (Receipt Voucher)
**Path:** `Dashboard → Accounting → Credit Voucher`

Use when money **COMES IN** to your business.

#### When to Use:
- Receiving customer payments
- Receiving plot booking money
- Receiving service income
- Receiving loan from bank
- Owner investing capital
- Any money receipt

#### How to Create:
1. Click **"Create Credit Voucher"**
2. **Date:** Select receipt date
3. **Voucher No:** Auto-generated (or enter custom)
4. **Debit Account:** Select bank/cash account (where money goes)
5. **Credit Account:** Select revenue/liability/equity account (where money comes from)
6. **Amount:** Enter receipt amount
7. **Narration:** Enter description
8. Click **"Save"**

**✅ Example - Customer Payment:**
```
Date: 2025-12-11
Voucher No: CV-001
Debit: Bank Account - DBBL (Asset)
Credit: Sales Revenue (Revenue)
Amount: 150,000৳
Narration: Plot A-101 booking payment from customer
```

**✅ Example - Owner Investment:**
```
Date: 2025-12-11
Debit: Cash in Hand (Asset)
Credit: Owner's Capital (Equity)
Amount: 500,000৳
Narration: Additional capital investment
```

---

### Contra Voucher (Bank/Cash Transfer)
**Path:** `Dashboard → Accounting → Contra Voucher`

Use when money **TRANSFERS** between bank and cash accounts.

#### When to Use:
- Withdrawing cash from bank
- Depositing cash to bank
- Transferring between bank accounts

#### How to Create:
1. Click **"Create Contra Voucher"**
2. **Date:** Select transfer date
3. **Voucher No:** Auto-generated (or enter custom)
4. **Debit Account:** Select receiving account (cash/bank)
5. **Credit Account:** Select sending account (bank/cash)
6. **Amount:** Enter transfer amount
7. **Narration:** Enter description
8. Click **"Save"**

**✅ Example - Bank Withdrawal:**
```
Date: 2025-12-11
Voucher No: CN-001
Debit: Cash in Hand (Asset)
Credit: Bank Account - DBBL (Asset)
Amount: 100,000৳
Narration: Cash withdrawal for site expenses
```

---

### Journal Voucher (Adjustment Entry)
**Path:** `Dashboard → Accounting → Journal Voucher`

Use for **NON-CASH** transactions and adjustments.

#### When to Use:
- Depreciation entries
- Accrual adjustments
- Error corrections
- Period-end adjustments
- Recording credit sales
- Recording credit purchases

#### How to Create:
1. Click **"Create Journal Voucher"**
2. **Date:** Select transaction date
3. **Voucher No:** Auto-generated (or enter custom)
4. **Add multiple entries:**
   - **Debit Entries:** Accounts to debit with amounts
   - **Credit Entries:** Accounts to credit with amounts
5. **Narration:** Enter detailed description
6. Ensure **Total Debit = Total Credit**
7. Click **"Save"**

**✅ Example - Depreciation:**
```
Date: 2025-12-31
Voucher No: JV-001
Debit: Depreciation Expense - 10,000৳
Credit: Accumulated Depreciation - 10,000৳
Narration: Monthly depreciation on office equipment
```

**✅ Example - Credit Sale:**
```
Date: 2025-12-11
Voucher No: JV-002
Debit: Accounts Receivable - 200,000৳
Credit: Sales Revenue - 200,000৳
Narration: Credit sale to customer XYZ
```

---

## 📊 Reports

### Account Ledger
**Path:** `Dashboard → Accounting → Ledger`

Shows transaction history for a specific account.

#### How to Use:
1. **Select Expense Head:** Choose account to view
2. **From Date:** Select start date
3. **To Date:** Select end date
4. Click **"Generate Report"**
5. Click **"Print"** for PDF

**Shows:**
- Opening balance
- All debit transactions
- All credit transactions
- Running balance after each transaction
- Closing balance
- Total debits and credits

---

### Trial Balance
**Path:** `Dashboard → Accounting → Trial Balance`

Shows balances of all accounts to verify accounting accuracy.

#### How to Use:
1. **From Date:** Select start date
2. **To Date:** Select end date
3. Click **"Generate Report"**
4. Click **"Print"** for PDF

**Shows:**
- All active accounts grouped by type
- Debit balances (Assets, Expenses)
- Credit balances (Liabilities, Equity, Revenue)
- Verification: Total Debit = Total Credit
- Balance status (Balanced/Not Balanced)

**✅ Important:** If not balanced, check for:
- Incomplete voucher entries
- Wrong account selections
- Missing entries

---

### Balance Sheet
**Path:** `Dashboard → Accounting → Balance Sheet`

Shows financial position (what you own vs what you owe).

#### How to Use:
1. **As of Date:** Select reporting date
2. Click **"Generate Report"**
3. Click **"Print"** for PDF

**Shows:**
- **Assets:** Current + Fixed Assets
- **Liabilities:** Current + Long-term Liabilities
- **Equity:** Owner's Capital + Retained Earnings
- Verification: Assets = Liabilities + Equity

---

### Profit & Loss Statement
**Path:** `Dashboard → Accounting → Profit & Loss`

Shows financial performance (profit or loss).

#### How to Use:
1. **From Date:** Select period start
2. **To Date:** Select period end
3. Click **"Generate Report"**
4. Click **"Print"** for PDF

**Shows:**
- Total Revenue
- Direct Expenses (COGS)
- **Gross Profit** = Revenue - Direct Expenses
- Operating Expenses
- **Operating Profit** = Gross Profit - Operating Expenses
- Other Expenses
- **Net Profit** = Operating Profit - Other Expenses
- Profit Margin %

---

## 🔧 Common Scenarios

### Scenario 1: Adding New Contractor for Grade Beam Construction

**Problem:** You hired a new contractor "Rahim Construction" for grade beam work, but his account doesn't exist.

**Solution:**
1. Go to `Finance → Heads`
2. Click **"Add Expense Head"**
3. Enter details:
   ```
   Head Name: Grade Beam Construction - Rahim Construction
   Type: Expense
   Is Active: ✓
   ```
4. Click **"Save"**
5. Now you can create Debit Voucher to pay this contractor

---

### Scenario 2: Recording Customer Plot Booking Payment

**Problem:** Customer paid 200,000৳ for plot booking, how to record?

**Solution:**
1. **First Time Setup (if not done):**
   - Go to `Finance → Heads`
   - Create account: "Plot Booking Income" (Type: Revenue)

2. **Record Payment:**
   - Go to `Accounting → Credit Voucher`
   - Create voucher:
     ```
     Date: Today
     Debit: Bank Account - DBBL (where money received)
     Credit: Plot Booking Income (revenue account)
     Amount: 200,000৳
     Narration: Plot A-101 booking - Customer Name
     ```

---

### Scenario 3: Paying Contractor After Work Completion

**Problem:** Contractor completed work worth 300,000৳, how to pay?

**Solution:**
1. **Ensure contractor account exists:**
   - Check `Finance → Heads`
   - If not, create expense account for contractor

2. **Make Payment:**
   - Go to `Accounting → Debit Voucher`
   - Create voucher:
     ```
     Date: Today
     Debit: [Contractor Expense Account] (expense increases)
     Credit: Cash in Hand or Bank Account (asset decreases)
     Amount: 300,000৳
     Narration: Payment for completed work - Project Name
     ```

---

### Scenario 4: Receiving Bank Loan

**Problem:** Received 5,000,000৳ bank loan, how to record?

**Solution:**
1. **First Time Setup:**
   - Go to `Finance → Heads`
   - Create: "Bank Loan - DBBL" (Type: Liabilities)

2. **Record Loan Receipt:**
   - Go to `Accounting → Credit Voucher`
   - Create voucher:
     ```
     Debit: Bank Account - DBBL (asset increases)
     Credit: Bank Loan - DBBL (liability increases)
     Amount: 5,000,000৳
     Narration: Term loan received for project
     ```

---

### Scenario 5: Recording Monthly Rent Expense

**Problem:** Office rent 50,000৳ paid monthly, how to record?

**Solution:**
1. **First Time Setup:**
   - Go to `Finance → Heads`
   - Create: "Rent Expense" (Type: Expense)

2. **Record Payment:**
   - Go to `Accounting → Debit Voucher`
   - Create voucher:
     ```
     Date: Rent payment date
     Debit: Rent Expense (expense increases)
     Credit: Bank Account or Cash in Hand (asset decreases)
     Amount: 50,000৳
     Narration: December 2025 office rent
     ```

---

### Scenario 6: Withdrawing Cash from Bank for Site Work

**Problem:** Need 200,000৳ cash for site expenses, withdraw from bank.

**Solution:**
- Go to `Accounting → Contra Voucher`
- Create voucher:
  ```
  Date: Today
  Debit: Cash in Hand (cash increases)
  Credit: Bank Account - DBBL (bank decreases)
  Amount: 200,000৳
  Narration: Cash withdrawal for site expenses
  ```

---

### Scenario 7: Recording Salary Payment to Employees

**Problem:** Monthly salary 150,000৳ to be paid.

**Solution:**
1. **First Time Setup:**
   - Go to `Finance → Heads`
   - Create: "Salary Expense" (Type: Expense)

2. **Record Payment:**
   - Go to `Accounting → Debit Voucher`
   - Create voucher:
     ```
     Debit: Salary Expense
     Credit: Bank Account - DBBL
     Amount: 150,000৳
     Narration: December 2025 staff salaries
     ```

---

### Scenario 8: Owner Adding Personal Money to Business

**Problem:** Owner invested 1,000,000৳ personal money.

**Solution:**
1. **First Time Setup:**
   - Go to `Finance → Heads`
   - Create: "Owner's Capital" (Type: Equity)

2. **Record Investment:**
   - Go to `Accounting → Credit Voucher`
   - Create voucher:
     ```
     Debit: Cash in Hand or Bank Account (asset increases)
     Credit: Owner's Capital (equity increases)
     Amount: 1,000,000৳
     Narration: Additional capital investment
     ```

---

## ❓ Troubleshooting

### Problem: Can't Find Account in Voucher Dropdown

**Reason:** Account head not created or inactive.

**Solution:**
1. Go to `Finance → Heads`
2. Check if account exists
3. If not, create new account
4. If exists, check **"Is Active"** checkbox
5. Refresh voucher page

---

### Problem: Trial Balance Not Matching

**Reason:** Total Debit ≠ Total Credit

**Solution:**
1. Check all vouchers for mistakes
2. Ensure debit and credit amounts are equal in each voucher
3. Look for incomplete vouchers
4. Verify all transactions are saved properly

---

### Problem: Report Shows No Data

**Reason:** No transactions in selected date range or account.

**Solution:**
1. Check date range is correct
2. Verify transactions exist in that period
3. Check account is selected correctly
4. Ensure vouchers are saved and confirmed

---

### Problem: Can't Create Voucher - Account Not Available

**Reason:** Account head not created in Finance module.

**Solution:**
1. **ALWAYS create account heads first** in `Finance → Heads`
2. Then create vouchers in Accounting module
3. Account types and heads are prerequisites

---

### Problem: Negative Balance in Cash/Bank Account

**Reason:** More payments than available balance (possible overdraft or error).

**Solution:**
1. Check ledger report for the account
2. Verify all entries are correct
3. Check if initial balance was set correctly
4. Look for duplicate entries
5. If legitimate overdraft, it's okay; if error, create correcting journal voucher

---

## 📋 Quick Reference Chart

| Transaction Type | Use This Voucher | Debit Account | Credit Account |
|-----------------|------------------|---------------|----------------|
| Pay contractor | Debit Voucher | Contractor Expense | Bank/Cash |
| Receive customer payment | Credit Voucher | Bank/Cash | Sales Revenue |
| Pay salary | Debit Voucher | Salary Expense | Bank/Cash |
| Pay bills | Debit Voucher | Utility/Bills Expense | Bank/Cash |
| Owner invests money | Credit Voucher | Bank/Cash | Owner's Capital |
| Withdraw cash from bank | Contra Voucher | Cash in Hand | Bank Account |
| Deposit cash to bank | Contra Voucher | Bank Account | Cash in Hand |
| Receive bank loan | Credit Voucher | Bank Account | Bank Loan (Liability) |
| Credit sale | Journal Voucher | Accounts Receivable | Sales Revenue |
| Depreciation | Journal Voucher | Depreciation Expense | Accumulated Depreciation |

---

## 🎯 Best Practices

1. **Always create Finance setup first** before using Accounting vouchers
2. **Use descriptive names** for account heads (e.g., "Grade Beam - Contractor A" instead of just "Contractor")
3. **Write clear narrations** in vouchers for future reference
4. **Check Trial Balance regularly** to ensure books are balanced
5. **Generate reports monthly** to track business performance
6. **Take backup** of important transactions
7. **Print vouchers** immediately after creation for records
8. **Keep sequential voucher numbers** for easy tracking

---

## 📞 Need Help?

If you're still confused:
1. Review this guide again
2. Check the scenario that matches your situation
3. Follow the step-by-step instructions
4. Verify prerequisites are completed

**Remember:** Finance Setup → Account Creation → Then Accounting Vouchers

---

**Last Updated:** December 11, 2025
