import CROP_DEFINITIONS from "./crop_definitions.json";
import {
  CropData,
  CropDefinition,
  Season,
  computeQuality,
  SILVER_MULTIPLIER,
  GOLD_MULTIPLIER,
  IRIDIUM_MULTIPLIER,
  calculate,
  Settings,
} from "./crops";

const DEFAULT_SETTINGS: Settings = {
  season: Season.SPRING,
  start_day: 1,
  multiseason_enabled: false,
  quality_probabilities: null,
  tiller_enabled: false,
};

function getCrop(name: string): CropDefinition {
  const crop = CROP_DEFINITIONS.find((c) => c.name == name);
  if (crop === undefined) {
    throw new Error("Crop " + name + " not found!");
  }
  return crop;
}

function expectIsInSeason(
  c: CropData | "out-of-season"
): asserts c is CropData {
  expect(c).not.toBe("out-of-season");
}

describe("testing crop calculation", () => {
  const cauliflower = getCrop("Cauliflower");

  test("cauliflower spring 1", () => {
    const output = calculate(cauliflower, DEFAULT_SETTINGS);

    const expectedProfit = cauliflower.sell_price - cauliflower.seed_cost;
    const expectedDailyProfit = expectedProfit / 12;

    expectIsInSeason(output);
    expect(output.useful_days).toBe(12);
    expect(output.num_harvests).toBe(1);
    expect(output.num_crops).toBe(1);
    expect(output.profit).toBe(expectedProfit);
    expect(output.daily_profit).toBe(expectedDailyProfit);
  });

  test("cauliflower spring 20", () => {
    const settings: Settings = {
      ...DEFAULT_SETTINGS,
      start_day: 20,
    };
    const output = calculate(cauliflower, settings);

    expectIsInSeason(output);
    expect(output.useful_days).toBe(0);
    expect(output.num_harvests).toBe(0);
    expect(output.num_crops).toBe(0);
    expect(output.profit).toBe(-cauliflower.seed_cost);
    expect(output.daily_profit).toBe(-Infinity);
  });

  test("cauliflower summer 1", () => {
    const settings: Settings = {
      ...DEFAULT_SETTINGS,
      season: Season.SUMMER,
    };
    const output = calculate(cauliflower, settings);

    expect(output).toBe("out-of-season");
  });

  const strawberry = getCrop("Strawberry");

  test("strawberry spring 1", () => {
    const output = calculate(strawberry, DEFAULT_SETTINGS);

    const expectedHarvests = 5; // Day 9, 13, 17, 21, 25
    const expectedCrops = 5.1; // +2% chance
    const expectedProfit = 5.1 * strawberry.sell_price - strawberry.seed_cost;
    const expectedDailyProfit = expectedProfit / 24;

    expectIsInSeason(output);
    expect(output.useful_days).toBe(24);
    expect(output.num_harvests).toBe(expectedHarvests);
    expect(output.num_crops).toBe(expectedCrops);
    expect(output.profit).toBe(expectedProfit);
    expect(output.daily_profit).toBe(expectedDailyProfit);
  });

  test("strawberry spring 4", () => {
    const output = calculate(strawberry, { ...DEFAULT_SETTINGS, start_day: 4 });

    const expectedHarvests = 5; // Day 12, 16, 20, 24, 28
    const expectedCrops = 5 * 1.02; // +2% chance
    const expectedProfit =
      5 * 1.02 * strawberry.sell_price - strawberry.seed_cost;
    const expectedDailyProfit = expectedProfit / 24;

    expectIsInSeason(output);
    expect(output.useful_days).toBe(24);
    expect(output.num_harvests).toBe(expectedHarvests);
    expect(output.num_crops).toBe(expectedCrops);
    expect(output.profit).toBe(expectedProfit);
    expect(output.daily_profit).toBe(expectedDailyProfit);
  });

  test("strawberry spring 5", () => {
    const output = calculate(strawberry, { ...DEFAULT_SETTINGS, start_day: 5 });

    const expectedHarvests = 4; // Day 13, 17, 21, 25
    const expectedCrops = 4 * 1.02; // +2% chance
    const expectedProfit =
      4 * 1.02 * strawberry.sell_price - strawberry.seed_cost;
    const expectedDailyProfit = expectedProfit / 20;

    expectIsInSeason(output);
    expect(output.useful_days).toBe(20);
    expect(output.num_harvests).toBe(expectedHarvests);
    expect(output.num_crops).toBe(expectedCrops);
    expect(output.profit).toBe(expectedProfit);
    expect(output.daily_profit).toBe(expectedDailyProfit);
  });

  test("strawberry spring 20", () => {
    const output = calculate(strawberry, {
      ...DEFAULT_SETTINGS,
      start_day: 20,
    });

    const expectedHarvests = 1; // Day 28
    const expectedCrops = 1.02; // +2% chance
    const expectedProfit = 1.02 * strawberry.sell_price - strawberry.seed_cost;
    const expectedDailyProfit = expectedProfit / 8;

    expectIsInSeason(output);
    expect(output.useful_days).toBe(8);
    expect(output.num_harvests).toBe(expectedHarvests);
    expect(output.num_crops).toBe(expectedCrops);
    expect(output.profit).toBe(expectedProfit);
    expect(output.daily_profit).toBe(expectedDailyProfit);
  });

  test("strawberry spring 21", () => {
    const output = calculate(strawberry, {
      ...DEFAULT_SETTINGS,
      start_day: 21,
    });

    const expectedHarvests = 0;
    const expectedCrops = 0;
    const expectedProfit = -strawberry.seed_cost;
    const expectedDailyProfit = -Infinity;

    expectIsInSeason(output);
    expect(output.useful_days).toBe(0);
    expect(output.num_harvests).toBe(expectedHarvests);
    expect(output.num_crops).toBe(expectedCrops);
    expect(output.profit).toBe(expectedProfit);
    expect(output.daily_profit).toBe(expectedDailyProfit);
  });
});
