/**
 * Database Connection Manager (Supabase / PostgreSQL)
 * Utilizes parameterized queries via node-postgres with connection pooling.
 * Designed for least-privilege database user accounts.
 * Includes resilient URI parser that handles unencoded special characters in passwords.
 */

const { Pool } = require('pg');
require('dotenv').config();

let pool = null;

/**
 * Safely decode URI component without throwing on raw percent signs
 * @param {string} val 
 * @returns {string}
 */
function safeDecode(val) {
  if (!val) return '';
  try {
    return decodeURIComponent(val);
  } catch (e) {
    return val;
  }
}

/**
 * Parse PostgreSQL connection string into a structured PoolConfig object.
 * Avoids ERR_INVALID_URL by safely handling special characters (@, #, !, %, etc.) in passwords.
 * @param {string} rawUri 
 * @returns {import('pg').PoolConfig}
 */
function parsePostgresConnectionString(rawUri) {
  if (!rawUri || typeof rawUri !== 'string') {
    return null;
  }

  // Strip whitespace and quotes
  let uri = rawUri.trim().replace(/^["']|["']$/g, '');

  if (!uri) return null;

  // Detect literal brackets that users may forget to replace
  if (/\[YOUR[-_]?(?:PASSWORD|PROJECT[-_]?REF|DATABASE)\]/i.test(uri)) {
    console.warn('⚠️ [Database Config Warning]: Your DATABASE_URL contains placeholder brackets like [YOUR-PASSWORD]. Please replace them with your actual Supabase credentials.');
  }

  // Check protocol
  const schemeMatch = uri.match(/^(postgres(?:ql)?):\/\/(.*)$/i);
  if (!schemeMatch) {
    // If not a URI, return raw connection string fallback
    return { connectionString: uri };
  }

  const body = schemeMatch[2];
  const [mainPart, queryPart] = body.split('?');

  let user = '';
  let password = '';
  let hostAndPath = mainPart;

  // Split on LAST '@' to separate credentials from host
  const lastAtIndex = mainPart.lastIndexOf('@');
  if (lastAtIndex !== -1) {
    const authPart = mainPart.slice(0, lastAtIndex);
    hostAndPath = mainPart.slice(lastAtIndex + 1);

    const firstColonIndex = authPart.indexOf(':');
    if (firstColonIndex !== -1) {
      user = safeDecode(authPart.slice(0, firstColonIndex));
      password = safeDecode(authPart.slice(firstColonIndex + 1));
    } else {
      user = safeDecode(authPart);
    }
  }

  // Split host/port and database path
  const firstSlashIndex = hostAndPath.indexOf('/');
  const hostAndPort = firstSlashIndex !== -1 ? hostAndPath.slice(0, firstSlashIndex) : hostAndPath;
  const database = firstSlashIndex !== -1 ? hostAndPath.slice(firstSlashIndex + 1) : 'postgres';

  // Split host and port (look for last colon in host:port)
  let host = hostAndPort;
  let port = 5432;

  const colonIndex = hostAndPort.lastIndexOf(':');
  if (colonIndex !== -1) {
    host = hostAndPort.slice(0, colonIndex);
    const parsedPort = parseInt(hostAndPort.slice(colonIndex + 1), 10);
    if (!isNaN(parsedPort)) {
      port = parsedPort;
    }
  }

  const isSupabase = host.includes('supabase.co') || host.includes('pooler.supabase.com') || (queryPart && queryPart.includes('sslmode=require'));

  return {
    user,
    password,
    host,
    port,
    database: database.split('?')[0] || 'postgres',
    ssl: isSupabase || process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  };
}

function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString || !connectionString.trim()) {
      console.warn('⚠️ [Database] DATABASE_URL is not set in environment variables. Database queries will fail until provided.');
      return null;
    }

    try {
      const poolConfig = parsePostgresConnectionString(connectionString);
      if (!poolConfig) {
        console.warn('⚠️ [Database] Invalid DATABASE_URL format.');
        return null;
      }

      pool = new Pool(poolConfig);

      pool.on('error', (err) => {
        console.error('❌ [Database Pool Background Error]:', err.message);
      });
    } catch (err) {
      console.error('❌ [Database Pool Init Error]:', err.message);
      return null;
    }
  }
  return pool;
}

/**
 * Execute parameterized query safely
 * @param {string} text - Parameterized SQL string (e.g. SELECT * FROM users WHERE id = $1)
 * @param {Array} params - Array of query parameters
 */
async function query(text, params = []) {
  const dbPool = getPool();
  if (!dbPool) {
    throw new Error('Database connection not configured. Please set a valid DATABASE_URL in .env');
  }

  const start = Date.now();
  try {
    const res = await dbPool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development') {
      console.log(`⚡ [DB Query] executed in ${duration}ms | Rows: ${res.rowCount}`);
    }
    return res;
  } catch (error) {
    console.error('❌ [DB Query Error]:', error.message);
    throw error;
  }
}

/**
 * Test DB connection health
 */
async function testConnection() {
  try {
    const dbPool = getPool();
    if (!dbPool) return { connected: false, message: 'DATABASE_URL not configured' };
    const res = await dbPool.query('SELECT NOW() as server_time');
    return { connected: true, serverTime: res.rows[0].server_time };
  } catch (error) {
    return { connected: false, error: error.message };
  }
}

module.exports = {
  parsePostgresConnectionString,
  query,
  testConnection,
  getPool,
};
