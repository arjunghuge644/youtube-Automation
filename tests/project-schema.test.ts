import { describe, expect, it } from 'vitest';
import { createProjectSchema, updateProjectSchema, registerSchema } from '@creatorflow/shared';

describe('project contracts', () => {
  it('fills defaults and preserves Hindi text', () => {
    const project = createProjectSchema.parse({ title: '  ट्रैफिक क्यों होता है?  ', prompt: 'ट्रैफिक जाम के कारण समझाइए।' });
    expect(project.title).toBe('ट्रैफिक क्यों होता है?');
    expect(project.language).toBe('hi');
    expect(project.durationSeconds).toBe(60);
    expect(project.category).toBe('educational');
    expect(project.narrationEnabled).toBe(true);
  });
  it('supports 9:16, 16:9, and 1:1 aspect ratios across categories', () => {
    for (const ratio of ['9:16', '16:9', '1:1'] as const) {
      const res = createProjectSchema.parse({
        title: 'Video',
        prompt: 'A general purpose video prompt for testing.',
        aspectRatio: ratio,
        category: 'product_promo',
        narrationEnabled: false,
      });
      expect(res.aspectRatio).toBe(ratio);
      expect(res.category).toBe('product_promo');
      expect(res.narrationEnabled).toBe(false);
    }
  });
  it.each([
    { ownerId: 'another-user' }, { status: 'COMPLETED' }, { durationSeconds: 0 },
    { durationSeconds: 181 }, { durationSeconds: 30.5 }, { language: 'unsupported' },
    { aspectRatio: '4:3' }, { resolution: '8k' }, { prompt: 'short' },
  ])('rejects unsafe or unsupported creation input %j', (change) => {
    expect(createProjectSchema.safeParse({ title: 'Traffic', prompt: 'Explain traffic congestion.', ...change }).success).toBe(false);
  });
  it('requires a version and an editable field for updates', () => {
    expect(updateProjectSchema.safeParse({ title: 'Updated' }).success).toBe(false);
    expect(updateProjectSchema.safeParse({ expectedVersion: 1 }).success).toBe(false);
    expect(updateProjectSchema.safeParse({ expectedVersion: 1, ownerId: 'other' }).success).toBe(false);
  });
  it('does not reset omitted settings on a partial update', () => {
    expect(updateProjectSchema.parse({ expectedVersion: 1, title: 'Updated' })).toEqual({ expectedVersion: 1, title: 'Updated' });
  });
  it('normalizes email and enforces a useful password length', () => {
    expect(registerSchema.parse({ name: 'Arjun', email: 'ARJUN@example.com', password: 'a-long-password' }).email).toBe('arjun@example.com');
    expect(registerSchema.safeParse({ name: 'Arjun', email: 'a@example.com', password: 'short' }).success).toBe(false);
  });
});
