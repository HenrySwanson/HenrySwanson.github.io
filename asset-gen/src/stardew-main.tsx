"use strict";

import {
  CropData,
  Season,
  computeQuality,
  calculate,
  Settings,
  PRICE_MULTIPLIERS,
  qualityDot,
  ProcessingType,
} from "./crops";

import { useState } from "react";
import { createRoot } from "react-dom/client";

// should i pull this from a JSON like i'm doing now? or should i just
// hard-code it inline (might be more readable)
import CROP_DEFINITIONS from "./crop_definitions.json";

function clamp(x: number, min: number, max: number) {
  return Math.max(min, Math.min(max, x));
}

function toFixedOrInteger(n: number, fractionDigits?: number): string {
  if (Number.isInteger(n)) {
    return n.toString();
  }
  return n.toFixed(fractionDigits);
}

// Sorts
function compareNumbers(x: number, y: number): number {
  return x - y;
}

function compareNullableNumbers(
  x: number | null,
  y: number | null,
  nullIs: "min" | "max" = "min"
): number {
  if (x === null && y === null) {
    return 0;
  }
  if (x === null) {
    return nullIs === "min" ? -1 : 1;
  }
  if (y === null) {
    return nullIs === "min" ? 1 : -1;
  }
  return x - y;
}

// Defines the set of columns for the whole table.
type Column = {
  name: string;
  cellText: (crop: CropData) => string | JSX.Element;
  compare: (a: CropData, b: CropData) => number;
};

function makeColumn<T>(
  name: string,
  keyFn: (crop: CropData) => T,
  cellText: (key: T) => string | JSX.Element,
  compare: (keyA: T, keyB: T) => number
): Column {
  return {
    name,
    cellText: (crop: CropData) => {
      const key = keyFn(crop);
      return cellText(key);
    },
    compare: (a: CropData, b: CropData) => {
      const keyA = keyFn(a);
      const keyB = keyFn(b);
      return compare(keyA, keyB);
    },
  };
}

const COLUMNS: Column[] = [
  makeColumn(
    "Name",
    (crop: CropData) => crop.definition.name,
    (name: string) => {
      // NOTE: replace(string, string) only replaces the first one
      const img_name = `/img/${name.replace(/ /g, "_")}.png`;
      return (
        <>
          <img className="inline-icon" src={img_name} />
          {name}
        </>
      );
    },
    (a: string, b: string) => a.localeCompare(b)
  ),
  makeColumn(
    "Growth",
    (crop: CropData) => crop.definition.days_to_grow,
    (n: number) => `${n}d`,
    compareNumbers
  ),
  makeColumn(
    "Regrowth",
    (crop: CropData) => crop.definition.regrowth_period ?? null,
    (n: number | null) => (n ? `${n}d` : "-"), //n?.toString() ?? "-",
    compareNullableNumbers
  ),
  makeColumn(
    "Useful Days",
    (crop: CropData) => crop.useful_days,
    (n: number) => n.toString(),
    compareNumbers
  ),
  makeColumn<[number, number]>(
    "Yield",
    (crop: CropData) => [
      crop.definition.yield ?? 1,
      crop.definition.percent_chance_extra ?? 0,
    ],
    ([y, extra]) => {
      if (extra !== 0) {
        return `${y} + ${extra}%`;
      } else {
        return y.toString();
      }
    },
    ([a_yield, a_extra], [b_yield, b_extra]) => {
      // slight hack -- represent as a + b/100
      return a_yield + a_extra / 100 - (b_yield + b_extra / 100);
    }
  ),
  makeColumn(
    "Num Harvests",
    (crop: CropData) => crop.num_harvests,
    (n: number) => n.toString(),
    compareNumbers
  ),
  makeColumn(
    "Num Crops",
    (crop: CropData) => crop.num_crops,
    (n: number) => toFixedOrInteger(n, 2),
    compareNumbers
  ),
  makeColumn(
    "Seed Cost",
    (crop: CropData) => crop.definition.seed_cost,
    (seed_cost: number) => {
      // NOTE: replace(string, string) only replaces the first one
      return (
        <>
          <img className="inline-icon" src="/img/Gold.png" />
          {seed_cost}g
        </>
      );
    },
    compareNumbers
  ),
  makeColumn(
    "Processing",
    (crop: CropData) => crop.processing_type,
    (type: ProcessingType) => {
      switch (type) {
        case "raw":
          return "-";
        case "preserves":
          return "Preserves Jar";
        case "keg":
          return "Keg";
        case "oil":
          return "Oil Maker";
      }
    },
    (a, b) => a.localeCompare(b)
  ),
  makeColumn(
    "Output",
    (crop: CropData) => crop.proceeds.quantity,
    (quantity: number) => {
      return quantity.toFixed(2);
    },
    compareNumbers
  ),
  makeColumn(
    "Sell Price",
    (crop: CropData) => crop.proceeds.price,
    (sell_price: number) => {
      return (
        <>
          <img className="inline-icon" src="/img/Gold.png" />
          {sell_price.toFixed(2)}g
        </>
      );
    },
    compareNumbers
  ),
  makeColumn(
    "Profit",
    (crop: CropData) => crop.profit,
    (profit: number) => {
      return (
        <>
          <img className="inline-icon" src="/img/Gold.png" />
          {profit.toFixed(2)}g
        </>
      );
    },
    compareNumbers
  ),
  makeColumn(
    "Daily Profit",
    (crop: CropData) =>
      crop.useful_days !== 0 ? crop.profit / crop.useful_days : null,
    (daily_profit: number | null) => {
      if (daily_profit === null) {
        return "-";
      }
      return (
        <>
          <img className="inline-icon" src="/img/Gold.png" />
          {daily_profit.toFixed(2)}g
        </>
      );
    },
    compareNullableNumbers
  ),
];

function CropRow({ crop_data }: { crop_data: CropData }) {
  let cells = [];
  for (const col of COLUMNS) {
    const value = col.cellText(crop_data);
    cells.push(<td key={col.name}>{value}</td>);
  }

  // Disable a row if it can't be harvested this season
  return (
    <tr className={crop_data.num_harvests > 0 ? undefined : "disabled"}>
      {cells}
    </tr>
  );
}

type SortDirection = "ascending" | "descending";
function flipDirection(x: SortDirection): SortDirection {
  switch (x) {
    case "ascending":
      return "descending";
    case "descending":
      return "ascending";
  }
}

function CropTable({ crop_data }: { crop_data: CropData[] }) {
  const [currentSort, setCurrentSort] = useState<
    [number, SortDirection] | null
  >(null);

  function handleClick(idx: number) {
    // Which way do we sort?
    let dir: SortDirection;
    if (currentSort !== null && currentSort[0] === idx) {
      dir = flipDirection(currentSort[1]);
    } else {
      dir = "ascending";
    }
    setCurrentSort([idx, dir]);
  }

  function sortCropData(): CropData[] {
    // If no sort selected, default is to sort by name
    let idx: number;
    let dir: SortDirection;
    if (currentSort === null) {
      idx = 0;
      dir = "ascending";
    } else {
      [idx, dir] = currentSort;
    }

    // We first sort our own collection, then use that to re-insert
    // our row elements.
    const col = COLUMNS[idx];
    crop_data.sort((a, b) => {
      const compare = col.compare(a, b);
      return dir === "ascending" ? compare : -compare;
    });
    return crop_data;
  }

  // Create table header
  let header_cells = [];
  for (const [idx, col] of COLUMNS.entries()) {
    let aria_sort = currentSort?.[0] == idx ? currentSort[1] : undefined;
    header_cells.push(
      <th key={col.name} onClick={() => handleClick(idx)} aria-sort={aria_sort}>
        {col.name}
      </th>
    );
  }

  // Create the rows
  let rows = [];
  for (const data of sortCropData()) {
    rows.push(<CropRow key={data.definition.name} crop_data={data}></CropRow>);
  }

  return (
    <div className="rounded-box">
      <table className="sortable">
        <thead>
          <tr>{header_cells}</tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
    </div>
  );
}

type Inputs = {
  season: Season;
  start_day: number;
  multiseason_checked: boolean;
  quality_checkbox: boolean;
  farming_level: number;
  tiller_checkbox: boolean;
  artisan_checkbox: boolean;
  preserves_jar_checkbox: boolean;
  kegs_checkbox: boolean;
  oil_checkbox: boolean;
};

function InputPanel({
  inputs,
  changeInputs,
}: {
  inputs: Inputs;
  changeInputs: (inputs: Inputs) => void;
}) {
  const season_select = (
    <select
      id="season"
      name="season"
      value={Season[inputs.season].toLowerCase()}
      onChange={(e) => {
        changeInputs({ ...inputs, season: Season.fromString(e.target.value) });
      }}
    >
      <option value="spring">Spring</option>
      <option value="summer">Summer</option>
      <option value="fall">Fall</option>
      <option value="winter">Winter</option>
    </select>
  );

  const day_input = (
    <input
      type="number"
      id="day"
      name="day"
      value={inputs.start_day}
      onChange={(e) => {
        changeInputs({ ...inputs, start_day: e.target.valueAsNumber });
      }}
    />
  );

  const multiseason_checkbox = (
    <input
      type="checkbox"
      id="enable-multiseason"
      name="enable-multiseason"
      checked={inputs.multiseason_checked}
      onChange={(e) => {
        changeInputs({ ...inputs, multiseason_checked: e.target.checked });
      }}
    />
  );

  const quality_checkbox = (
    <input
      type="checkbox"
      id="enable-quality"
      name="enable-quality"
      checked={inputs.quality_checkbox}
      onChange={(e) => {
        changeInputs({ ...inputs, quality_checkbox: e.target.checked });
      }}
    />
  );

  const farmer_level_input = (
    <input
      type="number"
      id="farmer-level"
      name="farmer-level"
      min="1"
      max="10"
      value={inputs.farming_level}
      onChange={(e) => {
        changeInputs({ ...inputs, farming_level: e.target.valueAsNumber });
      }}
    />
  );

  const tiller_checkbox = (
    <input
      type="checkbox"
      id="enable-tiller"
      name="enable-tiller"
      checked={inputs.tiller_checkbox}
      onChange={(e) => {
        changeInputs({ ...inputs, tiller_checkbox: e.target.checked });
      }}
    />
  );

  const artisan_checkbox = (
    <input
      type="checkbox"
      id="enable-artisan"
      name="enable-artisan"
      checked={inputs.artisan_checkbox}
      onChange={(e) => {
        changeInputs({ ...inputs, artisan_checkbox: e.target.checked });
      }}
    />
  );

  const preserves_checkbox = (
    <input
      type="checkbox"
      id="enable-preserves"
      name="enable-preserves"
      checked={inputs.preserves_jar_checkbox}
      onChange={(e) => {
        changeInputs({ ...inputs, preserves_jar_checkbox: e.target.checked });
      }}
    />
  );

  const kegs_checkbox = (
    <input
      type="checkbox"
      id="enable-kegs"
      name="enable-kegs"
      checked={inputs.kegs_checkbox}
      onChange={(e) => {
        changeInputs({ ...inputs, kegs_checkbox: e.target.checked });
      }}
    />
  );

  const oil_checkbox = (
    <input
      type="checkbox"
      id="enable-oil"
      name="enable-oil"
      checked={inputs.oil_checkbox}
      onChange={(e) => {
        changeInputs({ ...inputs, oil_checkbox: e.target.checked });
      }}
    />
  );

  // Compute some values for things
  const quality = computeQuality(inputs.farming_level);
  const average_quality_score = qualityDot(quality, PRICE_MULTIPLIERS);
  const tiller_checkbox_enabled = inputs.farming_level >= 5;
  const artisan_checkbox_enabled = inputs.farming_level >= 10;

  // TODO: should this be a <form>?
  return (
    <div className="rounded-box">
      <table>
        <tbody>
          <tr>
            <td>
              <label htmlFor="season">Season:</label>
            </td>
            <td>{season_select}</td>
          </tr>
          <tr>
            <td>
              <label htmlFor="day">Day (1-28):</label>
            </td>
            <td>{day_input}</td>
          </tr>
          <tr>
            <td>
              <label htmlFor="enable-multiseason">Multi-season?:</label>
            </td>
            <td>{multiseason_checkbox}</td>
          </tr>
        </tbody>
      </table>
      <table>
        <tbody>
          <tr>
            <td>
              <label htmlFor="farmer-level">Farmer Level:</label>
            </td>
            <td>{farmer_level_input}</td>
          </tr>
          <tr className={tiller_checkbox_enabled ? undefined : "disabled"}>
            <td>
              <label htmlFor="enable-tiller">Tiller Profession?:</label>
            </td>
            <td>{tiller_checkbox}</td>
          </tr>
          <tr className={artisan_checkbox_enabled ? undefined : "disabled"}>
            <td>
              <label htmlFor="enable-artisan">Artisan Profession?:</label>
            </td>
            <td>{artisan_checkbox}</td>
          </tr>
        </tbody>
      </table>
      <table>
        <tbody>
          <tr>
            <td colSpan={3}>
              <label htmlFor="enable-quality">Enable Quality?:</label>
            </td>
            <td>{quality_checkbox}</td>
          </tr>
          <tr className={inputs.quality_checkbox ? undefined : "disabled"}>
            <td colSpan={3}>Average Quality Factor:</td>
            <td>{average_quality_score.toFixed(2)}</td>
          </tr>
          <tr className={inputs.quality_checkbox ? undefined : "disabled"}>
            <td>
              <img className="inline-icon" src="/img/Base_Quality.png" />
              {(100 * quality.normal).toFixed(0)}%
            </td>
            <td>
              <img className="inline-icon" src="/img/Silver_Quality.png" />
              {(100 * quality.silver).toFixed(0)}%
            </td>
            <td>
              <img className="inline-icon" src="/img/Gold_Quality.png" />
              {(100 * quality.gold).toFixed(0)}%
            </td>
            <td>
              <img className="inline-icon" src="/img/Iridium_Quality.png" />
              {(100 * quality.iridium).toFixed(0)}%
            </td>
          </tr>
        </tbody>
      </table>
      <table>
        <tbody>
          <tr>
            <td>
              <label htmlFor="enable-preserves">Preserve Jars?:</label>
            </td>
            <td>{preserves_checkbox}</td>
          </tr>
          <tr>
            <td>
              <label htmlFor="enable-kegs">Kegs?:</label>
            </td>
            <td>{kegs_checkbox}</td>
          </tr>
          <tr>
            <td>
              <label htmlFor="enable-oil">Oil Makers?:</label>
            </td>
            <td>{oil_checkbox}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

const DEFAULT_INPUTS: Inputs = {
  season: Season.SPRING,
  start_day: 1,
  multiseason_checked: false,
  quality_checkbox: false,
  farming_level: 1,
  tiller_checkbox: false,
  artisan_checkbox: false,
  preserves_jar_checkbox: false,
  kegs_checkbox: false,
  oil_checkbox: false,
};

function Root() {
  const [inputs, setInputs] = useState<Inputs>(DEFAULT_INPUTS);

  function updateInputs(i: Inputs) {
    // Do some quick massaging of the input data.
    // TODO: is this the actual max/min?
    i.farming_level = clamp(i.farming_level, 1, 10);

    // When the user ticks the season too far, wrap around and bump the season, for nice UX.
    if (i.start_day <= 0) {
      i.start_day = 28;
      i.season = (i.season + 3) % 4;
    } else if (i.start_day > 28) {
      i.start_day = 1;
      i.season = (i.season + 1) % 4;
    }

    setInputs(i);
  }

  // Construct the settings
  const quality = computeQuality(inputs.farming_level);
  let settings: Settings = {
    season: inputs.season,
    start_day: inputs.start_day,
    multiseason_enabled: inputs.multiseason_checked,
    quality_probabilities: inputs.quality_checkbox ? quality : null,
    tiller_skill_chosen: inputs.tiller_checkbox && inputs.farming_level >= 5,
    artisan_skill_chosen: inputs.artisan_checkbox && inputs.farming_level >= 10,
    preserves_jar_enabled: inputs.preserves_jar_checkbox,
    kegs_enabled: inputs.kegs_checkbox,
    oil_maker_enabled: inputs.oil_checkbox,
  };

  // Get the rows to draw
  // Discard the old rows and create new ones
  let crop_data = [];
  for (const def of CROP_DEFINITIONS) {
    // Filter to crops that are in-season
    const data = calculate(def, settings);
    if (data == "out-of-season") {
      continue;
    }
    crop_data.push(data);
  }

  // Change style of whole document
  document.documentElement.className = Season[inputs.season].toLowerCase();

  return (
    <>
      <InputPanel inputs={inputs} changeInputs={updateInputs}></InputPanel>
      <CropTable crop_data={crop_data}></CropTable>
    </>
  );
}

function initialize() {
  console.log("Initializing!");

  // Create React root
  const root = createRoot(document.getElementById("root")!);
  root.render(<Root />);
}

// Alrighty, we're ready to go! Wait for the DOM to finish loading (or see if it
// already has.
if (document.readyState === "loading") {
  // Loading hasn't finished yet
  document.addEventListener("DOMContentLoaded", initialize);
} else {
  // `DOMContentLoaded` has already fired
  initialize();
}
