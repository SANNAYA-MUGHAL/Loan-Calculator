import {
  validateLoanInputs,
  validateCarLoanInputs,
  validateHomeLoanInputs,
  calculateLoan,
  compareLoans,
  convertTermUnit,
  formatCurrency
} from './loan.js';

// ---------------------------------------------------------------------------
// DOM references -- Single Loan Calculator
// ---------------------------------------------------------------------------
const loanForm         = document.getElementById('loan-form');
const resetBtn         = document.getElementById('reset-btn');
const typeButtons      = document.querySelectorAll('.type-btn');

// Field groups
const fieldsPersonal   = document.getElementById('fields-personal');
const fieldsCar        = document.getElementById('fields-car');
const fieldsHome       = document.getElementById('fields-home');

// Shared inputs
const annualRateInput  = document.getElementById('annualRate');
const termInput        = document.getElementById('term');
const termLabel        = document.getElementById('term-label');
const termHint         = document.getElementById('term-hint');
const termUnit         = document.getElementById('term-unit');
const termUnitToggle   = document.getElementById('term-unit-toggle');
const toggleMonthsBtn  = document.getElementById('toggle-months');
const toggleYearsBtn   = document.getElementById('toggle-years');

// Personal inputs
const principalInput   = document.getElementById('principal');

// Car inputs
const vehiclePriceInput    = document.getElementById('vehiclePrice');
const downPaymentPctInput  = document.getElementById('downPaymentPct');

// Home inputs
const propertyPriceInput   = document.getElementById('propertyPrice');
const financingAmountInput = document.getElementById('financingAmount');

// Error elements -- single calculator
const principalError       = document.getElementById('principal-error');
const vehiclePriceError    = document.getElementById('vehiclePrice-error');
const downPaymentPctError  = document.getElementById('downPaymentPct-error');
const propertyPriceError   = document.getElementById('propertyPrice-error');
const financingAmountError = document.getElementById('financingAmount-error');
const annualRateError      = document.getElementById('annualRate-error');
const termError            = document.getElementById('term-error');

// Result elements
const resultsCard              = document.getElementById('results-card');
const financedAmountRow        = document.getElementById('financed-amount-row');
const resultFinancedAmount     = document.getElementById('result-financed-amount');
const resultMonthlyPayment     = document.getElementById('result-monthly-payment');
const resultTotalInterest      = document.getElementById('result-total-interest');
const resultTotalCost          = document.getElementById('result-total-cost');

// ---------------------------------------------------------------------------
// DOM references -- Comparison (S-4)
// ---------------------------------------------------------------------------
const compareBtn        = document.getElementById('compare-btn');
const compareResetBtn   = document.getElementById('compare-reset-btn');

// Offer A inputs
const aPrincipalInput = document.getElementById('a-principal');
const aRateInput      = document.getElementById('a-rate');
const aTermInput      = document.getElementById('a-term');

// Offer A error elements
const aPrincipalError = document.getElementById('a-principal-error');
const aRateError      = document.getElementById('a-rate-error');
const aTermError      = document.getElementById('a-term-error');

// Offer A result elements
const aMonthly   = document.getElementById('a-monthly');
const aInterest  = document.getElementById('a-interest');
const aCost      = document.getElementById('a-cost');

// Offer B inputs
const bPrincipalInput = document.getElementById('b-principal');
const bRateInput      = document.getElementById('b-rate');
const bTermInput      = document.getElementById('b-term');

// Offer B error elements
const bPrincipalError = document.getElementById('b-principal-error');
const bRateError      = document.getElementById('b-rate-error');
const bTermError      = document.getElementById('b-term-error');

// Offer B result elements
const bMonthly   = document.getElementById('b-monthly');
const bInterest  = document.getElementById('b-interest');
const bCost      = document.getElementById('b-cost');

// Comparison summary elements
const summaryPlaceholder = document.getElementById('summary-placeholder');
const summaryContent     = document.getElementById('summary-content');
const summaryMonthlyText = document.getElementById('summary-monthly-text');
const summaryInterestText= document.getElementById('summary-interest-text');

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
let currentType = 'personal'; // 'personal' | 'car' | 'home'
let termCurrentUnit = 'months'; // 'months' | 'years' (S-3 toggle state)

// ---------------------------------------------------------------------------
// Generic error helpers
// ---------------------------------------------------------------------------
function setFieldError(inputEl, errorEl, message) {
  errorEl.textContent = message;
  errorEl.classList.add('visible');
  inputEl.closest('.form-group').classList.add('has-error');
}

function clearFieldError(inputEl, errorEl) {
  if (!inputEl || !errorEl) return;
  errorEl.textContent = '';
  errorEl.classList.remove('visible');
  inputEl.closest('.form-group').classList.remove('has-error');
}

function clearAllErrors() {
  clearFieldError(principalInput, principalError);
  clearFieldError(vehiclePriceInput, vehiclePriceError);
  clearFieldError(downPaymentPctInput, downPaymentPctError);
  clearFieldError(propertyPriceInput, propertyPriceError);
  clearFieldError(financingAmountInput, financingAmountError);
  clearFieldError(annualRateInput, annualRateError);
  clearFieldError(termInput, termError);
}

// ---------------------------------------------------------------------------
// Single-loan results helpers
// ---------------------------------------------------------------------------
function showResults(result, financedAmount = null) {
  resultMonthlyPayment.textContent = formatCurrency(result.monthlyPayment);
  resultTotalInterest.textContent  = formatCurrency(result.totalInterest);
  resultTotalCost.textContent      = formatCurrency(result.totalCost);

  if (financedAmount !== null) {
    resultFinancedAmount.textContent = formatCurrency(financedAmount);
    financedAmountRow.classList.remove('hidden');
  } else {
    financedAmountRow.classList.add('hidden');
  }
}

function clearResults() {
  resultMonthlyPayment.textContent = '--';
  resultTotalInterest.textContent  = '--';
  resultTotalCost.textContent      = '--';
  financedAmountRow.classList.add('hidden');
}

// ---------------------------------------------------------------------------
// S-3: Term unit toggle (Personal and Car only)
// ---------------------------------------------------------------------------
function applyTermUnit(unit) {
  termCurrentUnit = unit;

  // Update toggle button active state
  toggleMonthsBtn.classList.toggle('active', unit === 'months');
  toggleYearsBtn.classList.toggle('active', unit === 'years');

  // Update suffix label
  termUnit.textContent = unit;

  if (unit === 'years') {
    termLabel.textContent = 'Loan Term (Years)';
    termHint.textContent  = 'Enter the duration in years. Fractional years allowed; will be rounded to the nearest month.';
    termInput.placeholder = 'Enter duration in years (e.g. 5)';
  } else {
    termLabel.textContent = 'Loan Term (Months)';
    termHint.textContent  = 'Enter the total duration of the loan in months.';
    termInput.placeholder = 'Enter duration in months (e.g. 36)';
  }
}

function onToggleUnit(newUnit) {
  if (newUnit === termCurrentUnit) return;

  // Convert the currently displayed value to the new unit (AC 3.1, 3.2, 3.6)
  const raw = termInput.value.trim();
  if (raw !== '') {
    const num = Number(raw);
    if (!isNaN(num)) {
      const converted = convertTermUnit(num, termCurrentUnit, newUnit);
      // For years display show up to 10 decimal places but strip trailing zeros
      termInput.value = newUnit === 'years'
        ? parseFloat(converted.toFixed(10)).toString()
        : String(converted);
    }
  }

  clearFieldError(termInput, termError);
  applyTermUnit(newUnit);
}

toggleMonthsBtn.addEventListener('click', () => onToggleUnit('months'));
toggleYearsBtn.addEventListener('click',  () => onToggleUnit('years'));

// ---------------------------------------------------------------------------
// Loan type switching (AC 9.1, AC 9.8)
// ---------------------------------------------------------------------------
function switchToType(type) {
  currentType = type;

  // Update active tab button
  typeButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.type === type));

  // Show/hide field groups
  fieldsPersonal.classList.toggle('hidden', type !== 'personal');
  fieldsCar.classList.toggle('hidden', type !== 'car');
  fieldsHome.classList.toggle('hidden', type !== 'home');

  if (type === 'home') {
    // Home uses fixed years; hide toggle and lock label
    termUnitToggle.classList.add('hidden');
    termLabel.textContent = 'Loan Term (Years)';
    termHint.textContent  = 'Enter the duration in years (e.g. 30). Converted to whole months, rounded to nearest month.';
    termUnit.textContent  = 'years';
    termInput.placeholder = 'Enter duration in years (e.g. 30)';
    // Reset toggle state to months for when we leave Home
    termCurrentUnit = 'years';
  } else {
    // Personal / Car: show toggle, reset to months
    termUnitToggle.classList.remove('hidden');
    applyTermUnit('months');
  }

  // Clear all state on type switch (AC 9.8)
  loanForm.reset();
  clearAllErrors();
  clearResults();
}

typeButtons.forEach(btn => {
  btn.addEventListener('click', () => switchToType(btn.dataset.type));
});

// ---------------------------------------------------------------------------
// Real-time error clearing (AC 1.7, AC 2.4)
// ---------------------------------------------------------------------------
function attachClearOnInput(inputEl, errorEl) {
  inputEl.addEventListener('input', () => clearFieldError(inputEl, errorEl));
}

attachClearOnInput(principalInput, principalError);
attachClearOnInput(vehiclePriceInput, vehiclePriceError);
attachClearOnInput(downPaymentPctInput, downPaymentPctError);
attachClearOnInput(propertyPriceInput, propertyPriceError);
attachClearOnInput(financingAmountInput, financingAmountError);
attachClearOnInput(annualRateInput, annualRateError);
attachClearOnInput(termInput, termError);

// ---------------------------------------------------------------------------
// Single-loan Calculate (S-1, S-2, S-9)
// ---------------------------------------------------------------------------
function getTermAsMonths() {
  // For Personal/Car: if toggle is in years mode, convert to months first.
  // For Home: main.js passes the raw years value to validateHomeLoanInputs.
  if (currentType === 'home') return termInput.value; // handled inside validateHomeLoanInputs
  if (termCurrentUnit === 'years') {
    const raw = termInput.value.trim();
    const num = Number(raw);
    if (!isNaN(num) && raw !== '') {
      return String(convertTermUnit(num, 'years', 'months'));
    }
    return raw; // let validator produce the error
  }
  return termInput.value;
}

function handleCalculate(e) {
  e.preventDefault();
  clearAllErrors();

  const rate = annualRateInput.value;
  let validation;

  if (currentType === 'personal') {
    validation = validateLoanInputs({
      principal:  principalInput.value.replace(/,/g, ''),
      annualRate: rate,
      termMonths: getTermAsMonths()
    });

    if (!validation.isValid) {
      clearResults();
      if (validation.errors.principal)  setFieldError(principalInput, principalError, validation.errors.principal);
      if (validation.errors.annualRate) setFieldError(annualRateInput, annualRateError, validation.errors.annualRate);
      if (validation.errors.termMonths) setFieldError(termInput, termError, validation.errors.termMonths);
      return;
    }

    const { principal, annualRate, termMonths } = validation.values;
    showResults(calculateLoan(principal, annualRate, termMonths));

  } else if (currentType === 'car') {
    validation = validateCarLoanInputs({
      vehiclePrice:   vehiclePriceInput.value.replace(/,/g, ''),
      downPaymentPct: downPaymentPctInput.value,
      annualRate:     rate,
      termMonths:     getTermAsMonths()
    });

    if (!validation.isValid) {
      clearResults();
      if (validation.errors.vehiclePrice)   setFieldError(vehiclePriceInput, vehiclePriceError, validation.errors.vehiclePrice);
      if (validation.errors.downPaymentPct) setFieldError(downPaymentPctInput, downPaymentPctError, validation.errors.downPaymentPct);
      if (validation.errors.annualRate)     setFieldError(annualRateInput, annualRateError, validation.errors.annualRate);
      if (validation.errors.termMonths)     setFieldError(termInput, termError, validation.errors.termMonths);
      return;
    }

    const { financedAmount, annualRate, termMonths } = validation.values;
    showResults(calculateLoan(financedAmount, annualRate, termMonths), financedAmount);

  } else {
    // home -- term entered in years; validateHomeLoanInputs handles the conversion
    validation = validateHomeLoanInputs({
      propertyPrice:   propertyPriceInput.value.replace(/,/g, ''),
      financingAmount: financingAmountInput.value.replace(/,/g, ''),
      annualRate:      rate,
      termYears:       termInput.value
    });

    if (!validation.isValid) {
      clearResults();
      if (validation.errors.propertyPrice)   setFieldError(propertyPriceInput, propertyPriceError, validation.errors.propertyPrice);
      if (validation.errors.financingAmount) setFieldError(financingAmountInput, financingAmountError, validation.errors.financingAmount);
      if (validation.errors.annualRate)      setFieldError(annualRateInput, annualRateError, validation.errors.annualRate);
      if (validation.errors.termYears)       setFieldError(termInput, termError, validation.errors.termYears);
      return;
    }

    const { financingAmount, annualRate, termMonths } = validation.values;
    showResults(calculateLoan(financingAmount, annualRate, termMonths));
  }
}

// ---------------------------------------------------------------------------
// Reset (AC 5.1, AC 9.9)
// ---------------------------------------------------------------------------
function handleReset() {
  loanForm.reset();
  clearAllErrors();
  clearResults();
  // Reset toggle back to months on Reset (AC 5.1 full reset)
  if (currentType !== 'home') {
    applyTermUnit('months');
  }
}

loanForm.addEventListener('submit', handleCalculate);
resetBtn.addEventListener('click', handleReset);

// ---------------------------------------------------------------------------
// S-4: Loan Comparison
// ---------------------------------------------------------------------------

// Offer-specific error helpers (comparison forms have no nearest .form-group
// wrapping at the offer level, so we keep a lightweight version)
function setOfferError(inputEl, errorEl, message) {
  errorEl.textContent = message;
  errorEl.classList.add('visible');
  inputEl.closest('.form-group').classList.add('has-error');
}

function clearOfferError(inputEl, errorEl) {
  if (!inputEl || !errorEl) return;
  errorEl.textContent = '';
  errorEl.classList.remove('visible');
  inputEl.closest('.form-group').classList.remove('has-error');
}

function clearAllOfferErrors() {
  clearOfferError(aPrincipalInput, aPrincipalError);
  clearOfferError(aRateInput, aRateError);
  clearOfferError(aTermInput, aTermError);
  clearOfferError(bPrincipalInput, bPrincipalError);
  clearOfferError(bRateInput, bRateError);
  clearOfferError(bTermInput, bTermError);
}

// Real-time error clearing for comparison fields
attachClearOnInput(aPrincipalInput, aPrincipalError);
attachClearOnInput(aRateInput, aRateError);
attachClearOnInput(aTermInput, aTermError);
attachClearOnInput(bPrincipalInput, bPrincipalError);
attachClearOnInput(bRateInput, bRateError);
attachClearOnInput(bTermInput, bTermError);

function showOfferResults(monthly, interest, cost, monthlyEl, interestEl, costEl) {
  monthlyEl.textContent  = formatCurrency(monthly);
  interestEl.textContent = formatCurrency(interest);
  costEl.textContent     = formatCurrency(cost);
}

function clearOfferResults(monthlyEl, interestEl, costEl) {
  monthlyEl.textContent  = '--';
  interestEl.textContent = '--';
  costEl.textContent     = '--';
}

function showComparisonSummary(delta) {
  if (!delta) {
    summaryContent.classList.add('hidden');
    summaryPlaceholder.classList.remove('hidden');
    summaryPlaceholder.textContent = 'Enter valid values for both offers to compare.';
    return;
  }

  summaryPlaceholder.classList.add('hidden');
  summaryContent.classList.remove('hidden');

  // Monthly payment line
  if (delta.lowerMonthlyOffer === 'equal') {
    summaryMonthlyText.textContent = 'Both offers have the same monthly payment ($0.00 difference).';
    summaryMonthlyText.className   = 'summary-value equal';
  } else {
    const winner = delta.lowerMonthlyOffer;
    summaryMonthlyText.textContent =
      `Offer ${winner} saves ${formatCurrency(delta.monthlyPaymentDiff)} per month.`;
    summaryMonthlyText.className   = 'summary-value winner';
  }

  // Total interest line
  if (delta.lowerTotalInterestOffer === 'equal') {
    summaryInterestText.textContent = 'Both offers cost the same total interest ($0.00 difference).';
    summaryInterestText.className   = 'summary-value equal';
  } else {
    const winner = delta.lowerTotalInterestOffer;
    summaryInterestText.textContent =
      `Offer ${winner} saves ${formatCurrency(delta.totalInterestDiff)} in total interest.`;
    summaryInterestText.className   = 'summary-value winner';
  }
}

function clearComparisonSummary() {
  summaryContent.classList.add('hidden');
  summaryPlaceholder.classList.remove('hidden');
  summaryPlaceholder.textContent = 'Enter valid values for both offers to compare.';
}

function handleCompare() {
  clearAllOfferErrors();

  // Validate Offer A
  const valA = validateLoanInputs({
    principal:  aPrincipalInput.value.replace(/,/g, ''),
    annualRate: aRateInput.value,
    termMonths: aTermInput.value
  });

  if (!valA.isValid) {
    if (valA.errors.principal)  setOfferError(aPrincipalInput, aPrincipalError, valA.errors.principal);
    if (valA.errors.annualRate) setOfferError(aRateInput, aRateError, valA.errors.annualRate);
    if (valA.errors.termMonths) setOfferError(aTermInput, aTermError, valA.errors.termMonths);
  }

  // Validate Offer B (independently -- AC 4.2)
  const valB = validateLoanInputs({
    principal:  bPrincipalInput.value.replace(/,/g, ''),
    annualRate: bRateInput.value,
    termMonths: bTermInput.value
  });

  if (!valB.isValid) {
    if (valB.errors.principal)  setOfferError(bPrincipalInput, bPrincipalError, valB.errors.principal);
    if (valB.errors.annualRate) setOfferError(bRateInput, bRateError, valB.errors.annualRate);
    if (valB.errors.termMonths) setOfferError(bTermInput, bTermError, valB.errors.termMonths);
  }

  // Compute whichever offers are valid (AC 4.2: error isolation)
  const offerA = valA.isValid ? valA.values : null;
  const offerB = valB.isValid ? valB.values : null;

  const { resultA, resultB, delta } = compareLoans(
    offerA ? { principal: offerA.principal, annualRate: offerA.annualRate, termMonths: offerA.termMonths } : null,
    offerB ? { principal: offerB.principal, annualRate: offerB.annualRate, termMonths: offerB.termMonths } : null
  );

  if (resultA) {
    showOfferResults(resultA.monthlyPayment, resultA.totalInterest, resultA.totalCost,
      aMonthly, aInterest, aCost);
  } else {
    clearOfferResults(aMonthly, aInterest, aCost);
  }

  if (resultB) {
    showOfferResults(resultB.monthlyPayment, resultB.totalInterest, resultB.totalCost,
      bMonthly, bInterest, bCost);
  } else {
    clearOfferResults(bMonthly, bInterest, bCost);
  }

  showComparisonSummary(delta);
}

// Reset comparison (AC 5.2)
function handleCompareReset() {
  document.getElementById('offer-a-form').reset();
  document.getElementById('offer-b-form').reset();
  clearAllOfferErrors();
  clearOfferResults(aMonthly, aInterest, aCost);
  clearOfferResults(bMonthly, bInterest, bCost);
  clearComparisonSummary();
}

compareBtn.addEventListener('click', handleCompare);
compareResetBtn.addEventListener('click', handleCompareReset);
