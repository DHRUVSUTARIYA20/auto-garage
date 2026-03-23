import { describe, it, expect } from 'vitest';
import { contactSchema } from '../src/pages/Contact';

describe('contact schema validation', () => {
  it('accepts valid payload', () => {
    const payload = {
      name: 'Jane',
      email: 'jane@example.com',
      phone: '987654321',
      subject: 'Question',
      message: 'I want to know your opening hours.',
    };

    expect(() => contactSchema.parse(payload)).not.toThrow();
  });

  it('rejects short message', () => {
    const payload = {
      name: 'Jane',
      email: 'jane@example.com',
      subject: 'Question',
      message: 'Too short',
    };

    expect(() => contactSchema.parse(payload)).toThrow();
  });
});
