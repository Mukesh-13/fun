/**
 * Verification Test Suite
 * Tests input validation, rate limiting TTL cache, JWT sessions, and security constraints.
 */

const { InMemoryTtlCache } = require('./src/middleware/rateLimiter');
const { validateLoginInput } = require('./src/middleware/validator');
const { hashPassword, verifyPassword, generateSessionToken, verifySessionToken } = require('./src/services/auth.service');
const { parsePostgresConnectionString } = require('./src/config/db');

async function runTests() {
  console.log('🧪 Starting Verification Test Suite (Username-Only Auth)...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, name) {
    if (condition) {
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${name}`);
      failed++;
    }
  }

  // -------------------------------------------------------------
  // Test 0: Resilient PostgreSQL URI Parsing
  // -------------------------------------------------------------
  console.log('[Test Group 0]: Resilient PostgreSQL URI Parser');
  const complexUri = 'postgresql://web_auth_user:MyP@ss#w0rd!123@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require';
  const parsed = parsePostgresConnectionString(complexUri);
  assert(parsed.user === 'web_auth_user', 'Parses username with unencoded password characters');
  assert(parsed.password === 'MyP@ss#w0rd!123', 'Parses password containing @, #, ! without throwing Invalid URL');
  assert(parsed.host === 'aws-0-us-east-1.pooler.supabase.com', 'Parses Supabase pooler host');
  assert(parsed.port === 6543, 'Parses port 6543');
  assert(parsed.ssl && parsed.ssl.rejectUnauthorized === false, 'Enables SSL for Supabase');

  // -------------------------------------------------------------
  // Test 1: Bcrypt Hashing & Verification
  // -------------------------------------------------------------
  console.log('[Test Group 1]: Bcrypt Password Hashing & Salt');
  const password = 'CorrectHorseBatteryStaple123!';
  const { hash, salt } = await hashPassword(password);
  assert(hash.startsWith('$2a$12$'), 'Bcrypt hash generated with 12 rounds');
  const isValid = await verifyPassword(password, hash, salt);
  assert(isValid === true, 'Correct password verifies successfully');
  const isInvalid = await verifyPassword('WrongPassword!', hash, salt);
  assert(isInvalid === false, 'Incorrect password correctly rejected');

  // -------------------------------------------------------------
  // Test 2: JWT Session Generation & Verification
  // -------------------------------------------------------------
  console.log('\n[Test Group 2]: JWT Session Token Security');
  const user = { id: '123e4567-e89b-12d3-a456-426614174000', username: 'alice', role: 'admin' };
  const token = generateSessionToken(user);
  assert(typeof token === 'string' && token.split('.').length === 3, 'JWT token correctly generated');
  const decoded = verifySessionToken(token);
  assert(decoded && decoded.username === 'alice' && decoded.sub === user.id, 'JWT token successfully verified and decoded');
  const tamperedToken = token.slice(0, -4) + 'abcd';
  const badDecoded = verifySessionToken(tamperedToken);
  assert(badDecoded === null, 'Tampered JWT token rejected');

  // -------------------------------------------------------------
  // Test 3: In-Memory Rate Limiter with TTL
  // -------------------------------------------------------------
  console.log('\n[Test Group 3]: In-Memory Rate Limiter with TTL (Memory-First Shield)');
  const cache = new InMemoryTtlCache(5000);
  const testKey = 'test_device_ip_fingerprint_01';
  const maxAttempts = 3;
  const windowMs = 2000; // 2 seconds for test

  // Initial check
  let status = cache.checkLimit(testKey, maxAttempts, windowMs);
  assert(status.limited === false && status.remaining === 3, 'Initial state: not rate limited, 3 remaining');

  // Record 1st and 2nd attempt
  cache.recordAttempt(testKey, maxAttempts, windowMs);
  cache.recordAttempt(testKey, maxAttempts, windowMs);
  status = cache.checkLimit(testKey, maxAttempts, windowMs);
  assert(status.limited === false && status.remaining === 1, 'After 2 attempts: 1 remaining');

  // Record 3rd attempt (exceeds limit)
  cache.recordAttempt(testKey, maxAttempts, windowMs);
  status = cache.checkLimit(testKey, maxAttempts, windowMs);
  assert(status.limited === true && status.retryAfterSec > 0, 'After 3 attempts: rate limited in memory without DB query');

  // Reset on successful login
  cache.reset(testKey);
  status = cache.checkLimit(testKey, maxAttempts, windowMs);
  assert(status.limited === false && status.remaining === 3, 'Reset clears limit immediately');

  // -------------------------------------------------------------
  // Test 4: SQL Injection & Input Validation (Username & Password)
  // -------------------------------------------------------------
  console.log('\n[Test Group 4]: Anti-Injection & Username Validator');
  
  function mockValidate(body) {
    let statusCode = 200;
    let jsonOutput = null;
    let nextCalled = false;

    const req = { body };
    const res = {
      status: (code) => {
        statusCode = code;
        return {
          json: (data) => { jsonOutput = data; }
        };
      }
    };
    const next = () => { nextCalled = true; };

    validateLoginInput(req, res, next);
    return { statusCode, jsonOutput, nextCalled, sanitized: req.sanitized };
  }

  // Good input
  const validRes = mockValidate({ username: 'admin_user', password: 'ValidPassword123!' });
  assert(validRes.nextCalled === true && validRes.statusCode === 200, 'Valid username/password passes validation');

  // SQL Injection vector 1: ' OR '1'='1
  const sqliRes1 = mockValidate({ username: "' OR '1'='1", password: 'password' });
  assert(sqliRes1.nextCalled === false && sqliRes1.statusCode === 400, "SQL Injection payload 1 (' OR '1'='1) rejected");

  // SQL Injection vector 2: admin'; DROP TABLE users;--
  const sqliRes2 = mockValidate({ username: "admin'; DROP TABLE users;--", password: 'password' });
  assert(sqliRes2.nextCalled === false && sqliRes2.statusCode === 400, "SQL Injection payload 2 (DROP TABLE) rejected");

  // Prototype pollution attack vector
  const protoPollutionBody = JSON.parse('{"username":"admin","password":"pass","__proto__":{"admin":true}}');
  const protoRes = mockValidate(protoPollutionBody);
  assert(protoRes.nextCalled === false && protoRes.statusCode === 400, "Prototype pollution payload rejected");

  // Null byte injection
  const nullByteRes = mockValidate({ username: "admin\0injection", password: 'password' });
  assert(nullByteRes.nextCalled === false && nullByteRes.statusCode === 400, "Null byte injection rejected");

  console.log(`\n======================================================`);
  console.log(`📊 Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
