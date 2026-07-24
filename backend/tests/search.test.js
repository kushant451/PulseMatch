require('./setup');
const request = require('supertest');
const createApp = require('../app');
const User = require('../models/User');

const app = createApp();

// Two points ~1.1km apart (safe for a 10km test radius), one far away (~65km)
const NEAR_ORIGIN = { longitude: 77.2090, latitude: 28.6139 }; // Delhi
const NEAR_POINT = { longitude: 77.2200, latitude: 28.6200 }; // ~1.3km away
const FAR_POINT = { longitude: 76.9, latitude: 28.5 }; // ~30km+ away

async function registerAndLogin(overrides = {}) {
  const payload = {
    name: 'Donor',
    email: `donor_${Date.now()}_${Math.random()}@example.com`,
    password: 'password123',
    phone: '9999999999',
    role: 'donor',
    bloodGroup: 'O+',
    weightKg: 65,
    longitude: NEAR_ORIGIN.longitude,
    latitude: NEAR_ORIGIN.latitude,
    address: 'Origin',
    ...overrides,
  };
  const res = await request(app).post('/api/auth/register').send(payload);
  return res.body; // includes token
}

describe('Search API — geo-matching', () => {
  test('finds a donor within the search radius', async () => {
    await registerAndLogin({
      email: 'near@example.com',
      longitude: NEAR_POINT.longitude,
      latitude: NEAR_POINT.latitude,
      bloodGroup: 'O+',
    });
    const requester = await registerAndLogin({ email: 'requester1@example.com' });

    const res = await request(app)
      .get('/api/search/donors')
      .set('Authorization', `Bearer ${requester.token}`)
      .query({
        bloodGroup: 'O+',
        longitude: NEAR_ORIGIN.longitude,
        latitude: NEAR_ORIGIN.latitude,
        maxDistanceKm: 10,
      });

    expect(res.status).toBe(200);
    expect(res.body.count).toBeGreaterThanOrEqual(1);
    expect(res.body.donors.some((d) => d.email === 'near@example.com')).toBe(true);
  });

  test('excludes a donor outside the search radius', async () => {
    await registerAndLogin({
      email: 'far@example.com',
      longitude: FAR_POINT.longitude,
      latitude: FAR_POINT.latitude,
      bloodGroup: 'O+',
    });
    const requester = await registerAndLogin({ email: 'requester2@example.com' });

    const res = await request(app)
      .get('/api/search/donors')
      .set('Authorization', `Bearer ${requester.token}`)
      .query({
        bloodGroup: 'O+',
        longitude: NEAR_ORIGIN.longitude,
        latitude: NEAR_ORIGIN.latitude,
        maxDistanceKm: 10,
      });

    expect(res.status).toBe(200);
    expect(res.body.donors.some((d) => d.email === 'far@example.com')).toBe(false);
  });

  test('excludes an ineligible donor (donated within the last 90 days)', async () => {
    const donor = await registerAndLogin({
      email: 'ineligible@example.com',
      longitude: NEAR_POINT.longitude,
      latitude: NEAR_POINT.latitude,
      bloodGroup: 'O+',
    });

    // Simulate a donation 10 days ago — should fail the 90-day eligibility check
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    await User.findByIdAndUpdate(donor._id, { lastDonationDate: tenDaysAgo });

    const requester = await registerAndLogin({ email: 'requester3@example.com' });

    const res = await request(app)
      .get('/api/search/donors')
      .set('Authorization', `Bearer ${requester.token}`)
      .query({
        bloodGroup: 'O+',
        longitude: NEAR_ORIGIN.longitude,
        latitude: NEAR_ORIGIN.latitude,
        maxDistanceKm: 10,
      });

    expect(res.status).toBe(200);
    expect(res.body.donors.some((d) => d.email === 'ineligible@example.com')).toBe(false);
  });

  test('rejects search without required query params', async () => {
    const requester = await registerAndLogin({ email: 'requester4@example.com' });

    const res = await request(app)
      .get('/api/search/donors')
      .set('Authorization', `Bearer ${requester.token}`)
      .query({ bloodGroup: 'O+' }); // missing longitude/latitude

    expect(res.status).toBe(400);
  });

  test('rejects search with no auth token', async () => {
    const res = await request(app).get('/api/search/donors').query({
      bloodGroup: 'O+',
      longitude: NEAR_ORIGIN.longitude,
      latitude: NEAR_ORIGIN.latitude,
    });
    expect(res.status).toBe(401);
  });
});
