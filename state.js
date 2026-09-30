// Dipanggil oleh halaman web. Header x-view-key harus = VIEW_PASSWORD.
const crypto = require("crypto");
const { loadAll, usingRedis } = require("./_store");

module.exports = async (req, res) => {
  const pw = process.env.VIEW_PASSWORD;
  if (!pw) return res.status(500).json({ error: "VIEW_PASSWORD belum di-set di Vercel" });
  const got = String(req.headers["x-view-key"] || "");
  const a = Buffer.from(got), b = Buffer.from(pw);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b))
    return res.status(401).json({ error: "password salah" });
  try {
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({ now: Date.now(), persistent: usingRedis(), bots: await loadAll() });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
};
