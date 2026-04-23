import fs from 'fs';
import path from 'path';

const dir = 'supabase/migrations';
const out = 'C:\\Users\\Ravi\\.gemini\\antigravity\\brain\\3d06355a-236e-49d0-8f6b-d5a7dfa7b615\\all_migrations.sql';

const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort();
let content = '-- Combined Migrations for SQL Editor\\n\\n';
for (const file of files) {
  content += `-- ==========================================\n`;
  content += `-- MIGRATION: ${file}\n`;
  content += `-- ==========================================\n\n`;
  content += fs.readFileSync(path.join(dir, file), 'utf8') + '\n\n';
}
fs.writeFileSync(out, content);
console.log('Successfully wrote ' + files.length + ' files to ' + out);
