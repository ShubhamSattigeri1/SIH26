# GramAdvisory AI

## Setup

1. Install dependencies: `pip install -r requirements.txt`
2. Copy `.env.example` to `.env`.
3. Add a Groq key to `.env` as `GROQ_API_KEY=...`.
4. Start the backend: `python main.py`
5. Start the Expo app: `npm run web`

## Finance Workspace

After running an assessment, record each business transaction in the Finance Operations panel. Use one row per invoice or payment:

- `income` for a sale or other business receipt
- `expense` for a purchase or operating cost
- Use the invoice number and customer/vendor fields for document matching
- Select the payment method and whether the amount is paid or unpaid

The backend stores records in `transactions.csv`, which is ignored by git. Back up this file securely when needed.

## Profit and Loss

- Revenue = sum of income transactions
- Direct costs = expenses categorized as raw materials, inventory, feed, packaging, or direct costs
- Gross profit = revenue - direct costs
- Net profit = revenue - all expense transactions
- Cash received = paid income transactions only
- Outstanding income = income recorded as unpaid or otherwise not paid

Unpaid invoices count toward recorded revenue but do not count as cash received. Review categories and invoices before using the figures for tax work.

## ITR Preparation

The ITR panel is a preparation assistant. It summarizes recorded income, expenses, profit, cash, outstanding income, and missing invoice metadata. It does not file a return or submit information to a tax portal. Have a qualified tax professional review the records before filing.

## Government Schemes

Scheme recommendations are category-matched suggestions with source and verification notes. Confirm current eligibility, documents, subsidy rules, and lender terms through the official scheme source before applying. The Micro Finance vs Term Loan router remains deterministic and separate from AI recommendations.
