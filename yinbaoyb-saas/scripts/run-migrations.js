// Run migrations 006 and 007 against Supabase via REST API
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = 'https://enffspurprzvzozgznke.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVuZmZzcHVycHJ6dnpvemd6bmtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTg3OTk0NiwiZXhwIjoyMDkxNDU1OTQ2fQ.gtiwcG0zxKJFV2kQTzXWypX5vxXmk_Yej2tQmI-aZqg';

async function runMigration(filename) {
  const filePath = path.join(__dirname, '..', 'supabase', 'migrations', filename);
  const sql = fs.readFileSync(filePath, 'utf8');
  
  console.log(`\n📦 Running migration: ${filename}`);
  console.log(`   SQL size: ${sql.length} chars`);
  
  // Split by semicolons but handle functions with $$..$$ blocks
  const statements = [];
  let current = '';
  let insideDollarBlock = false;
  
  for (const line of sql.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('--')) {
      current += line + '\n';
      continue;
    }
    
    if (line.includes('$$')) {
      insideDollarBlock = !insideDollarBlock;
      current += line + '\n';
      if (!insideDollarBlock) {
        // End of function block — execute as one statement
        statements.push(current.trim());
        current = '';
      }
      continue;
    }
    
    if (insideDollarBlock) {
      current += line + '\n';
      continue;
    }
    
    // Regular line
    current += line + '\n';
    
    if (trimmed.endsWith(';')) {
      const stmt = current.trim();
      if (stmt && !stmt.startsWith('--')) {
        statements.push(stmt);
      }
      current = '';
    }
  }
  
  // Catch any remaining
  if (current.trim() && !current.trim().startsWith('--')) {
    statements.push(current.trim());
  }
  
  console.log(`   Statements to execute: ${statements.length}`);
  
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    db: { schema: 'public' }
  });
  
  let success = 0;
  let failed = 0;
  
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    if (!stmt || stmt.trim() === '') continue;
    
    // Skip comment-only statements
    if (stmt.trim().split('\n').every(l => l.trim().startsWith('--') || l.trim() === '')) continue;
    
    try {
      const { data, error } = await supabase.rpc('exec_sql', { query: stmt });
      if (error) {
        // Try direct REST approach
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'apikey': SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ query: stmt })
        });
        
        if (!response.ok) {
          // RPC doesn't exist — use Supabase SQL Editor instead
          console.log(`   ⚠️  Cannot execute via RPC. Use Supabase SQL Editor instead.`);
          console.log(`   Copy the migration file and paste it in: https://supabase.com/dashboard/project/enffspurprzvzozgznke/sql`);
          failed += statements.length - i;
          break;
        }
      }
      success++;
      if ((i + 1) % 5 === 0) console.log(`   ✅ ${i + 1}/${statements.length} done`);
    } catch (err) {
      console.log(`   ❌ Statement ${i + 1} failed: ${err.message}`);
      console.log(`   SQL: ${stmt.substring(0, 100)}...`);
      failed++;
    }
  }
  
  console.log(`   Result: ${success} success, ${failed} failed`);
  return { success, failed };
}

async function main() {
  console.log('🚀 Starting migrations...\n');
  
  await runMigration('006_add_patient_active_and_policies.sql');
  await runMigration('007_fix_parent_portal.sql');
  
  console.log('\n✅ Migrations complete!');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});