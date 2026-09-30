// Dipanggil oleh script Lua (POST JSON). Body harus memuat "key" = REPORT_KEY.
const crypto = require("crypto");
const { saveBot } = require("./_store");

const same = (a, b) => {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const expected = process.env.REPORT_KEY;
  if (!expected) return res.status(500).json({ error: "REPORT_KEY belum di-set di Vercel" });

  let b = req.body;
  if (typeof b === "string") { try { b = JSON.parse(b); } catch { b = null; } }
  if (!b || typeof b !== "object") return res.status(400).json({ error: "body bukan JSON" });
  if (!same(b.key || "", expected)) return res.status(401).json({ error: "key salah" });

  const name = String(b.name || "").slice(0, 40).replace(/[^\w.\- ]/g, "");
  if (!name) return res.status(400).json({ error: "name kosong" });

  delete b.key;
  b.name = name;
  b.ts = Date.now();
  b.inventory = Array.isArray(b.inventory) ? b.inventory.slice(0, 60) : [];
  b.logs = Array.isArray(b.logs) ? b.logs.slice(-20) : [];
  try {
    await saveBot(name, b);
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
};
