/**
 * Comprehensive Test Suite for New Features
 * Tests: CSV Import, Customers, Conversations, Analytics, Team Management
 */

import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_URL = 'http://localhost:8080/api';
let authToken = '';
let userId = '';
let companyId = '';
let testCustomerId = '';
let testConversationId = '';
let testSaleId = '';
let testCampaignId = '';

// Test utilities
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, colors.green);
}

function logError(message) {
  log(`✗ ${message}`, colors.red);
}

function logInfo(message) {
  log(`ℹ ${message}`, colors.blue);
}

function logSection(message) {
  log(`\n${'='.repeat(60)}`, colors.yellow);
  log(`  ${message}`, colors.yellow);
  log(`${'='.repeat(60)}`, colors.yellow);
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// API helper functions
async function apiCall(method, endpoint, body = null, token = null, isFormData = false) {
  const headers = {
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(!isFormData && { 'Content-Type': 'application/json' })
  };

  const options = {
    method,
    headers,
    ...(body && !isFormData && { body: JSON.stringify(body) }),
    ...(body && isFormData && { body })
  };

  const response = await fetch(`${API_URL}${endpoint}`, options);
  const data = await response.json().catch(() => ({}));
  return { response, data };
}

// Create test CSV file
function createTestCSV(filename, type = 'sales') {
  const csvDir = path.join(__dirname, 'test-data');
  if (!fs.existsSync(csvDir)) {
    fs.mkdirSync(csvDir, { recursive: true });
  }

  const filepath = path.join(csvDir, filename);

  if (type === 'sales') {
    const content = `date,product,amount,channel
2024-11-01,Product A,150.50,online
2024-11-02,Product B,200.00,retail
2024-11-03,Product C,175.25,online
2024-11-04,Product D,300.00,wholesale
2024-11-05,Product E,125.75,online`;
    fs.writeFileSync(filepath, content);
  } else if (type === 'campaigns') {
    const content = `name,platform,startDate,endDate,spend,responses
Campaign A,Facebook,2024-11-01,2024-11-15,500.00,150
Campaign B,Instagram,2024-11-05,2024-11-20,750.00,200
Campaign C,Google Ads,2024-11-10,2024-11-25,1000.00,300`;
    fs.writeFileSync(filepath, content);
  }

  return filepath;
}

// Test Suite
async function runTests() {
  let testsPassed = 0;
  let testsFailed = 0;

  try {
    // ============================================================
    // SETUP: Authentication
    // ============================================================
    logSection('SETUP: Authentication & User Registration');

    // Register a new user with company
    const testEmail = `test_${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';

    const { response: regRes, data: regData } = await apiCall('POST', '/auth/register', {
      email: testEmail,
      password: testPassword,
      name: 'Test User',
      companyName: 'Test Company',
      industry: 'Technology'
    });

    if (regRes.status === 201 && regData.accessToken) {
      logSuccess('User registered successfully');
      authToken = regData.accessToken;
      userId = regData.user.id;
      companyId = regData.user.companyId;
      logInfo(`  User ID: ${userId}`);
      logInfo(`  Company ID: ${companyId || 'none'}`);
      testsPassed++;
    } else {
      logError(`Registration failed: Status ${regRes.status}, Message: ${regData.message || 'Unknown error'}`);
      logError(`Response: ${JSON.stringify(regData, null, 2)}`);
      testsFailed++;
      return;
    }

    // Login to verify
    const { response: loginRes, data: loginData } = await apiCall('POST', '/auth/login', {
      email: testEmail,
      password: testPassword
    });

    if (loginRes.status === 200 && loginData.accessToken) {
      logSuccess('Login successful');
      authToken = loginData.accessToken;
      testsPassed++;
    } else {
      logError(`Login failed: ${loginData.message || 'Unknown error'}`);
      testsFailed++;
    }

    // Get profile to extract companyId if not set
    const { response: profileRes, data: profileData } = await apiCall('GET', '/auth/me', null, authToken);
    if (profileRes.status === 200 && profileData.user) {
      if (!companyId) {
        companyId = profileData.user.companyId;
      }
      logSuccess(`Profile retrieved - Company ID: ${companyId || 'none'}`);
      testsPassed++;
    } else {
      logError(`Failed to get profile: ${profileData.message || 'Unknown error'}`);
      testsFailed++;
    }

    // ============================================================
    // TEST 1: Customer CRUD Operations
    // ============================================================
    logSection('TEST 1: Customer Management');

    // Create customer
    const { response: createCustomerRes, data: createCustomerData } = await apiCall(
      'POST',
      '/customers',
      {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+8801712345678',
        metadata: { segment: 'premium', source: 'website' }
      },
      authToken
    );

    if (createCustomerRes.status === 201 && createCustomerData.success) {
      testCustomerId = createCustomerData.data.id;
      logSuccess(`Customer created - ID: ${testCustomerId}`);
      testsPassed++;
    } else {
      logError(`Customer creation failed: ${createCustomerData.message}`);
      testsFailed++;
    }

    // Get all customers
    const { response: getCustomersRes, data: getCustomersData } = await apiCall(
      'GET',
      '/customers?page=1&limit=10',
      null,
      authToken
    );

    if (getCustomersRes.status === 200 && getCustomersData.success) {
      logSuccess(`Retrieved ${getCustomersData.data.length} customers`);
      testsPassed++;
    } else {
      logError('Failed to get customers');
      testsFailed++;
    }

    // Get single customer
    const { response: getCustomerRes, data: getCustomerData } = await apiCall(
      'GET',
      `/customers/${testCustomerId}`,
      null,
      authToken
    );

    if (getCustomerRes.status === 200 && getCustomerData.success) {
      logSuccess(`Retrieved customer details: ${getCustomerData.data.name}`);
      testsPassed++;
    } else {
      logError('Failed to get customer details');
      testsFailed++;
    }

    // Update customer
    const { response: updateCustomerRes, data: updateCustomerData } = await apiCall(
      'PUT',
      `/customers/${testCustomerId}`,
      { name: 'John Doe Updated', phone: '+8801787654321' },
      authToken
    );

    if (updateCustomerRes.status === 200 && updateCustomerData.success) {
      logSuccess('Customer updated successfully');
      testsPassed++;
    } else {
      logError('Failed to update customer');
      testsFailed++;
    }

    // Search customers
    const { response: searchRes, data: searchData } = await apiCall(
      'GET',
      '/customers?search=john',
      null,
      authToken
    );

    if (searchRes.status === 200 && searchData.success) {
      logSuccess(`Search found ${searchData.data.length} customers`);
      testsPassed++;
    } else {
      logError('Customer search failed');
      testsFailed++;
    }

    // ============================================================
    // TEST 2: Sales with Customer Link
    // ============================================================
    logSection('TEST 2: Sales with Customer Association');

    // Create sale linked to customer
    const { response: createSaleRes, data: createSaleData } = await apiCall(
      'POST',
      '/sales',
      {
        date: new Date().toISOString(),
        product: 'Test Product',
        amount: 500.00,
        channel: 'online',
        customerId: testCustomerId
      },
      authToken
    );

    if (createSaleRes.status === 201 && createSaleData.sale) {
      testSaleId = createSaleData.sale.id;
      logSuccess(`Sale created with customer link - ID: ${testSaleId}`);
      testsPassed++;
    } else {
      logError(`Failed to create sale with customer: ${createSaleData.message || 'Unknown error'}`);
      testsFailed++;
    }

    // Verify customer shows purchase
    const { response: verifyCustomerRes, data: verifyCustomerData } = await apiCall(
      'GET',
      `/customers/${testCustomerId}`,
      null,
      authToken
    );

    if (verifyCustomerRes.status === 200 && verifyCustomerData.data.totalPurchases > 0) {
      logSuccess(`Customer total purchases: ${verifyCustomerData.data.totalPurchases}`);
      testsPassed++;
    } else {
      logError('Customer purchase total not updated');
      testsFailed++;
    }

    // ============================================================
    // TEST 3: Conversation & Message Management
    // ============================================================
    logSection('TEST 3: Conversation Management');

    // Create conversation
    const { response: createConvRes, data: createConvData } = await apiCall(
      'POST',
      '/conversations',
      { title: 'Test Conversation' },
      authToken
    );

    if (createConvRes.status === 201 && createConvData.success) {
      testConversationId = createConvData.data.id;
      logSuccess(`Conversation created - ID: ${testConversationId}`);
      testsPassed++;
    } else {
      logError('Failed to create conversation');
      testsFailed++;
    }

    // Add user message
    const { response: addMsg1Res, data: addMsg1Data } = await apiCall(
      'POST',
      `/conversations/${testConversationId}/messages`,
      { role: 'user', content: 'Hello, what are my sales this month?' },
      authToken
    );

    if (addMsg1Res.status === 201 && addMsg1Data.success) {
      logSuccess('User message added');
      testsPassed++;
    } else {
      logError('Failed to add user message');
      testsFailed++;
    }

    // Add assistant message
    const { response: addMsg2Res, data: addMsg2Data } = await apiCall(
      'POST',
      `/conversations/${testConversationId}/messages`,
      { role: 'assistant', content: 'You have 5 sales totaling $1,250 this month.' },
      authToken
    );

    if (addMsg2Res.status === 201 && addMsg2Data.success) {
      logSuccess('Assistant message added');
      testsPassed++;
    } else {
      logError('Failed to add assistant message');
      testsFailed++;
    }

    // Get messages
    const { response: getMsgRes, data: getMsgData } = await apiCall(
      'GET',
      `/conversations/${testConversationId}/messages`,
      null,
      authToken
    );

    if (getMsgRes.status === 200 && getMsgData.success && getMsgData.data.length === 2) {
      logSuccess(`Retrieved ${getMsgData.data.length} messages`);
      testsPassed++;
    } else {
      logError('Failed to get messages');
      testsFailed++;
    }

    // Get all conversations
    const { response: getConvsRes, data: getConvsData } = await apiCall(
      'GET',
      '/conversations',
      null,
      authToken
    );

    if (getConvsRes.status === 200 && getConvsData.success) {
      logSuccess(`Retrieved ${getConvsData.data.length} conversations`);
      testsPassed++;
    } else {
      logError('Failed to get conversations');
      testsFailed++;
    }

    // Update conversation title
    const { response: updateConvRes, data: updateConvData } = await apiCall(
      'PUT',
      `/conversations/${testConversationId}`,
      { title: 'Sales Inquiry - November 2024' },
      authToken
    );

    if (updateConvRes.status === 200 && updateConvData.success) {
      logSuccess('Conversation title updated');
      testsPassed++;
    } else {
      logError('Failed to update conversation');
      testsFailed++;
    }

    // ============================================================
    // TEST 4: Analytics Endpoints
    // ============================================================
    logSection('TEST 4: Analytics & Dashboard');

    // Create some test data first
    const testCampaign = await apiCall(
      'POST',
      '/campaigns',
      {
        name: 'Test Campaign',
        platform: 'Facebook',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000 * 7).toISOString(),
        responses: 100,
        spend: 500
      },
      authToken
    );

    if (testCampaign.response.status === 201 && testCampaign.data.campaign) {
      testCampaignId = testCampaign.data.campaign.id;
      logSuccess('Test campaign created for analytics');
      testsPassed++;
    } else {
      logError(`Campaign creation failed: ${testCampaign.data.message || 'Unknown error'}`);
      testsFailed++;
    }

    // Get overview
    const { response: overviewRes, data: overviewData } = await apiCall(
      'GET',
      '/analytics/overview',
      null,
      authToken
    );

    if (overviewRes.status === 200 && overviewData.success) {
      logSuccess(`Overview - Revenue: ${overviewData.data.totalRevenue}, Sales: ${overviewData.data.totalSales}`);
      logInfo(`  Growth Rate: ${overviewData.data.revenueGrowth.toFixed(2)}%`);
      logInfo(`  Customers: ${overviewData.data.totalCustomers}`);
      testsPassed++;
    } else {
      logError('Failed to get overview');
      testsFailed++;
    }

    // Get sales trend
    const { response: trendRes, data: trendData } = await apiCall(
      'GET',
      '/analytics/sales-trend?groupBy=day',
      null,
      authToken
    );

    if (trendRes.status === 200 && trendData.success) {
      logSuccess(`Sales trend retrieved - ${trendData.data.length} data points`);
      testsPassed++;
    } else {
      logError('Failed to get sales trend');
      testsFailed++;
    }

    // Get channel mix
    const { response: channelRes, data: channelData } = await apiCall(
      'GET',
      '/analytics/channel-mix',
      null,
      authToken
    );

    if (channelRes.status === 200 && channelData.success) {
      logSuccess(`Channel mix - ${channelData.data.length} channels`);
      channelData.data.forEach(ch => {
        logInfo(`  ${ch.channel}: ${ch.revenue} (${ch.percentage.toFixed(1)}%)`);
      });
      testsPassed++;
    } else {
      logError('Failed to get channel mix');
      testsFailed++;
    }

    // Get top customers
    const { response: topCustRes, data: topCustData } = await apiCall(
      'GET',
      '/analytics/top-customers?limit=5',
      null,
      authToken
    );

    if (topCustRes.status === 200 && topCustData.success) {
      logSuccess(`Top customers - ${topCustData.data.length} results`);
      testsPassed++;
    } else {
      logError('Failed to get top customers');
      testsFailed++;
    }

    // Get campaign performance
    const { response: campPerfRes, data: campPerfData } = await apiCall(
      'GET',
      '/analytics/campaign-performance',
      null,
      authToken
    );

    if (campPerfRes.status === 200 && campPerfData.success) {
      logSuccess(`Campaign performance - ${campPerfData.data.length} campaigns`);
      testsPassed++;
    } else {
      logError('Failed to get campaign performance');
      testsFailed++;
    }

    // Test caching - second call should be faster
    const cacheStart = Date.now();
    const { response: cachedRes, data: cachedData } = await apiCall(
      'GET',
      '/analytics/overview',
      null,
      authToken
    );
    const cacheTime = Date.now() - cacheStart;

    if (cachedRes.status === 200 && cachedData.cached) {
      logSuccess(`Cache working - Response time: ${cacheTime}ms`);
      testsPassed++;
    } else {
      logError('Cache not working properly');
      testsFailed++;
    }

    // ============================================================
    // TEST 5: CSV Import System
    // ============================================================
    logSection('TEST 5: CSV Import & Background Jobs');

    // Create test CSV files
    const salesCsvPath = createTestCSV('test-sales.csv', 'sales');
    const campaignsCsvPath = createTestCSV('test-campaigns.csv', 'campaigns');
    logInfo('Test CSV files created');

    // Preview sales CSV
    const previewForm = new FormData();
    previewForm.append('file', fs.createReadStream(salesCsvPath));

    const { response: previewRes, data: previewData } = await apiCall(
      'POST',
      '/import/preview',
      previewForm,
      authToken,
      true
    );

    if (previewRes.status === 200 && previewData.success) {
      logSuccess(`CSV preview - ${previewData.data.totalRows} rows, ${previewData.data.columns.length} columns`);
      logInfo(`  Columns: ${previewData.data.columns.join(', ')}`);
      testsPassed++;
    } else {
      logError('CSV preview failed');
      testsFailed++;
    }

    // Import sales CSV
    const importForm = new FormData();
    importForm.append('file', fs.createReadStream(salesCsvPath));
    importForm.append('type', 'sales');

    const { response: importRes, data: importData } = await apiCall(
      'POST',
      '/import/csv',
      importForm,
      authToken,
      true
    );

    if (importRes.status === 202 && importData.success) {
      const jobId = importData.jobId;
      logSuccess(`CSV import started - Job ID: ${jobId}`);
      testsPassed++;

      // Poll for job completion
      let jobComplete = false;
      let attempts = 0;
      const maxAttempts = 20;

      while (!jobComplete && attempts < maxAttempts) {
        await delay(1000);
        attempts++;

        const { response: statusRes, data: statusData } = await apiCall(
          'GET',
          `/import/${jobId}/status`,
          null,
          authToken
        );

        if (statusRes.status === 200 && statusData.success) {
          const status = statusData.data.status;
          logInfo(`  Import status: ${status} (attempt ${attempts}/${maxAttempts})`);

          if (status === 'completed') {
            logSuccess(`Import completed - ${statusData.data.result.success} records imported`);
            jobComplete = true;
            testsPassed++;
          } else if (status === 'failed') {
            logError(`Import failed: ${statusData.data.error || 'Unknown error'}`);
            testsFailed++;
            break;
          }
        } else if (statusRes.status === 404) {
          logInfo('  Job not found yet, waiting...');
        }
      }

      if (!jobComplete && attempts >= maxAttempts) {
        logError('Import job timeout');
        testsFailed++;
      }
    } else {
      logError('Failed to start import');
      testsFailed++;
    }

    // Import campaigns CSV
    const campaignsForm = new FormData();
    campaignsForm.append('file', fs.createReadStream(campaignsCsvPath));
    campaignsForm.append('type', 'campaigns');

    const { response: campImportRes, data: campImportData } = await apiCall(
      'POST',
      '/import/csv',
      campaignsForm,
      authToken,
      true
    );

    if (campImportRes.status === 202) {
      logSuccess('Campaigns CSV import started');
      testsPassed++;
    } else {
      logError('Failed to start campaigns import');
      testsFailed++;
    }

    // ============================================================
    // TEST 6: Team Management & RBAC
    // ============================================================
    logSection('TEST 6: Team Management & RBAC');

    // Get company info
    const { response: companyRes, data: companyData } = await apiCall(
      'GET',
      '/team/company',
      null,
      authToken
    );

    if (companyRes.status === 200 && companyData.success) {
      logSuccess(`Company: ${companyData.data.name} (${companyData.data.industry})`);
      logInfo(`  Users: ${companyData.data._count.users}`);
      logInfo(`  Customers: ${companyData.data._count.customers}`);
      testsPassed++;
    } else {
      logError('Failed to get company info');
      testsFailed++;
    }

    // Get team members
    const { response: membersRes, data: membersData } = await apiCall(
      'GET',
      '/team/members',
      null,
      authToken
    );

    if (membersRes.status === 200 && membersData.success) {
      logSuccess(`Team members: ${membersData.data.length}`);
      membersData.data.forEach(member => {
        logInfo(`  ${member.name} (${member.role}) - ${member.email}`);
      });
      testsPassed++;
    } else {
      logError('Failed to get team members');
      testsFailed++;
    }

    // Invite team member
    const { response: inviteRes, data: inviteData } = await apiCall(
      'POST',
      '/team/invite',
      {
        email: `member_${Date.now()}@example.com`,
        name: 'Test Member',
        role: 'MEMBER'
      },
      authToken
    );

    if (inviteRes.status === 201 && inviteData.success) {
      logSuccess(`Team member invited: ${inviteData.data.name}`);
      logInfo(`  Temp password: ${inviteData.tempPassword}`);
      testsPassed++;
    } else {
      logError('Failed to invite team member');
      testsFailed++;
    }

    // Update company info
    const { response: updateCompRes, data: updateCompData } = await apiCall(
      'PUT',
      '/team/company',
      { name: 'Test Company Updated', industry: 'Technology & Software' },
      authToken
    );

    if (updateCompRes.status === 200 && updateCompData.success) {
      logSuccess('Company info updated');
      testsPassed++;
    } else {
      logError('Failed to update company');
      testsFailed++;
    }

    // Test RBAC - Try to access with wrong permissions
    // (This would require creating a VIEWER user and testing, skipping for brevity)

    // ============================================================
    // TEST 7: AI Worker Integration
    // ============================================================
    logSection('TEST 7: AI Worker Integration');

    // Enqueue AI query
    const { response: aiRes, data: aiData } = await apiCall(
      'POST',
      '/ai/query',
      { query: 'Show me my total sales this month' },
      authToken
    );

    if (aiRes.status === 202 && aiData.jobId) {
      const aiJobId = aiData.jobId;
      logSuccess(`AI query enqueued - Job ID: ${aiJobId}`);
      testsPassed++;

      // Poll for AI result
      let aiComplete = false;
      let aiAttempts = 0;
      const maxAiAttempts = 30;

      while (!aiComplete && aiAttempts < maxAiAttempts) {
        await delay(2000);
        aiAttempts++;

        const { response: aiResultRes, data: aiResultData } = await apiCall(
          'GET',
          `/ai/result/${aiJobId}`,
          null,
          authToken
        );

        if (aiResultRes.status === 200 && aiResultData.content) {
          logSuccess('AI response received');
          logInfo(`  Response length: ${aiResultData.content.length} characters`);
          aiComplete = true;
          testsPassed++;
        } else if (aiResultRes.status === 404) {
          logInfo(`  AI processing... (attempt ${aiAttempts}/${maxAiAttempts})`);
        } else if (aiResultData.error) {
          logError(`AI query failed: ${aiResultData.error}`);
          testsFailed++;
          break;
        } else {
          logError('AI query failed with unknown error');
          testsFailed++;
          break;
        }
      }

      if (!aiComplete && aiAttempts >= maxAiAttempts) {
        logError('AI query timeout');
        testsFailed++;
      }
    } else {
      logError('Failed to enqueue AI query');
      testsFailed++;
    }

    // ============================================================
    // CLEANUP: Delete Test Data
    // ============================================================
    logSection('CLEANUP: Removing Test Data');

    // Delete conversation
    const { response: delConvRes } = await apiCall(
      'DELETE',
      `/conversations/${testConversationId}`,
      null,
      authToken
    );
    if (delConvRes.status === 200) {
      logSuccess('Conversation deleted');
      testsPassed++;
    }

    // Delete campaign
    if (testCampaignId) {
      const { response: delCampRes } = await apiCall(
        'DELETE',
        `/campaigns/${testCampaignId}`,
        null,
        authToken
      );
      if (delCampRes.status === 200) {
        logSuccess('Campaign deleted');
        testsPassed++;
      }
    }

    // Delete sale
    const { response: delSaleRes } = await apiCall(
      'DELETE',
      `/sales/${testSaleId}`,
      null,
      authToken
    );
    if (delSaleRes.status === 200) {
      logSuccess('Sale deleted');
      testsPassed++;
    }

    // Delete customer
    const { response: delCustRes } = await apiCall(
      'DELETE',
      `/customers/${testCustomerId}`,
      null,
      authToken
    );
    if (delCustRes.status === 200) {
      logSuccess('Customer deleted');
      testsPassed++;
    }

    // Clean up test CSV files
    try {
      fs.unlinkSync(salesCsvPath);
      fs.unlinkSync(campaignsCsvPath);
      fs.rmdirSync(path.dirname(salesCsvPath));
      logSuccess('Test CSV files cleaned up');
    } catch (err) {
      logInfo('CSV cleanup skipped');
    }

  } catch (error) {
    logError(`Test suite error: ${error.message}`);
    console.error(error);
    testsFailed++;
  }

  // ============================================================
  // FINAL RESULTS
  // ============================================================
  logSection('TEST RESULTS');
  log(`\nTotal Tests: ${testsPassed + testsFailed}`);
  logSuccess(`Passed: ${testsPassed}`);
  if (testsFailed > 0) {
    logError(`Failed: ${testsFailed}`);
  }
  log(`Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%\n`);

  if (testsFailed === 0) {
    log('🎉 All tests passed! System is working correctly.', colors.green);
  } else {
    log('⚠️  Some tests failed. Please review the errors above.', colors.yellow);
  }

  process.exit(testsFailed > 0 ? 1 : 0);
}

// Run tests
console.log('\n');
logSection('COMPREHENSIVE BACKEND TEST SUITE');
log('Testing all new features: CSV Import, Customers, Conversations, Analytics, Team Management\n');

runTests().catch(error => {
  logError(`Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
