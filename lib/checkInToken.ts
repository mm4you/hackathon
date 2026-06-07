import jwt from "jsonwebtoken";

const CHECK_IN_TTL_SECONDS = 60 * 60 * 4;

type CheckInPayload = { appointmentId: string; purpose: "CHECK_IN" };

export function createCheckInToken(appointmentId: string) {
  return jwt.sign({ appointmentId, purpose: "CHECK_IN" } satisfies CheckInPayload, getCheckInSecret(), { expiresIn: CHECK_IN_TTL_SECONDS });
}

export function verifyCheckInToken(token: string) {
  try {
    const decoded = jwt.verify(token, getCheckInSecret()) as Partial<CheckInPayload>;
    if (decoded.purpose !== "CHECK_IN" || typeof decoded.appointmentId !== "string") return null;
    return { appointmentId: decoded.appointmentId };
  } catch {
    return null;
  }
}

function getCheckInSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not configured");
  return secret;
}
