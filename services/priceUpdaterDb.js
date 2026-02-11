/**
 * Price updater that PERSISTS changes to MongoDB.
 * - Every interval, loads all assets from DB
 * - Applies random-walk style price change
 * - Writes updated price (+ change24h) back with bulkWrite
 *
 * NOTE:
 * - This intentionally uses simple chaos, NOT real market prices.
 * - Data is persisted, so you WILL see the new values after refresh.
 */

const { connectDB } = require("../database/mongo");

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function roundTo(n, decimals = 2) {
  const p = Math.pow(10, decimals);
  return Math.round(n * p) / p;
}

/**
 * Create a new price based on old price.
 * - small drift most of the time
 * - occasional bigger "spike"
 */
function nextPrice(oldPrice) {
  const base = Number(oldPrice);
  if (!Number.isFinite(base) || base <= 0) return 1;

  // 90%: small change within ~[-2%, +2%]
  // 10%: spike within ~[-8%, +8%]
  const spike = Math.random() < 0.10;
  const maxPct = spike ? 0.08 : 0.02;

  const pct = (Math.random() * 2 - 1) * maxPct; // [-maxPct, +maxPct]
  let newPrice = base * (1 + pct);

  // keep prices sane
  newPrice = clamp(newPrice, 0.01, 1e12);

  return roundTo(newPrice, 2);
}

async function updateAllAssetPricesOnce() {
  const db = await connectDB();
  const collection = db.collection("assets");

  const assets = await collection
    .find({}, { projection: { _id: 1, price: 1, marketCap: 1 } })
    .toArray();

  if (!assets.length) return { updated: 0 };

  const now = new Date();

  const ops = assets.map((a) => {
    const oldPrice = Number(a.price);
    const newPrice = nextPrice(oldPrice);

    // "24h change" here is just the last tick % change (for demo purposes)
    const changePct = oldPrice > 0 ? roundTo(((newPrice - oldPrice) / oldPrice) * 100, 2) : 0;

    // Optional: keep marketCap roughly proportional to price movement
    const oldCap = Number(a.marketCap);
    const newCap = Number.isFinite(oldCap) && oldCap > 0
      ? roundTo(oldCap * (newPrice / (oldPrice || 1)), 0)
      : oldCap;

    return {
      updateOne: {
        filter: { _id: a._id },
        update: {
          $set: {
            price: newPrice,
            change24h: changePct,
            marketCap: newCap,
            updatedAt: now
          }
        }
      }
    };
  });

  const result = await collection.bulkWrite(ops, { ordered: false });
  return { updated: result.modifiedCount || 0 };
}

/**
 * Starts a safe interval loop (prevents overlapping runs).
 */
function startPriceUpdater({ intervalMs = 3000 } = {}) {
  let running = false;

  const runTick = async () => {
    if (running) return;
    running = true;
    try {
      const { updated } = await updateAllAssetPricesOnce();
      if (updated) {
        console.log(`[priceUpdater] Updated ${updated} assets @ ${new Date().toISOString()}`);
      }
    } catch (err) {
      console.error("[priceUpdater] Tick failed:", err?.message || err);
    } finally {
      running = false;
    }
  };

  // do first tick shortly after startup
  setTimeout(runTick, 1000);
  setInterval(runTick, intervalMs);
}

module.exports = {
  startPriceUpdater,
  updateAllAssetPricesOnce
};
