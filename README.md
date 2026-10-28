# Loan Repayment & Comparison Calculator

A fast, responsive web application for calculating loan repayment schedules and comparing competing financing offers. Built with Vanilla JavaScript, Vite, and Vitest following a strict documentation-first, test-driven approach.

---

## Overview & Target Audience

This application serves two primary roles:
1. **Primary Borrower (Jobs J-1, J-2):** Needs to calculate monthly payment commitments, total interest paid, and total lifetime cost for major purchases across three loan categories:
   - **Personal Loan:** Direct borrowing by principal amount, interest rate, and term.
   - **Car Loan:** Computed from vehicle purchase price and down payment percentage (financed amount = vehicle price x (1 - down payment %)).
   - **Home Loan:** Computed from property purchase price and desired financing amount, with loan term entered in years and converted to whole months.
2. **Loan Comparer (Job J-3):** Compares two loan proposals (Offer A vs. Offer B) side-by-side with automatic delta calculations showing monthly savings and total interest cost differences, with isolated error handling so an invalid offer never breaks a valid one.

---

## Technical Stack & Architectural Decisions

- **Framework-Free (Vanilla JS):** The problem did not require a heavy framework like React or Vue. Pure Vanilla JavaScript eliminates virtual DOM overhead, minimizes bundle size, and guarantees near-instant initial render.
- **Pure Financial Engine (`src/loan.js`):** All financial formulas, boundary checks, and input parsing functions are strictly pure with zero DOM dependencies. This enables 100% deterministic headless testing.
- **Build Tooling:** Vite 6 for rapid local development and optimized production bundling.
- **Testing:** Vitest 3 running 42 automated unit tests across all acceptance criteria.

---

## Financial Calculation Rules & Assumptions

1. **Standard Amortization Formula:**
   For annual interest rate $r > 0$, monthly rate $i = \frac{r}{12 \times 100}$:
   $$\text{Monthly Payment } M = P \times \frac{i(1 + i)^n}{(1 + i)^n - 1}$$
2. **Zero Interest Boundary:**
   When interest rate is 0%, monthly payment is calculated simply as principal divided by term:
   $$M = \frac{P}{n}$$
   without division-by-zero errors or NaN.
3. **Rounding Rule (Applied Strictly Across All Categories):**
   - Monthly payment is rounded to the nearest cent ($0.01).
   - Total loan cost is computed as: $\text{Total Cost} = M_{\text{rounded}} \times n$.
   - Total interest paid is computed as: $\text{Total Interest} = \text{Total Cost} - P$.
4. **Boundary Limits:**
   - Minimum term: 1 month.
   - Maximum term: 480 months (40 years).
   - Minimum interest rate: 0.0%. Negative rates are rejected.
   - Maximum interest rate: 100.0%. Rates above 100% are rejected.
   - Car down payment: 0% is valid (full financing); 100% or greater is rejected; negative is rejected.
   - Home loan financing: Must be greater than 0 and cannot exceed the property purchase price.
5. **Lender Rates Assumption:**
   The application never assumes, estimates, or stores bank interest rates. The borrower must enter the exact rate from their lender offer letter or quote.

---

## Getting Started

### Prerequisites
- Node.js 18.0.0 or higher (Node 20+ or 24+ recommended)
- npm 9.0.0 or higher

### Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/SANNAYA-MUGHAL/Loan-Calculator.git
cd Loan-Calculator
npm install
```

### Development Server
Start the local Vite development server:
```bash
npm run dev
```
Open the provided local URL (typically `http://localhost:5173`) in your web browser.

### Running Automated Tests
Run the entire Vitest suite:
```bash
npm test
```
To run tests in watch mode during development:
```bash
npx vitest
```

### Production Build
Build optimized production assets to `dist/`:
```bash
npm run build
```
To preview the production build locally:
```bash
npm run preview
```

---

## Project Structure

```
Loan Calculator/
├── docs/
│   ├── app-roles.md          # Role definitions (Primary Borrower, Loan Comparer)
│   ├── jobs-to-be-done.md    # Jobs J-1, J-2, J-3
│   ├── user-stories.md       # User stories S-1 through S-9 with Given/When/Then ACs
│   ├── decision-log.md       # Architecture decisions (001, 002, 003)
│   └── traceability.md       # Full requirements traceability matrix
├── transcripts/
│   └── session-01.md         # Full AI conversation and prompt transcript
├── src/
│   ├── loan.js               # Pure financial calculation and validation module
│   ├── main.js               # UI controller, event handlers, and DOM wiring
│   └── style.css             # Clean responsive styles and layout
├── test/
│   ├── loan.test.js          # Vitest suite for S-1, S-2, and S-9 (29 tests)
│   └── s3-s4.test.js         # Vitest suite for S-3, S-4, and S-5 (13 tests)
├── index.html                # Accessible HTML5 structure
├── package.json
└── README.md
```

---

## Requirements Traceability Summary

All 42 automated unit tests pass. Full matrix is documented in `docs/traceability.md`.

| Story | Role | Job | Description | Status | Test Coverage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **S-1** | Primary Borrower | J-1 | Monthly payment calculation & boundaries | Implemented | 10 tests (`test/loan.test.js`) |
| **S-2** | Primary Borrower | J-2 | Total interest & total loan cost | Implemented | 5 tests (`test/loan.test.js`) |
| **S-3** | Primary Borrower | J-1 | Term unit toggle (months / years) | Implemented | 7 tests (`test/s3-s4.test.js`) |
| **S-4** | Loan Comparer | J-3 | Side-by-side comparison & delta calculation | Implemented | 4 tests (`test/s3-s4.test.js`) |
| **S-5** | Both | J-1, J-3 | Reset inputs & comparison | Implemented | 2 tests (`test/s3-s4.test.js`) + DOM |
| **S-6** | Primary Borrower | J-2 | Extra monthly principal payments | Not implemented | Planned for v1.1 |
| **S-7** | Primary Borrower | J-2 | Export amortization schedule to CSV | Not implemented | Planned for v1.1 |
| **S-8** | Loan Comparer | J-3 | Persist loan scenarios in local storage | Not implemented | Planned for v1.2 |
| **S-9** | Primary Borrower | J-1 | Specialized loan types (Personal, Car, Home) | Implemented | 14 tests (`test/loan.test.js`) |

---

## AI Collaboration & Attribution

- **AI Tools Used:** Google DeepMind Antigravity Coding Assistant.
- **Underlying Models:** Claude 3.7 Sonnet (Thinking) and Gemini 2.5 Flash.
- **Workflow:** Documentation-first architecture. All app roles, jobs-to-be-done, user stories, and acceptance criteria were drafted and mathematically verified before implementing code.
- **Hand-Edited Code:** None. All code, tests, and configuration were generated, verified, and iterated collaboratively through the AI assistant interface.
