/**
 * Test script to verify Django-NextAuth integration
 */

const DJANGO_API_URL = 'http://localhost:8000/api';

// Test data
const testUser = {
  email: 'test@example.com',
  password: 'testpassword123',
  firstName: 'Test',
  lastName: 'User',
  role: 'developer'
};

const testGithubUser = {
  github_id: 12345,
  username: 'testuser',
  email: 'github@example.com',
  first_name: 'GitHub',
  last_name: 'User',
  avatar_url: 'https://github.com/avatar.jpg'
};

async function testDjangoAPI() {
  console.log('🚀 Testing Django Authentication API...\n');

  try {
    // Test 1: User Registration
    console.log('1. Testing user registration...');
    const registerResponse = await fetch(`${DJANGO_API_URL}/auth/register/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: testUser.email,
        email: testUser.email,
        password: testUser.password,
        password_confirm: testUser.password,
        first_name: testUser.firstName,
        last_name: testUser.lastName,
        role: testUser.role,
      }),
    });

    if (registerResponse.ok) {
      const registerData = await registerResponse.json();
      console.log('✅ Registration successful');
      console.log('   Access Token:', registerData.access ? 'Present' : 'Missing');
      console.log('   User ID:', registerData.user?.id || 'Missing');
      console.log('   User Type:', registerData.user?.user_type || 'Missing');
    } else {
      const errorData = await registerResponse.json();
      console.log('❌ Registration failed:', errorData);
    }

    // Test 2: User Login
    console.log('\n2. Testing user login...');
    const loginResponse = await fetch(`${DJANGO_API_URL}/auth/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: testUser.email,
        password: testUser.password,
      }),
    });

    let accessToken = null;
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      accessToken = loginData.access;
      console.log('✅ Login successful');
      console.log('   Access Token:', accessToken ? 'Present' : 'Missing');
      console.log('   Refresh Token:', loginData.refresh ? 'Present' : 'Missing');
      console.log('   User Type:', loginData.user?.user_type || 'Missing');
    } else {
      const errorData = await loginResponse.json();
      console.log('❌ Login failed:', errorData);
    }

    // Test 3: Get Current User
    if (accessToken) {
      console.log('\n3. Testing get current user...');
      const userResponse = await fetch(`${DJANGO_API_URL}/auth/user/`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        console.log('✅ Get user successful');
        console.log('   User ID:', userData.id);
        console.log('   Email:', userData.email);
        console.log('   User Type:', userData.user_type);
        console.log('   Profile Completed:', userData.profile_completed);
      } else {
        const errorData = await userResponse.json();
        console.log('❌ Get user failed:', errorData);
      }
    }

    // Test 4: GitHub OAuth
    console.log('\n4. Testing GitHub OAuth...');
    const githubResponse = await fetch(`${DJANGO_API_URL}/auth/github-oauth/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testGithubUser),
    });

    if (githubResponse.ok) {
      const githubData = await githubResponse.json();
      console.log('✅ GitHub OAuth successful');
      console.log('   Created New User:', githubData.created);
      console.log('   Access Token:', githubData.access ? 'Present' : 'Missing');
      console.log('   User Type:', githubData.user?.user_type || 'Missing');
    } else {
      const errorData = await githubResponse.json();
      console.log('❌ GitHub OAuth failed:', errorData);
    }

    // Test 5: Token Refresh
    if (accessToken) {
      console.log('\n5. Testing token refresh...');
      const refreshResponse = await fetch(`${DJANGO_API_URL}/auth/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh: 'dummy_refresh_token' // This will fail, but we can test the endpoint
        }),
      });

      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        console.log('✅ Token refresh successful');
        console.log('   New Access Token:', refreshData.access ? 'Present' : 'Missing');
      } else {
        console.log('⚠️  Token refresh failed (expected with dummy token)');
      }
    }

    console.log('\n🎉 Django API tests completed!');

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

// Run the tests
testDjangoAPI();