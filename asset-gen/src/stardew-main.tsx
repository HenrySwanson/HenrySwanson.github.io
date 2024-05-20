"use strict";

import {
  CropData,
  Season,
  computeQuality,
  SILVER_MULTIPLIER,
  GOLD_MULTIPLIER,
  IRIDIUM_MULTIPLIER,
  calculate,
  Settings,
} from "./crops";

import { useState } from "react";
import { createRoot } from "react-dom/client";

// should i pull this from a JSON like i'm doing now? or should i just
// hard-code it inline (might be more readable)
import CROP_DEFINITIONS from "./crop_definitions.json";

function clamp(x: number, min: number, max: number) {
  return Math.max(min, Math.min(max, x));
}

// Defines the set of columns for the whole table.
type Column = {
  name: string;
  cellText: (crop: CropData) => string | JSX.Element;
  compare: (a: CropData, b: CropData) => number;
};

const COLUMNS: Column[] = [
  {
    name: "Name",
    cellText: (crop: CropData) => {
      // NOTE: replace(string, string) only replaces the first one
      const img_name = `/img/${crop.definition.name.replace(/ /g, "_")}.png`;
      return (
        <>
          <img className="inline-icon" src={img_name} />
          {crop.definition.name}
        </>
      );
    },
    compare: (a: CropData, b: CropData) =>
      a.definition.name.localeCompare(b.definition.name),
  },
  {
    name: "Seed Cost",
    cellText: (crop: CropData) => {
      return (
        <>
          <img className="inline-icon" src="/img/Gold.png" />
          {crop.definition.seed_cost}g
        </>
      );
    },
    compare: (a: CropData, b: CropData) =>
      a.definition.seed_cost - b.definition.seed_cost,
  },
  {
    name: "Sell Price",
    cellText: (crop: CropData) => {
      return (
        <>
          <img className="inline-icon" src="/img/Gold.png" />
          {crop.definition.sell_price}g
        </>
      );
    },
    compare: (a: CropData, b: CropData) =>
      a.definition.sell_price - b.definition.sell_price,
  },
  {
    name: "Days to Grow",
    cellText: (crop: CropData) => crop.definition.days_to_grow.toString(),
    compare: (a: CropData, b: CropData) =>
      a.definition.days_to_grow - b.definition.days_to_grow,
  },
  {
    name: "Regrowth Period",
    cellText: (crop: CropData) =>
      crop.definition.regrowth_period?.toString() ?? "-",
    compare: (a: CropData, b: CropData) => {
      if (b.definition.regrowth_period === undefined) {
        return -1;
      } else if (a.definition.regrowth_period === undefined) {
        return 1;
      }
      return a.definition.regrowth_period - b.definition.regrowth_period;
    },
  },
  {
    name: "Yield",
    cellText: (crop: CropData) => {
      const yield_num = crop.definition.yield ?? 1;
      if (crop.definition.percent_chance_extra) {
        return `${yield_num} + ${crop.definition.percent_chance_extra}%`;
      } else {
        return yield_num.toString();
      }
    },
    compare: (a: CropData, b: CropData) => {
      // slight hack -- represent as a + b/100
      const a_num =
        (a.definition.yield ?? 1) +
        (a.definition.percent_chance_extra ?? 0) / 100;
      const b_num =
        (b.definition.yield ?? 1) +
        (b.definition.percent_chance_extra ?? 0) / 100;
      return a_num - b_num;
    },
  },
  {
    name: "Useful Days",
    cellText: (crop: CropData) => crop.useful_days.toString(),
    compare: (a: CropData, b: CropData) => a.useful_days - b.useful_days,
  },
  {
    name: "Num Harvests",
    cellText: (crop: CropData) => crop.num_harvests.toString(),
    compare: (a: CropData, b: CropData) => a.num_crops - b.num_crops,
  },
  {
    name: "Num Crops",
    cellText: (crop: CropData) => {
      const num_crops = crop.num_crops;
      if (Number.isInteger(num_crops)) {
        return num_crops.toString();
      }
      return crop.num_crops.toFixed(2);
    },
    compare: (a: CropData, b: CropData) => a.num_crops - b.num_crops,
  },
  {
    name: "Profit",
    cellText: (crop: CropData) => {
      return (
        <>
          <img className="inline-icon" src="/img/Gold.png" />
          {crop.profit.toFixed(2)}g
        </>
      );
    },
    compare: (a: CropData, b: CropData) => a.profit - b.profit,
  },
  {
    name: "Daily Profit",
    cellText: (crop: CropData) => {
      if (!Number.isFinite(crop.daily_profit)) {
        return "-";
      }
      return (
        <>
          <img className="inline-icon" src="/img/Gold.png" />
          {crop.daily_profit.toFixed(2)}g
        </>
      );
    },
    compare: (a: CropData, b: CropData) => a.daily_profit - b.daily_profit,
  },
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
  quality_checked: boolean;
  farming_level: number;
  tiller_checked: boolean;
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
      checked={inputs.quality_checked}
      onChange={(e) => {
        changeInputs({ ...inputs, quality_checked: e.target.checked });
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
      checked={inputs.tiller_checked}
      onChange={(e) => {
        changeInputs({ ...inputs, tiller_checked: e.target.checked });
      }}
    />
  );

  // Compute some values for things
  const quality = computeQuality(inputs.farming_level);
  const average_quality_score =
    quality.normal +
    quality.silver * SILVER_MULTIPLIER +
    quality.gold * GOLD_MULTIPLIER +
    quality.iridium * IRIDIUM_MULTIPLIER;
  const tiller_checkbox_enabled = inputs.farming_level >= 5;

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
        </tbody>
      </table>
      <table>
        <tbody>
          <tr>
            <td>
              <label htmlFor="enable-multiseason">Multi-season?:</label>
            </td>
            <td>{multiseason_checkbox}</td>
          </tr>
          <tr>
            <td>
              <label htmlFor="enable-quality">Enable Quality?:</label>
            </td>
            <td>{quality_checkbox}</td>
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
        </tbody>
      </table>
      <table>
        <tbody>
          <tr className={inputs.quality_checked ? undefined : "disabled"}>
            <td colSpan={3}>Average Quality Factor:</td>
            <td>{average_quality_score.toFixed(2)}</td>
          </tr>
          <tr className={inputs.quality_checked ? undefined : "disabled"}>
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
    </div>
  );
}

const DEFAULT_INPUTS: Inputs = {
  season: Season.SPRING,
  start_day: 1,
  multiseason_checked: false,
  quality_checked: false,
  farming_level: 1,
  tiller_checked: false,
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
    quality_probabilities: inputs.quality_checked ? quality : null,
    tiller_enabled: inputs.tiller_checked && inputs.farming_level >= 5,
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
