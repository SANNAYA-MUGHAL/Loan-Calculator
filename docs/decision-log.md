# Architecture Decision Log

### Decision 001: Technology Stack Selection (Vanilla JS + Vite + Vitest)
- **Status:** Approved
- **Context:** Building a responsive loan calculation and comparison tool that requires fast interactive response, robust automated testing, and clean maintainability.
- **Decision:** Use Vanilla JavaScript (ES modules) paired with Vite for development and bundling, and Vitest for headless unit testing. Avoid heavy frameworks such as React or Angular.
- **Justification:** The application is a focused utility tool with clean state boundaries. The problem did not require a full UI framework. Vanilla JS eliminates framework bundle overhead, simplifies deployment, and proves mastery of core web standards and pure functional separation.

### Decision 002: Decoupled Pure Financial Engine
- **Status:** Approved
- **Context:** Financial calculation logic must be deterministic, mathematically rigorous, and auditable independently of browser rendering.
- **Decision:** Isolate all calculation and input validation routines into `src/loan.js` with zero DOM or browser dependencies. The UI layer in `src/main.js` only consumes these pure functions.
- **Justification:** Guarantees that automated unit tests assert business logic without DOM mocking. Adheres to the strict rounding rule: round monthly payment to cents, compute total cost as payment multiplied by months, and total interest as total cost minus financed amount.

### Decision 003: Loan Category Selector (Personal, Car, Home)
- **Status:** Approved
- **Context:** Borrowers approach financing differently based on purpose: car purchases involve vehicle price with a down payment percentage, home purchases involve property price with desired financing and multi-year terms, and personal loans use direct principal.
- **Decision:** Introduce Story S-9 with a category selector on the main screen. The same underlying financial amortization engine (`src/loan.js`) powers all three categories, preserving strict 0% rate handling, 100% maximum rate limit, 480-month term cap, and the round-to-cents calculation rule.
- **Justification:** Eliminates code duplication, prevents assumption of external bank rates, maintains USD display formatting, and ensures category switching clears errors and isolated state.


### Decision 004: Category-Specific Comparison and Unified Mode Navigation
- **Status:** Approved
- **Context:** Borrowers comparing vehicle or property financing require comparison forms that reflect specific terms (e.g. down payment percentages or property prices) rather than forcing all loans into a generic personal principal model. Additionally, placing comparison at the bottom of a long page caused awkward scrolling.
- **Decision:** Elevate tool mode selection (Single Calculator vs Compare Two Offers) to a prominent top navigation menu. Within comparison mode, support all three categories (Personal, Car, Home) symmetrically across Offer A and Offer B, and provide months/years repayment toggles across all calculators.
- **Justification:** Keeps the interface focused, eliminates page clutter, and delivers genuine domain-specific comparison intelligence for cars and mortgages.
