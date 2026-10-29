# Loan Repayment and Comparison Calculator

A fast, responsive web application for calculating loan repayment schedules and comparing competing financing offers. Built with Vanilla JavaScript, Vite, and Vitest following a strict documentation-first, test-driven approach.

Live URL: https://loanlens-kappa.vercel.app

Built with Vite 6, vanilla JavaScript (ES modules, no UI framework) and Vitest 3 for automated tests. All calculation logic lives in one pure module (src/loan.js), shared by every loan type and by the comparison view. There is no backend, database, API key or paid service, so the app runs locally with Node.js alone and is deployed as a static site on Vercel.

---

## Overview and Target Audience

This application serves two primary roles:
1. **Primary Borrower (Jobs J-1, J-2):** Needs to calculate monthly payment commitments, total interest paid, and total lifetime cost for major purchases across three loan categories:
   - **Personal Loan:** Direct borrowing by principal amount, interest rate, and term.
   - **Car Loan:** Computed from vehicle purchase price and down payment percentage (financed amount = vehicle price x (1 - down payment %)).
   - **Home Loan:** Computed from property purchase price and desired financing amount, with loan term entered in years and converted to whole months.
2. **Loan Comparer (Job J-3):** Compares two loan proposals (Offer A vs Offer B) side-by-side with automatic delta calculations showing monthly savings and total interest cost differences, with isolated error handling so an invalid offer never breaks a valid one.

---

## Prerequisites

- Node.js version 18.0.0 or higher (tested and verified on Node.js v24.20.0)
- npm version 9.0.0 or higher (tested and verified on npm 11.19.0)
- A modern evergreen web browser. Verified on desktop Chrome and Safari. Mobile browsers and in-app webviews were not verified.

---

## Exact Commands

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
Starts the local Vite development server (typically at `http://localhost:5173`).

### 3. Build for Production
```bash
npm run build
```
Compiles and bundles production-ready static assets into the `dist/` directory.

### 4. Run Automated Tests
```bash
npm test
```
Executes all 45 automated unit tests via Vitest with exact numeric assertions.

Calculation and validation criteria are verified by automated Vitest tests asserting exact numbers; UI behaviour criteria are verified by browser automation and manual checks on the live site.

---

## Tools and Models Used

The following AI models and tools were used in this exact order:
1. Claude Opus 4.6 (Thinking)
2. Claude Sonnet 4.6 (Thinking)
3. Gemini 3.8 Flash

All models were accessed and orchestrated through Google Antigravity.

Claude (claude.ai chat) was also used outside the coding tool for planning, reviewing documents and independently computing expected values. The coding session itself is in transcripts/session-01.md.

- **Transcript:** Exported directly from the Antigravity chat panel and saved to transcripts/session-01.md.
- **Time Spent:** approximately 6 hours.
- **Hand-Edited Code:** None (all code, tests, styles, and documentation were generated, reviewed, and refined collaboratively via the AI assistant).

---

## Financial Rules and Assumptions

1. **Standard Amortization Formula:**
   For annual interest rate r > 0, monthly interest rate i = (r / 100) / 12:
   Monthly Payment M = P * [i * (1 + i)^n] / [(1 + i)^n - 1]
2. **Zero Interest Boundary:**
   When the interest rate is 0%, monthly payment is calculated simply as:
   M = P / n
   Total interest is 0.00, and no NaN or division-by-zero errors occur.
3. **Strict Rounding Rule (Universal across all categories):**
   - Monthly payment is rounded to the nearest cent ($0.01).
   - Total loan cost = monthly payment x term in months.
   - Total interest paid = total loan cost - financed principal amount.
4. **Currency and Rate Assumptions:**
   - Currency display is fixed to USD ($); the symbol is for display only. Foreign currency conversion is not supported.
   - Fixed rate loans only; variable or adjustable rates are not supported.
   - Compounding frequency is monthly.
   - The interest rate must be entered manually by the user from their lender's official quote or offer letter. The application never stores, assumes, or fetches third-party bank rates.
5. **Boundary Limits:**
   - Minimum term: 1 month.
   - Maximum term: 480 months (40 years).
   - Minimum interest rate: 0.0%. Negative rates are rejected.
   - Maximum interest rate: 100.0%. Rates above 100% are rejected.
   - Car down payment: 0% is allowed (100% financing); 100% or more is rejected; negative down payment is rejected.
   - Home financing amount: Must be greater than 0 and cannot exceed the property price.
6. **Cross-Category Equivalence:**
   A Car loan with a financed amount, rate, and term equal to a Personal loan produces an identical monthly payment and interest cost.

---

## Disclaimer

All calculations and comparison metrics provided by this application are estimates for educational and financial planning purposes only. Calculations exclude lender origination fees, closing costs, property taxes, homeowner insurance, private mortgage insurance (PMI), title insurance, and vehicle registration fees. Users should consult their lending institution for binding contractual terms.

---

## Known Limitations

1. **Fixed Interest Only:** Does not model adjustable-rate mortgages (ARMs) or variable loan structures.
2. **No Extra Payments:** Does not calculate the impact of lump-sum or recurring additional principal payments (planned for Story S-6).
3. **No Amortization Schedule Export:** Does not generate month-by-month principal/interest amortization schedules or CSV exports (planned for Story S-7).
4. **No Scenario Persistence:** Loan calculations are stored in component memory only and reset upon page reload (planned for Story S-8).
5. **Decimal Display on Term Toggle:** Converting odd months to years currently displays floating point decimals (e.g. 35 months displays as 2.9166666667 years). A backlog improvement is queued to display at most 2 decimals while preserving the exact underlying number.
6. **Load Capacity Unbenchmarked:** No empirical stress testing or load benchmarking has been run to confirm exact concurrent traffic limits (not verified). Because all calculations run 100% client-side in the browser, server load is limited to initial static file delivery via Vercel's Edge CDN.

---

## Stories Marked Not Implemented

The following user stories from `docs/user-stories.md` are documented in the specification but have not been implemented or verified:
- **Story S-6:** Model extra monthly principal payments (Roadmap v1.1 - Not implemented)
- **Story S-7:** Export amortization schedule to CSV (Roadmap v1.1 - Not implemented)
- **Story S-8:** Save loan scenarios to browser local storage (Roadmap v1.2 - Not implemented)
