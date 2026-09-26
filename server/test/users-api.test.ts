import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createApiFixture } from './helpers/apiFixture';

let fixture: Awaited<ReturnType<typeof createApiFixture>>;

beforeEach(async () => {
  fixture = await createApiFixture();
});

afterEach(async () => {
  vi.restoreAllMocks();
  await fixture.close();
});

const responseBody = async (response: Response) => response.json();
const userIds = (users: Array<{ id: number }>) => users.map((user) => user.id);

describe('GET /api/users', () => {
  it('returns the default page, actor metadata, and pagination', async () => {
    const response = await fixture.request('/api/users');
    const body = await responseBody(response);

    expect(response.status).toBe(200);
    expect(body.data[0]).toMatchObject({
      id: 6,
      firstName: '100%Real',
      lastName: 'Percent',
      totalFilms: 16,
      totalAwards: 6,
      hobbies: ['Reading'],
    });
    expect(body.pagination).toEqual({ page: 1, pageSize: 20, total: 32, hasMore: true });
    expect(body.facets.hobbies).toHaveLength(20);
    expect(body.facets.nationalities).toHaveLength(20);
  });

  it('matches any selected nationality and requires every selected hobby', async () => {
    const nationalityResponse = await fixture.request('/api/users?nationality=British&nationality=Canadian');
    const nationalityBody = await responseBody(nationalityResponse);
    expect(userIds(nationalityBody.data)).toEqual([7, 2, 3]);

    const hobbyResponse = await fixture.request('/api/users?hobby=Reading&hobby=Hiking');
    const hobbyBody = await responseBody(hobbyResponse);
    expect(userIds(hobbyBody.data)).toEqual([9, 1, 8, 3]);
  });

  it('combines prefix text, nationality, and all selected hobbies', async () => {
    const response = await fixture.request(
      '/api/users?q=ad&nationality=American,British&hobby=Reading,Hiking',
    );
    const body = await responseBody(response);

    expect(userIds(body.data)).toEqual([1, 3]);
  });

  it('matches case-insensitive prefixes in either name but not interior substrings', async () => {
    const response = await fixture.request('/api/users?q=MoH');
    const body = await responseBody(response);

    expect(userIds(body.data)).toEqual([8, 4]);
  });

  it('treats percent and underscore in text as literals', async () => {
    const percentResponse = await fixture.request(`/api/users?${new URLSearchParams({ q: '100%' })}`);
    const percentBody = await responseBody(percentResponse);
    const underscoreResponse = await fixture.request(`/api/users?${new URLSearchParams({ q: '100_' })}`);
    const underscoreBody = await responseBody(underscoreResponse);
    const backslashResponse = await fixture.request(`/api/users?${new URLSearchParams({ q: 'A\\' })}`);
    const backslashBody = await responseBody(backslashResponse);

    expect(userIds(percentBody.data)).toEqual([6]);
    expect(userIds(underscoreBody.data)).toEqual([7]);
    expect(userIds(backslashBody.data)).toEqual([10]);
  });

  it('sorts every supported field in either direction with deterministic id ties', async () => {
    const firstAsc = await responseBody(await fixture.request('/api/users?q=ad&sort=first_name&direction=asc'));
    const firstDesc = await responseBody(await fixture.request('/api/users?q=ad&sort=first_name&direction=desc'));
    const lastAsc = await responseBody(await fixture.request('/api/users?q=ad&sort=last_name&direction=asc'));
    const lastDesc = await responseBody(await fixture.request('/api/users?q=ad&sort=last_name&direction=desc'));
    const ageAsc = await responseBody(await fixture.request('/api/users?nationality=Egyptian&sort=age&direction=asc'));
    const ageDesc = await responseBody(await fixture.request('/api/users?nationality=Egyptian&sort=age&direction=desc'));
    const nationalityAsc = await responseBody(await fixture.request('/api/users?q=ad&sort=nationality&direction=asc'));
    const nationalityDesc = await responseBody(await fixture.request('/api/users?q=ad&sort=nationality&direction=desc'));

    expect(userIds(firstAsc.data)).toEqual([2, 9, 1, 3]);
    expect(userIds(firstDesc.data)).toEqual([3, 1, 2, 9]);
    expect(userIds(lastAsc.data)).toEqual([1, 3, 9, 2]);
    expect(userIds(lastDesc.data)).toEqual([2, 9, 1, 3]);
    expect(userIds(ageAsc.data)).toEqual([5, 4]);
    expect(userIds(ageDesc.data)).toEqual([4, 5]);
    expect(userIds(nationalityAsc.data)).toEqual([1, 9, 3, 2]);
    expect(userIds(nationalityDesc.data)).toEqual([2, 3, 1, 9]);
  });

  it('paginates by the active order without duplicate or missing users', async () => {
    const firstPage = await responseBody(await fixture.request(
      '/api/users?nationality=American&nationality=american&sort=age&direction=asc&pageSize=2',
    ));
    const secondPage = await responseBody(await fixture.request(
      '/api/users?nationality=American&nationality=american&sort=age&direction=asc&page=2&pageSize=2',
    ));
    const pastEnd = await responseBody(await fixture.request(
      '/api/users?nationality=American&nationality=american&sort=age&direction=asc&page=3&pageSize=2',
    ));

    expect(userIds(firstPage.data)).toEqual([6, 1]);
    expect(userIds(secondPage.data)).toEqual([10, 9]);
    expect(firstPage.pagination).toEqual({ page: 1, pageSize: 2, total: 4, hasMore: true });
    expect(secondPage.pagination.hasMore).toBe(false);
    expect(pastEnd.data).toEqual([]);
    expect(pastEnd.pagination.total).toBe(4);
  });

  it('returns empty rows and facets when no users match', async () => {
    const response = await fixture.request('/api/users?q=NobodyMatchesThis');
    const body = await responseBody(response);

    expect(response.status).toBe(200);
    expect(body.data).toEqual([]);
    expect(body.pagination).toEqual({ page: 1, pageSize: 20, total: 0, hasMore: false });
    expect(body.facets).toEqual({ hobbies: [], nationalities: [] });
  });

  it('computes both facet lists from the active filters and limits them to 20', async () => {
    const all = await responseBody(await fixture.request('/api/users'));
    const filtered = await responseBody(await fixture.request(
      '/api/users?nationality=British&nationality=Canadian&hobby=Reading',
    ));

    expect(all.facets.hobbies).toHaveLength(20);
    expect(all.facets.nationalities).toHaveLength(20);
    expect(filtered.facets.nationalities).toEqual([
      { value: 'Canadian', count: 2 },
      { value: 'British', count: 1 },
    ]);
    expect(filtered.facets.hobbies).toEqual([
      { value: 'Reading', count: 3 },
      { value: 'Cooking', count: 1 },
      { value: 'Hiking', count: 1 },
    ]);
  });

  it.each([
    ['/api/users?sort=not-a-column', 'sort'],
    ['/api/users?direction=sideways', 'direction'],
    ['/api/users?unexpected=value', 'unexpected'],
    ['/api/users?page=0', 'page'],
    ['/api/users?page=9007199254740991', 'page'],
    ['/api/users?pageSize=101', 'pageSize'],
  ])('returns the shared error envelope for invalid %s', async (url, field) => {
    const response = await fixture.request(url);
    const body = await responseBody(response);

    expect(response.status).toBe(400);
    expect(body.error).toMatchObject({ code: 'INVALID_QUERY_PARAM' });
    expect(body.error.issues).toEqual(expect.arrayContaining([expect.objectContaining({ field })]));
  });

  it('returns the shared error envelope for an unknown route', async () => {
    const response = await fixture.request('/api/missing');
    const body = await responseBody(response);

    expect(response.status).toBe(404);
    expect(body).toEqual({
      error: { code: 'NOT_FOUND', message: 'The requested resource was not found.' },
    });
  });

  it('treats blank query parameters as defaults', async () => {
    const response = await fixture.request('/api/users?page=&pageSize=&sort=&direction=');
    const body = await responseBody(response);

    expect(response.status).toBe(200);
    expect(body.pagination).toEqual({ page: 1, pageSize: 20, total: 32, hasMore: true });
  });

  it('logs method, path, status, and duration for successful and invalid requests', async () => {
    const logger = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await fixture.request('/api/users');
    await fixture.request('/api/users?sort=unknown');

    expect(logger).toHaveBeenCalledTimes(2);
    expect(logger.mock.calls[0][0]).toMatch(/^GET \/api\/users 200 \d+(\.\d+)?ms$/);
    expect(logger.mock.calls[1][0]).toMatch(/^GET \/api\/users 400 \d+(\.\d+)?ms$/);
  });
});
