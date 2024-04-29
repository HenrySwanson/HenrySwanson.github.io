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
    let num_crops = num_harvests * ((crop.yield ?? 1) + (crop.percent_chance_extra ?? 0) / 100);

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
type Column = {
    name: string;
    cellText: (crop: CropData) => string;
    compare: (a: CropData, b: CropData) => number;
};

const COLUMNS: Column[] = [
    {
        name: "Name",
        cellText: (crop: CropData) => crop.name,
        compare: (a: CropData, b: CropData) => a.name.localeCompare(b.name),
    },
    {
        name: "Season",
        cellText: (crop: CropData) => Season[crop.season],
        compare: (a: CropData, b: CropData) => a.season.valueOf() - b.season.valueOf(),
    },
    {
        name: "Seed Cost",
        cellText: (crop: CropData) => crop.seed_cost.toString(),
        compare: (a: CropData, b: CropData) => a.seed_cost - b.seed_cost,
    },
    {
        name: "Sell Price",
        cellText: (crop: CropData) => crop.sell_price.toString(),
        compare: (a: CropData, b: CropData) => a.sell_price - b.sell_price,
    },
    {
        name: "Days to Grow",
        cellText: (crop: CropData) => crop.days_to_grow.toString(),
        compare: (a: CropData, b: CropData) => a.days_to_grow - b.days_to_grow,
    },
    {
        name: "Regrowth Period",
        cellText: (crop: CropData) => crop.regrowth_period?.toString() ?? "-",
        compare: (a: CropData, b: CropData) => {
            if (b.regrowth_period === null) {
                return -1;
            } else if (a.regrowth_period === null) {
                return 1;
            }
            return a.regrowth_period - b.regrowth_period;
        }
    },
    {
        name: "Yield",
        cellText: (crop: CropData) => {
            let yield_num = crop.yield ?? 1;
            if (crop.percent_chance_extra) {
                return `${yield_num} + ${crop.percent_chance_extra}%`;
            } else {
                return yield_num.toString();
            }
        },
        compare: (a: CropData, b: CropData) => {
            // slight hack -- represent as a + b/100
            let a_num = (a.yield ?? 1) + (a.percent_chance_extra ?? 0) / 100;
            let b_num = (b.yield ?? 1) + (b.percent_chance_extra ?? 0) / 100;
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
            let num_crops = crop.num_crops;
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
        for (let col of COLUMNS) {
            let value = col.cellText(this.data);
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
    tbody: HTMLTableSectionElement;
    rows: CropRow[];
    current_sort: [number, SortDirection] | null;

    constructor(table: HTMLTableElement) {
        this.table = table;
        this.rows = [];
        this.current_sort = null;

        // Create table header and body
        let thead = this.table.createTHead();
        this.tbody = this.table.createTBody();

        // Populate head once, here
        let row = thead.insertRow();
        for (let [idx, col] of COLUMNS.entries()) {
            let cell = row.insertCell();
            cell.appendChild(document.createTextNode(col.name));
            cell.addEventListener("click", (event) => {
                // Which way do we sort?
                let dir: SortDirection;
                if (this.current_sort !== null && this.current_sort[0] === idx) {
                    dir = flipDirection(this.current_sort[1]);
                } else {
                    dir = "ascending";
                }
                this.current_sort = [idx, dir];

                // Clear all the header buttons, except ourselves
                let headers = this.table.querySelectorAll('thead td');
                for (let header of headers) {
                    header.removeAttribute("aria-sort");
                }
                headers[idx].setAttribute("aria-sort", dir);

                // Now sort the rows
                this.sortRows();
            });
        }

        // Body needs to be recalculated often, so put that in its
        // own function.
        this.recalculateRows(1);
    }

    // TODO: don't recreate rows; change the text instead
    public recalculateRows(current_day: number) {
        // Discard the old rows and create new ones
        this.tbody.replaceChildren();
        this.rows = [];
        for (let def of CROP_DEFINITIONS) {
            let data = calculate(def, current_day);
            let row = this.tbody.insertRow();
            this.rows.push(new CropRow(row, data));
        }

        // We also need to re-sort them. 
        this.sortRows();
    }

    private sortRows() {

        if (this.current_sort === null) {
            return;
        }
        let [idx, dir] = this.current_sort;

        // We first sort our own collection, then use that to re-insert
        // our row elements.
        let col = COLUMNS[idx];
        this.rows.sort((a, b) => {
            let compare = col.compare(a.data, b.data);
            return dir === "ascending" ? compare : -compare;
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