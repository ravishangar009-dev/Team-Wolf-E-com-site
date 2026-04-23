import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf-8');
const urlMatch = envFile.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = envFile.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

const supabase = createClient(urlMatch[1].trim(), keyMatch[1].trim());

const email = "ravishangaraarya24@gmail.com";
const password = "ravi$aarya2324";

async function run() {
  console.log("Attempting to sign in or sign up...");
  let { data, error } = await supabase.auth.signUp({
    email: email,
    password: password,
  });

  if (error && error.message.toLowerCase().includes('already registered')) {
     console.log("User already registered, signing in...");
     const signInResult = await supabase.auth.signInWithPassword({ email, password });
     data = signInResult.data;
     error = signInResult.error;
  }

  if (error) {
    console.error("Auth error:", error.message);
    return;
  }

  if (!data?.user) {
    console.error("No user returned. Did you enable email confirmations? If so, you will need to click the link sent to your email before logging in.");
    return;
  }

  const userId = data.user.id;
  console.log("Success! Authenticated User ID:", userId);
  
  console.log("Assigning 'admin' role...");
  const { error: roleError } = await supabase
    .from('user_roles')
    .insert({ user_id: userId, role: 'admin' })
    .select();

  // If the user is already admin, it might violate unique constraints
  if (roleError && roleError.code === '23505') {
       console.log("User is already an admin!");
       return;
  }

  if (roleError) {
    console.error("Role assignment error:", roleError.message);
    console.log(`\nIf the insert failed due to RLS, please run this inside your Supabase SQL Editor:\n\nINSERT INTO user_roles (user_id, role) VALUES ('${userId}', 'admin');\n`);
  } else {
    console.log("Admin role successfully assigned!");
  }
}

run();
