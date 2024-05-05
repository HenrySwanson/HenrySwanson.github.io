"use strict";

// should i pull this from a JSON like i'm doing now? or should i just
// hard-code it inline (might be more readable)
import CROP_DEFINITIONS from "./crops.json";

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

class CropRow {
    data: CropData;
    row: HTMLTableRowElement;

    constructor(row: HTMLTableRowElement, data: CropData) {
        this.data = data;
        this.row = row;

        // now populate the row
        for (const col of COLUMNS) {
            const value = col.cellText(this.data);
            this.row.insertCell().appendChild(document.createTextNode(value));
        }
    }
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

class CropTable {
    table: HTMLTableElement;
    thead: HTMLTableSectionElement;
    tbody: HTMLTableSectionElement;
    rows: CropRow[];
    current_sort: [number, SortDirection] | null;

    constructor(table: HTMLTableElement) {
        this.table = table;
        this.rows = [];
        this.current_sort = null;

        // Create table header and body
        this.thead = this.table.createTHead();
        this.tbody = this.table.createTBody();

        // Populate head once, here
        const row = this.thead.insertRow();
        for (const [idx, col] of COLUMNS.entries()) {
            const cell = row.insertCell();
            cell.appendChild(document.createTextNode(col.name));
            cell.addEventListener("click", () => {
                // Which way do we sort?
                let dir: SortDirection;
                if (this.current_sort !== null && this.current_sort[0] === idx) {
                    dir = flipDirection(this.current_sort[1]);
                } else {
                    dir = "ascending";
                }
                this.current_sort = [idx, dir];

                // Clear all the header buttons, except ourselves
                const headers = this.thead.querySelectorAll('td');
                for (const header of headers) {
                    header.removeAttribute("aria-sort");
                }
                headers[idx].setAttribute("aria-sort", dir);

                // Now sort the rows
                this.sortRows();
            });
        }

        // We'll leave the body empty because it'll be recomputed from
        // repopulateTable(), and we need the settings to be able to
        // create the rows anyways.
    }

    // TODO: don't recreate rows; change the text instead
    public repopulateTable(settings: Settings) {
        // Discard the old rows and create new ones
        this.tbody.replaceChildren();
        this.rows = [];
        for (const def of CROP_DEFINITIONS) {
            // Filter to crops that are in-season
            const data = calculate(def, settings);
            if (data == "out-of-season") {
                continue;
            }
            const row = this.tbody.insertRow();
            this.rows.push(new CropRow(row, data));
        }

        // We also need to re-sort them. 
        this.sortRows();
    }

    private sortRows() {
        // If no sort selected, default is to sort by name
        let idx: number;
        let dir: SortDirection;
        if (this.current_sort === null) {
            idx = 0;
            dir = "ascending";
        } else {
            [idx, dir] = this.current_sort;
        }

        // We first sort our own collection, then use that to re-insert
        // our row elements.
        const col = COLUMNS[idx];
        this.rows.sort((a, b) => {
            const compare = col.compare(a.data, b.data);
            return dir === "ascending" ? compare : -compare;
        });

        // Then use that to rearrange the nodes in the body
        for (const row of this.rows) {
            this.tbody.appendChild(row.row);
        }
    }
}

type Inputs = {
    season: Season,
    start_day: number,
    multiseason_checked: boolean,
    quality_checked: boolean,
    farming_level: number,
    tiller_checked: boolean,
};

function visuallyEnableRow(row: HTMLElement, enable: boolean) {
    for (let cell of row.querySelectorAll("td")) {
        if (enable) {
            cell.classList.remove("disabled");
        } else {
            cell.classList.add("disabled");
        }
    }
}

function initialize() {
    console.log("Initializing!");

    // Find all the elements I need
    const table = document.getElementById("crop-table");
    if (!(table instanceof HTMLTableElement)) {
        throw new Error("crop-table should be a <table>");
    }

    const input_panel = document.getElementById("input-panel")!;
    const season_input = document.querySelector<HTMLInputElement>("#season")!;
    const current_day_input = document.querySelector<HTMLInputElement>("#day")!;
    const enable_multiseason = document.querySelector<HTMLInputElement>("#enable-multiseason")!;
    const enable_quality = document.querySelector<HTMLInputElement>("#enable-quality")!;
    const farming_level_input = document.querySelector<HTMLInputElement>("#farmer-level")!;
    const enable_tiller = document.querySelector<HTMLInputElement>("#enable-tiller")!;

    let quality_cells = {
        normal: document.getElementById(`percent-normal`)!,
        silver: document.getElementById(`percent-silver`)!,
        gold: document.getElementById(`percent-gold`)!,
        iridium: document.getElementById(`percent-iridium`)!,
    };
    let avg_quality_cell = document.getElementById("average-quality")!;

    // Create table component
    const table_component = new CropTable(table);

    // Read inputs
    function readInputs(): Inputs {
        return {
            season: Season.fromString(season_input.value),
            start_day: current_day_input.valueAsNumber,
            multiseason_checked: enable_multiseason.checked,
            quality_checked: enable_quality.checked,
            farming_level: farming_level_input.valueAsNumber,
            tiller_checked: enable_tiller.checked,
        };
    }

    // Applies the input settings to the document
    function readAndApplySettings() {
        // Read all the inputs
        const inputs = readInputs();

        // Construct the settings
        const quality = computeQuality(inputs.farming_level);
        let settings: Settings = {
            season: inputs.season,
            start_day: inputs.start_day,
            multiseason_enabled: inputs.multiseason_checked,
            quality_probabilities: enable_quality.checked ? quality : null,
            tiller_enabled: enable_tiller.checked,
        };

        // Touch the display elements
        let q: QualityTypes;
        for (q in quality_cells) {
            const percent = 100 * quality[q];
            quality_cells[q].textContent = `${percent.toFixed(0)}%`;
        }
        const quality_factor = quality.normal + quality.silver * 1.25 + quality.gold * 1.5 + quality.iridium * 2.0;
        avg_quality_cell.textContent = quality_factor.toFixed(2);

        // Disable certain elements
        visuallyEnableRow(enable_tiller.parentElement!.parentElement!, inputs.farming_level >= 5);
        if (inputs.farming_level < 5) {
            settings.tiller_enabled = false;
        }

        for (q in quality_cells) {
            visuallyEnableRow(quality_cells[q].parentElement!, inputs.quality_checked);
        }
        visuallyEnableRow(avg_quality_cell.parentElement!, inputs.quality_checked);

        // Repopulate table and change style
        table_component.repopulateTable(settings);
        document.documentElement.className = season_input.value.toLowerCase();
    }

    // Run it once to apply the default settings.
    readAndApplySettings();

    // Attach event listeners
    input_panel.addEventListener("change", (event) => {
        readAndApplySettings();
    });
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