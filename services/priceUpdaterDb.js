
const { connectDB } = require("../database/mongo");


function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function roundTo(n, decimals = 2) {
  const p = Math.pow(10, decimals);
  return Math.round(n * p) / p;
}

function nextPrice(oldPrice, basePrice) {
  const base = Number(oldPrice);

  if (!Number.isFinite(base) || base <= 0) {
    return 1;
  }

  const target = Number(basePrice) || base;

  const noise = (Math.random() * 2 - 1) * 0.01;

  const pull = ((target - base) / target) * 0.02;

  let pct = noise + pull;

  pct = clamp(pct, -0.03, 0.03); 

  let newPrice = base * (1 + pct);

  newPrice = clamp(newPrice, 0.01, 1e9);

  return roundTo(newPrice, 2);
}


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

    const changePct =
      oldPrice > 0
        ? roundTo(((newPrice - oldPrice) / oldPrice) * 100, 2)
        : 0;

    const supply = Number(a.supply || 1000000);

    const newCap = roundTo(newPrice * supply, 0);

    return {
      updateOne: {
        filter: { _id: a._id },
        update: {
          $set: {
            price: newPrice,
            basePrice: basePrice, 
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

  setTimeout(runTick, 2000);

  setInterval(runTick, intervalMs);
}


module.exports = {
  startPriceUpdater,
  updateAllAssetPricesOnce,
};
