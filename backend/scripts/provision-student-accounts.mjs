import { createClient } from "@supabase/supabase-js";
import { randomInt } from "node:crypto";
import { stdin, stdout } from "node:process";
import { databaseStudentIds } from "../../src/lib/databaseStudentIds.js";
import { databaseStudentNames } from "../../src/lib/databaseStudentNames.js";

const accounts = databaseStudentIds.map((studentId) => ({
  studentId,
  fullName: databaseStudentNames[studentId],
}));

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

for (const account of accounts) {
  const { data: existingProfile, error: lookupError } = await supabase
    .from("users")
    .select("id")
    .eq("student_id", account.studentId)
    .maybeSingle();
  if (lookupError) {
    throw new Error(`Could not check student ${account.studentId}: ${lookupError.message}`);
  }
  if (existingProfile) {
    console.log(`Skipping ${account.studentId}; its profile already exists. No password was changed.`);
    continue;
  }

  const password = generateTemporaryPassword();
  const email = `${account.studentId}@students.scan2seat.invalid`;
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { student_id: account.studentId },
  });
  if (createError || !created.user) {
    throw new Error(`Could not create student ${account.studentId}: ${createError?.message ?? "No Auth user returned."}`);
  }

  const { error: profileError } = await supabase.from("users").insert({
    id: created.user.id,
    student_id: account.studentId,
    full_name: account.fullName,
    role: "student",
    account_status: "active",
    must_change_password: true,
  });
  if (profileError) {
    const { error: cleanupError } = await supabase.auth.admin.deleteUser(created.user.id);
    if (cleanupError) {
      console.error(`Could not clean up the incomplete Auth account for ${account.studentId}: ${cleanupError.message}`);
    }
    throw new Error(`Could not create the student profile for ${account.studentId}: ${profileError.message}`);
  }

  console.log(`\nCreated account ${account.studentId}. Copy this temporary password directly into the approved password manager now:\n${account.studentId}\t${password}\n`);
}
