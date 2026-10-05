"use client";

export const TALENT_DONATION_CONFIG = {
  minDonation: 10,
  maxDonation: 100,
  dailyDonationLimit: 3,
  multipliers: [50, 100, 200, 300, 500, 1000],
  tiers: [
    { id: "0-999", min: 0, max: 999, probabilities: [0, 5, 10, 20, 35, 30] },
    { id: "1000-1999", min: 1000, max: 1999, probabilities: [5, 10, 15, 25, 30, 15] },
    { id: "2000-2999", min: 2000, max: 2999, probabilities: [10, 15, 25, 25, 20, 5] },
    { id: "3000-3999", min: 3000, max: 3999, probabilities: [15, 25, 30, 20, 8, 2] },
    { id: "4000-5999", min: 4000, max: 5999, probabilities: [25, 35, 25, 10, 4, 1] },
    { id: "6000-7999", min: 6000, max: 7999, probabilities: [40, 40, 15, 4, 1, 0] },
    { id: "8000-9999", min: 8000, max: 9999, probabilities: [55, 35, 8, 2, 0, 0] },
    { id: "10000+", min: 10000, max: Infinity, probabilities: [70, 25, 4, 1, 0, 0] },
  ],
} as const;

export function validateTalentDonationConfig() {
  for (const tier of TALENT_DONATION_CONFIG.tiers) {
    const sum = tier.probabilities.reduce<number>((acc, value) => acc + value, 0);
    if (sum !== 100) {
      throw new Error(`Donation probability tier ${tier.id} sums to ${sum}, not 100`);
    }
  }
}

export function getDonationBonusLabel(balance: number) {
  if (balance < 2000) return { label: "Very high bonus chance", tone: "text-red-500 bg-red-50" };
  if (balance < 4000) return { label: "High bonus chance", tone: "text-violet-500 bg-violet-50" };
  if (balance < 6000) return { label: "Bonus chance", tone: "text-amber-600 bg-amber-50" };
  return { label: "Normal", tone: "text-neutral-500 bg-neutral-100" };
}
