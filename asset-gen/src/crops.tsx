"use strict";

// should i pull this from a JSON like i'm doing now? or should i just
// hard-code it inline (might be more readable)
import CROP_DEFINITIONS from "./crops.json";

function clamp(x: number, min: number, max: number) {
    return Math.max(min, Math.min(max, x));
}

/* ======== CALCULATION ======== */

type CropDefinition = typeof CROP_DEFINITIONS[number];

enum Season {
    SPRING, SUMMER, FALL, WINTER
}

namespace Season {
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

type CropData = {
    definition: CropDefinition,
    useful_days: number,
    num_harvests: number,
    num_crops: number,
    profit: number,
    daily_profit: number,
};

type QualityProbabilities = {
    normal: number,
    silver: number,
    gold: number,
    iridium: number,
};
type QualityTypes = keyof QualityProbabilities;

const SILVER_MULTIPLIER = 1.25;
const GOLD_MULTIPLIER = 1.5;
const IRIDIUM_MULTIPLIER = 2.0;

function computeQuality(farming_level: number): QualityProbabilities {
    // https://stardewvalleywiki.com/Farming#Complete_Formula_2
    const fertilizer_level = 0;

    // Quality for a crop is determined by a series of weighted coin flips.
    // The probabilities for the coins are computed here.
    const p_gold_coin = 0.2 * (farming_level / 10.0) + 0.2 * fertilizer_level * ((farming_level + 2.0) / 12.0) + 0.01;
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

type Settings = {
    season: Season,
    start_day: number,
    multiseason_enabled: boolean,
    quality_probabilities: QualityProbabilities | null,
    tiller_enabled: boolean,
};

function calculate(crop: CropDefinition, settings: Settings): CropData | "out-of-season" {
    // When is this crop in-season?
    const seasons: Season[] = [];
    const num_seasons = crop.multiseason ?? 1;
    for (let i = 0; i < num_seasons; i++) {
        seasons.push(Season.fromString(crop.season).valueOf() + i);
    }

    // Bail out if we're out of season
    if (!seasons.includes(settings.season)) {
        return "out-of-season";
    }

    // How many days do we have left?
    const seasons_left = settings.multiseason_enabled
        ? seasons.length - seasons.indexOf(settings.season)
        : 1;
    const days_left = 28 * seasons_left - settings.start_day;

    // In the number of days remaining, how many harvests do we get?
    let num_harvests = 0;
    let useful_days = 0;
    if (days_left >= crop.days_to_grow) {
        num_harvests += 1;
        useful_days += crop.days_to_grow;
        if (crop.regrowth_period) {
            const extra_harvests = Math.floor((days_left - crop.days_to_grow) / crop.regrowth_period);
            num_harvests += extra_harvests;
            useful_days += extra_harvests * crop.regrowth_period;
        }
    }

    // How much is a crop worth, on average?
    const base_price = crop.sell_price;
    let quality_price;
    if (settings.quality_probabilities) {
        const q = settings.quality_probabilities;
        // zip together prices and probabilities
        quality_price = [
            [1.0, q.normal],
            [SILVER_MULTIPLIER, q.silver],
            [GOLD_MULTIPLIER, q.gold],
            [IRIDIUM_MULTIPLIER, q.iridium],
        ]
            // prices are rounded down!
            .map(([multiplier, p]) => Math.trunc(multiplier * base_price) * p)
            .reduce((a, b) => a + b);
    } else {
        quality_price = base_price;
    }

    // We can sometimes get multiple crops per harvest, but all the extra crops
    // will be regular quality.
    // TODO: is this true? i see conflicting sources online
    const num_crops_per_harvest = (crop.yield ?? 1) + (crop.percent_chance_extra ?? 0) / 100.0;
    let revenue_per_harvest = quality_price + (num_crops_per_harvest - 1) * base_price;

    if (settings.tiller_enabled) {
        revenue_per_harvest *= 1.1; // could maybe do this before to get integer prices
    }

    // Okay, let's calculate everything!
    const profit = revenue_per_harvest * num_harvests - crop.seed_cost;
    const daily_profit = profit / useful_days;

    return {
        definition: crop,
        useful_days,
        num_harvests,
        num_crops: num_crops_per_harvest * num_harvests,
        profit,
        daily_profit,
    };
}

/* ======== GUI ======== */

import { useState } from "react";
import { createRoot } from "react-dom/client";

// Defines the set of columns for the whole table.
type Column = {
    name: string;
    cellText: (crop: CropData) => string;
    compare: (a: CropData, b: CropData) => number;
};

const COLUMNS: Column[] = [
    {
        name: "Name",
        cellText: (crop: CropData) => crop.definition.name,
        compare: (a: CropData, b: CropData) => a.definition.name.localeCompare(b.definition.name),
    },
    {
        name: "Seed Cost",
        cellText: (crop: CropData) => crop.definition.seed_cost.toString(),
        compare: (a: CropData, b: CropData) => a.definition.seed_cost - b.definition.seed_cost,
    },
    {
        name: "Sell Price",
        cellText: (crop: CropData) => crop.definition.sell_price.toString(),
        compare: (a: CropData, b: CropData) => a.definition.sell_price - b.definition.sell_price,
    },
    {
        name: "Days to Grow",
        cellText: (crop: CropData) => crop.definition.days_to_grow.toString(),
        compare: (a: CropData, b: CropData) => a.definition.days_to_grow - b.definition.days_to_grow,
    },
    {
        name: "Regrowth Period",
        cellText: (crop: CropData) => crop.definition.regrowth_period?.toString() ?? "-",
        compare: (a: CropData, b: CropData) => {
            if (b.definition.regrowth_period === undefined) {
                return -1;
            } else if (a.definition.regrowth_period === undefined) {
                return 1;
            }
            return a.definition.regrowth_period - b.definition.regrowth_period;
        }
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
            const a_num = (a.definition.yield ?? 1) + (a.definition.percent_chance_extra ?? 0) / 100;
            const b_num = (b.definition.yield ?? 1) + (b.definition.percent_chance_extra ?? 0) / 100;
            return a_num - b_num;
        }
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
        cellText: (crop: CropData) => crop.profit.toFixed(2),
        compare: (a: CropData, b: CropData) => a.profit - b.profit,
    },
    {
        name: "Daily Profit",
        cellText: (crop: CropData) => {
            if (Number.isFinite(crop.daily_profit)) {
                return crop.daily_profit.toFixed(2);
            }
            return "-";
        },
        compare: (a: CropData, b: CropData) => a.daily_profit - b.daily_profit,
    }
];

function CropRow({ crop_data }: { crop_data: CropData; }) {

    let cells = [];
    for (const col of COLUMNS) {
        const value = col.cellText(crop_data);
        cells.push(
            <td key={col.name}>{value}</td>
        );
    }

    return <tr>{cells}</tr>;
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


function CropTable({ crop_data }: { crop_data: CropData[]; }) {
    const [currentSort, setCurrentSort] = useState<[number, SortDirection] | null>(null);

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
            <td
                key={col.name}
                onClick={() => handleClick(idx)}
                aria-sort={aria_sort}> {col.name}
            </td >);
    }

    // Create the rows
    let rows = [];
    for (const data of sortCropData()) {
        rows.push(<CropRow key={data.definition.name} crop_data={data}></CropRow>);
    }

    return <>
        <thead><tr>{header_cells}</tr></thead>
        <tbody>{rows}</tbody>
    </>;
}

type Inputs = {
    season: Season,
    start_day: number,
    multiseason_checked: boolean,
    quality_checked: boolean,
    farming_level: number,
    tiller_checked: boolean,
};

// Global escape hatch
let _global_inputs: Inputs = {
    season: Season.SPRING,
    start_day: 1,
    multiseason_checked: false,
    quality_checked: false,
    farming_level: 1,
    tiller_checked: false
};
let _global_rerender: (() => void);

function InputPanel() {
    const [inputs, setInputs] = useState<Inputs>(_global_inputs);

    function updateInputs(i: Inputs) {
        i.start_day = clamp(i.start_day, 1, 28);
        i.farming_level = clamp(i.farming_level, 1, 10);
        setInputs(i);

        // Hack to set global and trigger re-rendering of other components
        _global_inputs = i;
        _global_rerender();
    }

    const season_select = <select
        id="season"
        name="season"
        value={Season[inputs.season].toLowerCase()}
        onChange={e => {
            updateInputs({ ...inputs, season: Season.fromString(e.target.value) });
        }}>
        <option value="spring">Spring</option>
        <option value="summer">Summer</option>
        <option value="fall">Fall</option>
        <option value="winter">Winter</option>
    </select>;

    const day_input = <input
        type="number"
        id="day"
        name="day"
        value={inputs.start_day}
        onChange={e => {
            updateInputs({ ...inputs, start_day: e.target.valueAsNumber });
        }} />;

    const multiseason_checkbox = <input
        type="checkbox"
        id="enable-multiseason"
        name="enable-multiseason"
        checked={inputs.multiseason_checked}
        onChange={e => {
            updateInputs({ ...inputs, multiseason_checked: e.target.checked });
        }}
    />;

    const quality_checkbox = <input
        type="checkbox"
        id="enable-quality"
        name="enable-quality"
        checked={inputs.quality_checked}
        onChange={e => {
            updateInputs({ ...inputs, quality_checked: e.target.checked });
        }}
    />;

    const farmer_level_input = <input
        type="number"
        id="farmer-level"
        name="farmer-level"
        min="1" max="10"
        value={inputs.farming_level}
        onChange={e => {
            updateInputs({ ...inputs, farming_level: e.target.valueAsNumber });
        }} />;

    const tiller_checkbox = <input
        type="checkbox"
        id="enable-tiller"
        name="enable-tiller"
        checked={inputs.tiller_checked}
        onChange={e => {
            updateInputs({ ...inputs, tiller_checked: e.target.checked });
        }} />;

    // Compute some values for things
    const quality = computeQuality(inputs.farming_level);
    const average_quality_score = quality.normal + quality.silver * 1.25 + quality.gold * 1.5 + quality.iridium * 2.0;
    const tiller_checkbox_enabled = inputs.farming_level >= 5;

    // TODO: should this be a <form>?
    return <>
        <table>
            <tbody>
                <tr>
                    <td><label htmlFor="season">Season:</label></td>
                    <td>{season_select}</td>
                </tr>
                <tr>
                    <td><label htmlFor="day">Day (1-28):</label></td>
                    <td>{day_input}</td>
                </tr>
            </tbody>
        </table>
        <table>
            <tbody>
                <tr>
                    <td><label htmlFor="enable-multiseason">Multi-season?:</label></td>
                    <td>{multiseason_checkbox}</td>
                </tr>
                <tr>
                    <td><label htmlFor="enable-quality">Enable Quality?:</label></td>
                    <td>{quality_checkbox}</td>
                </tr>
            </tbody>
        </table>
        <table>
            <tbody>
                <tr>
                    <td><label htmlFor="farmer-level">Farmer Level:</label></td>
                    <td>{farmer_level_input}</td>
                </tr>
                <tr>
                    <td className={tiller_checkbox_enabled ? undefined : "disabled"}><label htmlFor="enable-tiller">Tiller Profession?:</label></td>
                    <td className={tiller_checkbox_enabled ? undefined : "disabled"}>{tiller_checkbox}</td>
                </tr>
            </tbody>
        </table>
        <table>
            <tbody>
                <tr>
                    <td className={inputs.quality_checked ? undefined : "disabled"} colSpan={3}>Average Quality Factor:</td>
                    <td className={inputs.quality_checked ? undefined : "disabled"}>{average_quality_score.toFixed(2)}</td>
                </tr>
                <tr>
                    <td className={inputs.quality_checked ? undefined : "disabled"}>{(100 * quality.normal).toFixed(0)}%</td>
                    <td className={inputs.quality_checked ? undefined : "disabled"}>{(100 * quality.silver).toFixed(0)}%</td>
                    <td className={inputs.quality_checked ? undefined : "disabled"}>{(100 * quality.gold).toFixed(0)}%</td>
                    <td className={inputs.quality_checked ? undefined : "disabled"}>{(100 * quality.iridium).toFixed(0)}%</td>
                </tr>
            </tbody>
        </table >
    </>;
}

function initialize() {
    console.log("Initializing!");

    // Find all the elements I need
    const table = document.getElementById("crop-table");
    if (!(table instanceof HTMLTableElement)) {
        throw new Error("crop-table should be a <table>");
    }

    // Create table component
    const root = createRoot(table);
    root.render(<CropTable crop_data={[]}></CropTable>);

    const foo = createRoot(document.getElementById("input-panel")!);
    foo.render(<InputPanel></InputPanel>);

    // Applies the input settings to the document
    function readAndApplySettings() {
        // Read all the inputs
        const inputs = _global_inputs;

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

        // Repopulate table and change style
        root.render(<CropTable crop_data={crop_data}></CropTable>);
        document.documentElement.className = Season[inputs.season].toLowerCase();

        console.log(_global_inputs.season);
    }

    // Run it once to apply the default settings.
    readAndApplySettings();

    _global_rerender = readAndApplySettings;
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

