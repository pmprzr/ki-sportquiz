import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

/**
 * Verschlüsselt Daten zu einem Token, das der Browser zwar speichern und zurückschicken,
 * aber weder lesen noch verändern kann (AES-256-GCM = Verschlüsselung + Manipulationsschutz).
 * Das Secret ist ein Parameter, damit die Funktionen ohne Next.js testbar bleiben.
 */
const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;
const TAG_BYTES = 16;
export const MIN_SECRET_LENGTH = 32;

function deriveKey(secret: string): Buffer {
  if (secret.length < MIN_SECRET_LENGTH) {
    throw new Error(`Secret ist zu kurz (mindestens ${MIN_SECRET_LENGTH} Zeichen)`);
  }
  return createHash("sha256").update(secret).digest(); // immer genau 32 Byte = AES-256-Schlüssel
}

export function seal(payload: unknown, secret: string): string {
  const iv = randomBytes(IV_BYTES); // pro Token neu, darf nie wiederverwendet werden
  const cipher = createCipheriv(ALGORITHM, deriveKey(secret), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(payload), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64url");
}

/** Liefert null, wenn das Token kaputt, manipuliert oder mit einem anderen Secret erstellt ist. */
export function unseal(token: string, secret: string): unknown {
  const key = deriveKey(secret); // Konfigurationsfehler sollen sichtbar bleiben, daher außerhalb von try
  try {
    const buf = Buffer.from(token, "base64url");
    if (buf.length <= IV_BYTES + TAG_BYTES) return null;
    const decipher = createDecipheriv(ALGORITHM, key, buf.subarray(0, IV_BYTES));
    decipher.setAuthTag(buf.subarray(IV_BYTES, IV_BYTES + TAG_BYTES));
    const plain = Buffer.concat([
      decipher.update(buf.subarray(IV_BYTES + TAG_BYTES)),
      decipher.final(), // wirft, wenn der Inhalt verändert wurde
    ]);
    return JSON.parse(plain.toString("utf8"));
  } catch {
    return null;
  }
}
