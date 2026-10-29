import { describe, it, expect } from 'vitest';
import {
  validateLoanInputs,
  validateCarLoanInputs,
  validateHomeLoanInputs,
  calculateLoan,
  formatCurrency,
  convertTermUnit,
  compareLoans
} from '../src/loan.js';

describe('Story S-1: Calculate my monthly payment (serves J-1)', () => {
  it('AC 1.1: Standard calculation with a hand-checkable answer', () => {
    const validation = validateLoanInputs({
      principal: '10000',
      annualRate: '6.0',
      termMonths: '36'
    });
    expect(validation.isValid).toBe(true);

    const result = calculateLoan(
      validation.values.principal,
      validation.values.annualRate,
      validation.values.termMonths
    );
    expect(result.monthlyPayment).toBe(304.22);
    expect(formatCurrency(result.monthlyPayment)).toBe('$304.22');
  });

  it('AC 1.2: Zero interest rate boundary', () => {
    const validation = validateLoanInputs({
      principal: '12000',
      annualRate: '0.0',
      termMonths: '24'
    });
    expect(validation.isValid).toBe(true);

    const result = calculateLoan(
      validation.values.principal,
      validation.values.annualRate,
      validation.values.termMonths
    );
    expect(result.monthlyPayment).toBe(500.00);
    expect(result.totalInterest).toBe(0.00);
    expect(result.totalCost).toBe(12000.00);
    expect(formatCurrency(result.monthlyPayment)).toBe('$500.00');
    expect(Number.isFinite(result.monthlyPayment)).toBe(true);
    expect(isNaN(result.monthlyPayment)).toBe(false);
  });

  it('AC 1.3: Shortest term boundary (1 month)', () => {
    const validation = validateLoanInputs({
      principal: '12000',
      annualRate: '12.0',
      termMonths: '1'
    });
    // Note: AC 1.3 says $1,200, let's test $1,200 as specified
    const validationSmall = validateLoanInputs({
      principal: '1200',
      annualRate: '12.0',
      termMonths: '1'
    });
    expect(validationSmall.isValid).toBe(true);

    const result = calculateLoan(
      validationSmall.values.principal,
      validationSmall.values.annualRate,
      validationSmall.values.termMonths
    );
    expect(result.monthlyPayment).toBe(1212.00);
    expect(result.totalInterest).toBe(12.00);
    expect(result.totalCost).toBe(1212.00);
    expect(formatCurrency(result.monthlyPayment)).toBe('$1,212.00');
  });

  it('AC 1.4: Upper term boundary and large principal ($100,000,000, 5.0%, 480 months)', () => {
    const validation = validateLoanInputs({
      principal: '100000000',
      annualRate: '5.0',
      termMonths: '480'
    });
    expect(validation.isValid).toBe(true);

    const result = calculateLoan(
      validation.values.principal,
      validation.values.annualRate,
      validation.values.termMonths
    );
    expect(result.monthlyPayment).toBe(482196.60);
    expect(result.totalInterest).toBe(131454368.00);
    expect(result.totalCost).toBe(231454368.00);
    expect(formatCurrency(result.monthlyPayment)).toBe('$482,196.60');
    expect(formatCurrency(result.monthlyPayment)).not.toContain('e');
  });

  it('AC 1.5: Negative and zero principal validation', () => {
    const valNegative = validateLoanInputs({
      principal: '-5000',
      annualRate: '6.0',
      termMonths: '36'
    });
    expect(valNegative.isValid).toBe(false);
    expect(valNegative.errors.principal).toBe('Loan amount must be greater than 0');

    const valZero = validateLoanInputs({
      principal: '0',
      annualRate: '6.0',
      termMonths: '36'
    });
    expect(valZero.isValid).toBe(false);
    expect(valZero.errors.principal).toBe('Loan amount must be greater than 0');
  });

  it('AC 1.6: Non-numeric input validation', () => {
    const valAlpha = validateLoanInputs({
      principal: 'abc',
      annualRate: '6.0',
      termMonths: '36'
    });
    expect(valAlpha.isValid).toBe(false);
    expect(valAlpha.errors.principal).toBe('Please enter a valid numeric value');

    const valMalformed = validateLoanInputs({
      principal: '10000',
      annualRate: '12.3.4',
      termMonths: '36'
    });
    expect(valMalformed.isValid).toBe(false);
    expect(valMalformed.errors.annualRate).toBe('Please enter a valid numeric value');
  });

  it('AC 1.7: Error recovery', () => {
    // Starting with invalid -$5,000
    const invalid = validateLoanInputs({
      principal: '-5000',
      annualRate: '6.0',
      termMonths: '36'
    });
    expect(invalid.isValid).toBe(false);
    expect(invalid.errors.principal).toBe('Loan amount must be greater than 0');

    // Replace with valid $5,000 at 6.0% for 36 months
    const recovered = validateLoanInputs({
      principal: '5000',
      annualRate: '6.0',
      termMonths: '36'
    });
    expect(recovered.isValid).toBe(true);
    expect(recovered.errors.principal).toBeUndefined();

    const result = calculateLoan(
      recovered.values.principal,
      recovered.values.annualRate,
      recovered.values.termMonths
    );
    expect(result.monthlyPayment).toBe(152.11);
    expect(formatCurrency(result.monthlyPayment)).toBe('$152.11');
  });

  it('AC 1.8: Negative interest rate validation', () => {
    const validation = validateLoanInputs({
      principal: '10000',
      annualRate: '-5.0',
      termMonths: '36'
    });
    expect(validation.isValid).toBe(false);
    expect(validation.errors.annualRate).toBe('Interest rate cannot be negative');
  });

  it('AC 1.9: Empty field validation', () => {
    const valEmptyPrincipal = validateLoanInputs({
      principal: '',
      annualRate: '6.0',
      termMonths: '36'
    });
    expect(valEmptyPrincipal.isValid).toBe(false);
    expect(valEmptyPrincipal.errors.principal).toBe('Loan amount is required');

    const valEmptyRate = validateLoanInputs({
      principal: '10000',
      annualRate: '   ',
      termMonths: '36'
    });
    expect(valEmptyRate.isValid).toBe(false);
    expect(valEmptyRate.errors.annualRate).toBe('Interest rate quoted by your lender is required');

    const valEmptyTerm = validateLoanInputs({
      principal: '10000',
      annualRate: '6.0',
      termMonths: ''
    });
    expect(valEmptyTerm.isValid).toBe(false);
    expect(valEmptyTerm.errors.termMonths).toBe('Loan term is required');
  });

  it('AC 1.10: Interest rate exceeds maximum (100%)', () => {
    const valOverMax = validateLoanInputs({
      principal: '10000',
      annualRate: '101',
      termMonths: '36'
    });
    expect(valOverMax.isValid).toBe(false);
    expect(valOverMax.errors.annualRate).toBe('Interest rate must not exceed 100%');

    const val150 = validateLoanInputs({
      principal: '10000',
      annualRate: '150',
      termMonths: '36'
    });
    expect(val150.isValid).toBe(false);
    expect(val150.errors.annualRate).toBe('Interest rate must not exceed 100%');

    // Exactly 100% is valid
    const valAtMax = validateLoanInputs({
      principal: '10000',
      annualRate: '100',
      termMonths: '36'
    });
    expect(valAtMax.isValid).toBe(true);
  });
});

describe('Story S-2: See total interest and total cost (serves J-2)', () => {
  it('AC 2.1: Standard total interest and total cost ($10,000, 6.0%, 36 months)', () => {
    const validation = validateLoanInputs({
      principal: '10000',
      annualRate: '6.0',
      termMonths: '36'
    });
    expect(validation.isValid).toBe(true);

    const result = calculateLoan(
      validation.values.principal,
      validation.values.annualRate,
      validation.values.termMonths
    );
    expect(result.monthlyPayment).toBe(304.22);
    expect(result.totalInterest).toBe(951.92);
    expect(result.totalCost).toBe(10951.92);

    expect(formatCurrency(result.totalInterest)).toBe('$951.92');
    expect(formatCurrency(result.totalCost)).toBe('$10,951.92');
  });

  it('AC 2.2: Zero interest total cost ($6,000, 0.0%, 12 months)', () => {
    const validation = validateLoanInputs({
      principal: '6000',
      annualRate: '0.0',
      termMonths: '12'
    });
    expect(validation.isValid).toBe(true);

    const result = calculateLoan(
      validation.values.principal,
      validation.values.annualRate,
      validation.values.termMonths
    );
    expect(result.monthlyPayment).toBe(500.00);
    expect(result.totalInterest).toBe(0.00);
    expect(result.totalCost).toBe(6000.00);

    expect(formatCurrency(result.totalInterest)).toBe('$0.00');
    expect(formatCurrency(result.totalCost)).toBe('$6,000.00');
  });

  it('AC 2.3: Invalid term validation (0 or negative months)', () => {
    const valZero = validateLoanInputs({
      principal: '10000',
      annualRate: '6.0',
      termMonths: '0'
    });
    expect(valZero.isValid).toBe(false);
    expect(valZero.errors.termMonths).toBe('Term must be at least 1 month');

    const valNeg = validateLoanInputs({
      principal: '10000',
      annualRate: '6.0',
      termMonths: '-5'
    });
    expect(valNeg.isValid).toBe(false);
    expect(valNeg.errors.termMonths).toBe('Term must be at least 1 month');
  });

  it('AC 2.4: Error recovery after invalid term', () => {
    const invalid = validateLoanInputs({
      principal: '6000',
      annualRate: '0.0',
      termMonths: '0'
    });
    expect(invalid.isValid).toBe(false);
    expect(invalid.errors.termMonths).toBe('Term must be at least 1 month');

    const recovered = validateLoanInputs({
      principal: '6000',
      annualRate: '0.0',
      termMonths: '12'
    });
    expect(recovered.isValid).toBe(true);
    expect(recovered.errors.termMonths).toBeUndefined();

    const result = calculateLoan(
      recovered.values.principal,
      recovered.values.annualRate,
      recovered.values.termMonths
    );
    expect(result.monthlyPayment).toBe(500.00);
    expect(result.totalInterest).toBe(0.00);
    expect(result.totalCost).toBe(6000.00);
  });

  it('AC 2.5: Term exceeds maximum (481 months)', () => {
    const valOverMax = validateLoanInputs({
      principal: '10000',
      annualRate: '6.0',
      termMonths: '481'
    });
    expect(valOverMax.isValid).toBe(false);
    expect(valOverMax.errors.termMonths).toBe('Term must not exceed 480 months (40 years)');

    // 41 years in Home loan exceeds 480 months cap (41 x 12 = 492)
    const val41Years = validateHomeLoanInputs({
      propertyPrice: '300000',
      financingAmount: '240000',
      annualRate: '5.0',
      termYears: '41'
    });
    expect(val41Years.isValid).toBe(false);
    expect(val41Years.errors.termYears).toBe('Term must not exceed 480 months (40 years)');

    // 480 is valid
    const valAtMax = validateLoanInputs({
      principal: '10000',
      annualRate: '6.0',
      termMonths: '480'
    });
    expect(valAtMax.isValid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Story S-9: Loan type selector (Car and Home)
// ---------------------------------------------------------------------------

describe('Story S-9: Car Loan (serves J-1)', () => {
  it('AC 9.2: Car standard case -- $30,000, 20% down, 6%, 60 months', () => {
    const v = validateCarLoanInputs({
      vehiclePrice: '30000',
      downPaymentPct: '20',
      annualRate: '6.0',
      termMonths: '60'
    });
    expect(v.isValid).toBe(true);
    expect(v.values.financedAmount).toBe(24000);

    const r = calculateLoan(v.values.financedAmount, v.values.annualRate, v.values.termMonths);
    expect(r.monthlyPayment).toBe(463.99);
    expect(r.totalCost).toBe(27839.40);
    expect(r.totalInterest).toBe(3839.40);
  });

  it('AC 9.3: Car zero interest -- $24,000 financed, 0%, 60 months', () => {
    const v = validateCarLoanInputs({
      vehiclePrice: '30000',
      downPaymentPct: '20',
      annualRate: '0',
      termMonths: '60'
    });
    expect(v.isValid).toBe(true);
    expect(v.values.financedAmount).toBe(24000);

    const r = calculateLoan(v.values.financedAmount, v.values.annualRate, v.values.termMonths);
    expect(r.monthlyPayment).toBe(400.00);
    expect(r.totalInterest).toBe(0.00);
    expect(r.totalCost).toBe(24000.00);
  });

  it('AC 9.4a: Car down payment 0% is valid', () => {
    const v = validateCarLoanInputs({
      vehiclePrice: '20000',
      downPaymentPct: '0',
      annualRate: '5',
      termMonths: '36'
    });
    expect(v.isValid).toBe(true);
    expect(v.values.financedAmount).toBe(20000);
  });

  it('AC 9.4b: Car down payment 100% is rejected', () => {
    const v = validateCarLoanInputs({
      vehiclePrice: '20000',
      downPaymentPct: '100',
      annualRate: '5',
      termMonths: '36'
    });
    expect(v.isValid).toBe(false);
    expect(v.errors.downPaymentPct).toBe('Down payment percentage must be less than 100%');

    const v120 = validateCarLoanInputs({
      vehiclePrice: '20000',
      downPaymentPct: '120',
      annualRate: '5',
      termMonths: '36'
    });
    expect(v120.isValid).toBe(false);
    expect(v120.errors.downPaymentPct).toBe('Down payment percentage must be less than 100%');
  });

  it('AC 9.4c: Car negative down payment is rejected', () => {
    const v = validateCarLoanInputs({
      vehiclePrice: '20000',
      downPaymentPct: '-5',
      annualRate: '5',
      termMonths: '36'
    });
    expect(v.isValid).toBe(false);
    expect(v.errors.downPaymentPct).toBe('Down payment percentage cannot be negative');
  });

  it('AC 9.7: Car empty field messages are field-specific', () => {
    const vPrice = validateCarLoanInputs({
      vehiclePrice: '',
      downPaymentPct: '20',
      annualRate: '6',
      termMonths: '60'
    });
    expect(vPrice.errors.vehiclePrice).toBe('Vehicle price is required');

    const vDown = validateCarLoanInputs({
      vehiclePrice: '30000',
      downPaymentPct: '',
      annualRate: '6',
      termMonths: '60'
    });
    expect(vDown.errors.downPaymentPct).toBe('Down payment percentage is required');

    const vRate = validateCarLoanInputs({
      vehiclePrice: '30000',
      downPaymentPct: '20',
      annualRate: '',
      termMonths: '60'
    });
    expect(vRate.errors.annualRate).toBe('Interest rate quoted by your lender is required');

    const vTerm = validateCarLoanInputs({
      vehiclePrice: '30000',
      downPaymentPct: '20',
      annualRate: '6',
      termMonths: ''
    });
    expect(vTerm.errors.termMonths).toBe('Loan term is required');
  });

  it('AC 9.10: Car loan with same financed amount as Personal gives identical result', () => {
    const car = validateCarLoanInputs({
      vehiclePrice: '30000',
      downPaymentPct: '20',
      annualRate: '6.0',
      termMonths: '60'
    });
    const personal = validateLoanInputs({
      principal: '24000',
      annualRate: '6.0',
      termMonths: '60'
    });

    const rCar = calculateLoan(car.values.financedAmount, car.values.annualRate, car.values.termMonths);
    const rPersonal = calculateLoan(personal.values.principal, personal.values.annualRate, personal.values.termMonths);

    expect(rCar.monthlyPayment).toBe(rPersonal.monthlyPayment);
    expect(rCar.totalCost).toBe(rPersonal.totalCost);
    expect(rCar.totalInterest).toBe(rPersonal.totalInterest);
  });
});

describe('Story S-9: Home Loan (serves J-1)', () => {
  it('AC 9.5: Home standard case -- $240,000 financed, 5%, 30 years', () => {
    const v = validateHomeLoanInputs({
      propertyPrice: '300000',
      financingAmount: '240000',
      annualRate: '5.0',
      termYears: '30'
    });
    expect(v.isValid).toBe(true);
    expect(v.values.termMonths).toBe(360);
    expect(v.values.financingAmount).toBe(240000);

    const r = calculateLoan(v.values.financingAmount, v.values.annualRate, v.values.termMonths);
    expect(r.monthlyPayment).toBe(1288.37);
    expect(r.totalCost).toBe(463813.20);
    expect(r.totalInterest).toBe(223813.20);
  });

  it('AC 9.5a: Home term in years is converted to whole months (30 years = 360 months)', () => {
    const v = validateHomeLoanInputs({
      propertyPrice: '300000',
      financingAmount: '240000',
      annualRate: '5.0',
      termYears: '30'
    });
    expect(v.values.termMonths).toBe(360);
  });

  it('AC 9.5b: Home fractional year rounds correctly (2.55 years = 31 months)', () => {
    const v = validateHomeLoanInputs({
      propertyPrice: '300000',
      financingAmount: '240000',
      annualRate: '5.0',
      termYears: '2.55'
    });
    expect(v.isValid).toBe(true);
    expect(v.values.termMonths).toBe(31);
  });

  it('AC 9.6a: Home financing exceeds property price is rejected', () => {
    const v = validateHomeLoanInputs({
      propertyPrice: '300000',
      financingAmount: '300001',
      annualRate: '5.0',
      termYears: '30'
    });
    expect(v.isValid).toBe(false);
    expect(v.errors.financingAmount).toBe('Financing amount cannot exceed property price');
  });

  it('AC 9.6b: Home financing of $0 is rejected', () => {
    const v = validateHomeLoanInputs({
      propertyPrice: '300000',
      financingAmount: '0',
      annualRate: '5.0',
      termYears: '30'
    });
    expect(v.isValid).toBe(false);
    expect(v.errors.financingAmount).toBe('Financing amount must be greater than 0');
  });

  it('AC 9.6c: Home negative financing is rejected', () => {
    const v = validateHomeLoanInputs({
      propertyPrice: '300000',
      financingAmount: '-1000',
      annualRate: '5.0',
      termYears: '30'
    });
    expect(v.isValid).toBe(false);
    expect(v.errors.financingAmount).toBe('Financing amount must be greater than 0');
  });

  it('AC 9.7: Home empty field messages are field-specific', () => {
    const vProp = validateHomeLoanInputs({
      propertyPrice: '',
      financingAmount: '240000',
      annualRate: '5',
      termYears: '30'
    });
    expect(vProp.errors.propertyPrice).toBe('Property price is required');

    const vFin = validateHomeLoanInputs({
      propertyPrice: '300000',
      financingAmount: '',
      annualRate: '5',
      termYears: '30'
    });
    expect(vFin.errors.financingAmount).toBe('Desired financing amount is required');

    const vRate = validateHomeLoanInputs({
      propertyPrice: '300000',
      financingAmount: '240000',
      annualRate: '',
      termYears: '30'
    });
    expect(vRate.errors.annualRate).toBe('Interest rate quoted by your lender is required');

    const vTerm = validateHomeLoanInputs({
      propertyPrice: '300000',
      financingAmount: '240000',
      annualRate: '5',
      termYears: ''
    });
    expect(vTerm.errors.termYears).toBe('Loan term is required');
  });
});
