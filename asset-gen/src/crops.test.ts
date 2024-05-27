import CROP_DEFINITIONS from "./crop_definitions.json";
import {
  CropData,
  CropDefinition,
  Season,
  Settings,
  getNumberOfHarvests,
  getExpectedCropsPerHarvest,
  NO_QUALITY,
  QualityVector,
} from "./crops";

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
    // Out of season (different from no harvest!)
    expect(getNumberOfHarvests(strawberry, Season.SUMMER, 1, false)).toBe(
      "out-of-season"
    );
  });

  test("multiseason", () => {
    // Single-crop
    const sunflower = getCrop("Sunflower");
    // Multi-crop
    const corn = getCrop("Corn");

    // Tea is just weird always, test it in its own thing

    // Will it grow in the first season, as normal?
    expectHelper(sunflower, Season.SUMMER, 1, false, 1, 8);
    expectHelper(sunflower, Season.SUMMER, 20, false, 1, 8);
    expectHelper(sunflower, Season.SUMMER, 21, false, 0, 0);
    expectHelper(corn, Season.SUMMER, 1, false, 4, 26);
    expectHelper(corn, Season.SUMMER, 3, false, 3, 22);
    expectHelper(corn, Season.SUMMER, 14, false, 1, 14);
    expectHelper(corn, Season.SUMMER, 15, false, 0, 0);

    // What about the second season?
    expectHelper(sunflower, Season.FALL, 1, false, 1, 8);
    expectHelper(sunflower, Season.FALL, 20, false, 1, 8);
    expectHelper(sunflower, Season.FALL, 21, false, 0, 0);
    expectHelper(corn, Season.FALL, 1, false, 4, 26);
    expectHelper(corn, Season.FALL, 14, false, 1, 14);
    expectHelper(corn, Season.FALL, 15, false, 0, 0);

    // Can it cross over when the flag is set?
    expectHelper(sunflower, Season.SUMMER, 21, true, 1, 8);
    expectHelper(sunflower, Season.SUMMER, 28, true, 1, 8);
    expectHelper(corn, Season.SUMMER, 1, true, 4 + 7, 26 + 28);
    expectHelper(corn, Season.SUMMER, 2, true, 4 + 7, 26 + 28);
    expectHelper(corn, Season.SUMMER, 3, true, 3 + 7, 22 + 28);

    // It will not cross over into the wrong season
    expectHelper(sunflower, Season.FALL, 21, true, 0, 0);
    expectHelper(corn, Season.FALL, 25, true, 0, 0);

    // It also won't grow in the wrong season at all
    expect(getNumberOfHarvests(sunflower, Season.SPRING, 1, true)).toBe(
      "out-of-season"
    );
    expect(getNumberOfHarvests(sunflower, Season.SPRING, 28, true)).toBe(
      "out-of-season"
    );
    expect(getNumberOfHarvests(corn, Season.SPRING, 1, true)).toBe(
      "out-of-season"
    );
    expect(getNumberOfHarvests(corn, Season.SPRING, 28, true)).toBe(
      "out-of-season"
    );
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
    quality_probabilities: QualityVector<number>,
    expected_crops: QualityVector<number>
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
      normal: 3.4 + 0.02, // 3 extra beans, with a 2% chance of extras
      silver: 0.3,
      gold: 0.2,
      iridium: 0.1,
    });

    // tea doesn't have quality!
    expectHelper("Tea Leaves", quality, {
      normal: 1.0,
      silver: 0.0,
      gold: 0.0,
      iridium: 0.0,
    });
  });
});
