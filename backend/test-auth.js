import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:4000/api';

async function testAuth() {
  try {
    console.log('🔐 Testing Authentication Flow...\n');

    // Step 1: Login
    console.log('1️⃣ Logging in...');
    const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'alice@acme.com',
        password: 'SecurePass123!'
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status} ${loginResponse.statusText}`);
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login successful!');
    console.log(`User: ${loginData.user.name} (${loginData.user.role})`);
    console.log(`Access Token: ${loginData.accessToken.substring(0, 20)}...\n`);

    // Step 2: Test /me endpoint
    console.log('2️⃣ Testing /me endpoint...');
    const meResponse = await fetch(`${BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${loginData.accessToken}`
      }
    });

    if (!meResponse.ok) {
      throw new Error(`/me failed: ${meResponse.status} ${meResponse.statusText}`);
    }

    const meData = await meResponse.json();
    console.log('✅ /me endpoint successful!');
    console.log('User details:', JSON.stringify(meData.user, null, 2));

    // Step 3: Test without token (should fail)
    console.log('\n3️⃣ Testing /me without token (should fail)...');
    const noTokenResponse = await fetch(`${BASE_URL}/auth/me`, {
      method: 'GET'
    });

    if (noTokenResponse.status === 401) {
      console.log('✅ Correctly rejected request without token');
    } else {
      console.log('❌ Should have been rejected');
    }

    console.log('\n🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAuth(); 