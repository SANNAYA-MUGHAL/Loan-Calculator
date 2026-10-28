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
// Mode Navigation (Single Calculator vs Compare Offers)
// ---------------------------------------------------------------------------
const modeCalculateBtn  = document.getElementById('mode-calculate-btn');
const modeCompareBtn    = document.getElementById('mode-compare-btn');
const singleCalcSection = document.getElementById('single-calc-section');
const comparisonSection = document.getElementById('comparison-section');

let currentMode = 'calculate'; // 'calculate' | 'compare'

function switchMode(newMode) {
  currentMode = newMode;
  modeCalculateBtn.classList.toggle('active', newMode === 'calculate');
  modeCalculateBtn.setAttribute('aria-selected', newMode === 'calculate');
  modeCompareBtn.classList.toggle('active', newMode === 'compare');
  modeCompareBtn.setAttribute('aria-selected', newMode === 'compare');

  singleCalcSection.classList.toggle('hidden', newMode !== 'calculate');
  comparisonSection.classList.toggle('hidden', newMode !== 'compare');
}

modeCalculateBtn.addEventListener('click', () => switchMode('calculate'));
modeCompareBtn.addEventListener('click', () => switchMode('compare'));

// ---------------------------------------------------------------------------
// DOM references -- Single Loan Calculator
// ---------------------------------------------------------------------------
const loanForm         = document.getElementById('loan-form');
const resetBtn         = document.getElementById('reset-btn');
const singleTypeBtns   = document.querySelectorAll('#single-type-selector .type-btn');

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
const toggleMonthsBtn  = document.getElementById('toggle-months');
const toggleYearsBtn   = document.getElementById('toggle-years');

// Category inputs
const principalInput       = document.getElementById('principal');
const vehiclePriceInput    = document.getElementById('vehiclePrice');
const downPaymentPctInput  = document.getElementById('downPaymentPct');
const propertyPriceInput   = document.getElementById('propertyPrice');
const financingAmountInput = document.getElementById('financingAmount');

// Error elements
const principalError       = document.getElementById('principal-error');
const vehiclePriceError    = document.getElementById('vehiclePrice-error');
const downPaymentPctError  = document.getElementById('downPaymentPct-error');
const propertyPriceError   = document.getElementById('propertyPrice-error');
const financingAmountError = document.getElementById('financingAmount-error');
const annualRateError      = document.getElementById('annualRate-error');
const termError            = document.getElementById('term-error');

// Result elements
const financedAmountRow    = document.getElementById('financed-amount-row');
const resultFinancedAmount = document.getElementById('result-financed-amount');
const resultMonthlyPayment = document.getElementById('result-monthly-payment');
const resultTotalInterest  = document.getElementById('result-total-interest');
const resultTotalCost      = document.getElementById('result-total-cost');

let singleCurrentType = 'personal'; // 'personal' | 'car' | 'home'
let singleTermUnit    = 'months';   // 'months' | 'years'

// ---------------------------------------------------------------------------
// Helper: Error management
// ---------------------------------------------------------------------------
function setFieldError(inputEl, errorEl, message) {
  if (!errorEl || !inputEl) return;
  errorEl.textContent = message;
  errorEl.classList.add('visible');
  const group = inputEl.closest('.form-group');
  if (group) group.classList.add('has-error');
}

function clearFieldError(inputEl, errorEl) {
  if (!errorEl || !inputEl) return;
  errorEl.textContent = '';
  errorEl.classList.remove('visible');
  const group = inputEl.closest('.form-group');
  if (group) group.classList.remove('has-error');
}

function attachClearOnInput(inputEl, errorEl) {
  if (inputEl && errorEl) {
    inputEl.addEventListener('input', () => clearFieldError(inputEl, errorEl));
  }
}

// Single calc input error attachments
attachClearOnInput(principalInput, principalError);
attachClearOnInput(vehiclePriceInput, vehiclePriceError);
attachClearOnInput(downPaymentPctInput, downPaymentPctError);
attachClearOnInput(propertyPriceInput, propertyPriceError);
attachClearOnInput(financingAmountInput, financingAmountError);
attachClearOnInput(annualRateInput, annualRateError);
attachClearOnInput(termInput, termError);

function clearAllSingleErrors() {
  clearFieldError(principalInput, principalError);
  clearFieldError(vehiclePriceInput, vehiclePriceError);
  clearFieldError(downPaymentPctInput, downPaymentPctError);
  clearFieldError(propertyPriceInput, propertyPriceError);
  clearFieldError(financingAmountInput, financingAmountError);
  clearFieldError(annualRateInput, annualRateError);
  clearFieldError(termInput, termError);
}

// ---------------------------------------------------------------------------
// Single Calculator: Results
// ---------------------------------------------------------------------------
function showSingleResults(result, financedAmount = null) {
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

function clearSingleResults() {
  resultMonthlyPayment.textContent = '--';
  resultTotalInterest.textContent  = '--';
  resultTotalCost.textContent      = '--';
  financedAmountRow.classList.add('hidden');
}

// ---------------------------------------------------------------------------
// Single Calculator: Term Unit Toggle (Months / Years)
// ---------------------------------------------------------------------------
function applySingleTermUnit(unit) {
  singleTermUnit = unit;
  toggleMonthsBtn.classList.toggle('active', unit === 'months');
  toggleYearsBtn.classList.toggle('active', unit === 'years');
  termUnit.textContent = unit;

  if (unit === 'years') {
    termLabel.textContent = 'Loan Term (Years)';
    termHint.textContent  = 'Enter duration in years. Fractional years allowed; rounded to nearest month.';
    termInput.placeholder = 'Enter duration in years (e.g. 5)';
  } else {
    termLabel.textContent = 'Loan Term (Months)';
    termHint.textContent  = 'Enter the total duration of the loan in months.';
    termInput.placeholder = 'Enter duration in months (e.g. 36)';
  }
}

function onToggleSingleTerm(newUnit) {
  if (newUnit === singleTermUnit) return;
  const raw = termInput.value.trim();
  if (raw !== '') {
    const num = Number(raw);
    if (!isNaN(num)) {
      const converted = convertTermUnit(num, singleTermUnit, newUnit);
      termInput.value = newUnit === 'years'
        ? parseFloat(converted.toFixed(10)).toString()
        : String(converted);
    }
  }
  clearFieldError(termInput, termError);
  applySingleTermUnit(newUnit);
}

toggleMonthsBtn.addEventListener('click', () => onToggleSingleTerm('months'));
toggleYearsBtn.addEventListener('click',  () => onToggleSingleTerm('years'));

// ---------------------------------------------------------------------------
// Single Calculator: Category Switching (AC 9.1, AC 9.8)
// ---------------------------------------------------------------------------
function switchSingleType(type) {
  singleCurrentType = type;
  singleTypeBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.type === type));

  fieldsPersonal.classList.toggle('hidden', type !== 'personal');
  fieldsCar.classList.toggle('hidden', type !== 'car');
  fieldsHome.classList.toggle('hidden', type !== 'home');

  if (type === 'home') {
    applySingleTermUnit('years');
  } else {
    applySingleTermUnit('months');
  }

  loanForm.reset();
  clearAllSingleErrors();
  clearSingleResults();
}

singleTypeBtns.forEach(btn => {
  btn.addEventListener('click', () => switchSingleType(btn.dataset.type));
});

// ---------------------------------------------------------------------------
// Single Calculator: Calculation
// ---------------------------------------------------------------------------
function getSingleTermMonths() {
  const raw = termInput.value.trim();
  if (singleTermUnit === 'years') {
    const num = Number(raw);
    if (!isNaN(num) && raw !== '') {
      return String(convertTermUnit(num, 'years', 'months'));
    }
    return raw;
  }
  return termInput.value;
}

function handleSingleCalculate(e) {
  e.preventDefault();
  clearAllSingleErrors();

  const rate = annualRateInput.value;
  let validation;

  if (singleCurrentType === 'personal') {
    validation = validateLoanInputs({
      principal:  principalInput.value.replace(/,/g, ''),
      annualRate: rate,
      termMonths: getSingleTermMonths()
    });

    if (!validation.isValid) {
      clearSingleResults();
      if (validation.errors.principal)  setFieldError(principalInput, principalError, validation.errors.principal);
      if (validation.errors.annualRate) setFieldError(annualRateInput, annualRateError, validation.errors.annualRate);
      if (validation.errors.termMonths) setFieldError(termInput, termError, validation.errors.termMonths);
      return;
    }

    const { principal, annualRate, termMonths } = validation.values;
    showSingleResults(calculateLoan(principal, annualRate, termMonths));

  } else if (singleCurrentType === 'car') {
    validation = validateCarLoanInputs({
      vehiclePrice:   vehiclePriceInput.value.replace(/,/g, ''),
      downPaymentPct: downPaymentPctInput.value,
      annualRate:     rate,
      termMonths:     getSingleTermMonths()
    });

    if (!validation.isValid) {
      clearSingleResults();
      if (validation.errors.vehiclePrice)   setFieldError(vehiclePriceInput, vehiclePriceError, validation.errors.vehiclePrice);
      if (validation.errors.downPaymentPct) setFieldError(downPaymentPctInput, downPaymentPctError, validation.errors.downPaymentPct);
      if (validation.errors.annualRate)     setFieldError(annualRateInput, annualRateError, validation.errors.annualRate);
      if (validation.errors.termMonths)     setFieldError(termInput, termError, validation.errors.termMonths);
      return;
    }

    const { financedAmount, annualRate, termMonths } = validation.values;
    showSingleResults(calculateLoan(financedAmount, annualRate, termMonths), financedAmount);

  } else {
    // home
    validation = validateHomeLoanInputs({
      propertyPrice:   propertyPriceInput.value.replace(/,/g, ''),
      financingAmount: financingAmountInput.value.replace(/,/g, ''),
      annualRate:      rate,
      termMonths:      getSingleTermMonths()
    });

    if (!validation.isValid) {
      clearSingleResults();
      if (validation.errors.propertyPrice)   setFieldError(propertyPriceInput, propertyPriceError, validation.errors.propertyPrice);
      if (validation.errors.financingAmount) setFieldError(financingAmountInput, financingAmountError, validation.errors.financingAmount);
      if (validation.errors.annualRate)      setFieldError(annualRateInput, annualRateError, validation.errors.annualRate);
      if (validation.errors.termYears || validation.errors.termMonths) {
        setFieldError(termInput, termError, validation.errors.termYears || validation.errors.termMonths);
      }
      return;
    }

    const { financingAmount, annualRate, termMonths } = validation.values;
    showSingleResults(calculateLoan(financingAmount, annualRate, termMonths));
  }
}

function handleSingleReset() {
  loanForm.reset();
  clearAllSingleErrors();
  clearSingleResults();
  if (singleCurrentType === 'home') {
    applySingleTermUnit('years');
  } else {
    applySingleTermUnit('months');
  }
}

loanForm.addEventListener('submit', handleSingleCalculate);
resetBtn.addEventListener('click', handleSingleReset);

// ===========================================================================
// SECTION 2: Loan Comparison (Personal, Car, Home)
// ===========================================================================
const compareTypeBtns = document.querySelectorAll('#comparison-type-selector .compare-type-btn');
const compareBtn      = document.getElementById('compare-btn');
const compareResetBtn = document.getElementById('compare-reset-btn');

let compareCurrentType = 'personal'; // 'personal' | 'car' | 'home'
let aTermUnit          = 'months';   // 'months' | 'years'
let bTermUnit          = 'months';   // 'months' | 'years'

// Offer A DOM elements
const aFieldsPersonal = document.getElementById('a-fields-personal');
const aFieldsCar      = document.getElementById('a-fields-car');
const aFieldsHome     = document.getElementById('a-fields-home');
const aPrincipalInput = document.getElementById('a-principal');
const aVehicleInput   = document.getElementById('a-vehiclePrice');
const aDownInput      = document.getElementById('a-downPaymentPct');
const aPropertyInput  = document.getElementById('a-propertyPrice');
const aFinancingInput = document.getElementById('a-financingAmount');
const aRateInput      = document.getElementById('a-rate');
const aTermInput      = document.getElementById('a-term');
const aTermLabel      = document.getElementById('a-term-label');
const aTermUnitEl     = document.getElementById('a-term-unit');
const aToggleMonths   = document.getElementById('a-toggle-months');
const aToggleYears    = document.getElementById('a-toggle-years');

const aPrincipalError = document.getElementById('a-principal-error');
const aVehicleError   = document.getElementById('a-vehiclePrice-error');
const aDownError      = document.getElementById('a-downPaymentPct-error');
const aPropertyError  = document.getElementById('a-propertyPrice-error');
const aFinancingError = document.getElementById('a-financingAmount-error');
const aRateError      = document.getElementById('a-rate-error');
const aTermError      = document.getElementById('a-term-error');

const aFinancedRow    = document.getElementById('a-financed-row');
const aFinancedVal    = document.getElementById('a-financed');
const aMonthlyVal     = document.getElementById('a-monthly');
const aInterestVal    = document.getElementById('a-interest');
const aCostVal        = document.getElementById('a-cost');

// Offer B DOM elements
const bFieldsPersonal = document.getElementById('b-fields-personal');
const bFieldsCar      = document.getElementById('b-fields-car');
const bFieldsHome     = document.getElementById('b-fields-home');
const bPrincipalInput = document.getElementById('b-principal');
const bVehicleInput   = document.getElementById('b-vehiclePrice');
const bDownInput      = document.getElementById('b-downPaymentPct');
const bPropertyInput  = document.getElementById('b-propertyPrice');
const bFinancingInput = document.getElementById('b-financingAmount');
const bRateInput      = document.getElementById('b-rate');
const bTermInput      = document.getElementById('b-term');
const bTermLabel      = document.getElementById('b-term-label');
const bTermUnitEl     = document.getElementById('b-term-unit');
const bToggleMonths   = document.getElementById('b-toggle-months');
const bToggleYears    = document.getElementById('b-toggle-years');

const bPrincipalError = document.getElementById('b-principal-error');
const bVehicleError   = document.getElementById('b-vehiclePrice-error');
const bDownError      = document.getElementById('b-downPaymentPct-error');
const bPropertyError  = document.getElementById('b-propertyPrice-error');
const bFinancingError = document.getElementById('b-financingAmount-error');
const bRateError      = document.getElementById('b-rate-error');
const bTermError      = document.getElementById('b-term-error');

const bFinancedRow    = document.getElementById('b-financed-row');
const bFinancedVal    = document.getElementById('b-financed');
const bMonthlyVal     = document.getElementById('b-monthly');
const bInterestVal    = document.getElementById('b-interest');
const bCostVal        = document.getElementById('b-cost');

// Comparison Summary elements
const summaryPlaceholder  = document.getElementById('summary-placeholder');
const summaryContent      = document.getElementById('summary-content');
const summaryMonthlyText  = document.getElementById('summary-monthly-text');
const summaryInterestText = document.getElementById('summary-interest-text');

// Attach error clearing for comparison fields
[
  [aPrincipalInput, aPrincipalError],
  [aVehicleInput, aVehicleError],
  [aDownInput, aDownError],
  [aPropertyInput, aPropertyError],
  [aFinancingInput, aFinancingError],
  [aRateInput, aRateError],
  [aTermInput, aTermError],
  [bPrincipalInput, bPrincipalError],
  [bVehicleInput, bVehicleError],
  [bDownInput, bDownError],
  [bPropertyInput, bPropertyError],
  [bFinancingInput, bFinancingError],
  [bRateInput, bRateError],
  [bTermInput, bTermError]
].forEach(([input, err]) => attachClearOnInput(input, err));

function clearAllCompareErrors() {
  [
    [aPrincipalInput, aPrincipalError],
    [aVehicleInput, aVehicleError],
    [aDownInput, aDownError],
    [aPropertyInput, aPropertyError],
    [aFinancingInput, aFinancingError],
    [aRateInput, aRateError],
    [aTermInput, aTermError],
    [bPrincipalInput, bPrincipalError],
    [bVehicleInput, bVehicleError],
    [bDownInput, bDownError],
    [bPropertyInput, bPropertyError],
    [bFinancingInput, bFinancingError],
    [bRateInput, bRateError],
    [bTermInput, bTermError]
  ].forEach(([input, err]) => clearFieldError(input, err));
}

// ---------------------------------------------------------------------------
// Comparison: Term Unit Toggles for Offer A and Offer B
// ---------------------------------------------------------------------------
function applyOfferTermUnit(offer, unit) {
  if (offer === 'A') {
    aTermUnit = unit;
    aToggleMonths.classList.toggle('active', unit === 'months');
    aToggleYears.classList.toggle('active', unit === 'years');
    aTermUnitEl.textContent = unit;
    aTermLabel.textContent = unit === 'years' ? 'Loan Term (Years)' : 'Loan Term (Months)';
    aTermInput.placeholder = unit === 'years' ? 'e.g. 5' : 'e.g. 36';
  } else {
    bTermUnit = unit;
    bToggleMonths.classList.toggle('active', unit === 'months');
    bToggleYears.classList.toggle('active', unit === 'years');
    bTermUnitEl.textContent = unit;
    bTermLabel.textContent = unit === 'years' ? 'Loan Term (Years)' : 'Loan Term (Months)';
    bTermInput.placeholder = unit === 'years' ? 'e.g. 5' : 'e.g. 48';
  }
}

function onToggleOfferTerm(offer, newUnit) {
  const currentUnit = offer === 'A' ? aTermUnit : bTermUnit;
  const inputEl     = offer === 'A' ? aTermInput : bTermInput;
  const errorEl     = offer === 'A' ? aTermError : bTermError;

  if (newUnit === currentUnit) return;
  const raw = inputEl.value.trim();
  if (raw !== '') {
    const num = Number(raw);
    if (!isNaN(num)) {
      const converted = convertTermUnit(num, currentUnit, newUnit);
      inputEl.value = newUnit === 'years'
        ? parseFloat(converted.toFixed(10)).toString()
        : String(converted);
    }
  }
  clearFieldError(inputEl, errorEl);
  applyOfferTermUnit(offer, newUnit);
}

aToggleMonths.addEventListener('click', () => onToggleOfferTerm('A', 'months'));
aToggleYears.addEventListener('click',  () => onToggleOfferTerm('A', 'years'));
bToggleMonths.addEventListener('click', () => onToggleOfferTerm('B', 'months'));
bToggleYears.addEventListener('click',  () => onToggleOfferTerm('B', 'years'));

// ---------------------------------------------------------------------------
// Comparison: Category Switching (Personal / Car / Home)
// ---------------------------------------------------------------------------
function switchCompareType(type) {
  compareCurrentType = type;
  compareTypeBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.type === type));

  // Offer A fields
  aFieldsPersonal.classList.toggle('hidden', type !== 'personal');
  aFieldsCar.classList.toggle('hidden', type !== 'car');
  aFieldsHome.classList.toggle('hidden', type !== 'home');

  // Offer B fields
  bFieldsPersonal.classList.toggle('hidden', type !== 'personal');
  bFieldsCar.classList.toggle('hidden', type !== 'car');
  bFieldsHome.classList.toggle('hidden', type !== 'home');

  // Default unit: Home defaults to years, Personal/Car to months
  const defaultUnit = type === 'home' ? 'years' : 'months';
  applyOfferTermUnit('A', defaultUnit);
  applyOfferTermUnit('B', defaultUnit);

  handleCompareReset();
}

compareTypeBtns.forEach(btn => {
  btn.addEventListener('click', () => switchCompareType(btn.dataset.type));
});

// ---------------------------------------------------------------------------
// Comparison: Results display
// ---------------------------------------------------------------------------
function showOfferResult(prefix, result, financedAmount = null) {
  const monthlyEl  = prefix === 'A' ? aMonthlyVal : bMonthlyVal;
  const interestEl = prefix === 'A' ? aInterestVal : bInterestVal;
  const costEl     = prefix === 'A' ? aCostVal : bCostVal;
  const finRow     = prefix === 'A' ? aFinancedRow : bFinancedRow;
  const finVal     = prefix === 'A' ? aFinancedVal : bFinancedVal;

  if (result) {
    monthlyEl.textContent  = formatCurrency(result.monthlyPayment);
    interestEl.textContent = formatCurrency(result.totalInterest);
    costEl.textContent     = formatCurrency(result.totalCost);

    if (financedAmount !== null) {
      finVal.textContent = formatCurrency(financedAmount);
      finRow.classList.remove('hidden');
    } else {
      finRow.classList.add('hidden');
    }
  } else {
    monthlyEl.textContent  = '--';
    interestEl.textContent = '--';
    costEl.textContent     = '--';
    finRow.classList.add('hidden');
  }
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

  // Monthly payment delta
  if (delta.lowerMonthlyOffer === 'equal') {
    summaryMonthlyText.textContent = 'Both offers have the same monthly payment ($0.00 difference).';
    summaryMonthlyText.className   = 'summary-value equal';
  } else {
    const winner = delta.lowerMonthlyOffer;
    summaryMonthlyText.textContent =
      `Offer ${winner} saves ${formatCurrency(delta.monthlyPaymentDiff)} per month.`;
    summaryMonthlyText.className   = 'summary-value winner';
  }

  // Total interest delta
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

// ---------------------------------------------------------------------------
// Comparison: Execution
// ---------------------------------------------------------------------------
function getOfferTermMonths(prefix) {
  const inputEl = prefix === 'A' ? aTermInput : bTermInput;
  const unit    = prefix === 'A' ? aTermUnit : bTermUnit;
  const raw     = inputEl.value.trim();
  if (unit === 'years') {
    const num = Number(raw);
    if (!isNaN(num) && raw !== '') {
      return String(convertTermUnit(num, 'years', 'months'));
    }
    return raw;
  }
  return inputEl.value;
}

function validateOffer(prefix) {
  const termMonths = getOfferTermMonths(prefix);

  if (compareCurrentType === 'personal') {
    const princEl = prefix === 'A' ? aPrincipalInput : bPrincipalInput;
    const rateEl  = prefix === 'A' ? aRateInput : bRateInput;
    const errP    = prefix === 'A' ? aPrincipalError : bPrincipalError;
    const errR    = prefix === 'A' ? aRateError : bRateError;
    const errT    = prefix === 'A' ? aTermError : bTermError;

    const val = validateLoanInputs({
      principal:  princEl.value.replace(/,/g, ''),
      annualRate: rateEl.value,
      termMonths
    });

    if (!val.isValid) {
      if (val.errors.principal)  setFieldError(princEl, errP, val.errors.principal);
      if (val.errors.annualRate) setFieldError(rateEl, errR, val.errors.annualRate);
      if (val.errors.termMonths) setFieldError(prefix === 'A' ? aTermInput : bTermInput, errT, val.errors.termMonths);
      return null;
    }
    return { principal: val.values.principal, annualRate: val.values.annualRate, termMonths: val.values.termMonths, financedAmount: null };

  } else if (compareCurrentType === 'car') {
    const vehEl  = prefix === 'A' ? aVehicleInput : bVehicleInput;
    const downEl = prefix === 'A' ? aDownInput : bDownInput;
    const rateEl = prefix === 'A' ? aRateInput : bRateInput;
    const errV   = prefix === 'A' ? aVehicleError : bVehicleError;
    const errD   = prefix === 'A' ? aDownError : bDownError;
    const errR   = prefix === 'A' ? aRateError : bRateError;
    const errT   = prefix === 'A' ? aTermError : bTermError;

    const val = validateCarLoanInputs({
      vehiclePrice:   vehEl.value.replace(/,/g, ''),
      downPaymentPct: downEl.value,
      annualRate:     rateEl.value,
      termMonths
    });

    if (!val.isValid) {
      if (val.errors.vehiclePrice)   setFieldError(vehEl, errV, val.errors.vehiclePrice);
      if (val.errors.downPaymentPct) setFieldError(downEl, errD, val.errors.downPaymentPct);
      if (val.errors.annualRate)     setFieldError(rateEl, errR, val.errors.annualRate);
      if (val.errors.termMonths)     setFieldError(prefix === 'A' ? aTermInput : bTermInput, errT, val.errors.termMonths);
      return null;
    }
    return { principal: val.values.financedAmount, annualRate: val.values.annualRate, termMonths: val.values.termMonths, financedAmount: val.values.financedAmount };

  } else {
    // home
    const propEl = prefix === 'A' ? aPropertyInput : bPropertyInput;
    const finEl  = prefix === 'A' ? aFinancingInput : bFinancingInput;
    const rateEl = prefix === 'A' ? aRateInput : bRateInput;
    const errPr  = prefix === 'A' ? aPropertyError : bPropertyError;
    const errFi  = prefix === 'A' ? aFinancingError : bFinancingError;
    const errR   = prefix === 'A' ? aRateError : bRateError;
    const errT   = prefix === 'A' ? aTermError : bTermError;

    const val = validateHomeLoanInputs({
      propertyPrice:   propEl.value.replace(/,/g, ''),
      financingAmount: finEl.value.replace(/,/g, ''),
      annualRate:      rateEl.value,
      termMonths
    });

    if (!val.isValid) {
      if (val.errors.propertyPrice)   setFieldError(propEl, errPr, val.errors.propertyPrice);
      if (val.errors.financingAmount) setFieldError(finEl, errFi, val.errors.financingAmount);
      if (val.errors.annualRate)      setFieldError(rateEl, errR, val.errors.annualRate);
      if (val.errors.termYears || val.errors.termMonths) {
        setFieldError(prefix === 'A' ? aTermInput : bTermInput, errT, val.errors.termYears || val.errors.termMonths);
      }
      return null;
    }
    return { principal: val.values.financingAmount, annualRate: val.values.annualRate, termMonths: val.values.termMonths, financedAmount: null };
  }
}

function handleCompare() {
  clearAllCompareErrors();

  const offerA = validateOffer('A');
  const offerB = validateOffer('B');

  // S-4 AC 4.2: Error isolation -- evaluate each valid offer independently
  const { resultA, resultB, delta } = compareLoans(offerA, offerB);

  showOfferResult('A', resultA, offerA ? offerA.financedAmount : null);
  showOfferResult('B', resultB, offerB ? offerB.financedAmount : null);
  showComparisonSummary(delta);
}

function handleCompareReset() {
  document.getElementById('offer-a-form').reset();
  document.getElementById('offer-b-form').reset();
  clearAllCompareErrors();
  showOfferResult('A', null);
  showOfferResult('B', null);
  showComparisonSummary(null);

  const defaultUnit = compareCurrentType === 'home' ? 'years' : 'months';
  applyOfferTermUnit('A', defaultUnit);
  applyOfferTermUnit('B', defaultUnit);
}

compareBtn.addEventListener('click', handleCompare);
compareResetBtn.addEventListener('click', handleCompareReset);
