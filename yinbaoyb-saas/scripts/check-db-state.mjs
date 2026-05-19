// Execute migrations 006 and 007 via Supabase REST API (rpc)
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = 'https://enffspurprzvzozgznke.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVuZmZzcHVycHJ6dnpvemd6bmtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTg3OTk0NiwiZXhwIjoyMDkxNDU1OTQ2fQ.gtiwcG0zxKJFV2kQTzXWypX5vxXmk_Yej2tQmI-aZqg';

// We'll use the Supabase management API or direct SQL execution
// The simplest approach: use supabase.sql() which isn't available in JS client
// Instead, we'll create an exec_sql RPC function first, then use it

// Actually, let's just use fetch directly to the Supabase SQL endpoint
// Supabase doesn't have a direct SQL execution endpoint from the JS client
// But we can use the REST API to check tables and then create what's missing

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  db: { schema: 'public' }
});

async function checkTable(tableName) {
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .limit(1);
  if (error) {
    console.log(`  Table ${tableName}: ${error.message}`);
    return false;
  }
  console.log(`  Table ${tableName}: OK (${data?.length ?? 0} rows sampled)`);
  return true;
}

async function checkColumn(tableName, columnName) {
  const { data, error } = await supabase
    .from(tableName)
    .select(columnName)
    .limit(1);
  if (error) {
    console.log(`  Column ${tableName}.${columnName}: ${error.message}`);
    return false;
  }
  console.log(`  Column ${tableName}.${columnName}: EXISTS`);
  return true;
}

async function checkRPC(rpcName, params = {}) {
  const { data, error } = await supabase.rpc(rpcName, params);
  if (error) {
    console.log(`  RPC ${rpcName}: ${error.message}`);
    return false;
  }
  console.log(`  RPC ${rpcName}: OK`);
  return true;
}

async function main() {
  console.log('🔍 Checking current database state...\n');
  
  // Check tables exist
  console.log('📋 Tables:');
  await checkTable('patients');
  await checkTable('appointments');
  await checkTable('profiles');
  await checkTable('therapists');
  await checkTable('scale_results');
  await checkTable('clinical_notes');
  await checkTable('therapist_availability');
  await checkTable('scale_questions');
  await checkTable('clinical_scales');
  await checkTable('parent_patients');
  
  // Check columns
  console.log('\n📋 Columns (migration 006):');
  await checkColumn('patients', 'active');
  await checkColumn('patients', 'parent_id');
  await checkColumn('patients', 'emergency_contact');
  await checkColumn('patients', 'emergency_phone');
  await checkColumn('profiles', 'email');
  await checkColumn('clinical_scales', 'name');
  await checkColumn('clinical_scales', 'acronym');
  
  // Check RPCs
  console.log('\n📋 RPC Functions:');
  await checkRPC('get_tenant_id');
  await checkRPC('get_user_role');
  await checkRPC('get_therapist_profiles');
  await checkRPC('get_profile_by_id', { profile_id: '00000000-0000-0000-0000-000000000000' });
  await checkRPC('get_all_users');
  await checkRPC('update_parent_profile', { p_user_id: '00000000-0000-0000-0000-000000000000', p_first_name: '', p_last_name: '', p_phone: '' });
  
  console.log('\n✅ Check complete!');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});