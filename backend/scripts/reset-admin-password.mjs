import { createClient } from "@supabase/supabase-js";
import { randomInt } from "node:crypto";
import { stdin, stdout } from "node:process";

const adminId = process.argv[2] || "admin001";
if (!/^admin\d+$/.test(adminId)) {
  throw new Error("Provide a valid administrator ID as the command argument, for example admin001.");
}

const supabaseUrl = process.env.SUPABASE_URL;
if (!supabaseUrl) throw new Error("Set SUPABASE_URL in the local environment first.");
if (!stdin.isTTY || typeof stdin.setRawMode !== "function") {
  throw new Error("Run this password-reset script in an interactive terminal.");
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
          reject(new Error("Password reset cancelled."));
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

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  || await readHiddenInput("Enter the Supabase service-role key (input hidden): ");
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: profile, error: lookupError } = await supabase
  .from("users")
  .select("id")
  .eq("student_id", adminId)
  .eq("role", "admin")
  .eq("account_status", "active")
  .maybeSingle();

if (lookupError || !profile) {
  throw new Error(`Could not find an active administrator account for ${adminId}: ${lookupError?.message ?? "No profile found."}`);
}

const password = generateTemporaryPassword();
const { error: setupError } = await supabase
  .from("users")
  .update({ must_change_password: true })
  .eq("id", profile.id);
if (setupError) {
  throw new Error(`Could not require a password change for ${adminId}: ${setupError.message}`);
}

const { error: passwordError } = await supabase.auth.admin.updateUserById(profile.id, { password });
if (passwordError) {
  throw new Error(`Password reset failed for ${adminId}: ${passwordError.message}. Account remains required to change its password.`);
}

console.log(`\nReset administrator ${adminId}. Copy this temporary password to the administrator privately now:\n${adminId}\t${password}\n`);
