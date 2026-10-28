/**
 * Pure calculation and validation logic for the Loan Calculator.
 * Contains no DOM or UI code.
 *
 * Rounding rule (applies to all loan types):
 *   Round monthly payment to cents.
 *   Total cost = monthly payment x months.
 *   Total interest = total cost - financed amount.
 */

/**
 * Parses a raw input string.
 * Returns a field-specific "required" message on empty,
 * or a generic "valid numeric value" message on non-numeric input.
 *
 * @param {string|number} rawValue
 * @param {string} fieldLabel  - used in "X is required" messages
 * @returns {{ valid: boolean, value?: number, error?: string }}
 */
function parseNumericInput(rawValue, fieldLabel) {
  if (rawValue === null || rawValue === undefined) {
    return { valid: false, error: `${fieldLabel} is required` };
  }
  const str = String(rawValue).trim();
  if (str === '') {
    return { valid: false, error: `${fieldLabel} is required` };
  }
  const num = Number(str);
  if (isNaN(num)) {
    return { valid: false, error: 'Please enter a valid numeric value' };
  }
  return { valid: true, value: num };
}

/**
 * Shared rate validator — identical rules for all three loan types.
 * Mutates the errors object passed in.
 */
function validateRate(annualRate, errors) {
  const parsed = parseNumericInput(annualRate, 'Interest rate quoted by your lender');
  if (!parsed.valid) {
    errors.annualRate = parsed.error;
  } else if (parsed.value < 0) {
    errors.annualRate = 'Interest rate cannot be negative';
  } else if (parsed.value > 100) {
    errors.annualRate = 'Interest rate must not exceed 100%';
  }
  return parsed;
}

/**
 * Shared term (months) validator — identical rules for all three loan types.
 * Mutates the errors object passed in.
 */
function validateTermMonths(termMonths, errors) {
  const parsed = parseNumericInput(termMonths, 'Loan term');
  if (!parsed.valid) {
    errors.termMonths = parsed.error;
  } else if (parsed.value < 1) {
    errors.termMonths = 'Term must be at least 1 month';
  } else if (parsed.value > 480) {
    errors.termMonths = 'Term must not exceed 480 months (40 years)';
  }
  return parsed;
}

// ---------------------------------------------------------------------------
// Personal Loan
// ---------------------------------------------------------------------------

/**
 * Validates Personal loan inputs.
 *
 * @param {{ principal: string|number, annualRate: string|number, termMonths: string|number }} params
 * @returns {{ isValid: boolean, errors: Object, values?: { principal: number, annualRate: number, termMonths: number } }}
 */
export function validateLoanInputs({ principal, annualRate, termMonths }) {
  const errors = {};

  const parsedPrincipal = parseNumericInput(principal, 'Loan amount');
  if (!parsedPrincipal.valid) {
    errors.principal = parsedPrincipal.error;
  } else if (parsedPrincipal.value <= 0) {
    errors.principal = 'Loan amount must be greater than 0';
  }

  const parsedRate = validateRate(annualRate, errors);
  const parsedTerm = validateTermMonths(termMonths, errors);

  const isValid = Object.keys(errors).length === 0;
  return {
    isValid,
    errors,
    values: isValid
      ? {
          principal: parsedPrincipal.value,
          annualRate: parsedRate.value,
          termMonths: Math.round(parsedTerm.value)
        }
      : undefined
  };
}

// ---------------------------------------------------------------------------
// Car Loan
// ---------------------------------------------------------------------------

/**
 * Validates Car loan inputs.
 * Financed amount = vehiclePrice x (1 - downPaymentPct / 100).
 * Down payment of 0% is valid (full financing). 100% or above is rejected.
 *
 * @param {{ vehiclePrice: string|number, downPaymentPct: string|number, annualRate: string|number, termMonths: string|number }} params
 * @returns {{ isValid: boolean, errors: Object, values?: { vehiclePrice: number, downPaymentPct: number, financedAmount: number, annualRate: number, termMonths: number } }}
 */
export function validateCarLoanInputs({ vehiclePrice, downPaymentPct, annualRate, termMonths }) {
  const errors = {};

  const parsedPrice = parseNumericInput(vehiclePrice, 'Vehicle price');
  if (!parsedPrice.valid) {
    errors.vehiclePrice = parsedPrice.error;
  } else if (parsedPrice.value <= 0) {
    errors.vehiclePrice = 'Vehicle price must be greater than 0';
  }

  const parsedDown = parseNumericInput(downPaymentPct, 'Down payment percentage');
  if (!parsedDown.valid) {
    errors.downPaymentPct = parsedDown.error;
  } else if (parsedDown.value < 0) {
    errors.downPaymentPct = 'Down payment percentage cannot be negative';
  } else if (parsedDown.value >= 100) {
    errors.downPaymentPct = 'Down payment percentage must be less than 100%';
  }

  const parsedRate = validateRate(annualRate, errors);
  const parsedTerm = validateTermMonths(termMonths, errors);

  const isValid = Object.keys(errors).length === 0;
  if (!isValid) return { isValid, errors };

  const financedAmount = Math.round(parsedPrice.value * (1 - parsedDown.value / 100) * 100) / 100;
  return {
    isValid,
    errors,
    values: {
      vehiclePrice: parsedPrice.value,
      downPaymentPct: parsedDown.value,
      financedAmount,
      annualRate: parsedRate.value,
      termMonths: Math.round(parsedTerm.value)
    }
  };
}

// ---------------------------------------------------------------------------
// Home Loan
// ---------------------------------------------------------------------------

/**
 * Validates Home loan inputs.
 * Term is entered in years; converted to whole months by rounding.
 *
 * @param {{ propertyPrice: string|number, financingAmount: string|number, annualRate: string|number, termYears: string|number }} params
 * @returns {{ isValid: boolean, errors: Object, values?: { propertyPrice: number, financingAmount: number, annualRate: number, termMonths: number } }}
 */
export function validateHomeLoanInputs({ propertyPrice, financingAmount, annualRate, termYears }) {
  const errors = {};

  const parsedProperty = parseNumericInput(propertyPrice, 'Property price');
  if (!parsedProperty.valid) {
    errors.propertyPrice = parsedProperty.error;
  } else if (parsedProperty.value <= 0) {
    errors.propertyPrice = 'Property price must be greater than 0';
  }

  const parsedFinancing = parseNumericInput(financingAmount, 'Desired financing amount');
  if (!parsedFinancing.valid) {
    errors.financingAmount = parsedFinancing.error;
  } else if (parsedFinancing.value <= 0) {
    errors.financingAmount = 'Financing amount must be greater than 0';
  } else if (parsedProperty.valid && parsedProperty.value > 0 && parsedFinancing.value > parsedProperty.value) {
    errors.financingAmount = 'Financing amount cannot exceed property price';
  }

  const parsedRate = validateRate(annualRate, errors);

  // Term entered in years; convert to whole months
  const parsedYears = parseNumericInput(termYears, 'Loan term');
  let termMonthsValue;
  if (!parsedYears.valid) {
    errors.termYears = parsedYears.error;
  } else {
    termMonthsValue = Math.round(parsedYears.value * 12);
    if (termMonthsValue < 1) {
      errors.termYears = 'Term must be at least 1 month';
    } else if (termMonthsValue > 480) {
      errors.termYears = 'Term must not exceed 480 months (40 years)';
    }
  }

  const isValid = Object.keys(errors).length === 0;
  if (!isValid) return { isValid, errors };

  return {
    isValid,
    errors,
    values: {
      propertyPrice: parsedProperty.value,
      financingAmount: parsedFinancing.value,
      annualRate: parsedRate.value,
      termMonths: termMonthsValue
    }
  };
}

// ---------------------------------------------------------------------------
// Calculation (shared by all loan types)
// ---------------------------------------------------------------------------

/**
 * Calculates monthly payment, total cost, and total interest.
 * The principal passed here is always the financed amount
 * (for Car: vehiclePrice x (1 - downPaymentPct); for Home: financingAmount).
 *
 * @param {number} principal  - financed amount
 * @param {number} annualRate - annual rate in percent, e.g. 6.0 for 6%
 * @param {number} termMonths - whole number of months >= 1
 * @returns {{ monthlyPayment: number, totalCost: number, totalInterest: number }}
 */
export function calculateLoan(principal, annualRate, termMonths) {
  let monthlyPayment;

  if (annualRate === 0) {
    monthlyPayment = principal / termMonths;
  } else {
    const monthlyRate = (annualRate / 100) / 12;
    const compound = Math.pow(1 + monthlyRate, termMonths);
    monthlyPayment = (principal * (monthlyRate * compound)) / (compound - 1);
  }

  const roundedMonthlyPayment = Math.round(monthlyPayment * 100) / 100;
  const totalCost = Math.round(roundedMonthlyPayment * termMonths * 100) / 100;
  const totalInterest = Math.round((totalCost - principal) * 100) / 100;

  return {
    monthlyPayment: roundedMonthlyPayment,
    totalCost,
    totalInterest
  };
}

// ---------------------------------------------------------------------------
// Comparison (S-4)
// ---------------------------------------------------------------------------

/**
 * Converts a term value between years and months units.
 * Used by S-3 toggle and comparison logic.
 *
 * @param {number} value - the numeric value in the current unit
 * @param {'months'|'years'} fromUnit
 * @param {'months'|'years'} toUnit
 * @returns {number} converted value (raw, not rounded for display)
 */
export function convertTermUnit(value, fromUnit, toUnit) {
  if (fromUnit === toUnit) return value;
  if (fromUnit === 'months' && toUnit === 'years') return value / 12;
  return Math.round(value * 12); // years -> months: round to nearest whole month
}

/**
 * Compares two loan offers and returns per-offer results plus delta summary.
 * Each offer is described by { principal, annualRate, termMonths }.
 * If either offer is invalid, that offer's result is null and the delta is null.
 *
 * @param {{ principal: number, annualRate: number, termMonths: number }} offerA
 * @param {{ principal: number, annualRate: number, termMonths: number }} offerB
 * @returns {{
 *   resultA: { monthlyPayment, totalCost, totalInterest } | null,
 *   resultB: { monthlyPayment, totalCost, totalInterest } | null,
 *   delta: {
 *     monthlyPaymentDiff: number,
 *     totalInterestDiff: number,
 *     lowerMonthlyOffer: 'A'|'B'|'equal',
 *     lowerTotalInterestOffer: 'A'|'B'|'equal'
 *   } | null
 * }}
 */
export function compareLoans(offerA, offerB) {
  const resultA = offerA
    ? calculateLoan(offerA.principal, offerA.annualRate, offerA.termMonths)
    : null;
  const resultB = offerB
    ? calculateLoan(offerB.principal, offerB.annualRate, offerB.termMonths)
    : null;

  let delta = null;
  if (resultA && resultB) {
    const monthlyDiff = Math.round(Math.abs(resultA.monthlyPayment - resultB.monthlyPayment) * 100) / 100;
    const interestDiff = Math.round(Math.abs(resultA.totalInterest - resultB.totalInterest) * 100) / 100;

    let lowerMonthly;
    if (resultA.monthlyPayment < resultB.monthlyPayment) lowerMonthly = 'A';
    else if (resultB.monthlyPayment < resultA.monthlyPayment) lowerMonthly = 'B';
    else lowerMonthly = 'equal';

    let lowerInterest;
    if (resultA.totalInterest < resultB.totalInterest) lowerInterest = 'A';
    else if (resultB.totalInterest < resultA.totalInterest) lowerInterest = 'B';
    else lowerInterest = 'equal';

    delta = {
      monthlyPaymentDiff: monthlyDiff,
      totalInterestDiff: interestDiff,
      lowerMonthlyOffer: lowerMonthly,
      lowerTotalInterestOffer: lowerInterest
    };
  }

  return { resultA, resultB, delta };
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

/**
 * Formats a number as USD currency with commas and 2 decimal places.
 * e.g. 482196.6 -> "$482,196.60"
 *
 * @param {number} amount
 * @returns {string}
 */
export function formatCurrency(amount) {
  return '$' + amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}
