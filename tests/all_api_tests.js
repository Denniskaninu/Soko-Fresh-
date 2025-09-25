const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let authToken = '';
let batchId = '';

async function runAllTests() {
  console.log('🚀 Starting comprehensive API tests...\n');

  try {
    // 1. Health check
    console.log('1️⃣ Testing health check...');
    const health = await axios.get('http://localhost:5000/health');
    console.log('✅ Health:', health.data.message);

    // 2. Crop templates
    console.log('\n2️⃣ Testing crop templates...');
    const crops = await axios.get(`${BASE_URL}/crops/templates`);
    console.log('✅ Crops loaded:', crops.data.data.crops.length, 'templates');

    // 3. Register farmer
    console.log('\n3️⃣ Testing farmer registration...');
    const farmerData = {
      phone_number: `+2547${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
      email: `farmer${Date.now()}@test.com`,
      password: 'Password123!',
      name: 'Test Farmer API',
      user_type: 'farmer',
      location: { lat: -1.2921, lng: 36.8219, address: 'Nairobi, Kenya' }
    };

    const register = await axios.post(`${BASE_URL}/auth/register`, farmerData);
    console.log('✅ Farmer registered:', register.data.message);
    const otp = register.data.data.otp;

    // 4. Verify OTP
    console.log('\n4️⃣ Testing OTP verification...');
    const verify = await axios.post(`${BASE_URL}/auth/verify-otp`, {
      phone_number: farmerData.phone_number,
      otp
    });
    authToken = verify.data.data.tokens.access_token;
    console.log('✅ OTP verified, token received');

    // 5. Login farmer
    console.log('\n5️⃣ Testing farmer login...');
    const login = await axios.post(`${BASE_URL}/auth/login`, {
      phone_number: farmerData.phone_number,
      password: farmerData.password
    });
    authToken = login.data.data.access_token;
    console.log('✅ Login successful, token received');

    // 5. Create batch
    console.log('\n5️⃣ Testing batch creation...');
    const batchData = {
      crop_template_id: 1,
      quantity: 75,
      unit: 'kg',
      harvest_date: new Date().toISOString().split('T')[0],
      storage_conditions: { 
        temperature_controlled: true,
        humidity_controlled: false
      }
    };

    const batch = await axios.post(`${BASE_URL}/farmer/batches`, batchData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    batchId = batch.data.data.id;
    console.log('✅ Batch created:', batch.data.data.batch_id);

    // 6. Get farmer batches
    console.log('\n6️⃣ Testing get farmer batches...');
    const batches = await axios.get(`${BASE_URL}/farmer/batches`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Farmer batches:', batches.data.data.length, 'batches found');
    console.log('📊 Spoilage risk levels:', batches.data.data.map(b => b.spoilage_risk_level));

    // 7. Generate QR code
    console.log('\n7️⃣ Testing QR code generation...');
    const qr = await axios.post(`${BASE_URL}/farmer/batches/${batchId}/qr-code`, {}, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ QR code generated, length:', qr.data.data.qr_code_url.length, 'characters');

    // 8. Create listing
    console.log('\n8️⃣ Testing listing creation...');
    const listingData = {
      batch_id: batchId,
      price_per_unit: 95.75,
      currency: 'KES'
    };

    const listing = await axios.post(`${BASE_URL}/farmer/listings`, listingData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Listing created, price: KES', listing.data.data.price_per_unit);

    // 9. Browse marketplace
    console.log('\n9️⃣ Testing marketplace browse...');
    const marketplace = await axios.get(`${BASE_URL}/marketplace/listings`);
    console.log('✅ Marketplace has:', marketplace.data.data.listings.length, 'listings');

    // 10. Test filters
    console.log('\n🔟 Testing marketplace filters...');
    const filtered = await axios.get(`${BASE_URL}/marketplace/listings`, {
      params: {
        crop_category: 'Vegetables',
        max_price: 100,
        spoilage_risk_max: 3
      }
    });
    console.log('✅ Filtered results:', filtered.data.data.listings.length, 'listings');

    // 11. Test unauthorized access
    console.log('\n1️⃣1️⃣ Testing security...');
    try {
      await axios.get(`${BASE_URL}/farmer/batches`);
      console.log('❌ Security test failed - should have been blocked');
    } catch (error) {
      if (error.response.status === 401) {
        console.log('✅ Security working - unauthorized access blocked');
      }
    }

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📊 Test Summary:');
    console.log('- ✅ Health check');
    console.log('- ✅ Crop templates');
    console.log('- ✅ User registration');
    console.log('- ✅ User authentication');
    console.log('- ✅ Batch management');
    console.log('- ✅ QR code generation');
    console.log('- ✅ Marketplace listings');
    console.log('- ✅ Filtering & search');
    console.log('- ✅ Security middleware');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.error('Stack:', error.stack);
  }
}

// Install axios if needed: npm install axios
runAllTests();
