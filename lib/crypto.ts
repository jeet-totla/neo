import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

// AES-256-GCM. The key is derived from ENCRYPTION_KEY, which only exists on the server.
function secret(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw || raw.length < 16) throw new Error("ENCRYPTION_KEY is missing or too short (use at least 16 random characters).");
  return createHash("sha256").update(raw).digest();
}

/** Returns "iv.tag.ciphertext", each base64. */
export function encrypt(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", secret(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), enc].map(b => b.toString("base64")).join(".");
}

export function decrypt(payload: string): string {
  const [iv, tag, enc] = payload.split(".").map(p => Buffer.from(p, "base64"));
  const decipher = createDecipheriv("aes-256-gcm", secret(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
}
