import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createApiFixture } from './helpers/apiFixture';

let fixture: Awaited<ReturnType<typeof createApiFixture>>;

beforeEach(async () => {
  fixture = await createApiFixture();
});

afterEach(async () => {
  await fixture.close();
});

describe('reference endpoints', () => {
  it('returns every distinct hobby as a value and label pair', async () => {
    const response = await fixture.request('/api/hobbies');
    const body = await response.json();
    const values = [
      'Cooking',
      'Hiking',
      ...Array.from({ length: 22 }, (_, index) => `Hobby ${String(index).padStart(2, '0')}`),
      'Reading',
      'Running',
    ];

    expect(response.status).toBe(200);
    expect(body).toEqual(values.map((value) => ({ value, label: value })));
  });

  it('returns every distinct nationality as a value and label pair', async () => {
    const response = await fixture.request('/api/nationalities');
    const body = await response.json();
    const values = [
      'American',
      'american',
      'British',
      'Canadian',
      ...Array.from({ length: 22 }, (_, index) => `Country ${String(index).padStart(2, '0')}`),
      'Egyptian',
      'Lebanese',
    ];

    expect(response.status).toBe(200);
    expect(body).toEqual(values.map((value) => ({ value, label: value })));
  });
});
