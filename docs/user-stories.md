# User Stories and Acceptance Criteria

---

## Story S-1: Calculate my monthly payment (serves J-1, Implemented)

**As a** Primary Borrower,
**I want** to calculate my monthly payment by entering the loan principal,
annual interest rate, and term,
**so that** I know my exact recurring budget obligation.

### Acceptance Criteria

**AC 1.1 - Standard calculation with a hand-checkable answer:**
Given a loan amount of $10,000, an annual interest rate of 6.0%, and a term of
36 months,
When I calculate the loan,
Then the monthly payment displays as $304.22.

**AC 1.2 - Zero interest rate boundary:**
Given a loan amount of $12,000, an annual interest rate of 0.0%, and a term of
24 months,
When I calculate the loan,
Then the monthly payment displays as $500.00 (principal divided by term) without
division-by-zero errors, NaN, or Infinity values.

**AC 1.3 - Shortest term boundary (1 month):**
Given a loan amount of $1,200, an annual interest rate of 12.0%, and a term of
1 month,
When I calculate the loan,
Then the monthly payment displays as $1,212.00.

**AC 1.4 - Upper term boundary and large principal:**
Given a loan amount of $100,000,000, an annual interest rate of 5.0%, and a term
of 480 months (40 years),
When I calculate the loan,
Then the monthly payment displays as $482,196.60 with comma separators and no
scientific notation.

**AC 1.5 - Negative and zero principal validation:**
Given a loan amount of -$5,000 or $0,
When I attempt to calculate the loan,
Then an error message "Loan amount must be greater than 0" is shown and no
result is rendered.

**AC 1.6 - Non-numeric input validation:**
Given non-numeric characters (such as "abc" or "12.3.4") entered into any
input field,
When the input is evaluated,
Then an error message "Please enter a valid numeric value" is shown.

**AC 1.7 - Error recovery:**
Given an active error message from an invalid loan amount of -$5,000,
When I replace the value with a valid amount of $5,000 at 6.0% for 36 months,
Then the error message clears immediately and the correct monthly payment of
$152.11 is displayed.

**AC 1.8 - Negative interest rate validation:**
Given an annual interest rate of -5.0%,
When I attempt to calculate the loan,
Then an error message "Interest rate cannot be negative" is shown and no result
is rendered.

**AC 1.9 - Empty field validation:**
Given any input field is left completely empty,
When I attempt to calculate the loan,
Then a field-specific error message is shown ("Loan amount is required",
"Annual interest rate is required", or "Loan term is required") for that field
and no result is rendered.

**AC 1.10 - Interest rate exceeds maximum:**
Given an annual interest rate of 101%,
When I attempt to calculate the loan,
Then an error message "Interest rate must not exceed 100%" is shown and no
result is rendered.

---

## Story S-2: See total interest and total cost (serves J-2, Implemented)

**As a** Primary Borrower,
**I want** to see the total interest paid and total loan cost alongside my
monthly payment,
**so that** I understand the full price of borrowing.

### Acceptance Criteria

**AC 2.1 - Standard total interest and total cost:**
Given a loan amount of $10,000 at 6.0% annual interest over 36 months,
When the calculation completes,
Then total interest paid displays as $951.92 and total cost displays as
$10,951.92.

**AC 2.2 - Zero interest total cost:**
Given a loan amount of $6,000 at 0.0% annual interest over 12 months,
When the calculation completes,
Then total interest paid displays as $0.00 and total cost displays as $6,000.00.

**AC 2.3 - Invalid term validation:**
Given a term of 0 months or a negative number of months,
When entered,
Then an error "Term must be at least 1 month" is displayed and previous results
are cleared.

**AC 2.4 - Error recovery after invalid term:**
Given an active error from a term of 0 months,
When I replace the value with 12 months,
Then the error clears and correct results display.

**AC 2.5 - Term exceeds maximum:**
Given a term of 481 months,
When I attempt to calculate the loan,
Then an error "Term must not exceed 480 months (40 years)" is shown and no
result is rendered.

---

## Story S-3: Toggle term between years and months (serves J-1, Implemented)

**As a** Primary Borrower,
**I want** to toggle between entering my loan term in years or months,
**so that** I can enter terms in whichever unit my lender quotes without manual
conversion.

### Acceptance Criteria

**AC 3.1 - Years to months conversion:**
Given a term of 3 years entered,
When I switch the term unit from Years to Months,
Then the input value changes to 36 months and the payment calculation remains
unchanged.

**AC 3.2 - Months to years conversion:**
Given a term of 48 months entered,
When I switch the term unit from Months to Years,
Then the input value changes to 4 years and the payment calculation remains
unchanged.

**AC 3.3 - Fractional year rounding:**
Given a term of 2.5 years entered,
When calculated,
Then the system rounds to the nearest whole month (30 months) and computes
the loan over that duration.

**AC 3.4 - Zero or negative term in years mode:**
Given a term of 0 years or -1 years,
When I attempt to calculate the loan,
Then an error "Term must be at least 1 month" is displayed.

**AC 3.5 - Fractional year rounding (non-half):**
Given a term of 2.55 years entered,
When calculated,
Then the system rounds to the nearest whole month (31 months, since
2.55 x 12 = 30.6 rounds to 31) and computes the loan over that duration.

**AC 3.6 - Non-whole months to years conversion:**
Given a term of 37 months entered,
When I switch the term unit to Years,
Then the input displays the decimal equivalent (37 divided by 12). When I switch
back to Months, the value returns to 37.

**AC 3.7 - Home loan term unit toggle:**
Given the Home loan type is selected,
When I switch the term unit between Years and Months,
Then the term is converted between years and whole months, and calculations
accurately evaluate across the selected duration.

---

## Story S-4: Compare two loan offers (serves J-3, Implemented)

**As a** Loan Comparer,
**I want** to compare two distinct loan offers with automatic delta
calculations,
**so that** I can easily see which loan saves me more money overall and on a
monthly basis.

### Acceptance Criteria

**AC 4.1 - Comparison with clear trade-offs:**
Given Offer A of $20,000 at 7.0% for 36 months (monthly $617.54, total interest
$2,231.44) and Offer B of $20,000 at 5.5% for 48 months (monthly $465.13,
total interest $2,326.24),
When I view the comparison,
Then the app highlights that Offer B saves $152.41 per month, but Offer A saves
$94.80 in total interest.

**AC 4.2 - Error isolation between offers:**
Given Offer A has valid inputs and Offer B has an invalid negative interest rate
of -2.0%,
When evaluated,
Then Offer A displays its correct standalone results, Offer B displays an error
"Interest rate cannot be negative", and the comparison summary states "Enter
valid values for both offers to compare".

**AC 4.3 - Identical offers produce zero delta:**
Given Offer A and Offer B both have identical terms of $15,000 at 5.0% for
36 months,
When compared,
Then the delta shows $0.00 difference for both monthly payment and total
interest.

**AC 4.4 - Car loan offer comparison with down payments:**
Given Offer A of a $30,000 vehicle with 20% down ($24,000 financed) at 6.0% for
60 months, and Offer B of a $30,000 vehicle with 10% down ($27,000 financed) at
4.5% for 60 months,
When I compare the offers,
Then Offer A displays monthly payment $463.99 and total interest $3,839.40,
Offer B displays monthly payment $503.36 and total interest $3,201.60, and the
summary highlights that Offer A saves $39.37 per month while Offer B saves
$637.80 in total interest.

**AC 4.5 - Home loan offer comparison across different terms:**
Given Offer A of a $300,000 property with $240,000 financing at 5.0% for 30 years
(360 months), and Offer B with $240,000 financing at 4.5% for 15 years (180 months),
When I compare the offers,
Then Offer A displays monthly payment $1,288.37 and total interest $223,813.20,
Offer B displays monthly payment $1,835.98 and total interest $90,476.40, and the
summary highlights that Offer A saves $547.61 per month while Offer B saves
$133,336.80 in total interest.

---

## Story S-5: Reset all inputs (serves J-1, Implemented)

**As a** Primary Borrower,
**I want** an instant reset option,
**so that** I can clear all inputs, results, and active errors to start a clean
calculation.

### Acceptance Criteria

**AC 5.1 - Single loan reset:**
Given fields populated with $25,000, 7.5%, 60 months, and visible calculation
results,
When I activate the reset,
Then all input fields revert to their default empty state, result displays are
cleared, and any active error messages disappear.

**AC 5.2 - Comparison reset:**
Given both Offer A and Offer B are populated with values, results are visible
for both offers, and a comparison summary is displayed,
When I activate the comparison reset,
Then all offer input fields revert to their default empty state, all offer
results are hidden, and the comparison summary disappears.

---

## Story S-6: Model extra monthly payments (serves J-2, Not implemented)

**As a** Primary Borrower,
**I want** to specify an extra monthly principal payment amount,
**so that** I can see how much interest I save and how many months earlier I
become debt-free.

**Status:** Not implemented. Planned for v1.1.

### Acceptance Criteria

**AC 6.1 - Extra payment impact:**
Given an active loan of $10,000 at 6.0% for 36 months, when an extra payment of
$50 per month is entered, then the new payoff term and total interest saved are
displayed.

---

## Story S-7: Export amortization schedule (serves J-2, Not implemented)

**As a** Primary Borrower,
**I want** to export a complete month-by-month amortization schedule as a
downloadable CSV file,
**so that** I can retain the payment breakdown for personal accounting and tax
records.

**Status:** Not implemented. Planned for v1.1.

### Acceptance Criteria

**AC 7.1 - CSV download:**
Given a calculated loan, when the user requests an export, then a CSV file is
downloaded containing columns for Month, Payment, Principal Paid, Interest Paid,
and Remaining Balance.

---

## Story S-8: Save loan scenarios (serves J-3, Not implemented)

**As a** Loan Comparer,
**I want** to save multiple named loan scenarios to my browser's local storage,
**so that** I can revisit and re-evaluate offers across different shopping
sessions.

**Status:** Not implemented. Planned for v1.2.

### Acceptance Criteria

**AC 8.1 - Persist and recall:**
Given two or more configured loans, when the user saves a scenario, then the
scenarios are persisted in browser local storage and listed for recall.


---

## Story S-9: Select loan type for specialized borrowing (serves J-1, Implemented)

**As a** Primary Borrower,
**I want** to choose between Personal, Car, and Home loan types,
**so that** I can enter the exact purchase and financing terms that correspond
to my borrowing situation.

### Acceptance Criteria

**AC 9.1 - Default loan type selection:**
Given the calculator is opened,
When viewed,
Then the loan type selector defaults to Personal, and only the inputs for
Personal loan (loan amount, interest rate, term) are visible.

**AC 9.2 - Car loan financed amount calculation and repayment:**
Given the Car loan type is selected, with a vehicle price of $30,000, a down
payment of 20%, an interest rate of 6.0%, and a term of 60 months,
When I calculate the loan,
Then the financed amount is computed as $24,000 ($30,000 x (1 - 0.20)), the
monthly payment displays as $463.99, the total cost displays as $27,839.40,
and the total interest displays as $3,839.40.

**AC 9.3 - Car loan zero interest rate boundary:**
Given the Car loan type is selected, with a vehicle price of $30,000, a down
payment of 20% ($24,000 financed), an interest rate of 0.0%, and a term of
60 months,
When I calculate the loan,
Then the monthly payment displays as $400.00 ($24,000 / 60) and total interest
displays as $0.00.

**AC 9.4 - Car loan down payment percentage validation:**
Given the Car loan type is selected,
When a down payment percentage of 0% is entered,
Then the input is valid and financing covers 100% of the vehicle price.
When a down payment percentage of 100% or greater is entered,
Then an error message "Down payment percentage must be less than 100%" is
shown and no result is rendered.
When a negative down payment percentage is entered,
Then an error message "Down payment percentage cannot be negative" is shown.

**AC 9.5 - Home loan financing calculation and multi-year term:**
Given the Home loan type is selected, with a property price of $300,000, a
desired financing amount of $240,000, an interest rate of 5.0%, and a term of
30 years (360 months),
When I calculate the loan,
Then the monthly payment displays as $1,288.37, the total cost displays as
$463,813.20, and the total interest displays as $223,813.20.

**AC 9.6 - Home loan desired financing validation:**
Given the Home loan type is selected,
When a desired financing amount greater than the property purchase price is
entered,
Then an error message "Financing amount cannot exceed property price" is shown
and no result is rendered.
When a desired financing amount of $0 or a negative amount is entered,
Then an error message "Financing amount must be greater than 0" is shown.

**AC 9.7 - Category-specific empty field messages:**
Given any required field in the active category is left blank when calculating,
Then a specific required message is displayed:
- "Vehicle price is required" for empty vehicle price in Car loan.
- "Down payment percentage is required" for empty down payment in Car loan.
- "Property price is required" for empty property price in Home loan.
- "Desired financing amount is required" for empty financing in Home loan.
- "Interest rate quoted by your lender is required" for empty rate.
- "Loan term is required" for empty term.

**AC 9.8 - Category switching state isolation:**
Given fields and results are active in one loan category (e.g. Car loan),
When I switch to a different loan category (e.g. Home loan),
Then the previously displayed results, inputs, and active error messages are
cleared, and only the inputs for the newly selected category are displayed.

**AC 9.9 - Category-specific reset:**
Given fields and results are populated within the active loan category,
When I click Reset,
Then all input fields for the active category revert to their blank default
state, results are cleared, and active error messages are dismissed.

**AC 9.10 - Cross-category calculation equivalence:**
Given a Car loan with $30,000 vehicle price, 20% down ($24,000 financed), 6.0%
rate, and 60 months,
And a Personal loan with $24,000 principal, 6.0% rate, and 60 months,
When both are calculated,
Then both produce the identical monthly payment of $463.99, total cost of
$27,839.40, and total interest of $3,839.40.
