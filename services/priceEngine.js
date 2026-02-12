const { connectDB } = require("../database/mongo");
const { ObjectId } = require("mongodb");

let initPromise = null;
const state = new Map();

function randn() {
  // Box–Muller transform
  let u = 0,
    v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function makeAssetState(seedPrice) {
  const p = Number(seedPrice) || 1;
  return {
    price: Math.max(0.01, p),
    open24h: Math.max(0.01, p),
    lastTs: Date.now(),
    vol: 0.003 + Math.random() * 0.022,
    drift: (Math.random() - 0.5) * 0.0004, 
  };
}

function stepOne(s, now) {
  const dtMs = now - s.lastTs;
  if (dtMs <= 0) return;

  const steps = clamp(Math.floor(dtMs / 1000), 1, 60);
  for (let i = 0; i < steps; i++) {
    const shock = randn() * s.vol;
    const change = s.drift + shock;
    s.price = Math.max(0.01, s.price * (1 + change));
  }

  s.lastTs = now;
}

async function ensureInit() {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const db = await connectDB();
    const assets = await db.collection("assets").find({}).toArray();
    for (const a of assets) {
      const id = String(a._id);
      if (!state.has(id)) state.set(id, makeAssetState(a.price));
    }
  })();

  return initPromise;
}

function decorate(asset) {
  if (!asset || !asset._id) return asset;
  const id = String(asset._id);

  let s = state.get(id);
  if (!s) {
    s = makeAssetState(asset.price);
    state.set(id, s);
  }

  const now = Date.now();
  stepOne(s, now);

  const price = Math.round(s.price * 100) / 100;
  const change24h = Math.round(((price / s.open24h) * 100 - 100) * 100) / 100; // %

  return {
    ...asset,
    price,
    change24h,
  };
}

function upsertFromDb(asset) {
  if (!asset || !asset._id) return;
  const id = String(asset._id);

  if (state.has(id)) {
    const s = state.get(id);
    if (Number.isFinite(Number(asset.price))) {
      s.price = Math.max(0.01, Number(asset.price));
      s.open24h = Math.max(0.01, Number(asset.price));
      s.lastTs = Date.now();
    }
    return;
  }

  state.set(id, makeAssetState(asset.price));
}

function remove(id) {
  if (!id) return;
  state.delete(String(id));
}

module.exports = {
  ensureInit,
  decorate,
  upsertFromDb,
  remove,
  ObjectId,
};
