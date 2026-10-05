import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const configSource = fs.readFileSync(path.join(root, "lib/talent-donation-config.ts"), "utf8");
const sqlSource = fs.readFileSync(path.join(root, "supabase/migrations/20261005000000_talent_donations.sql"), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function extractNumber(name) {
  const match = configSource.match(new RegExp(`${name}:\\s*(\\d+)`));
  assert(match, `Missing ${name}`);
  return Number(match[1]);
}

const minDonation = extractNumber("minDonation");
const maxDonation = extractNumber("maxDonation");
const dailyDonationLimit = extractNumber("dailyDonationLimit");

assert(minDonation === 10, "Minimum donation must be 10");
assert(maxDonation === 100, "Maximum donation must be 100");
assert(dailyDonationLimit === 3, "Daily donation limit must be 3");

const multiplierMatch = configSource.match(/multipliers:\s*\[([^\]]+)\]/);
assert(multiplierMatch, "Missing multipliers");
const multipliers = multiplierMatch[1].split(",").map(v => Number(v.trim()));
assert(JSON.stringify(multipliers) === JSON.stringify([50, 100, 200, 300, 500, 1000]), "Unexpected multiplier list");

const tierPattern = /\{\s*id:\s*"([^"]+)",\s*min:\s*(\d+),\s*max:\s*(Infinity|\d+),\s*probabilities:\s*\[([^\]]+)\]\s*\}/g;
const tiers = [...configSource.matchAll(tierPattern)].map(match => ({
  id: match[1],
  min: Number(match[2]),
  max: match[3] === "Infinity" ? Infinity : Number(match[3]),
  probabilities: match[4].split(",").map(v => Number(v.trim())),
}));

assert(tiers.length === 8, "Expected 8 probability tiers");
for (const tier of tiers) {
  const sum = tier.probabilities.reduce((acc, value) => acc + value, 0);
  assert(sum === 100, `${tier.id} probabilities sum to ${sum}`);
  assert(tier.probabilities.length === multipliers.length, `${tier.id} probability count does not match multiplier count`);
}

const byId = Object.fromEntries(tiers.map(tier => [tier.id, tier]));
assert(byId["6000-7999"].probabilities[5] === 0, "1000% must be impossible for 6000-7999");
assert(byId["8000-9999"].probabilities[4] === 0, "500% must be impossible for 8000-9999");
assert(byId["8000-9999"].probabilities[5] === 0, "1000% must be impossible for 8000-9999");
assert(byId["10000+"].probabilities[4] === 0, "500% must be impossible for 10000+");
assert(byId["10000+"].probabilities[5] === 0, "1000% must be impossible for 10000+");

assert(sqlSource.includes("FOR UPDATE"), "RPC must lock donation/student rows");
assert(sqlSource.includes("gen_random_bytes"), "RPC must use server-side cryptographic randomness");
assert(!/p_(multiplier|gift_amount|random|probability)/i.test(sqlSource), "RPC must not accept random outcome parameters");
assert(sqlSource.includes("Asia/Seoul"), "Daily reset must use Asia/Seoul");
assert(sqlSource.includes("uq_talent_donations_sender_recipient_date"), "Same recipient daily uniqueness is required");
assert(sqlSource.includes("v_sender.talents < p_donation_amount"), "RPC must prevent insufficient balance");
assert(sqlSource.includes("v_sender_count >= 3"), "RPC must enforce daily attempt limit");
assert(sqlSource.includes("GIFT_ALREADY_OPENED"), "RPC must prevent duplicate gift opening");
assert(sqlSource.includes("status = 'opened'"), "RPC must mark a gift opened after payout");
assert(sqlSource.includes("create_random_talent_donation"), "Student gift flow must use a server-side random recipient RPC");
assert(sqlSource.includes("NO_RANDOM_RECIPIENT_AVAILABLE"), "Random recipient RPC must handle exhausted recipient candidates");

console.log("Talent donation configuration and RPC invariants passed.");
