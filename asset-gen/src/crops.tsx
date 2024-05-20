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
  daily_profit: number;
};

export type QualityProbabilities = {
  normal: number;
  silver: number;
  gold: number;
  iridium: number;
};

export const NO_QUALITY: QualityProbabilities = {
  normal: 1,
  silver: 0,
  gold: 0,
  iridium: 0,
};

export const SILVER_MULTIPLIER = 1.25;
export const GOLD_MULTIPLIER = 1.5;
export const IRIDIUM_MULTIPLIER = 2.0;

export function computeQuality(farming_level: number): QualityProbabilities {
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
  quality_probabilities: QualityProbabilities | null;
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

export type ExpectedCrops = {
  normal: number;
  silver: number;
  gold: number;
  iridium: number;
};

export function getExpectedCropsPerHarvest(
  crop: CropDefinition,
  q: QualityProbabilities
): ExpectedCrops {
  if (!crop.special_handling) {
    // We can sometimes get multiple crops per harvest, but all the extra crops
    // will be regular quality.
    // TODO: is this true? i see conflicting sources online
    const crop_yield =
      (crop.yield ?? 1) + (crop.percent_chance_extra ?? 0) / 100.0;
    return {
      normal: q.normal + crop_yield - 1,
      silver: q.silver,
      gold: q.gold,
      iridium: q.iridium,
    };
  } else if (crop.special_handling == "tea") {
    // Tea has no quality and no multipliers
    return NO_QUALITY;
  } else {
    throw new Error("Unrecognized special " + crop.special_handling);
  }
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

  // How many crops of each quality do we expect to get?
  const quality_probabilities = settings.quality_probabilities ?? NO_QUALITY;
  const per_harvest = getExpectedCropsPerHarvest(crop, quality_probabilities);

  // How much are those crops worth?
  // prices are rounded down!
  const base_price = crop.sell_price;
  const silver_price = Math.trunc(SILVER_MULTIPLIER * base_price);
  const gold_price = Math.trunc(GOLD_MULTIPLIER * base_price);
  const iridium_price = Math.trunc(IRIDIUM_MULTIPLIER * base_price);

  // So, putting it all together
  const num_crops_per_harvest =
    per_harvest.normal +
    per_harvest.silver +
    per_harvest.gold +
    per_harvest.iridium;
  let revenue_per_harvest =
    per_harvest.normal * base_price +
    per_harvest.silver * silver_price +
    per_harvest.gold * gold_price +
    per_harvest.iridium * iridium_price;

  if (settings.tiller_enabled) {
    revenue_per_harvest *= 1.1; // could maybe do this before to get integer prices
  }

  // Okay, let's calculate everything!
  const profit = revenue_per_harvest * harvests.number - crop.seed_cost;
  const daily_profit = profit / harvests.duration;

  return {
    definition: crop,
    useful_days: harvests.duration,
    num_harvests: harvests.number,
    num_crops: num_crops_per_harvest * harvests.number,
    profit,
    daily_profit,
  };
}
