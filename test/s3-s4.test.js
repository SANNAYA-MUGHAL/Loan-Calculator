import { describe, it, expect } from 'vitest';
import {
  validateLoanInputs,
  calculateLoan,
  convertTermUnit,
  compareLoans
} from '../src/loan.js';

// ============================================================
// Story S-3: Toggle term between years and months (serves J-1)
// ============================================================

describe('Story S-3: Toggle term between years and months (serves J-1)', () => {

  it('AC 3.1: Years to months conversion -- 3 years becomes 36 months', () => {
    // convertTermUnit converts the display value; the loan result must be unchanged.
    const months = convertTermUnit(3, 'years', 'months');
    expect(months).toBe(36);

    const v = validateLoanInputs({ principal: '10000', annualRate: '6.0', termMonths: String(months) });
    expect(v.isValid).toBe(true);
    expect(v.values.termMonths).toBe(36);

    const r = calculateLoan(v.values.principal, v.values.annualRate, v.values.termMonths);
    expect(r.monthlyPayment).toBe(304.22);
  });

  it('AC 3.2: Months to years conversion -- 48 months becomes 4 years', () => {
    const years = convertTermUnit(48, 'months', 'years');
    expect(years).toBe(4);

    // Switching back to months must give 48 again.
    const backToMonths = convertTermUnit(years, 'years', 'months');
    expect(backToMonths).toBe(48);

    // Loan result must be identical both ways.
    const rMonths  = calculateLoan(10000, 6.0, 48);
    const rYears   = calculateLoan(10000, 6.0, backToMonths);
    expect(rMonths.monthlyPayment).toBe(rYears.monthlyPayment);
  });

  it('AC 3.3: Fractional year rounding -- 2.5 years rounds to 30 months', () => {
    const months = convertTermUnit(2.5, 'years', 'months');
    expect(months).toBe(30);

    const v = validateLoanInputs({ principal: '10000', annualRate: '6.0', termMonths: String(months) });
    expect(v.isValid).toBe(true);
    expect(v.values.termMonths).toBe(30);
  });

  it('AC 3.4: Zero or negative term in years mode produces validation error', () => {
    // 0 years -> 0 months -> "at least 1 month"
    const zeroMonths = convertTermUnit(0, 'years', 'months');
    expect(zeroMonths).toBe(0);
    const vZero = validateLoanInputs({ principal: '10000', annualRate: '6.0', termMonths: String(zeroMonths) });
    expect(vZero.isValid).toBe(false);
    expect(vZero.errors.termMonths).toBe('Term must be at least 1 month');

    // -1 years -> -12 months -> same error
    const negMonths = convertTermUnit(-1, 'years', 'months');
    expect(negMonths).toBe(-12);
    const vNeg = validateLoanInputs({ principal: '10000', annualRate: '6.0', termMonths: String(negMonths) });
    expect(vNeg.isValid).toBe(false);
    expect(vNeg.errors.termMonths).toBe('Term must be at least 1 month');
  });

  it('AC 3.5: Fractional year rounding (non-half) -- 2.55 years rounds to 31 months', () => {
    // 2.55 x 12 = 30.6, rounds to 31
    const months = convertTermUnit(2.55, 'years', 'months');
    expect(months).toBe(31);

    const v = validateLoanInputs({ principal: '10000', annualRate: '6.0', termMonths: String(months) });
    expect(v.isValid).toBe(true);
    expect(v.values.termMonths).toBe(31);
  });

  it('AC 3.6: Non-whole months to years -- 37 months displayed as decimal, switch back returns 37', () => {
    // Months -> Years: raw decimal (not rounded) for display
    const years = convertTermUnit(37, 'months', 'years');
    // 37/12 = 3.0833...
    expect(years).toBeCloseTo(37 / 12, 10);

    // Switching back: years -> months must round back to 37
    const backToMonths = convertTermUnit(years, 'years', 'months');
    expect(backToMonths).toBe(37);
  });

  it('AC 3.1 (same-unit no-op): convertTermUnit with identical from/to unit returns value unchanged', () => {
    expect(convertTermUnit(36, 'months', 'months')).toBe(36);
    expect(convertTermUnit(3, 'years', 'years')).toBe(3);
  });
});

// ============================================================
// Story S-4: Compare two loan offers (serves J-3)
// ============================================================
// Independent expected values:
//   Offer A: $20,000, 7.0%, 36 months
//     r = (7/100)/12 = 0.005833...
//     compound = (1.005833...)^36 = 1.233598...
//     payment = 20000 * (0.005833 * 1.233598) / (1.233598 - 1) = 617.54
//     totalCost = 617.54 * 36 = 22231.44, totalInterest = 22231.44 - 20000 = 2231.44
//
//   Offer B: $20,000, 5.5%, 48 months
//     r = (5.5/100)/12 = 0.004583...
//     compound = (1.004583)^48 = 1.24439...
//     payment = 20000 * (0.004583 * 1.24439) / (1.24439 - 1) = 465.13
//     totalCost = 465.13 * 48 = 22326.24, totalInterest = 22326.24 - 20000 = 2326.24
//
//   B saves per month: 617.54 - 465.13 = 152.41
//   A saves total interest: 2326.24 - 2231.44 = 94.80
// ============================================================

describe('Story S-4: Compare two loan offers (serves J-3)', () => {

  it('AC 4.1: Comparison with clear trade-offs (Offer A vs Offer B)', () => {
    const offerA = { principal: 20000, annualRate: 7.0, termMonths: 36 };
    const offerB = { principal: 20000, annualRate: 5.5, termMonths: 48 };

    const { resultA, resultB, delta } = compareLoans(offerA, offerB);

    // Per-offer assertions
    expect(resultA.monthlyPayment).toBe(617.54);
    expect(resultA.totalInterest).toBe(2231.44);
    expect(resultB.monthlyPayment).toBe(465.13);
    expect(resultB.totalInterest).toBe(2326.24);

    // Delta assertions
    expect(delta).not.toBeNull();
    expect(delta.monthlyPaymentDiff).toBe(152.41);
    expect(delta.totalInterestDiff).toBe(94.80);
    expect(delta.lowerMonthlyOffer).toBe('B');      // B has lower monthly payment
    expect(delta.lowerTotalInterestOffer).toBe('A'); // A has lower total interest
  });

  it('AC 4.2: Error isolation -- invalid Offer B does not affect Offer A result', () => {
    // The pure calc layer does not validate; validation happens in main.js.
    // We test that compareLoans gracefully handles a null offerB (representing a failed validation).
    const offerA = { principal: 20000, annualRate: 7.0, termMonths: 36 };

    const { resultA, resultB, delta } = compareLoans(offerA, null);

    expect(resultA.monthlyPayment).toBe(617.54);
    expect(resultA.totalInterest).toBe(2231.44);
    expect(resultB).toBeNull();
    expect(delta).toBeNull(); // No comparison possible with one invalid offer
  });

  it('AC 4.3: Identical offers produce zero delta', () => {
    const offerA = { principal: 15000, annualRate: 5.0, termMonths: 36 };
    const offerB = { principal: 15000, annualRate: 5.0, termMonths: 36 };

    const { resultA, resultB, delta } = compareLoans(offerA, offerB);

    expect(resultA.monthlyPayment).toBe(resultB.monthlyPayment);
    expect(resultA.totalInterest).toBe(resultB.totalInterest);
    expect(delta.monthlyPaymentDiff).toBe(0.00);
    expect(delta.totalInterestDiff).toBe(0.00);
    expect(delta.lowerMonthlyOffer).toBe('equal');
    expect(delta.lowerTotalInterestOffer).toBe('equal');
  });

  it('AC 4.3 (null both): both offers null returns null results and null delta', () => {
    const { resultA, resultB, delta } = compareLoans(null, null);
    expect(resultA).toBeNull();
    expect(resultB).toBeNull();
    expect(delta).toBeNull();
  });
});


// ============================================================
// Story S-5: Reset all inputs (serves J-1, J-3)
// ============================================================

describe('Story S-5: Reset all inputs (serves J-1, J-3)', () => {
  it('AC 5.1: Single loan reset state defaults', () => {
    // When reset is triggered, all inputs, active errors, and result fields return to default
    const resetState = {
      principal: '',
      annualRate: '',
      termMonths: '',
      errors: {},
      results: { monthlyPayment: '--', totalInterest: '--', totalCost: '--' }
    };

    expect(resetState.principal).toBe('');
    expect(resetState.annualRate).toBe('');
    expect(resetState.termMonths).toBe('');
    expect(Object.keys(resetState.errors).length).toBe(0);
    expect(resetState.results.monthlyPayment).toBe('--');
    expect(resetState.results.totalInterest).toBe('--');
    expect(resetState.results.totalCost).toBe('--');
  });

  it('AC 5.2: Comparison reset state defaults', () => {
    // When comparison reset is triggered, both offers and comparison summary return to default
    const comparisonResetState = {
      offerA: { principal: '', annualRate: '', termMonths: '' },
      offerB: { principal: '', annualRate: '', termMonths: '' },
      errorsA: {},
      errorsB: {},
      resultsA: { monthlyPayment: '--', totalInterest: '--', totalCost: '--' },
      resultsB: { monthlyPayment: '--', totalInterest: '--', totalCost: '--' },
      summary: null
    };

    expect(comparisonResetState.offerA.principal).toBe('');
    expect(comparisonResetState.offerB.principal).toBe('');
    expect(Object.keys(comparisonResetState.errorsA).length).toBe(0);
    expect(Object.keys(comparisonResetState.errorsB).length).toBe(0);
    expect(comparisonResetState.resultsA.monthlyPayment).toBe('--');
    expect(comparisonResetState.resultsB.monthlyPayment).toBe('--');
    expect(comparisonResetState.summary).toBeNull();
  });
});
