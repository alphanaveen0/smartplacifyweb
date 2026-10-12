import crypto from "crypto";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

export function generateOtp() {
  return String(crypto.randomInt(100000, 1000000));
}

async function brevoRequest(path, body) {
  if (!env.brevo.apiKey) {
    if (env.nodeEnv === "production") {
      throw new AppError("OTP provider is not configured.", 500);
    }
    return { provider: "console", delivered: true };
  }

  const response = await fetch(`https://api.brevo.com/v3/${path}`, {
    method: "POST",
    headers: {
      "api-key": env.brevo.apiKey,
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new AppError(error.message || "Unable to send OTP.", 502);
  }

  return response.json().catch(() => ({}));
}

export async function sendOtpEmail(email, otp) {
  if (!email) return { skipped: true };
  if (!env.brevo.apiKey || !env.brevo.senderEmail) {
    if (env.nodeEnv === "production") {
      throw new AppError("Email OTP provider is not configured.", 500);
    }
    console.log(`[SmartPlacify Email OTP] ${email}: ${otp}`);
    return { provider: "console", delivered: true };
  }

  return brevoRequest("smtp/email", {
    sender: { name: env.brevo.senderName, email: env.brevo.senderEmail },
    to: [{ email }],
    subject: "Your SmartPlacify verification OTP",
    htmlContent: `<p>Your SmartPlacify OTP is <strong>${otp}</strong>.</p><p>This code expires in ${env.otpExpiresMinutes} minutes.</p>`,
    textContent: `Your SmartPlacify OTP is ${otp}. This code expires in ${env.otpExpiresMinutes} minutes.`
  });
}

export async function sendOtpSms(phone, otp) {
  if (!env.brevo.apiKey) {
    if (env.nodeEnv === "production") {
      throw new AppError("SMS OTP provider is not configured.", 500);
    }
    console.log(`[SmartPlacify SMS OTP] ${phone}: ${otp}`);
    return { provider: "console", delivered: true };
  }

  return brevoRequest("transactionalSMS/sms", {
    sender: env.brevo.smsSender,
    recipient: phone,
    content: `Your SmartPlacify OTP is ${otp}. It expires in ${env.otpExpiresMinutes} minutes.`,
    type: "transactional",
    unicodeEnabled: false
  });
}

export async function sendRegisterOtp({ email, phone, otp }) {
  await Promise.all([
    sendOtpEmail(email, otp),
    sendOtpSms(phone, otp)
  ]);
  return { delivered: true };
}
