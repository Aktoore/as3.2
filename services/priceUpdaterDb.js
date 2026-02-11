/**
 * Price updater that PERSISTS changes to MongoDB.
 * - Loads assets from DB
 * - Applies controlled random-walk (no crazy growth)
 * - Saves back to DB
 *
 * Prices fluctuate around basePrice (mean reversion).
 */

const { connectDB } = require("../database/mongo");

// ---------------- Utils ----------------

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function roundTo(n, decimals = 2) {
  const p = Math.pow(10, decimals);
  return Math.round(n * p) / p;
}

// ---------------- Price Logic ----------------

/**
 * Generate next price with mean reversion
 * (price tries to return to basePrice)
 */
function nextPrice(oldPrice, basePrice) {
  const base = Number(oldPrice);

  if (!Number.isFinite(base) || base <= 0) {
    return 1;
  }

  // target = "normal" price
  const target = Number(basePrice) || base;

  // random noise ±1%
  const noise = (Math.random() * 2 - 1) * 0.01;

  // pull back to base price
  const pull = ((target - base) / target) * 0.02;

  // combine
  let pct = noise + pull;

  // limit max movement
  pct = clamp(pct, -0.03, 0.03); // ±3%

  let newPrice = base * (1 + pct);

  newPrice = clamp(newPrice, 0.01, 1e9);

  return roundTo(newPrice, 2);
}

// ---------------- DB Update ----------------

async function updateAllAssetPricesOnce() {
  const db = await connectDB();
  const collection = db.collection("assets");

  const assets = await collection.find({}).toArray();

  if (!assets.length) {
    return { updated: 0 };
  }

  const now = new Date();

  const ops = assets.map((a) => {
    const oldPrice = Number(a.price);
    const basePrice = Number(a.basePrice || a.price);

    const newPrice = nextPrice(oldPrice, basePrice);

    // 24h change (demo)
    const changePct =
      oldPrice > 0
        ? roundTo(((newPrice - oldPrice) / oldPrice) * 100, 2)
        : 0;

    // MarketCap = price * supply (or fake supply)
    const supply = Number(a.supply || 1000000);

    const newCap = roundTo(newPrice * supply, 0);

    return {
      updateOne: {
        filter: { _id: a._id },
        update: {
          $set: {
            price: newPrice,
            basePrice: basePrice, // keep base
            change24h: changePct,
            marketCap: newCap,
            updatedAt: now,
          },
        },
      },
    };
  });

  const result = await collection.bulkWrite(ops, {
    ordered: false,
  });

  return { updated: result.modifiedCount || 0 };
}

// ---------------- Scheduler ----------------

/**
 * Start price updater loop
 */
function startPriceUpdater({ intervalMs = 5000 } = {}) {
  let running = false;

  const runTick = async () => {
    if (running) return;

    running = true;

    try {
      const { updated } = await updateAllAssetPricesOnce();

      if (updated) {
        console.log(
          `[priceUpdater] Updated ${updated} assets @ ${new Date().toISOString()}`
        );
      }
    } catch (err) {
      console.error("[priceUpdater] Error:", err?.message || err);
    } finally {
      running = false;
    }
  };

  // first run
  setTimeout(runTick, 2000);

  // interval
  setInterval(runTick, intervalMs);
}

// ---------------- Exports ----------------

module.exports = {
  startPriceUpdater,
  updateAllAssetPricesOnce,
};
