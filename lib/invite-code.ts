import { randomBytes } from "crypto";

// Short enough to type by hand if it has to be read out over a call, long
// enough (2^32 codepoints) that guessing one isn't practical — it's also
// gated by consume_invite() requiring an authenticated session anyway.
export function generateInviteCode() {
  return `INV-${randomBytes(4).toString("hex").toUpperCase()}`;
}
