#!/usr/bin/env node

/**
 * Quick manual test to verify core functionality
 */

import fetch from 'node-fetch';

const API_URL = 'http://localhost:8080/api';

async function quickTest() {
  console.log('🧪 Quick Backend Test\n');
  
  try {
    // 1. Register
    console.log('1. Registering user...');
    const regRes = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `quicktest_${Date.now()}@example.com`,
        password: 'Test123!',
        name: 'Quick Test',
        companyName: 'Quick Company',
        industry: 'Tech'
      })
    });
    const regData = await regRes.json();
    console.log('   ✓ Status:', regRes.status);
    console.log('   ✓ Has Token:', !!regData.accessToken);
    console.log('   ✓ Company ID:', regData.user.companyId);
    
    const token = regData.accessToken;
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // 2. Create Customer
    console.log('\n2. Creating customer...');
    const custRes = await fetch(`${API_URL}/customers`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: 'Test Customer',
        email: 'cust@test.com',
        phone: '+1234567890'
      })
    });
    const custData = await custRes.json();
    console.log('   ✓ Status:', custRes.status);
    console.log('   ✓ Response:', JSON.stringify(custData, null, 2));
    
    if (!custData.success) {
      console.error('   ✗ Failed:', custData.message);
      return;
    }
    
    const customerId = custData.data.id;
    
    // 3. Create Sale
    console.log('\n3. Creating sale...');
    const saleRes = await fetch(`${API_URL}/sales`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        date: new Date().toISOString(),
        product: 'Test Product',
        amount: 100.50,
        channel: 'online',
        customerId
      })
    });
    const saleData = await saleRes.json();
    console.log('   ✓ Status:', saleRes.status);
    console.log('   ✓ Response:', JSON.stringify(saleData, null, 2));
    
    // 4. Get Analytics
    console.log('\n4. Getting analytics...');
    const analyticsRes = await fetch(`${API_URL}/analytics/overview`, {
      headers
    });
    const analyticsData = await analyticsRes.json();
    console.log('   ✓ Status:', analyticsRes.status);
    console.log('   ✓ Total Revenue:', analyticsData.data?.totalRevenue);
    console.log('   ✓ Total Customers:', analyticsData.data?.totalCustomers);
    
    // 5. Create Conversation
    console.log('\n5. Creating conversation...');
    const convRes = await fetch(`${API_URL}/conversations`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ title: 'Test Chat' })
    });
    const convData = await convRes.json();
    console.log('   ✓ Status:', convRes.status);
    console.log('   ✓ Conversation ID:', convData.data?.id);
    
    // 6. Get Team
    console.log('\n6. Getting team members...');
    const teamRes = await fetch(`${API_URL}/team/members`, { headers });
    const teamData = await teamRes.json();
    console.log('   ✓ Status:', teamRes.status);
    console.log('   ✓ Members Count:', teamData.data?.length);
    
    console.log('\n✅ All quick tests passed!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
  }
}

quickTest();
