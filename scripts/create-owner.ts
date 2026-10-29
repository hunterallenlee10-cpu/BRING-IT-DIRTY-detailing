/**
 * npm run create-owner -- owner@studio.com 'a-long-password'
 * Creates (or updates the password of) a Supabase Auth user and adds the email to public.admins.
 */
import { createClient } from "@supabase/supabase-js";

try {
  process.loadEnvFile?.(".env.local");
} catch {
  /* no .env.local */
}

const [email, password] = process.argv.slice(2);
if (!email || !password) {
  console.error("Usage: npm run create-owner -- email password");
  process.exit(1);
}
if (password.length < 10) {
  console.error("Use a password of at least 10 characters.");
  process.exit(1);
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (in .env.local) first.");
  console.error("Demo mode has no users: it uses DEMO_OWNER_EMAIL / DEMO_OWNER_PASSWORD instead.");
  process.exit(1);
}
const sb = createClient(url, key, { auth: { persistSession: false } });
const lower = email.trim().toLowerCase();

const created = await sb.auth.admin.createUser({ email: lower, password, email_confirm: true });
if (created.error) {
  if (!/already|registered|exists/i.test(created.error.message)) throw created.error;
  // existing user: find and update the password
  let page = 1;
  for (;;) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const u = data.users.find((x) => x.email?.toLowerCase() === lower);
    if (u) {
      const upd = await sb.auth.admin.updateUserById(u.id, { password });
      if (upd.error) throw upd.error;
      break;
    }
    if (data.users.length < 200) throw new Error("User exists but could not be found");
    page++;
  }
  console.log(`Updated password for ${lower}.`);
} else {
  console.log(`Created auth user ${lower}.`);
}
const adm = await sb.from("admins").upsert({ email: lower });
if (adm.error) throw adm.error;
console.log(`${lower} is on the owner allow-list. Sign in at /admin/login.`);
