import { Pool, PoolConfig } from 'pg';

function safeDecode(val: string): string {
  if (!val) return '';
  try {
    return decodeURIComponent(val);
  } catch {
    return val;
  }
}

export function parsePostgresConnectionString(rawUri: string | undefined): PoolConfig | null {
  if (!rawUri || typeof rawUri !== 'string') {
    return null;
  }

  const uri = rawUri.trim().replace(/^["']|["']$/g, '');
  if (!uri) return null;

  if (/\[YOUR[-_]?(?:PASSWORD|PROJECT[-_]?REF|DATABASE)\]/i.test(uri)) {
    console.warn('⚠️ [Database Config Warning]: Your DATABASE_URL contains placeholder brackets. Please replace them.');
  }

  const schemeMatch = uri.match(/^(postgres(?:ql)?):\/\/(.*)$/i);
  if (!schemeMatch) {
    return { connectionString: uri };
  }

  const body = schemeMatch[2];
  const [mainPart, queryPart] = body.split('?');

  let user = '';
  let password = '';
  let hostAndPath = mainPart;

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

  const firstSlashIndex = hostAndPath.indexOf('/');
  const hostAndPort = firstSlashIndex !== -1 ? hostAndPath.slice(0, firstSlashIndex) : hostAndPath;
  const database = firstSlashIndex !== -1 ? hostAndPath.slice(firstSlashIndex + 1) : 'postgres';

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
  
  // Default to false for Supabase certificates unless DB_SSL_REJECT_UNAUTHORIZED is explicitly 'true'
  const rejectUnauthorized = process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true';

  return {
    user,
    password,
    host,
    port,
    database: database.split('?')[0] || 'postgres',
    ssl: isSupabase || process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized }
      : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  };
}

const globalForDb = globalThis as unknown as {
  pgPool?: Pool;
};

export function getPool(): Pool | null {
  if (!globalForDb.pgPool) {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString || !connectionString.trim()) {
      console.warn('⚠️ [Database] DATABASE_URL is not set.');
      return null;
    }

    try {
      const poolConfig = parsePostgresConnectionString(connectionString);
      if (!poolConfig) {
        console.warn('⚠️ [Database] Invalid DATABASE_URL format.');
        return null;
      }

      const pool = new Pool({
        ...poolConfig,
        max: process.env.NODE_ENV === 'production' ? 5 : 10,
        allowExitOnIdle: true,
      });

      pool.on('error', (err) => {
        console.error('❌ [Database Pool Background Error]:', err.message);
      });

      globalForDb.pgPool = pool;
    } catch (err: unknown) {
      console.error('❌ [Database Pool Init Error]:', err instanceof Error ? err.message : err);
      return null;
    }
  }
  return globalForDb.pgPool;
}

export async function query(text: string, params: unknown[] = []) {
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
  } catch (error: unknown) {
    console.error('❌ [DB Query Error]:', error instanceof Error ? error.message : error);
    throw error;
  }
}

export async function userQuery(text: string, params: unknown[] = [], user: { id: string, role?: string }) {
  const dbPool = getPool();
  if (!dbPool) throw new Error('Database connection not configured.');

  const client = await dbPool.connect();
  try {
    await client.query('BEGIN');
    
    // Drop superuser privileges for this transaction to enforce RLS
    await client.query("SET LOCAL role = 'authenticated';");
    
    // Inject the custom JWT claims so Supabase's auth.uid() function works
    await client.query(
      `SET LOCAL "request.jwt.claims" = $1;`,
      [JSON.stringify({ sub: user.id, role: user.role || 'authenticated' })]
    );

    const start = Date.now();
    const res = await client.query(text, params);
    const duration = Date.now() - start;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`⚡ [DB UserQuery] executed in ${duration}ms | Rows: ${res.rowCount}`);
    }
    
    await client.query('COMMIT');
    return res;
  } catch (error: unknown) {
    await client.query('ROLLBACK');
    console.error('❌ [DB UserQuery Error]:', error instanceof Error ? error.message : error);
    throw error;
  } finally {
    client.release();
  }
}

