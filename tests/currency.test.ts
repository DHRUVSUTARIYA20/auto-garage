import { describe, it, expect } from 'vitest';
import { convertUSDToINR, formatCurrency } from '../src/lib/currency';

describe('currency util', () => {
  it('converts USD to INR using rate', () => {
    expect(convertUSDToINR(10, 90)).toBe(900);
    expect(convertUSDToINR(0, 90)).toBe(0);
  });

  it('formats USD correctly', () => {
    const s = formatCurrency(1234.5, 'USD');
    expect(s).toContain('$');
    expect(s).toContain('1,234');
  });

  it('formats INR correctly', () => {
    const s = formatCurrency(123456.78, 'INR');
    expect(s).toContain('₹');
  });
});
