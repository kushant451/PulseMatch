require('./setup');
const request = require('supertest');
const createApp = require('../app');

const app = createApp();

describe('Auth API', () => {
  const donorPayload = {
    name: 'Test Donor',
    email: 'donor@example.com',
    password: 'password123',
    phone: '9999999999',
    role: 'donor',
    bloodGroup: 'O+',
    weightKg: 65,
    longitude: 77.2,
    latitude: 28.6,
    address: 'Test Address',
  };

  test('registers a new donor successfully', async () => {
    const res = await request(app).post('/api/auth/register').send(donorPayload);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.email).toBe(donorPayload.email);
    expect(res.body.role).toBe('donor');
  });

  test('rejects registration with a duplicate email', async () => {
    await request(app).post('/api/auth/register').send(donorPayload);
    const res = await request(app).post('/api/auth/register').send(donorPayload);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already exists/i);
  });

  test('rejects donor registration without a blood group', async () => {
    const { bloodGroup, ...invalidPayload } = donorPayload;
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...invalidPayload, email: 'nobloodgroup@example.com' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/blood group/i);
  });

  test('rejects donor registration below minimum weight', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...donorPayload, email: 'underweight@example.com', weightKg: 40 });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/50kg/i);
  });

  test('logs in with correct credentials', async () => {
    await request(app).post('/api/auth/register').send(donorPayload);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: donorPayload.email, password: donorPayload.password });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  test('rejects login with wrong password', async () => {
    await request(app).post('/api/auth/register').send(donorPayload);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: donorPayload.email, password: 'wrongpassword' });

    expect(res.status).toBe(401);
  });

  test('protected route rejects requests with no token', async () => {
    const res = await request(app).get('/api/profile');
    expect(res.status).toBe(401);
  });
});
