# Delivery Notes: Loan Repayment and Comparison Calculator

**Project:** Loan Repayment and Comparison Calculator  
**Deployment URL:** https://loanlens-kappa.vercel.app  
**Verified Runtime:** Node.js v24.20.0, npm 11.19.0  
**Tools and Models Used (in order):** Claude Opus 4.6 (Thinking), Claude Sonnet 4.6 (Thinking), Gemini 3.8 Flash, all through Google Antigravity  
**Claude Chat Usage:** Claude (claude.ai chat) was also used outside the coding tool for planning, reviewing documents and independently computing expected values. The coding session itself is in transcripts/session-01.md.  
**Hand-Edited Code:** None  
**Time Spent:** approximately 6 hours  
**Transcript:** Exported directly from the Antigravity chat panel and saved to transcripts/session-01.md.  

---

## 1. Scope and Non-Goals

### In Scope
1. **Single Calculator with Three Categories:**
   - **Personal Loan:** Calculates monthly payment, total interest, and total cost from loan amount, annual interest rate, and term.
   - **Car Loan:** Calculates financing from vehicle price and down payment percentage (financed amount = vehicle price x (1 - down payment %)), plus payment and interest.
   - **Home Loan:** Calculates financing from property price and desired financing amount, with loan term entered in years and converted to whole months.
2. **Term Unit Toggle:** Allows switching between Months and Years across all categories and comparison forms with bidirectional numeric conversion.
3. **Side-by-Side Comparison (Offer A vs Offer B):** Compares two loan offers across all three categories with automatic delta calculations showing monthly savings and total interest differences.
4. **Input Validation and Error Isolation:**
   - Field-specific required messages when empty (e.g. "Vehicle price is required").
   - Boundary checks: 0% interest allowed, negative interest rejected, rate above 100% rejected, term minimum 1 month, term maximum 480 months (40 years), car down payment 0% to under 100%, home financing greater than 0 and not exceeding property price.
   - Error isolation in comparison mode: an invalid offer does not prevent a valid offer from displaying results.
5. **State Management:** Category switching clears inputs, results, and active errors. Dedicated reset buttons clear single calculator and comparison forms.

### Non-Goals
1. Variable rate or adjustable-rate mortgages (ARMs).
2. Extra principal payments or payoff acceleration modeling (Story S-6).
3. Full amortization schedule tables and CSV export (Story S-7).
4. Local storage or server-side persistence of calculation scenarios (Story S-8).
5. Estimating escrow costs, property taxes, insurance (PMI/hazard), title fees, or loan origination charges.
6. Multi-currency support or dynamic currency conversion (USD display only).

---

## 2. Definition of Done

A user story or feature was considered "Done" and marked "Implemented" only when all of the following criteria were satisfied:
1. **Documentation First:** Detailed user story with Given/When/Then acceptance criteria drafted and approved before code implementation.
2. **Mathematical Verification:** Expected values computed independently using the standard amortization formula with the strict rounding rule (monthly payment rounded to cents, total cost = payment x months, total interest = total cost - principal).
3. **Pure Financial Engine:** All calculation logic isolated in `src/loan.js` with zero DOM or browser dependencies.
4. **Automated Unit Testing:** 100% of acceptance criteria verified with automated Vitest tests asserting exact expected numbers.
5. **Mutation Sensitivity:** Calculation formulas validated with intentional mutations (e.g. divisor 12 to 13) causing immediate test failures, followed by clean restoration with zero git diff.
6. **Live Deployment Verification:** Automated CDP browser runs executed against `https://loanlens-kappa.vercel.app` validating all DOM states.
7. **Manual Human Verification:** Live browser verification performed directly by the user on the deployed site with photographic evidence before any implementation status was confirmed.

Calculation and validation criteria are verified by automated Vitest tests asserting exact numbers; UI behaviour criteria are verified by browser automation and manual checks on the live site.

---

## 3. Risk and Issue Log

| ID | Risk or Issue | Severity | Mitigation / Resolution | Status |
| :--- | :--- | :--- | :--- | :--- |
| **R-1** | Division by zero when interest rate is 0.0% | High | Explicit zero-rate branch in `src/loan.js`: monthly payment = principal / term; total interest = 0.00. No NaN or errors. | Resolved |
| **R-2** | Floating point rounding drift across terms | High | Universal rounding rule enforced: round monthly payment to cents ($0.01) first, compute total cost as payment x months, total interest as total cost - financed amount. | Resolved |
| **R-3** | Borrower relying on assumed lender rates | Medium | Application never stores or assumes third-party bank rates. Helper text and labels explicitly instruct user to enter quoted annual rate from offer letter. | Resolved |
| **R-4** | Comparison section accessibility and layout | Medium | Elevated comparison from page bottom to top mode toggle menu, with symmetrical category support. | Resolved |
| **R-5** | Discrepancy between AI verification prose and actual code execution | High | Strict manual testing on live site caught AI report typo (AI-9). Policy adopted: AI reports are claims to be checked, not evidence. | Resolved |

---

## 4. Architecture Decision Log

### Decision 001: Technology Stack Selection (Vanilla JS + Vite + Vitest)
- **Status:** Approved
- **Decision:** Use Vanilla JavaScript (ES modules) paired with Vite for development and bundling, and Vitest for headless unit testing.
- **Justification:** The application is a focused utility tool with clean state boundaries. Vanilla JS eliminates framework overhead, minimizes bundle size, and guarantees near-instant initial render.

### Decision 002: Decoupled Pure Financial Engine
- **Status:** Approved
- **Decision:** Isolate all calculation and input validation routines into `src/loan.js` with zero DOM or browser dependencies.
- **Justification:** Enables 100% deterministic headless testing and guarantees that business logic matches independent mathematical calculations.

### Decision 003: Loan Category Selector (Personal, Car, Home)
- **Status:** Approved
- **Decision:** Implement Story S-9 with a category selector on the main screen, using the same underlying financial calculation engine across all categories.
- **Justification:** Adapts input fields to each loan type (down payment percentage for cars, property price and desired financing for homes) while sharing core amortization logic.

### Decision 004: Category-Specific Comparison and Unified Mode Navigation
- **Status:** Approved
- **Decision:** Elevate tool mode selection (Single Calculator vs Compare Two Offers) to a top navigation menu, and support all three loan categories within comparison mode.
- **Justification:** Keeps the UI uncluttered, eliminates excessive page scrolling, and allows borrowers to compare auto loans and mortgages on their native terms.

---

## 5. Requirements Traceability Matrix

Status is marked **Implemented** only for stories and criteria that have been verified in code and on the live site. All unbuilt roadmap stories remain **Not implemented**.

| Role | Job | Story | Acceptance Criteria | Automated Test / Verification | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Primary Borrower | J-1 | S-1 (Monthly Payment) | AC 1.1 ($10k, 6%, 36mo: $304.22) | `test/loan.test.js` > AC 1.1 | Implemented |
| Primary Borrower | J-1 | S-1 (Monthly Payment) | AC 1.2 (0% rate boundary: $500.00) | `test/loan.test.js` > AC 1.2 | Implemented |
| Primary Borrower | J-1 | S-1 (Monthly Payment) | AC 1.3 (1 month term boundary: $1,212.00) | `test/loan.test.js` > AC 1.3 | Implemented |
| Primary Borrower | J-1 | S-1 (Monthly Payment) | AC 1.4 (Upper term boundary: 480mo, $100M: $482,196.60) | `test/loan.test.js` > AC 1.4 | Implemented |
| Primary Borrower | J-1 | S-1 (Monthly Payment) | AC 1.5 (Negative and zero principal validation) | `test/loan.test.js` > AC 1.5 | Implemented |
| Primary Borrower | J-1 | S-1 (Monthly Payment) | AC 1.6 (Non-numeric input validation) | `test/loan.test.js` > AC 1.6 | Implemented |
| Primary Borrower | J-1 | S-1 (Monthly Payment) | AC 1.7 (Real-time error recovery) | `test/loan.test.js` > AC 1.7 | Implemented |
| Primary Borrower | J-1 | S-1 (Monthly Payment) | AC 1.8 (Negative interest rate validation) | `test/loan.test.js` > AC 1.8 | Implemented |
| Primary Borrower | J-1 | S-1 (Monthly Payment) | AC 1.9 (Field-specific empty field validation) | `test/loan.test.js` > AC 1.9 | Implemented |
| Primary Borrower | J-1 | S-1 (Monthly Payment) | AC 1.10 (Interest rate exceeds 100% max) | `test/loan.test.js` > AC 1.10 | Implemented |
| Primary Borrower | J-2 | S-2 (Total Interest & Cost) | AC 2.1 (Standard interest: $951.92, cost: $10,951.92) | `test/loan.test.js` > AC 2.1 | Implemented |
| Primary Borrower | J-2 | S-2 (Total Interest & Cost) | AC 2.2 (Zero interest cost: $6,000.00, interest: $0.00) | `test/loan.test.js` > AC 2.2 | Implemented |
| Primary Borrower | J-2 | S-2 (Total Interest & Cost) | AC 2.3 (Term <= 0 validation) | `test/loan.test.js` > AC 2.3 | Implemented |
| Primary Borrower | J-2 | S-2 (Total Interest & Cost) | AC 2.4 (Error recovery after invalid term) | `test/loan.test.js` > AC 2.4 | Implemented |
| Primary Borrower | J-2 | S-2 (Total Interest & Cost) | AC 2.5 (Term exceeds 480 months cap) | `test/loan.test.js` > AC 2.5 | Implemented |
| Primary Borrower | J-1 | S-3 (Term Unit Toggle) | AC 3.1 (Years to months: 3 yr -> 36 mo) | `test/s3-s4.test.js` > AC 3.1 | Implemented |
| Primary Borrower | J-1 | S-3 (Term Unit Toggle) | AC 3.2 (Months to years: 48 mo -> 4 yr) | `test/s3-s4.test.js` > AC 3.2 | Implemented |
| Primary Borrower | J-1 | S-3 (Term Unit Toggle) | AC 3.3 (Fractional year rounding: 2.5 yr -> 30 mo) | `test/s3-s4.test.js` > AC 3.3 | Implemented |
| Primary Borrower | J-1 | S-3 (Term Unit Toggle) | AC 3.4 (Zero/negative term in years) | `test/s3-s4.test.js` > AC 3.4 | Implemented |
| Primary Borrower | J-1 | S-3 (Term Unit Toggle) | AC 3.5 (Fractional rounding: 2.55 yr -> 31 mo) | `test/s3-s4.test.js` > AC 3.5 | Implemented |
| Primary Borrower | J-1 | S-3 (Term Unit Toggle) | AC 3.6 (Non-whole months: 37 mo decimal display) | `test/s3-s4.test.js` > AC 3.6 | Implemented |
| Primary Borrower | J-1 | S-3 (Term Unit Toggle) | AC 3.7 (Home loan term unit toggle: months / years) | `test/s3-s4.test.js` > AC 3.7 | Implemented |
| Loan Comparer | J-3 | S-4 (Compare Two Offers) | AC 4.1 (Comparison trade-offs: Offer A vs Offer B) | `test/s3-s4.test.js` > AC 4.1 | Implemented |
| Loan Comparer | J-3 | S-4 (Compare Two Offers) | AC 4.2 (Error isolation between offers) | `test/s3-s4.test.js` > AC 4.2 | Implemented |
| Loan Comparer | J-3 | S-4 (Compare Two Offers) | AC 4.3 (Identical offers produce zero delta) | `test/s3-s4.test.js` > AC 4.3 | Implemented |
| Loan Comparer | J-3 | S-4 (Compare Two Offers) | AC 4.4 (Car loan offer comparison with down payments) | `test/s3-s4.test.js` > AC 4.4 | Implemented |
| Loan Comparer | J-3 | S-4 (Compare Two Offers) | AC 4.5 (Home loan offer comparison across terms) | `test/s3-s4.test.js` > AC 4.5 | Implemented |
| Primary Borrower / Comparer | J-1 / J-3 | S-5 (Reset All Inputs) | AC 5.1 (Single loan reset clears fields, results, errors) | `test/s3-s4.test.js` > AC 5.1 + Live UI | Implemented |
| Primary Borrower / Comparer | J-1 / J-3 | S-5 (Reset All Inputs) | AC 5.2 (Comparison reset clears offers, results, summary) | `test/s3-s4.test.js` > AC 5.2 + Live UI | Implemented |
| Primary Borrower | J-2 | S-6 (Model Extra Payments) | AC 6.1 (Payoff term and interest saved) | Roadmap item (v1.1) | Not implemented |
| Primary Borrower | J-2 | S-7 (Export CSV Schedule) | AC 7.1 (CSV download with amortization schedule) | Roadmap item (v1.1) | Not implemented |
| Loan Comparer | J-3 | S-8 (Save Scenarios) | AC 8.1 (Local storage persistence) | Roadmap item (v1.2) | Not implemented |
| Primary Borrower | J-1 | S-9 (Select Loan Type) | AC 9.1 (Default to Personal type) | `index.html` + Live UI | Implemented |
| Primary Borrower | J-1 | S-9 (Select Loan Type) | AC 9.2 (Car standard: $30k, 20% down, 6%, 60mo: $463.99) | `test/loan.test.js` > AC 9.2 | Implemented |
| Primary Borrower | J-1 | S-9 (Select Loan Type) | AC 9.3 (Car zero interest: $24k, 0%, 60mo: $400.00) | `test/loan.test.js` > AC 9.3 | Implemented |
| Primary Borrower | J-1 | S-9 (Select Loan Type) | AC 9.4 (Car down payment validation: 0% valid, >=100% error, <0% error) | `test/loan.test.js` > AC 9.4a, b, c | Implemented |
| Primary Borrower | J-1 | S-9 (Select Loan Type) | AC 9.5 (Home standard: $300k prop, $240k fin, 5%, 30yr: $1,288.37) | `test/loan.test.js` > AC 9.5, 9.5a, 9.5b | Implemented |
| Primary Borrower | J-1 | S-9 (Select Loan Type) | AC 9.6 (Home financing validation: > prop error, <=0 error) | `test/loan.test.js` > AC 9.6a, b, c | Implemented |
| Primary Borrower | J-1 | S-9 (Select Loan Type) | AC 9.7 (Category-specific empty field messages) | `test/loan.test.js` > AC 9.7 | Implemented |
| Primary Borrower | J-1 | S-9 (Select Loan Type) | AC 9.8 (Category switching clears state and errors) | `src/main.js` + Live UI | Implemented |
| Primary Borrower | J-1 | S-9 (Select Loan Type) | AC 9.9 (Category-specific reset) | `src/main.js` + Live UI | Implemented |
| Primary Borrower | J-1 | S-9 (Select Loan Type) | AC 9.10 (Cross-category calculation equivalence) | `test/loan.test.js` > AC 9.10 | Implemented |

---

## 6. Verification and Testing Results

### Automated Verification
20 automated verification checks were executed in the final test suite and browser automation run, with all 20 passing:
- 45 automated unit tests in Vitest passing cleanly across `test/loan.test.js` and `test/s3-s4.test.js`.
- Mutation check: Mutating the interest divisor in `src/loan.js` from 12 to 13 immediately broke 15 tests, demonstrating that tests actively assert formula accuracy. Restoring the divisor returned the test suite to 100% pass with zero git diff.
- Headless browser verification via Chrome DevTools Protocol verified default load states, calculations across all categories, conversion toggles, category switching, validation error triggers, and comparison deltas.

### Manual Verification by User on Live Site (`https://loanlens-kappa.vercel.app`)
Verified on desktop Chrome and Safari. Mobile browsers and in-app webviews were not verified. Evidence screenshots are saved in `docs/evidence/`:
1. **Personal Loan Calculation:** Entered $5,000 at 6% for 36 months. Result: Monthly Payment $152.11, Total Interest $475.96, Total Cost $5,475.96. Matches independent formula exactly. (Screenshot: `docs/evidence/personal-5k-6pct-36mo.png`).
2. **Car Loan Empty Field Validation:** Left all fields empty and clicked Calculate. Result: Specific required message displayed under each field ("Vehicle price is required", "Down payment percentage is required", "Interest rate quoted by your lender is required", "Loan term is required"). (Screenshot: `docs/evidence/car-empty-fields-validation.png`).
3. **Home Loan Boundary Validation:** Entered rate 150 and term 481 years. Result: Triggered "Interest rate must not exceed 100%" and "Term must not exceed 480 months (40 years)". (Screenshot: `docs/evidence/home-rate-150-term-481yr.png`).
4. **Personal Loan Boundary Validation:** Entered rate 150 and term 481 months. Result: Triggered "Interest rate must not exceed 100%" and "Term must not exceed 480 months (40 years)". (Screenshot: `docs/evidence/personal-rate-150-term-481.png`).
5. **Term Unit Toggle Conversion:** Converted 36 months to 3 years and back to 36 months; converted 35 months to 2.9166666667 years. (Screenshot: `docs/evidence/toggle-35mo-to-decimal-years.png`).

---

## 7. Issues Found in AI Output and How I Corrected Them

Throughout the collaborative pairing sessions, the user actively audited all AI suggestions, documents, and generated output. The following issues were caught and corrected:

- **AI-1: Status Claim Inflation**  
  *Issue:* AI marked Story S-3 as "Implemented (spec ready)" before any code was written or tested.  
  *Correction:* User required that status reflect only verified reality. S-3, S-4, S-5, and S-9 were downgraded to "Not implemented" until fully built, tested, and checked in the running app.
- **AI-2: Premature Decision Approval**  
  *Issue:* AI drafted Decision 003 with status "Approved" before user review.  
  *Correction:* User mandated that decisions remain "Proposed" until explicit human approval is granted.
- **AI-3: Punctuation Constraint Violation**  
  *Issue:* AI repeatedly introduced em dashes and en dashes into documentation and test files.  
  *Correction:* User established a strict negative constraint: remove all em dashes and en dashes project-wide. All occurrences were replaced with hyphens, double hyphens, or colons.
- **AI-4: Comparison Scope Omission**  
  *Issue:* AI initially scoped loan comparison exclusively for Personal loans, neglecting Car and Home categories.  
  *Correction:* User insisted that comparison must support all three categories symmetrically, allowing users to compare auto loans with down payments and mortgages with property values.
- **AI-5: Awkward Page Layout and Scrolling**  
  *Issue:* AI placed the comparison section at the bottom of the page beneath the single calculator, requiring long vertical scrolls.  
  *Correction:* User requested a prominent top menu navigation bar toggling between "Single Calculator" and "Compare Two Offers".
- **AI-6: Generic Validation Messages**  
  *Issue:* AI initially reused generic "Please enter a valid numeric value" errors for empty fields.  
  *Correction:* User required distinct, field-specific required messages (e.g. "Vehicle price is required") different from non-numeric messages.
- **AI-7: Ambiguous Interest Rate Source**  
  *Issue:* Field labels did not clearly convey where the interest rate originates, creating a risk that users would assume the app fetched current bank rates.  
  *Correction:* User updated label to "Interest rate quoted by your lender (%)" with helper text: "Enter the annual rate from your offer letter or quote. The app never stores or assumes any bank's rates."
- **AI-8: Test Coverage Gaps**  
  *Issue:* Automated test suite omitted several boundary cases ($100,000,000 principal, 481-month error, fractional year rounding, 120% car down payment).  
  *Correction:* User provided an exact 13-part verification checklist asserting hand-calculated numbers to the cent before implementation was approved.
- **AI-9: Discrepancy in AI Verification Report Table**  
  *Issue:* In the final verification report table for Test 13 ($5,000 at 6% for 36 months), the AI's generated prose stated interest $476.08 and total $5,476.08.  
  *Correction:* User ran manual verification on the live running app at https://loanlens-kappa.vercel.app and confirmed the app actually rendered Monthly Payment $152.11, Total Interest $475.96, and Total Cost $5,475.96. The app's calculation was mathematically correct (152.11 x 36 = 5,475.96, and 5,475.96 minus 5,000 = 475.96); the error was solely in the AI's report transcription.  
  *Lesson Learned:* An AI report is a claim to be checked, not evidence. Ground truth exists only in the running code, the live DOM, and independent human verification.

---

## 8. Metrics I Would Track in a Real Product

If this loan calculator were deployed as a live consumer product, the following metrics would be instrumented to evaluate user success, friction, and engagement:

1. **Calculation Completion Rate:** Ratio of sessions that successfully compute a repayment schedule versus sessions where users abandon with empty or invalid fields.
2. **Field-Level Validation Error Rate:** Frequency of error triggers per field (e.g. rate > 100%, negative financing, empty fields) to identify confusing form inputs and refine microcopy.
3. **Mode Engagement Distribution:** Percentage of users utilizing "Single Calculator" versus "Compare Two Offers", indicating demand for competitive quote evaluation.
4. **Loan Category Split:** Proportion of calculations across Personal (unsecured), Car (vehicle/down payment), and Home (mortgage/property) categories to inform future domain-specific tooling.
5. **Term Unit Toggle Frequency:** How often users toggle between Months and Years, evaluating whether default units match borrower mental models.
6. **Time to First Result:** Median elapsed time from page render to first valid calculation display, measuring onboarding speed and interface efficiency.
7. **Form Reset Rate:** Rate at which users click Reset versus modifying individual input fields, indicating whether users compare iterations or start fresh.
8. **Comparison Winner Profile:** Aggregated distribution of chosen offers (e.g. lower monthly payment vs lower total lifetime interest) to understand borrower decision drivers.

---

## 9. Prioritized Backlog

- **P1 (Usability): Format Converted Term to Two Decimals**  
  When toggling terms that result in non-terminating fractions (e.g. 35 months converted to years), format display to at most 2 decimal places (2.92 years) while preserving the exact numerical value internally for calculation.
- **P2 (Story S-6): Model Extra Monthly Principal Payments**  
  Allow borrowers to input an optional extra monthly payment or one-time lump sum to see how many months earlier the loan pays off and total interest saved.
- **P3 (Story S-7): Export Amortization Schedule to CSV**  
  Provide a downloadable CSV file containing a complete month-by-month breakdown of payment number, beginning balance, principal paid, interest paid, and remaining balance.
- **P4 (Story S-8): Save Loan Scenarios in Local Storage**  
  Allow users to save named loan calculations or comparison pairs to browser local storage so they can revisit previous quotes without re-entering numbers.
- **P5 (Reporting): Printable Comparison Summary / PDF Export**  
  Add print-friendly CSS and a one-click PDF export of side-by-side offer comparisons for borrowers to bring to lender negotiations.

---

## 10. Items Could Not Confirm

1. **Mobile Browsers and In-App Webviews:** not verified. Verified on desktop Chrome and Safari. Mobile browsers and in-app webviews were not verified.
2. **Maximum Concurrent Traffic and Load Capacity:** not verified. No empirical load testing or stress benchmarking (such as k6, ApacheBench, or Artillery) has been run to establish exact concurrent user limits or requests per second. From an architecture standpoint, all financial calculations run 100% client-side in the user's browser, and static assets are delivered via Vercel's global Edge CDN, meaning there is zero backend calculation or database bottleneck. However, the precise traffic ceiling remains unverified.
