/**
 * CrowdFlow Load Test Script
 * Usage: node scripts/load-test.js [BASE_URL]
 *
 * Simulates concurrent attendee connections to verify:
 * - API response times remain <500ms at P95
 * - SSE connections remain stable
 * - Health endpoint stays responsive
 */

const BASE_URL = process.argv[2] || 'http://localhost:3000';

const ENDPOINTS = [
  { path: '/api/health', method: 'GET', weight: 0.1 },
  { path: '/api/crowd/density', method: 'GET', weight: 0.4 },
  { path: '/api/queues', method: 'GET', weight: 0.3 },
  { path: '/api/wayfinding/route?from=zone-north-1&to=zone-south-1', method: 'GET', weight: 0.2 },
];

const CONFIG = {
  concurrentUsers: 100,
  durationSeconds: 30,
  rampUpSeconds: 5,
};

const results = {
  total: 0,
  success: 0,
  errors: 0,
  latencies: [],
  statusCodes: {},
};

function selectEndpoint() {
  const rand = Math.random();
  let cumulative = 0;
  for (const ep of ENDPOINTS) {
    cumulative += ep.weight;
    if (rand <= cumulative) return ep;
  }
  return ENDPOINTS[0];
}

async function makeRequest() {
  const endpoint = selectEndpoint();
  const url = `${BASE_URL}${endpoint.path}`;
  const start = Date.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      method: endpoint.method,
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'CrowdFlow-LoadTest/1.0',
      },
    });

    clearTimeout(timeout);
    const latency = Date.now() - start;

    results.total++;
    results.latencies.push(latency);
    results.statusCodes[response.status] = (results.statusCodes[response.status] || 0) + 1;

    if (response.ok) {
      results.success++;
    } else {
      results.errors++;
    }
  } catch (error) {
    results.total++;
    results.errors++;
    results.latencies.push(Date.now() - start);
  }
}

function percentile(arr, p) {
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

async function runLoadTest() {
  console.log('=== CrowdFlow Load Test ===');
  console.log(`Target:     ${BASE_URL}`);
  console.log(`Users:      ${CONFIG.concurrentUsers}`);
  console.log(`Duration:   ${CONFIG.durationSeconds}s`);
  console.log(`Ramp-up:    ${CONFIG.rampUpSeconds}s`);
  console.log('');

  const startTime = Date.now();
  const endTime = startTime + CONFIG.durationSeconds * 1000;

  const workers = [];
  const usersPerStep = Math.ceil(CONFIG.concurrentUsers / (CONFIG.rampUpSeconds * 10));

  let activeUsers = 0;

  // Ramp up users
  const rampInterval = setInterval(() => {
    activeUsers = Math.min(activeUsers + usersPerStep, CONFIG.concurrentUsers);
    if (activeUsers >= CONFIG.concurrentUsers) clearInterval(rampInterval);
  }, 100);

  // Main loop
  while (Date.now() < endTime) {
    const batch = [];
    for (let i = 0; i < Math.max(1, activeUsers); i++) {
      batch.push(makeRequest());
    }
    await Promise.all(batch);

    // Small delay to prevent overwhelming
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  clearInterval(rampInterval);

  // Print results
  const duration = (Date.now() - startTime) / 1000;
  const rps = results.total / duration;

  console.log('=== Results ===');
  console.log(`Duration:       ${duration.toFixed(1)}s`);
  console.log(`Total Requests: ${results.total}`);
  console.log(`Successful:     ${results.success}`);
  console.log(`Errors:         ${results.errors}`);
  console.log(`RPS:            ${rps.toFixed(1)}`);
  console.log(`Error Rate:     ${((results.errors / results.total) * 100).toFixed(2)}%`);
  console.log('');

  if (results.latencies.length > 0) {
    console.log('=== Latency ===');
    console.log(`P50:  ${percentile(results.latencies, 50)}ms`);
    console.log(`P95:  ${percentile(results.latencies, 95)}ms`);
    console.log(`P99:  ${percentile(results.latencies, 99)}ms`);
    console.log(`Max:  ${Math.max(...results.latencies)}ms`);
    console.log('');
  }

  console.log('=== Status Codes ===');
  for (const [code, count] of Object.entries(results.statusCodes)) {
    console.log(`  ${code}: ${count}`);
  }

  // Pass/Fail
  console.log('');
  const p95 = percentile(results.latencies, 95);
  const errorRate = (results.errors / results.total) * 100;

  if (p95 < 500 && errorRate < 1) {
    console.log('✓ PASS: P95 < 500ms, Error rate < 1%');
  } else {
    console.log('✗ FAIL:');
    if (p95 >= 500) console.log(`  - P95 latency ${p95}ms exceeds 500ms threshold`);
    if (errorRate >= 1) console.log(`  - Error rate ${errorRate.toFixed(2)}% exceeds 1% threshold`);
    process.exit(1);
  }
}

runLoadTest().catch(console.error);
