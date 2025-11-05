#!/usr/bin/env node

/**
 * Utility script to generate a bcrypt hash for the admin password
 * Usage: node scripts/generate-password-hash.js <password>
 * 
 * This script generates a secure hash that should be stored in ADMIN_PASSWORD_HASH
 * environment variable instead of storing the plain password.
 */

const bcrypt = require('bcrypt');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function generateHash() {
  const password = process.argv[2];

  if (password) {
    // Password provided as argument
    const hash = await bcrypt.hash(password, 10);
    console.log('\n✅ Password hash generated:');
    console.log(hash);
    console.log('\n📝 Add this to your .env file as:');
    console.log(`ADMIN_PASSWORD_HASH=${hash}\n`);
    process.exit(0);
  } else {
    // Prompt for password
    rl.question('Enter admin password: ', async (password) => {
      if (!password) {
        console.error('❌ Password is required');
        process.exit(1);
      }

      const hash = await bcrypt.hash(password, 10);
      console.log('\n✅ Password hash generated:');
      console.log(hash);
      console.log('\n📝 Add this to your .env file as:');
      console.log(`ADMIN_PASSWORD_HASH=${hash}\n`);
      rl.close();
      process.exit(0);
    });
  }
}

generateHash().catch((error) => {
  console.error('Error generating hash:', error);
  process.exit(1);
});

