"use strict";

// should i pull this from a JSON like i'm doing now? or should i just
// hard-code it inline (might be more readable)
import CROP_DEFINITIONS from "./crops.json";

/* ======== CALCULATION ======== */

type CropDefinition = typeof CROP_DEFINITIONS[number];

enum Season {
    SPRING, SUMMER, FALL
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
            default:
                throw new Error(`Unknown season ${s}`);
        }
    }
}

type CropData = {
    name: string,
    season: Season,
    seed_cost: number,
    sell_price: number,
    days_to_grow: number,
    regrowth_period: number | null,
    yield: number | null,
    percent_chance_extra: number | null,
    useful_days: number,
    num_harvests: number,
    num_crops: number,
    profit: number,
    daily_profit: number,
};

function calculate(crop: CropDefinition, start_day: number): CropData {
    let days_left = 28 - start_day;  // planting on day 28 is zero days left

    // What's the profit? Depends how many harvests we can get this season.
    let num_harvests = 0;
    let useful_days = 0;
    if (days_left >= crop.days_to_grow) {
        num_harvests += 1;
        useful_days += crop.days_to_grow;
        if (crop.regrowth_period) {
            let extra_harvests = Math.floor((days_left - crop.days_to_grow) / crop.regrowth_period);
            num_harvests += extra_harvests;
            useful_days += extra_harvests * crop.regrowth_period;
        }
    }

    // We can sometimes get multiple crops per harvest
    let num_crops = num_harvests * (crop.yield ?? 1) + ((crop.percent_chance_extra ?? 0) / 100);

    let profit = num_crops * crop.sell_price - crop.seed_cost;
    let daily_profit = profit / useful_days;

    return {
        name: crop.name,
        season: Season.fromString(crop.season),
        seed_cost: crop.seed_cost,
        sell_price: crop.sell_price,
        days_to_grow: crop.days_to_grow,
        regrowth_period: crop.regrowth_period ?? null,
        yield: crop.yield ?? null,
        percent_chance_extra: crop.percent_chance_extra ?? null,
        useful_days,
        num_harvests,
        num_crops,
        profit,
        daily_profit,
    };
}

/* ======== GUI ======== */

// Defines the set of columns for the whole table.
type Column = [string, ((crop: CropData) => string)];
const COLUMNS: Column[] = [
    ["Name", (crop: CropData) => { return crop.name; }],
    ["Season", (crop: CropData) => {
        return Season[crop.season];
    }],
    ["Seed Cost", (crop: CropData) => { return crop.seed_cost.toString(); }],
    ["Sell Price", (crop: CropData) => { return crop.sell_price.toString(); }],
    ["Days to Grow", (crop: CropData) => { return crop.days_to_grow.toString(); }],
    ["Regrowth Period", (crop: CropData) => {
        return crop.regrowth_period?.toString() ?? "-";
    }],
    ["Yield", (crop: CropData) => {
        let yield_num = crop.yield ?? 1;
        if (crop.percent_chance_extra) {
            return `${yield_num} + ${crop.percent_chance_extra}%`;
        } else {
            return yield_num.toString();
        }
    }],
    ["Useful Days", (crop: CropData) => { return crop.useful_days.toString(); }],
    ["Num Harvests", (crop: CropData) => { return crop.num_harvests.toString(); }],
    ["Num Crops", (crop: CropData) => {
        let num_crops = crop.num_crops;
        if (Number.isInteger(num_crops)) {
            return num_crops.toString();
        }
        return crop.num_crops.toFixed(2);
    }],
    ["Profit", (crop: CropData) => { return crop.profit.toFixed(2); }],
    ["Daily Profit", (crop: CropData) => {
        if (Number.isFinite(crop.daily_profit)) {
            return crop.daily_profit.toFixed(2);
        }
        return "-";
    }]
];

class CropRow {
    data: CropData;
    row: HTMLTableRowElement;

    constructor(row: HTMLTableRowElement, data: CropData) {
        this.data = data;
        this.row = row;

        // now populate the row
        for (let [_, col_attr] of COLUMNS) {
            let value = col_attr(this.data);
            this.row.insertCell().appendChild(document.createTextNode(value));
        }
    }
}

class CropTable {
    table: HTMLTableElement;
    tbody: HTMLTableSectionElement;
    rows: CropRow[];

    constructor(table: HTMLTableElement) {
        this.table = table;
        this.rows = [];

        // Create table header and body
        let thead = this.table.createTHead();
        this.tbody = this.table.createTBody();

        // Populate head once, here
        let row = thead.insertRow();
        for (let [idx, [col_name, _]] of COLUMNS.entries()) {
            let cell = row.insertCell();
            cell.appendChild(document.createTextNode(col_name));
            cell.addEventListener("click", (event) => {
                this.sortRows(idx);
            });
        }

        // Body needs to be recalculated often, so put that in its
        // own function.
        this.recalculateRows(1);
    }

    public recalculateRows(current_day: number) {
        this.tbody.replaceChildren();
        for (let def of CROP_DEFINITIONS) {
            let data = calculate(def, current_day);
            let row = this.tbody.insertRow();
            this.rows.push(new CropRow(row, data));
        }
    }

    private sortRows(idx: number) {
        // Update the buttons in the header (also this is how we
        // discover which way we're sorting)
        let headers = this.table.querySelectorAll('thead td');
        let sort_ascending = true;
        for (let [i, header] of headers.entries()) {
            if (idx === i) {
                // This is the right column; flip the sort order, or
                // if it's not set, sort asscending by default.
                let sort_dir = header.getAttribute('aria-sort');
                if (sort_dir === "descending") {
                    header.setAttribute("aria-sort", "ascending");
                    sort_ascending = false;
                } else {
                    header.setAttribute("aria-sort", "descending");
                }
            } else {
                // Clear the sort attribute
                header.removeAttribute("aria-sort");
            }
        }

        // Sort our collection of rows
        this.rows.sort((a, b) => {
            let a_key = a.row.children[idx].textContent!;
            let b_key = b.row.children[idx].textContent!;

            let ret = a_key > b_key ? 1 : -1;
            
            if (sort_ascending) {
                return ret;
            } else {
                return -ret;
            }
        });

        // Then use that to rearrange the nodes in the body
        for (let row of this.rows) {
            this.tbody.appendChild(row.row);
        }
    }
}

function initialize() {
    console.log("Initializing!");

    // Find all the elements I need
    let table = document.getElementById("crop-table");
    if (!(table instanceof HTMLTableElement)) {
        throw new Error("crop-table should be a <table>");
    }

    let input_panel = document.getElementById("input-panel")!;
    let current_day_input = document.querySelector<HTMLInputElement>("#day")!;

    // Create components
    let table_component = new CropTable(table);

    // Attach event listeners
    input_panel.addEventListener("change", (event) => {
        let current_day = current_day_input.valueAsNumber;
        table_component.recalculateRows(current_day);
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