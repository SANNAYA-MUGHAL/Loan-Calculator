# App Roles

## Role 1: Primary Borrower

A **Primary Borrower** is an individual planning a major personal, auto, or
home purchase who needs to determine whether a specific loan payment fits
securely within their monthly household budget.

They can select a loan category (Personal, Car, or Home), configure loan
parameters (including vehicle purchase price with down payment percentage, or
property purchase price with desired financing amount), view their monthly
payment obligation, examine total interest paid alongside total cost, and
reset their inputs to start over.

They must never be shown misleading or ambiguous repayment figures, unhandled
zero-rate calculation errors, NaN or Infinity values, or silent failures that
could distort their financial budgeting.


## Role 2: Loan Comparer

A **Loan Comparer** is a prospective borrower or financial shopper who has
received competing financing options from different lenders (such as a lower
rate over a longer term versus a higher rate over a shorter term) and needs to
weigh the true trade-offs between monthly cash flow and lifetime borrowing cost.

They can input two separate loan options, view automatic delta comparisons for
monthly payment and total interest, and immediately see which offer costs less
overall.

They must never see corrupted or cross-contaminated calculations where an
invalid input in one offer invalidates or distorts the valid data of the other
offer.
