const axios = require('axios');
const { io } = require('socket.io-client');
const { startServer, db } = require('../server');

const BASE_URL = 'http://localhost:3000/api';
let authToken = '';
let batchId = '';
let socket;
let server;

describe('Features', () => {
  beforeAll(async () => {
    server = await startServer();

    // Register and login a farmer to get a token
    const farmerData = {
      phone_number: `+2547${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
      email: `farmer${Date.now()}@test.com`,
      password: 'Password123!',
      name: 'Test Farmer Features',
      user_type: 'farmer',
      location: { lat: -1.2921, lng: 36.8219, address: 'Nairobi, Kenya' },
    };
    await axios.post(`${BASE_URL}/auth/register`, farmerData);
    const login = await axios.post(`${BASE_URL}/auth/login`, {
      phone_number: farmerData.phone_number,
      password: farmerData.password,
    });
    authToken = login.data.data.access_token;

    // Create a batch to use in the tests
    const batchData = {
      crop_template_id: 1,
      quantity: 100,
      unit: 'kg',
      harvest_date: new Date().toISOString(),
    };
    const batch = await axios.post(`${BASE_URL}/farmer/batches`, batchData, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    batchId = batch.data.data.id;

    socket = io('http://localhost:3000');
    await new Promise((resolve) => {
      socket.on('connect', resolve);
    });
  });

  afterAll(async () => {
    socket.disconnect();
    await db.sequelize.close();
    server.close();
  });

  it('should receive a new-listing event when a new listing is created', (done) => {
    socket.on('new-listing', (listing) => {
      expect(listing).toHaveProperty('id');
      done();
    });

    axios.post(`${BASE_URL}/farmer/listings`, {
      batch_id: batchId,
      price_per_unit: 100,
      currency: 'KES',
    }, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
  });

  it('should cache the marketplace listings', async () => {
    const startTime = Date.now();
    await axios.get(`${BASE_URL}/marketplace/listings`);
    const firstCallTime = Date.now() - startTime;

    const startTime2 = Date.now();
    await axios.get(`${BASE_URL}/marketplace/listings`);
    const secondCallTime = Date.now() - startTime2;

    expect(secondCallTime).toBeLessThan(firstCallTime);
  });

  it('should filter listings by geolocation', async () => {
    const response = await axios.get(`${BASE_URL}/marketplace/listings`, {
      params: {
        location: '-1.2921,36.8219',
        radius: 10,
      },
    });
    expect(response.data.data.listings.length).toBeGreaterThan(0);
  });
});
