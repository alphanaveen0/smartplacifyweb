import crypto from "crypto";

export function generateOtp() {
  return String(crypto.randomInt(100000, 1000000));
}

export async function sendOtpSms(phone, otp) {
  console.log(`[SmartPlacify OTP] ${phone}: ${otp}`);
  return { provider: "console", delivered: true };
}
