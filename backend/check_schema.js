require('dotenv').config();
const db = require('./config/db');

async function checkSchema() {
  try {
    console.log('Checking database schema...');
    
    // Check if users table exists and show its structure
    const result = await db.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📋 Users table structure:');
    console.log('Column Name | Data Type | Nullable');
    console.log('------------|-----------|---------');
    
    result.rows.forEach(row => {
      console.log(`${row.column_name.padEnd(12)} | ${row.data_type.padEnd(10)} | ${row.is_nullable}`);
    });
    
    if (result.rows.length === 0) {
      console.log('❌ Users table does not exist!');
    } else {
      const hasGoogleId = result.rows.some(row => row.column_name === 'google_id');
      console.log(`\n${hasGoogleId ? '✅' : '❌'} google_id column: ${hasGoogleId ? 'EXISTS' : 'MISSING'}`);
    }
    
  } catch (error) {
    console.error('❌ Error checking schema:', error.message);
  } finally {
    await db.end();
  }
}

checkSchema(); 