// Penyimpanan: Upstash Redis (REST) kalau env ada, kalau tidak pakai memori (hilang saat instance tidur).
const URL_ = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const mem = globalThis.__pabrik || (globalThis.__pabrik = { bots: {}, trails: {} });

async function pipeline(cmds) {
  const r = await fetch(URL_ + "/pipeline", {
    method: "POST",
    headers: { Authorization: "Bearer " + TOKEN, "Content-Type": "application/json" },
    body: JSON.stringify(cmds),
  });
  if (!r.ok) throw new Error("redis " + r.status);
  return (await r.json()).map((x) => x.result);
}

const usingRedis = () => !!(URL_ && TOKEN);

async function saveBot(name, data) {
  const trailEntry = `${data.x},${data.y},${data.ts}`;
  if (!usingRedis()) {
    mem.bots[name] = data;
    const t = (mem.trails[name] = mem.trails[name] || []);
    t.unshift(trailEntry);
    t.length = Math.min(t.length, 40);
    return;
  }
  await pipeline([
    ["SET", "bot:" + name, JSON.stringify(data), "EX", 86400],
    ["SADD", "bots", name],
    ["LPUSH", "trail:" + name, trailEntry],
    ["LTRIM", "trail:" + name, 0, 39],
    ["EXPIRE", "trail:" + name, 86400],
  ]);
}

async function loadAll() {
  let names, rows, trails;
  if (!usingRedis()) {
    names = Object.keys(mem.bots);
    rows = names.map((n) => JSON.stringify(mem.bots[n]));
    trails = names.map((n) => mem.trails[n] || []);
  } else {
    [names] = await pipeline([["SMEMBERS", "bots"]]);
    names = (names || []).sort();
    if (!names.length) return [];
    const res = await pipeline([
      ...names.map((n) => ["GET", "bot:" + n]),
      ...names.map((n) => ["LRANGE", "trail:" + n, 0, 39]),
    ]);
    rows = res.slice(0, names.length);
    trails = res.slice(names.length);
  }
  return names
    .map((n, i) => {
      if (!rows[i]) return null;
      const d = JSON.parse(rows[i]);
      d.trail = (trails[i] || []).reverse().map((s) => {
        const [x, y, ts] = s.split(",").map(Number);
        return { x, y, ts };
      });
      return d;
    })
    .filter(Boolean);
}

module.exports = { saveBot, loadAll, usingRedis };
