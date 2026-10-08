import { createClient } from "@supabase/supabase-js";
import { randomInt } from "node:crypto";
import { stdin, stdout } from "node:process";

const adminAccount = {
  username: "admin001",
  fullName: "Library Administrator",
  email: "admin001@admins.scan2seat.invalid",
};

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl) {
  throw new Error("Set SUPABASE_URL in the local environment first.");
}
if (!stdin.isTTY || typeof stdin.setRawMode !== "function") {
  throw new Error("Run this account setup script in an interactive terminal so secrets can be entered without echo.");
}

function readHiddenInput(label) {
  return new Promise((resolve, reject) => {
    stdout.write(label);
    stdin.setRawMode(true);
    stdin.resume();
    let value = "";

    const cleanup = () => {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.removeListener("data", onData);
    };
    const onData = (chunk) => {
      for (const character of chunk.toString("utf8")) {
        if (character === "\u0003") {
          cleanup();
          stdout.write("\n");
          reject(new Error("Account setup cancelled."));
          return;
        }
        if (character === "\r" || character === "\n") {
          cleanup();
          stdout.write("\n");
          resolve(value);
          return;
        }
        if (character === "\u007f" || character === "\b") value = value.slice(0, -1);
        else value += character;
      }
    };
    stdin.on("data", onData);
  });
}

const privateServiceRoleKey = serviceRoleKey || await readHiddenInput(
  "Enter the Supabase service-role key (input hidden): ",
);
const supabase = createClient(supabaseUrl, privateServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function generateTemporaryPassword() {
  const lowercase = "abcdefghijkmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const digits = "23456789";
  const symbols = "!@#$%*-_";
  const alphabet = lowercase + uppercase + digits + symbols;
  const characters = [
    lowercase[randomInt(lowercase.length)],
    uppercase[randomInt(uppercase.length)],
    digits[randomInt(digits.length)],
    symbols[randomInt(symbols.length)],
  ];
  while (characters.length < 24) characters.push(alphabet[randomInt(alphabet.length)]);
  for (let index = characters.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1);
    [characters[index], characters[swapIndex]] = [characters[swapIndex], characters[index]];
  }
  return characters.join("");
}

const { data: existingProfile, error: lookupError } = await supabase
  .from("users")
  .select("id, role")
  .eq("student_id", adminAccount.username)
  .maybeSingle();
if (lookupError) {
  throw new Error(`Could not check administrator ${adminAccount.username}: ${lookupError.message}`);
}
if (existingProfile) {
  if (existingProfile.role !== "admin") {
    throw new Error(`ID ${adminAccount.username} is already assigned to a non-administrator profile.`);
  }
  console.log(`Administrator ${adminAccount.username} already exists. No password was changed.`);
} else {
  const password = generateTemporaryPassword();
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email: adminAccount.email,
    password,
    email_confirm: true,
    user_metadata: { admin_id: adminAccount.username },
  });
  if (createError || !created.user) {
    throw new Error(`Could not create administrator ${adminAccount.username}: ${createError?.message ?? "No Auth user returned."}`);
  }

  const { error: profileError } = await supabase.from("users").insert({
    id: created.user.id,
    student_id: adminAccount.username,
    full_name: adminAccount.fullName,
    role: "admin",
    account_status: "active",
    must_change_password: true,
  });
  if (profileError) {
    const { error: cleanupError } = await supabase.auth.admin.deleteUser(created.user.id);
    if (cleanupError) {
      console.error(`Could not clean up the incomplete Auth account: ${cleanupError.message}`);
    }
    throw new Error(`Could not create administrator profile: ${profileError.message}`);
  }

  console.log(`\nCreated administrator ${adminAccount.username}. Copy this temporary password directly into your password manager now:\n${adminAccount.username}\t${password}\n`);
}
