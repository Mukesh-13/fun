/**
 * Interactive User Seeding & Password Hashing Tool
 * Run via: npm run seed
 * Generates salted bcrypt hashes (12 rounds) and produces ready-to-run SQL for Supabase SQL Editor.
 * Does NOT execute any automated migrations or connections directly to the DB.
 */

const bcrypt = require('bcryptjs');
const readline = require('readline');

const BCRYPT_SALT_ROUNDS = 12;

async function generateSeed(username, plainPassword, role = 'admin') {
  console.log('\n🔐 Computing Salted Bcrypt Hash (12 rounds)...');
  const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
  const hash = await bcrypt.hash(plainPassword, salt);

  console.log('\n======================================================');
  console.log('✅ CREDENTIALS GENERATED SUCCESSFULLY:');
  console.log('======================================================');
  console.log(`👤 Username:     ${username}`);
  console.log(`🔑 Password:     ${plainPassword}`);
  console.log(`👑 Role:         ${role}`);
  console.log(`🛡️ Hash:         ${hash}`);
  console.log('======================================================\n');

  const sqlInsert = `INSERT INTO public.users (username, password_hash, salt, role, is_active)
VALUES (
    '${username.replace(/'/g, "''")}',
    '${hash}',
    'bcrypt_salt_rounds_12',
    '${role.replace(/'/g, "''")}',
    true
)
ON CONFLICT (username) 
DO UPDATE SET 
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    updated_at = NOW();`;

  console.log('📋 COPY & PASTE THIS INTO SUPABASE SQL EDITOR:\n');
  console.log(sqlInsert);
  console.log('\n======================================================\n');
}

async function promptInteractive() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (query) => new Promise((resolve) => rl.question(query, resolve));

  console.log('\n==================================================');
  console.log('  🛡️  Antigravity User Seeding Tool');
  console.log('==================================================');

  try {
    let username = '';
    while (!username) {
      username = (await question('👉 Enter Username: ')).trim();
      if (!username) {
        console.log('   ⚠️  Username cannot be empty.');
      } else if (!/^[a-zA-Z0-9_.-]{3,64}$/.test(username)) {
        console.log('   ⚠️  Username must be 3-64 alphanumeric characters (. _ - allowed).');
        username = '';
      }
    }

    let password = '';
    while (!password) {
      password = (await question('👉 Enter Password: ')).trim();
      if (!password) {
        console.log('   ⚠️  Password cannot be empty.');
      } else if (password.length < 6) {
        console.log('   ⚠️  Password should be at least 6 characters.');
      }
    }

    let role = (await question('👉 Enter Role [admin/user] (default: admin): ')).trim() || 'admin';

    rl.close();
    await generateSeed(username, password, role);
  } catch (error) {
    console.error('❌ Error:', error.message);
    rl.close();
  }
}

promptInteractive();
