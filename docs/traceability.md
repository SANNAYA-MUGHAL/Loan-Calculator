# Requirements Traceability Matrix

This table maps every role, job-to-be-done, user story, and acceptance criteria to its automated test verification and implementation status.

| Role | Job | Story | Acceptance Criteria | Automated Test / Verification | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Primary Borrower | J-1 | S-1 (Calculate Monthly Payment) | AC 1.1 ($10k, 6%, 36mo: $304.22) | `test/loan.test.js` > AC 1.1 | Implemented |
| Primary Borrower | J-1 | S-1 (Calculate Monthly Payment) | AC 1.2 (0% rate boundary: $500.00) | `test/loan.test.js` > AC 1.2 | Implemented |
| Primary Borrower | J-1 | S-1 (Calculate Monthly Payment) | AC 1.3 (1 month term boundary: $1,212.00) | `test/loan.test.js` > AC 1.3 | Implemented |
| Primary Borrower | J-1 | S-1 (Calculate Monthly Payment) | AC 1.4 (Upper term boundary: 480mo, $100M: $482,196.60) | `test/loan.test.js` > AC 1.4 | Implemented |
| Primary Borrower | J-1 | S-1 (Calculate Monthly Payment) | AC 1.5 (Negative and zero principal validation) | `test/loan.test.js` > AC 1.5 | Implemented |
| Primary Borrower | J-1 | S-1 (Calculate Monthly Payment) | AC 1.6 (Non-numeric input validation) | `test/loan.test.js` > AC 1.6 | Implemented |
| Primary Borrower | J-1 | S-1 (Calculate Monthly Payment) | AC 1.7 (Real-time error recovery) | `test/loan.test.js` > AC 1.7 | Implemented |
| Primary Borrower | J-1 | S-1 (Calculate Monthly Payment) | AC 1.8 (Negative interest rate validation) | `test/loan.test.js` > AC 1.8 | Implemented |
| Primary Borrower | J-1 | S-1 (Calculate Monthly Payment) | AC 1.9 (Field-specific empty field validation) | `test/loan.test.js` > AC 1.9 | Implemented |
| Primary Borrower | J-1 | S-1 (Calculate Monthly Payment) | AC 1.10 (Interest rate exceeds 100% max) | `test/loan.test.js` > AC 1.10 | Implemented |
| Primary Borrower | J-2 | S-2 (See Total Interest and Total Cost) | AC 2.1 (Standard total interest: $951.92, total cost: $10,951.92) | `test/loan.test.js` > AC 2.1 | Implemented |
| Primary Borrower | J-2 | S-2 (See Total Interest and Total Cost) | AC 2.2 (Zero interest total cost: $6,000.00, interest: $0.00) | `test/loan.test.js` > AC 2.2 | Implemented |
| Primary Borrower | J-2 | S-2 (See Total Interest and Total Cost) | AC 2.3 (Term <= 0 validation) | `test/loan.test.js` > AC 2.3 | Implemented |
| Primary Borrower | J-2 | S-2 (See Total Interest and Total Cost) | AC 2.4 (Error recovery after invalid term) | `test/loan.test.js` > AC 2.4 | Implemented |
| Primary Borrower | J-2 | S-2 (See Total Interest and Total Cost) | AC 2.5 (Term exceeds 480 months cap) | `test/loan.test.js` > AC 2.5 | Implemented |
| Primary Borrower | J-1 | S-3 (Toggle Term Between Years and Months) | AC 3.1 (Years to months: 3 yr -> 36 mo) | `test/s3-s4.test.js` > AC 3.1 | Implemented |
| Primary Borrower | J-1 | S-3 (Toggle Term Between Years and Months) | AC 3.2 (Months to years: 48 mo -> 4 yr) | `test/s3-s4.test.js` > AC 3.2 | Implemented |
| Primary Borrower | J-1 | S-3 (Toggle Term Between Years and Months) | AC 3.3 (Fractional year rounding: 2.5 yr -> 30 mo) | `test/s3-s4.test.js` > AC 3.3 | Implemented |
| Primary Borrower | J-1 | S-3 (Toggle Term Between Years and Months) | AC 3.4 (Zero/negative term in years) | `test/s3-s4.test.js` > AC 3.4 | Implemented |
| Primary Borrower | J-1 | S-3 (Toggle Term Between Years and Months) | AC 3.5 (Fractional rounding: 2.55 yr -> 31 mo) | `test/s3-s4.test.js` > AC 3.5 | Implemented |
| Primary Borrower | J-1 | S-3 (Toggle Term Between Years and Months) | AC 3.6 (Non-whole months: 37 mo decimal display) | `test/s3-s4.test.js` > AC 3.6 | Implemented |
| Loan Comparer | J-3 | S-4 (Compare Two Loan Offers) | AC 4.1 (Comparison trade-offs: Offer A vs Offer B) | `test/s3-s4.test.js` > AC 4.1 | Implemented |
| Loan Comparer | J-3 | S-4 (Compare Two Loan Offers) | AC 4.2 (Error isolation between offers) | `test/s3-s4.test.js` > AC 4.2 | Implemented |
| Loan Comparer | J-3 | S-4 (Compare Two Loan Offers) | AC 4.3 (Identical offers produce zero delta) | `test/s3-s4.test.js` > AC 4.3 | Implemented |
| Primary Borrower / Comparer | J-1 / J-3 | S-5 (Reset All Inputs) | AC 5.1 (Single loan reset clears fields, results, errors) | `test/s3-s4.test.js` > AC 5.1 + DOM | Implemented |
| Primary Borrower / Comparer | J-1 / J-3 | S-5 (Reset All Inputs) | AC 5.2 (Comparison reset clears offers, results, summary) | `test/s3-s4.test.js` > AC 5.2 + DOM | Implemented |
| Primary Borrower | J-2 | S-6 (Model Extra Monthly Payments) | AC 6.1 (Payoff term and interest saved) | Roadmap item (v1.1) | Not implemented |
| Primary Borrower | J-2 | S-7 (Export Amortization Schedule) | AC 7.1 (CSV download with schedule) | Roadmap item (v1.1) | Not implemented |
| Loan Comparer | J-3 | S-8 (Save Loan Scenarios) | AC 8.1 (Local storage persistence) | Roadmap item (v1.2) | Not implemented |
| Primary Borrower | J-1 | S-9 (Select Loan Type) | AC 9.1 (Default to Personal type) | `index.html` + DOM initialization | Implemented |
| Primary Borrower | J-1 | S-9 (Select Loan Type) | AC 9.2 (Car standard: $30k, 20% down, 6%, 60mo: $463.99) | `test/loan.test.js` > AC 9.2 | Implemented |
| Primary Borrower | J-1 | S-9 (Select Loan Type) | AC 9.3 (Car zero interest: $24k, 0%, 60mo: $400.00) | `test/loan.test.js` > AC 9.3 | Implemented |
| Primary Borrower | J-1 | S-9 (Select Loan Type) | AC 9.4 (Car down payment validation: 0% valid, >=100% error, <0% error) | `test/loan.test.js` > AC 9.4a, b, c | Implemented |
| Primary Borrower | J-1 | S-9 (Select Loan Type) | AC 9.5 (Home standard: $300k prop, $240k fin, 5%, 30yr: $1,288.37) | `test/loan.test.js` > AC 9.5, 9.5a, 9.5b | Implemented |
| Primary Borrower | J-1 | S-9 (Select Loan Type) | AC 9.6 (Home financing validation: > prop error, <=0 error) | `test/loan.test.js` > AC 9.6a, b, c | Implemented |
| Primary Borrower | J-1 | S-9 (Select Loan Type) | AC 9.7 (Category-specific empty field messages) | `test/loan.test.js` > AC 9.7 (Car & Home) | Implemented |
| Primary Borrower | J-1 | S-9 (Select Loan Type) | AC 9.8 (Category switching clears state and errors) | `src/main.js` (`switchToType`) | Implemented |
| Primary Borrower | J-1 | S-9 (Select Loan Type) | AC 9.9 (Category-specific reset) | `src/main.js` (`handleReset`) | Implemented |
| Primary Borrower | J-1 | S-9 (Select Loan Type) | AC 9.10 (Cross-category calculation equivalence) | `test/loan.test.js` > AC 9.10 | Implemented |
