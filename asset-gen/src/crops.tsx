"use strict";

import CROP_DEFINITIONS from "./crop_definitions.json";

export type CropDefinition = (typeof CROP_DEFINITIONS)[number];

export enum Season {
  SPRING,
  SUMMER,
  FALL,
  WINTER,
}

export namespace Season {
  export function fromString(s: string): Season {
    switch (s.toUpperCase()) {
      case "SPRING":
        return Season.SPRING;
      case "SUMMER":
        return Season.SUMMER;
      case "FALL":
        return Season.FALL;
      case "WINTER":
        return Season.WINTER;
      default:
        throw new Error(`Unknown season ${s}`);
    }
  }
}

export type CropData = {
  definition: CropDefinition;
  useful_days: number;
  num_harvests: number;
  num_crops: number;
  profit: number;
  daily_profit: number | null;
};

export type QualityVector<T> = {
  normal: T;
  silver: T;
  gold: T;
  iridium: T;
};

function qualityMap<T, U>(
  q: QualityVector<T>,
  fn: (_: T) => U
): QualityVector<U> {
  return {
    normal: fn(q.normal),
    silver: fn(q.silver),
    gold: fn(q.gold),
    iridium: fn(q.iridium),
  };
}

function qualityZip<T1, T2, U>(
  q1: QualityVector<T1>,
  q2: QualityVector<T2>,
  fn: (_1: T1, _2: T2) => U
): QualityVector<U> {
  return {
    normal: fn(q1.normal, q2.normal),
    silver: fn(q1.silver, q2.silver),
    gold: fn(q1.gold, q2.gold),
    iridium: fn(q1.iridium, q2.iridium),
  };
}

function qualitySum(q: QualityVector<number>): number {
  return q.normal + q.silver + q.gold + q.iridium;
}

export function qualityDot(
  q1: QualityVector<number>,
  q2: QualityVector<number>
): number {
  return qualitySum(qualityZip(q1, q2, (v1, v2) => v1 * v2));
}

export const NO_QUALITY: QualityVector<number> = {
  normal: 1,
  silver: 0,
  gold: 0,
  iridium: 0,
};

export const PRICE_MULTIPLIERS: QualityVector<number> = {
  normal: 1.0,
  silver: 1.25,
  gold: 1.5,
  iridium: 2.0,
};

function multiplyPriceByPercentage(
  base: number,
  percentage: number,
  apply: boolean = true
): number {
  if (apply) {
    // We use (e.g.) 40 instead of 0.4 here, because we can lose precision otherwise.
    // For example, 690 * 1.4 is exactly 966, but JS computes it as 965.99999
    return Math.trunc((base * percentage) / 100);
  } else {
    return base;
  }
}

/// Returns the quality ratios for a given farming level
export function computeQuality(farming_level: number): QualityVector<number> {
  // https://stardewvalleywiki.com/Farming#Complete_Formula_2
  const fertilizer_level = 0;

  // Quality for a crop is determined by a series of weighted coin flips.
  // The probabilities for the coins are computed here.
  const p_gold_coin =
    0.2 * (farming_level / 10.0) +
    0.2 * fertilizer_level * ((farming_level + 2.0) / 12.0) +
    0.01;
  const p_silver_coin = Math.min(2 * p_gold_coin, 0.75);
  let p_iridium_coin = p_gold_coin / 2;

  // TODO: this is only enabled at certain fertilizer levels
  p_iridium_coin = 0;

  // However, these coins are flipped one at a time, so we have slightly more
  // work to do to find out the final probabilities.

  // Chance of iridium is just the local chance of iridium.
  const iridium = p_iridium_coin;
  // To get gold, don't be iridium, and pass the gold coin flip.
  const gold = (1 - iridium) * p_gold_coin;
  // Similarly, for silver, don't be iridum or gold, and pass the
  // silver coin flip.
  const silver = (1 - iridium - gold) * p_silver_coin;
  // Base quality is everything else.
  const normal = 1 - iridium - gold - silver;

  return { normal, silver, gold, iridium };
}

export type Settings = {
  season: Season;
  start_day: number;
  multiseason_enabled: boolean;
  quality_probabilities: QualityVector<number> | null;
  tiller_enabled: boolean;
};

type Harvests = {
  number: number;
  duration: number;
};

export function getNumberOfHarvests(
  crop: CropDefinition,
  current_season: Season,
  current_day: number,
  multiseason_enabled: boolean
): Harvests | "out-of-season" {
  // When is this crop in-season?
  // Note: Cactus Fruit has no season; watch out for that!
  if (!crop.season) {
    return "out-of-season";
  }

  const seasons: Season[] = [];
  const num_seasons = crop.multiseason ?? 1;
  for (let i = 0; i < num_seasons; i++) {
    seasons.push(Season.fromString(crop.season).valueOf() + i);
  }

  // Bail out if we're out of season
  if (!seasons.includes(current_season)) {
    return "out-of-season";
  }

  // How many days do we have left?
  const seasons_left = multiseason_enabled
    ? seasons.length - seasons.indexOf(current_season)
    : 1;
  const days_left = 28 * seasons_left - current_day;

  // In the number of days remaining, how many harvests do we get?
  if (!crop.special_handling) {
    let num_harvests = 0;
    let useful_days = 0;

    if (days_left >= crop.days_to_grow) {
      num_harvests += 1;
      useful_days += crop.days_to_grow;
      if (crop.regrowth_period) {
        const extra_harvests = Math.floor(
          (days_left - crop.days_to_grow) / crop.regrowth_period
        );
        num_harvests += extra_harvests;
        useful_days += extra_harvests * crop.regrowth_period;
      }
    }

    return {
      number: num_harvests,
      duration: useful_days,
    };
  } else if (crop.special_handling == "tea") {
    // Is this tea? If so, skip all that; compute it differently.

    // First figure out how many we get during the first season.
    const becomes_bush_at = current_day + crop.days_to_grow;
    const leaves_harvested_first_season = Math.max(
      0, // can't go negative!
      28 - Math.max(21, becomes_bush_at) // half-inclusive; tea bush does not produce on first day
    );
    // ^^ TODO: if i plant on the 1st, it becomes a bush on the 21st, and produces on the 2nd.
    // if i plant on the 2nd, it becomes a bush on the 22nd -- it doesn't produce, i think?

    return {
      // The other seasons we get all 7 harvests.
      number: leaves_harvested_first_season + 7 * (seasons_left - 1),
      duration: days_left, // idk
    };
  } else {
    throw new Error("Unrecognized special value: " + crop.special_handling);
  }
}

export function getExpectedCropsPerHarvest(
  crop: CropDefinition,
  q: QualityVector<number>
): QualityVector<number> {
  if (!crop.special_handling) {
    // We can sometimes get multiple crops per harvest, but all the extra crops
    // will be regular quality.
    // TODO: is this true? i see conflicting sources online
    const crop_yield =
      (crop.yield ?? 1) + (crop.percent_chance_extra ?? 0) / 100.0;

    // Make a full copy; no cloning issues!
    let output = qualityMap(q, (x) => x);
    output.normal += crop_yield - 1;
    return output;
  } else if (crop.special_handling == "tea") {
    // Tea has no quality and no multipliers
    return NO_QUALITY;
  } else {
    throw new Error("Unrecognized special " + crop.special_handling);
  }
}

export function getRevenueFromRaw(
  crop: CropDefinition,
  quantity: QualityVector<number>,
  tiller: boolean
): number {
  const prices = qualityMap(PRICE_MULTIPLIERS, (multiplier) => {
    // Note: prices are rounded down after each multiplier, and
    // quality is applied first.
    //
    // Proof: Silver Ancient Fruit is 687, and 755 with Tiller.
    //   550 * 1.25 = 687.5 -> 687
    //   687 * 1.1 = 755.7 -> 755
    // but 550 * 1.25 * 1.1 = 756.25, too high
    // and trunc(550 * 1.1) * 1.25 is the same
    return multiplyPriceByPercentage(
      multiplyPriceByPercentage(crop.sell_price, Math.round(100 * multiplier)),
      110,
      tiller
    );
  });

  return qualityDot(prices, quantity);
}

export function getRevenueFromPreserveJar(
  crop: CropDefinition,
  quantity: number,
  artisan: boolean
): number | null {
  // Only fruits and veggies can be preserved
  if (crop.type === "fruit" || crop.type === "vegetable") {
    // Quality makes no difference! Everything is the same price.
    const base_price = 2 * crop.sell_price + 50;
    const price = multiplyPriceByPercentage(base_price, 140, artisan);
    return price * quantity;
  }

  return null;
}

function getBasePriceKeggedGood(crop: CropDefinition): number | null {
  // First deal with some special cases
  // TODO: more robust than name matching?
  switch (crop.name) {
    case "Wheat":
      return 200; // beer
    case "Unmilled Rice":
      // technically this only works if you have milled rice...
      return 100; // vinegar
    case "Coffee Bean":
      return 150; // coffee
    case "Tea Leaves":
      return 100; // green tea
    case "Hops":
      return 300; // pale ale
    default:
    // do nothing
  }

  switch (crop.type) {
    case "fruit":
      return 3 * crop.sell_price;
    case "vegetable":
      return multiplyPriceByPercentage(crop.sell_price, 225);
    default:
    // do nothing
  }

  return null;
}

export function getRevenueFromKeg(
  crop: CropDefinition,
  quantity: number,
  artisan: boolean
): number | null {
  const base_price = getBasePriceKeggedGood(crop);
  if (base_price === null) {
    return null;
  }

  // Coffee is a special case: it takes 5 beans and also it's not an
  // artisan good...
  if (crop.name === "Coffee Bean") {
    return (base_price * quantity) / 5;
  }
  // Same with vinegar; produces 2 per rice, and isn't artisan good
  if (crop.name === "Unmilled Rice") {
    return base_price * quantity * 2;
  }

  // Everything else is straightforward
  const price = multiplyPriceByPercentage(base_price, 140, artisan);
  return price * quantity;
}

export function calculate(
  crop: CropDefinition,
  settings: Settings
): CropData | "out-of-season" {
  // How many harvests do we get, if any?
  const harvests = getNumberOfHarvests(
    crop,
    settings.season,
    settings.start_day,
    settings.multiseason_enabled
  );

  if (harvests == "out-of-season") {
    return "out-of-season";
  }

  // How many crops of each quality do we expect to get, in total.
  const quality_probabilities = settings.quality_probabilities ?? NO_QUALITY;
  const per_harvest = getExpectedCropsPerHarvest(crop, quality_probabilities);
  const total_crops = qualityMap(per_harvest, (x) => x * harvests.number);

  // How much are those crops worth?
  const revenue = getRevenueFromRaw(crop, total_crops, settings.tiller_enabled);

  // So, putting it all together
  const profit = revenue - crop.seed_cost;
  const daily_profit =
    harvests.duration === 0 ? null : profit / harvests.duration;

  return {
    definition: crop,
    useful_days: harvests.duration,
    num_harvests: harvests.number,
    num_crops: qualitySum(total_crops),
    profit,
    daily_profit,
  };
}
