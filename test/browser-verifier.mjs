import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.resolve('screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// Start Chrome
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new',
  '--remote-debugging-port=9222',
  '--remote-debugging-address=127.0.0.1',
  '--user-data-dir=/tmp/cdp-verifier-profile',
  '--window-size=1280,960',
  '--no-first-run'
]);

let ws = null;
let msgId = 1;
const callbacks = new Map();

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = msgId++;
    callbacks.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function evalCode(expression) {
  const res = await send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true
  });
  if (res.exceptionDetails) {
    throw new Error(JSON.stringify(res.exceptionDetails));
  }
  return res.result.value;
}

async function captureScreenshot(name) {
  const res = await send('Page.captureScreenshot', { format: 'png' });
  const filePath = path.join(SCREENSHOT_DIR, name);
  fs.writeFileSync(filePath, Buffer.from(res.data, 'base64'));
  console.log(`Saved screenshot: ${name}`);
  return filePath;
}

async function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  console.log('Connecting to Chrome...');
  for (let i = 0; i < 20; i++) {
    await wait(500);
    try {
      const res = await fetch('http://127.0.0.1:9222/json');
      const tabs = await res.json();
      const pageTab = tabs.find(t => t.type === 'page');
      if (pageTab && pageTab.webSocketDebuggerUrl) {
        ws = new WebSocket(pageTab.webSocketDebuggerUrl);
        break;
      }
    } catch (e) {}
  }

  if (!ws) {
    console.error('Could not connect to Chrome DevTools WebSocket');
    chrome.kill();
    process.exit(1);
  }

  await new Promise(r => ws.onopen = r);
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && callbacks.has(data.id)) {
      const { resolve } = callbacks.get(data.id);
      callbacks.delete(data.id);
      resolve(data.result);
    }
  };

  await send('Page.enable');
  await send('Runtime.enable');

  console.log('Navigating to https://loanlens-kappa.vercel.app/ ...');
  await send('Page.navigate', { url: 'https://loanlens-kappa.vercel.app/' });
  await wait(3000);

  const results = [];

  // =========================================================================
  // Test 1: Default load
  // =========================================================================
  {
    const state = await evalCode(`(() => {
      const singleActive = document.getElementById('mode-calculate-btn').classList.contains('active');
      const personalActive = document.querySelector('#single-type-selector [data-type="personal"]').classList.contains('active');
      const principalVisible = !document.getElementById('fields-personal').classList.contains('hidden');
      return { singleActive, personalActive, principalVisible };
    })()`);
    await captureScreenshot('01_default_load.png');
    results.push({
      test: 'Default load state',
      expected: 'Single Calculator active, Personal category active, principal input visible',
      actual: `Single: ${state.singleActive}, Personal: ${state.personalActive}, Visible: ${state.principalVisible}`,
      pass: state.singleActive && state.personalActive && state.principalVisible
    });
  }

  // =========================================================================
  // Test 2: Personal 10,000 at 6% for 36 months
  // =========================================================================
  {
    const res = await evalCode(`(() => {
      document.getElementById('principal').value = '10000';
      document.getElementById('annualRate').value = '6.0';
      document.getElementById('term').value = '36';
      document.getElementById('calculate-btn').click();
      return {
        payment: document.getElementById('result-monthly-payment').textContent.trim(),
        interest: document.getElementById('result-total-interest').textContent.trim(),
        total: document.getElementById('result-total-cost').textContent.trim()
      };
    })()`);
    await captureScreenshot('02_personal_10k_6pct_36mo.png');
    results.push({
      test: 'Personal $10,000 at 6% for 36 months',
      expected: 'Payment $304.22, Interest $951.92, Total $10,951.92',
      actual: `Payment ${res.payment}, Interest ${res.interest}, Total ${res.total}`,
      pass: res.payment === '$304.22' && res.interest === '$951.92' && res.total === '$10,951.92'
    });
  }

  // =========================================================================
  // Test 3: Car 30,000, 20% down, 6%, 60 months
  // =========================================================================
  {
    const res = await evalCode(`(() => {
      document.querySelector('#single-type-selector [data-type="car"]').click();
      document.getElementById('vehiclePrice').value = '30000';
      document.getElementById('downPaymentPct').value = '20';
      document.getElementById('annualRate').value = '6.0';
      document.getElementById('term').value = '60';
      document.getElementById('calculate-btn').click();
      return {
        financed: document.getElementById('result-financed-amount').textContent.trim(),
        payment: document.getElementById('result-monthly-payment').textContent.trim(),
        interest: document.getElementById('result-total-interest').textContent.trim(),
        total: document.getElementById('result-total-cost').textContent.trim()
      };
    })()`);
    await captureScreenshot('03_car_30k_20down_6pct_60mo.png');
    results.push({
      test: 'Car $30,000, 20% down, 6%, 60 months',
      expected: 'Financed $24,000.00, Payment $463.99, Interest $3,839.40, Total $27,839.40',
      actual: `Financed ${res.financed}, Payment ${res.payment}, Interest ${res.interest}, Total ${res.total}`,
      pass: res.financed === '$24,000.00' && res.payment === '$463.99' && res.interest === '$3,839.40' && res.total === '$27,839.40'
    });
  }

  // =========================================================================
  // Test 4: Car at 0% interest
  // =========================================================================
  {
    const res = await evalCode(`(() => {
      document.getElementById('annualRate').value = '0';
      document.getElementById('calculate-btn').click();
      return {
        payment: document.getElementById('result-monthly-payment').textContent.trim(),
        interest: document.getElementById('result-total-interest').textContent.trim(),
        total: document.getElementById('result-total-cost').textContent.trim()
      };
    })()`);
    await captureScreenshot('04_car_zero_interest.png');
    results.push({
      test: 'Car $24,000 financed at 0% for 60 months',
      expected: 'Payment $400.00, Interest $0.00, Total $24,000.00',
      actual: `Payment ${res.payment}, Interest ${res.interest}, Total ${res.total}`,
      pass: res.payment === '$400.00' && res.interest === '$0.00' && res.total === '$24,000.00'
    });
  }

  // =========================================================================
  // Test 5: Home 300,000, financing 240,000, 5%, 30 years
  // =========================================================================
  {
    const res = await evalCode(`(() => {
      document.querySelector('#single-type-selector [data-type="home"]').click();
      document.getElementById('propertyPrice').value = '300000';
      document.getElementById('financingAmount').value = '240000';
      document.getElementById('annualRate').value = '5.0';
      document.getElementById('term').value = '30';
      document.getElementById('calculate-btn').click();
      return {
        payment: document.getElementById('result-monthly-payment').textContent.trim(),
        interest: document.getElementById('result-total-interest').textContent.trim(),
        total: document.getElementById('result-total-cost').textContent.trim()
      };
    })()`);
    await captureScreenshot('05_home_300k_240k_5pct_30yr.png');
    results.push({
      test: 'Home $300,000 property, $240,000 financing, 5%, 30 years',
      expected: 'Payment $1,288.37, Interest $223,813.20, Total $463,813.20',
      actual: `Payment ${res.payment}, Interest ${res.interest}, Total ${res.total}`,
      pass: res.payment === '$1,288.37' && res.interest === '$223,813.20' && res.total === '$463,813.20'
    });
  }

  // =========================================================================
  // Test 6: Months / Years Toggle Conversions
  // =========================================================================
  {
    const res = await evalCode(`(() => {
      // Switch to Personal
      document.querySelector('#single-type-selector [data-type="personal"]').click();
      
      // Case A: 3 years -> toggle months shows 36
      document.getElementById('toggle-years').click();
      document.getElementById('term').value = '3';
      document.getElementById('toggle-months').click();
      const val3yr = document.getElementById('term').value;

      // Case B: 48 months -> toggle years shows 4
      document.getElementById('term').value = '48';
      document.getElementById('toggle-years').click();
      const val48mo = document.getElementById('term').value;

      // Case C: 37 months -> toggle years shows decimal, switch back shows 37
      document.getElementById('toggle-months').click();
      document.getElementById('term').value = '37';
      document.getElementById('toggle-years').click();
      const val37yr = document.getElementById('term').value;
      document.getElementById('toggle-months').click();
      const val37back = document.getElementById('term').value;

      return { val3yr, val48mo, val37yr, val37back };
    })()`);
    await captureScreenshot('06_term_unit_toggles.png');
    results.push({
      test: 'Months and Years Toggle Conversions',
      expected: '3 yr -> 36 mo; 48 mo -> 4 yr; 37 mo -> 3.0833333333 -> 37',
      actual: `3yr: ${res.val3yr}, 48mo: ${res.val48mo}, 37mo: ${res.val37yr} -> ${res.val37back}`,
      pass: res.val3yr === '36' && res.val48mo === '4' && res.val37yr.startsWith('3.08333') && res.val37back === '37'
    });
  }

  // =========================================================================
  // Test 7: Validation - Empty fields
  // =========================================================================
  {
    const res = await evalCode(`(() => {
      document.getElementById('reset-btn').click();
      document.getElementById('calculate-btn').click();
      return {
        pErr: document.getElementById('principal-error').textContent.trim(),
        rErr: document.getElementById('annualRate-error').textContent.trim(),
        tErr: document.getElementById('term-error').textContent.trim()
      };
    })()`);
    await captureScreenshot('07_validation_empty_fields.png');
    results.push({
      test: 'Validation: Empty fields',
      expected: 'Loan amount is required, Interest rate quoted by your lender is required, Loan term is required',
      actual: `${res.pErr} | ${res.rErr} | ${res.tErr}`,
      pass: res.pErr === 'Loan amount is required' &&
            res.rErr === 'Interest rate quoted by your lender is required' &&
            res.tErr === 'Loan term is required'
    });
  }

  // =========================================================================
  // Test 8: Validation - Non-numeric, negative/zero amount, rate bounds, term bounds
  // =========================================================================
  {
    const res = await evalCode(`(() => {
      // 1. Non-numeric
      document.getElementById('principal').value = 'abc';
      document.getElementById('annualRate').value = '12.3.4';
      document.getElementById('term').value = 'xyz';
      document.getElementById('calculate-btn').click();
      const nonNumP = document.getElementById('principal-error').textContent.trim();
      const nonNumR = document.getElementById('annualRate-error').textContent.trim();

      // 2. Negative and zero principal
      document.getElementById('principal').value = '-5000';
      document.getElementById('annualRate').value = '6';
      document.getElementById('term').value = '36';
      document.getElementById('calculate-btn').click();
      const negP = document.getElementById('principal-error').textContent.trim();

      document.getElementById('principal').value = '0';
      document.getElementById('calculate-btn').click();
      const zeroP = document.getElementById('principal-error').textContent.trim();

      // 3. Negative and >100% rate
      document.getElementById('principal').value = '10000';
      document.getElementById('annualRate').value = '-5';
      document.getElementById('calculate-btn').click();
      const negR = document.getElementById('annualRate-error').textContent.trim();

      document.getElementById('annualRate').value = '150';
      document.getElementById('calculate-btn').click();
      const overR = document.getElementById('annualRate-error').textContent.trim();

      // 4. Term 0 and 481 months
      document.getElementById('annualRate').value = '6';
      document.getElementById('term').value = '0';
      document.getElementById('calculate-btn').click();
      const zeroT = document.getElementById('term-error').textContent.trim();

      document.getElementById('term').value = '481';
      document.getElementById('calculate-btn').click();
      const overT = document.getElementById('term-error').textContent.trim();

      // 5. Car down payment 100% and 120%
      document.querySelector('#single-type-selector [data-type="car"]').click();
      document.getElementById('vehiclePrice').value = '30000';
      document.getElementById('downPaymentPct').value = '100';
      document.getElementById('annualRate').value = '6';
      document.getElementById('term').value = '36';
      document.getElementById('calculate-btn').click();
      const car100 = document.getElementById('downPaymentPct-error').textContent.trim();

      document.getElementById('downPaymentPct').value = '120';
      document.getElementById('calculate-btn').click();
      const car120 = document.getElementById('downPaymentPct-error').textContent.trim();

      // 6. Home financing > property and financing 0
      document.querySelector('#single-type-selector [data-type="home"]').click();
      document.getElementById('propertyPrice').value = '300000';
      document.getElementById('financingAmount').value = '350000';
      document.getElementById('annualRate').value = '5';
      document.getElementById('term').value = '30';
      document.getElementById('calculate-btn').click();
      const homeOver = document.getElementById('financingAmount-error').textContent.trim();

      document.getElementById('financingAmount').value = '0';
      document.getElementById('calculate-btn').click();
      const homeZero = document.getElementById('financingAmount-error').textContent.trim();

      return { nonNumP, nonNumR, negP, zeroP, negR, overR, zeroT, overT, car100, car120, homeOver, homeZero };
    })()`);
    await captureScreenshot('08_validation_boundary_cases.png');
    results.push({
      test: 'Validation: Numeric & boundary error messages',
      expected: 'Non-numeric msg, amount > 0, rate 0-100%, term 1-480, down < 100%, home fin <= prop',
      actual: `nonNum: ${res.nonNumP}, negP: ${res.negP}, rate150: ${res.overR}, term481: ${res.overT}, carDown120: ${res.car120}, homeOver: ${res.homeOver}`,
      pass: res.nonNumP === 'Please enter a valid numeric value' &&
            res.negP === 'Loan amount must be greater than 0' &&
            res.negR === 'Interest rate cannot be negative' &&
            res.overR === 'Interest rate must not exceed 100%' &&
            res.zeroT === 'Term must be at least 1 month' &&
            res.overT === 'Term must not exceed 480 months (40 years)' &&
            res.car100 === 'Down payment percentage must be less than 100%' &&
            res.car120 === 'Down payment percentage must be less than 100%' &&
            res.homeOver === 'Financing amount cannot exceed property price' &&
            res.homeZero === 'Financing amount must be greater than 0'
    });
  }

  // =========================================================================
  // Test 9: Category switching clears state
  // =========================================================================
  {
    const res = await evalCode(`(() => {
      // Set values on Car
      document.querySelector('#single-type-selector [data-type="car"]').click();
      document.getElementById('vehiclePrice').value = '25000';
      document.getElementById('downPaymentPct').value = '10';
      document.getElementById('annualRate').value = '5';
      document.getElementById('term').value = '36';
      document.getElementById('calculate-btn').click();

      // Switch to Home
      document.querySelector('#single-type-selector [data-type="home"]').click();

      return {
        propVal: document.getElementById('propertyPrice').value,
        rateVal: document.getElementById('annualRate').value,
        paymentText: document.getElementById('result-monthly-payment').textContent.trim(),
        hasErrors: document.querySelectorAll('.error-message.visible').length
      };
    })()`);
    await captureScreenshot('09_category_switch_clears.png');
    results.push({
      test: 'Category switching clears results and active errors',
      expected: 'Inputs empty, payment "--", 0 active errors',
      actual: `Prop: "${res.propVal}", Rate: "${res.rateVal}", Payment: "${res.paymentText}", Errors: ${res.hasErrors}`,
      pass: res.propVal === '' && res.rateVal === '' && res.paymentText === '--' && res.hasErrors === 0
    });
  }

  // =========================================================================
  // Test 10: Reset clears single calculator
  // =========================================================================
  {
    const res = await evalCode(`(() => {
      document.querySelector('#single-type-selector [data-type="personal"]').click();
      document.getElementById('principal').value = '25000';
      document.getElementById('annualRate').value = '7.5';
      document.getElementById('term').value = '60';
      document.getElementById('calculate-btn').click();

      // Click Reset
      document.getElementById('reset-btn').click();

      return {
        principal: document.getElementById('principal').value,
        rate: document.getElementById('annualRate').value,
        term: document.getElementById('term').value,
        payment: document.getElementById('result-monthly-payment').textContent.trim(),
        interest: document.getElementById('result-total-interest').textContent.trim(),
        errors: document.querySelectorAll('.error-message.visible').length
      };
    })()`);
    await captureScreenshot('10_reset_single_calculator.png');
    results.push({
      test: 'Reset button clears single calculator',
      expected: 'Fields empty, payment "--", interest "--", 0 active errors',
      actual: `Fields: "${res.principal}", Payment: "${res.payment}", Errors: ${res.errors}`,
      pass: res.principal === '' && res.rate === '' && res.term === '' && res.payment === '--' && res.errors === 0
    });
  }

  // =========================================================================
  // Test 11: Error recovery on valid input
  // =========================================================================
  {
    const res = await evalCode(`(() => {
      document.getElementById('principal').value = '-5000';
      document.getElementById('annualRate').value = '6';
      document.getElementById('term').value = '36';
      document.getElementById('calculate-btn').click();
      const hadError = document.getElementById('principal-error').classList.contains('visible');

      // Recover with 5000
      document.getElementById('principal').value = '5000';
      document.getElementById('calculate-btn').click();
      const errCleared = !document.getElementById('principal-error').classList.contains('visible');
      const payment = document.getElementById('result-monthly-payment').textContent.trim();

      return { hadError, errCleared, payment };
    })()`);
    await captureScreenshot('11_error_recovery.png');
    results.push({
      test: 'Error recovery on valid input (5000 at 6% for 36mo)',
      expected: 'Error cleared immediately, payment $152.11',
      actual: `Had error: ${res.hadError}, Cleared: ${res.errCleared}, Payment: ${res.payment}`,
      pass: res.hadError && res.errCleared && res.payment === '$152.11'
    });
  }

  // =========================================================================
  // Test 12: Compare mode - Case 10 (Trade-offs Offer A vs Offer B)
  // =========================================================================
  {
    const res = await evalCode(`(() => {
      document.getElementById('mode-compare-btn').click();
      document.querySelector('#comparison-type-selector [data-type="personal"]').click();

      // Offer A: 20000, 7.0%, 36mo
      document.getElementById('a-principal').value = '20000';
      document.getElementById('a-rate').value = '7.0';
      document.getElementById('a-term').value = '36';

      // Offer B: 20000, 5.5%, 48mo
      document.getElementById('b-principal').value = '20000';
      document.getElementById('b-rate').value = '5.5';
      document.getElementById('b-term').value = '48';

      document.getElementById('compare-btn').click();

      return {
        aMonthly: document.getElementById('a-monthly').textContent.trim(),
        aInterest: document.getElementById('a-interest').textContent.trim(),
        bMonthly: document.getElementById('b-monthly').textContent.trim(),
        bInterest: document.getElementById('b-interest').textContent.trim(),
        summaryMonthly: document.getElementById('summary-monthly-text').textContent.trim(),
        summaryInterest: document.getElementById('summary-interest-text').textContent.trim()
      };
    })()`);
    await captureScreenshot('12_compare_tradeoffs_case10.png');
    results.push({
      test: 'Compare Case 10: Offer A (20k, 7%, 36mo) vs Offer B (20k, 5.5%, 48mo)',
      expected: 'A: $617.54/$2,231.44; B: $465.13/$2,326.24; B saves $152.41/mo, A saves $94.80 interest',
      actual: `A: ${res.aMonthly}/${res.aInterest}, B: ${res.bMonthly}/${res.bInterest}, Monthly: "${res.summaryMonthly}", Interest: "${res.summaryInterest}"`,
      pass: res.aMonthly === '$617.54' && res.aInterest === '$2,231.44' &&
            res.bMonthly === '$465.13' && res.bInterest === '$2,326.24' &&
            res.summaryMonthly.includes('Offer B saves $152.41 per month') &&
            res.summaryInterest.includes('Offer A saves $94.80 in total interest')
    });
  }

  // =========================================================================
  // Test 13: Compare mode - Case 11 (Identical Offers produce $0.00 difference)
  // =========================================================================
  {
    const res = await evalCode(`(() => {
      document.getElementById('a-principal').value = '15000';
      document.getElementById('a-rate').value = '5.0';
      document.getElementById('a-term').value = '36';

      document.getElementById('b-principal').value = '15000';
      document.getElementById('b-rate').value = '5.0';
      document.getElementById('b-term').value = '36';

      document.getElementById('compare-btn').click();

      return {
        aMonthly: document.getElementById('a-monthly').textContent.trim(),
        aInterest: document.getElementById('a-interest').textContent.trim(),
        bMonthly: document.getElementById('b-monthly').textContent.trim(),
        bInterest: document.getElementById('b-interest').textContent.trim(),
        summaryMonthly: document.getElementById('summary-monthly-text').textContent.trim(),
        summaryInterest: document.getElementById('summary-interest-text').textContent.trim()
      };
    })()`);
    await captureScreenshot('13_compare_identical_case11.png');
    results.push({
      test: 'Compare Case 11: Identical offers (15k, 5%, 36mo)',
      expected: 'Payment $449.56, Interest $1,184.16, $0.00 difference for monthly and interest',
      actual: `A: ${res.aMonthly}/${res.aInterest}, Summary: "${res.summaryMonthly}" & "${res.summaryInterest}"`,
      pass: res.aMonthly === '$449.56' && res.aInterest === '$1,184.16' &&
            res.summaryMonthly.includes('$0.00 difference') &&
            res.summaryInterest.includes('$0.00 difference')
    });
  }

  // =========================================================================
  // Test 14: Compare mode - Error isolation (Valid Offer A, Invalid Offer B)
  // =========================================================================
  {
    const res = await evalCode(`(() => {
      // Offer A valid: 20000, 7%, 36mo
      document.getElementById('a-principal').value = '20000';
      document.getElementById('a-rate').value = '7.0';
      document.getElementById('a-term').value = '36';

      // Offer B invalid: negative interest rate -2.0%
      document.getElementById('b-principal').value = '20000';
      document.getElementById('b-rate').value = '-2.0';
      document.getElementById('b-term').value = '48';

      document.getElementById('compare-btn').click();

      return {
        aMonthly: document.getElementById('a-monthly').textContent.trim(),
        bError: document.getElementById('b-rate-error').textContent.trim(),
        summaryHidden: document.getElementById('summary-content').classList.contains('hidden'),
        placeholderText: document.getElementById('summary-placeholder').textContent.trim()
      };
    })()`);
    await captureScreenshot('14_compare_error_isolation.png');
    results.push({
      test: 'Compare: Error isolation (Valid Offer A, Invalid Offer B rate -2%)',
      expected: 'Offer A shows $617.54, Offer B shows error, placeholder: "Enter valid values for both offers to compare."',
      actual: `A: ${res.aMonthly}, B Err: "${res.bError}", Placeholder: "${res.placeholderText}"`,
      pass: res.aMonthly === '$617.54' &&
            res.bError === 'Interest rate cannot be negative' &&
            res.summaryHidden &&
            res.placeholderText === 'Enter valid values for both offers to compare.'
    });
  }

  // =========================================================================
  // Test 15: Reset Comparison
  // =========================================================================
  {
    const res = await evalCode(`(() => {
      document.getElementById('compare-reset-btn').click();
      return {
        aPrincipal: document.getElementById('a-principal').value,
        bRate: document.getElementById('b-rate').value,
        aMonthly: document.getElementById('a-monthly').textContent.trim(),
        bMonthly: document.getElementById('b-monthly').textContent.trim(),
        errors: document.querySelectorAll('#comparison-section .error-message.visible').length,
        placeholderVisible: !document.getElementById('summary-placeholder').classList.contains('hidden')
      };
    })()`);
    await captureScreenshot('15_reset_comparison.png');
    results.push({
      test: 'Reset Comparison button',
      expected: 'All offer fields empty, results "--", 0 errors, summary placeholder visible',
      actual: `Fields: "${res.aPrincipal}", "${res.bRate}", Results: "${res.aMonthly}", Errors: ${res.errors}, Placeholder: ${res.placeholderVisible}`,
      pass: res.aPrincipal === '' && res.bRate === '' && res.aMonthly === '--' && res.bMonthly === '--' && res.errors === 0 && res.placeholderVisible
    });
  }

  console.log('\n======================================================');
  console.log('BROWSER TEST RUN RESULTS (https://loanlens-kappa.vercel.app/)');
  console.log('======================================================');
  let allPass = true;
  for (const r of results) {
    console.log(`[${r.pass ? 'PASS' : 'FAIL'}] ${r.test}`);
    console.log(`       Expected: ${r.expected}`);
    console.log(`       Actual:   ${r.actual}`);
    if (!r.pass) allPass = false;
  }
  console.log('======================================================');
  console.log('TOTAL BROWSER TESTS:', results.length, '| PASSED:', results.filter(r => r.pass).length, '| FAILED:', results.filter(r => !r.pass).length);
  console.log('======================================================\n');

  fs.writeFileSync('screenshots/results.json', JSON.stringify(results, null, 2));

  chrome.kill();
  process.exit(allPass ? 0 : 1);
}

main().catch(err => {
  console.error('Fatal in test runner:', err);
  chrome.kill();
  process.exit(1);
});
