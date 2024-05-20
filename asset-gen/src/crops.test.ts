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
  getNumberOfHarvests,
  getExpectedCropsPerHarvest,
  NO_QUALITY,
  QualityProbabilities,
  ExpectedCrops,
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

describe("number of harvests", () => {
  function expectHelper(
    crop: CropDefinition,
    season: Season,
    day: number,
    multiseason_enabled: boolean,
    num_harvests: number,
    duration: number
  ) {
    expect(
      getNumberOfHarvests(crop, season, day, multiseason_enabled)
    ).toStrictEqual({
      number: num_harvests,
      duration,
    });
  }

  test("cauliflower", () => {
    const cauliflower = getCrop("Cauliflower");

    expectHelper(cauliflower, Season.SPRING, 1, false, 1, 12);
    expectHelper(cauliflower, Season.SPRING, 10, false, 1, 12);
    expectHelper(cauliflower, Season.SPRING, 16, false, 1, 12);
    expectHelper(cauliflower, Season.SPRING, 17, false, 0, 0);
    expect(getNumberOfHarvests(cauliflower, Season.SUMMER, 1, false)).toBe(
      "out-of-season"
    );
  });

  test("strawberry", () => {
    const strawberry = getCrop("Strawberry");

    // Days 9, 13, 17, 21, 25
    expectHelper(strawberry, Season.SPRING, 1, false, 5, 24);
    // Days 12, 16, 20, 24, 28
    expectHelper(strawberry, Season.SPRING, 4, false, 5, 24);
    // Days 13, 17, 21, 25
    expectHelper(strawberry, Season.SPRING, 5, false, 4, 20);
    // Day 25, not quite enough time to get another harvest
    expectHelper(strawberry, Season.SPRING, 17, false, 1, 8);
    // Day 28
    expectHelper(strawberry, Season.SPRING, 20, false, 1, 8);
    // No harvest
    expectHelper(strawberry, Season.SPRING, 21, false, 0, 0);
  });

  test("tea", () => {
    const tea = getCrop("Tea Leaves");

    expectHelper(tea, Season.SPRING, 1, false, 7, 27);
    expectHelper(tea, Season.SPRING, 2, false, 6, 26);
    expectHelper(tea, Season.SPRING, 3, false, 5, 25);
    expectHelper(tea, Season.SPRING, 7, false, 1, 21);
    expectHelper(tea, Season.SPRING, 8, false, 0, 20);
  });
});

describe("expected crops", () => {
  function expectHelper(
    crop_name: string,
    quality_probabilities: QualityProbabilities,
    expected_crops: ExpectedCrops
  ) {
    const crop = getCrop(crop_name);
    const output = getExpectedCropsPerHarvest(crop, quality_probabilities);
    expect(output.normal).toBeCloseTo(expected_crops.normal);
    expect(output.silver).toBeCloseTo(expected_crops.silver);
    expect(output.gold).toBeCloseTo(expected_crops.gold);
    expect(output.iridium).toBeCloseTo(expected_crops.iridium);
  }

  test("no quality", () => {
    expectHelper("Cauliflower", NO_QUALITY, {
      normal: 1.0,
      silver: 0.0,
      gold: 0.0,
      iridium: 0.0,
    });

    expectHelper("Potato", NO_QUALITY, {
      normal: 1.25, // there's a 25% chance of extras
      silver: 0.0,
      gold: 0.0,
      iridium: 0.0,
    });

    expectHelper("Coffee Bean", NO_QUALITY, {
      normal: 4.02, // there's a 2% chance of extras
      silver: 0.0,
      gold: 0.0,
      iridium: 0.0,
    });

    expectHelper("Tea Leaves", NO_QUALITY, {
      normal: 1.0,
      silver: 0.0,
      gold: 0.0,
      iridium: 0.0,
    });
  });

  test("with quality", () => {
    const quality = {
      normal: 0.4,
      silver: 0.3,
      gold: 0.2,
      iridium: 0.1,
    };

    expectHelper("Cauliflower", quality, {
      normal: 0.4,
      silver: 0.3,
      gold: 0.2,
      iridium: 0.1,
    });

    expectHelper("Potato", quality, {
      normal: 0.4 + 0.25, // there's a 25% chance of extras
      silver: 0.3,
      gold: 0.2,
      iridium: 0.1,
    });

    expectHelper("Coffee Bean", quality, {
      normal: 3.4 + 0.02, // there's a 2% chance of extras
      silver: 0.3,
      gold: 0.2,
      iridium: 0.1,
    });

    // ignore quality!
    expectHelper("Tea Leaves", quality, {
      normal: 1.0,
      silver: 0.0,
      gold: 0.0,
      iridium: 0.0,
    });
  });
});
