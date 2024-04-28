"use strict";

// should i pull this from a JSON like i'm doing now? or should i just
// hard-code it inline (might be more readable)
import crop_definitions from "./crops.json";

type CropDefinition = typeof crop_definitions[number];

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
    name: String,
    season: Season,
    seed_cost: number,
    sell_price: number,
    days_to_grow: number,
    regrowth_period: number | "N/A",
    num_harvests: number,
    num_crops: number,
    profit: number,
    daily_profit: number,
};

function calculate(crop: CropDefinition, start_day: number): CropData {
    let days_left = 28 - start_day;  // planting on day 28 is zero days left

    // What's the profit? Depends how many harvests we can get this season.
    let harvests = 0;
    let useful_days = 0;
    if (days_left > crop.days_to_grow) {
        harvests += 1;
        useful_days += crop.days_to_grow;
        if (crop.regrowth_period) {
            let extra_harvests = Math.floor((days_left - crop.days_to_grow) / crop.regrowth_period);
            harvests += extra_harvests;
            useful_days += extra_harvests * crop.regrowth_period;
        }
    }

    // We can sometimes get multiple crops per harvest
    let num_crops = harvests * (crop.yield ?? 1) * (1 + (crop.percent_chance_extra ?? 0) / 100);

    let profit = num_crops * crop.sell_price - crop.seed_cost;
    let daily_profit = profit / useful_days;

    return {
        name: crop.name,
        season: Season.fromString(crop.season),
        seed_cost: crop.seed_cost,
        sell_price: crop.sell_price,
        days_to_grow: crop.days_to_grow,
        regrowth_period: crop.regrowth_period ?? "N/A",
        num_harvests: harvests,
        num_crops,
        profit,
        daily_profit,
    };
}

type Column = [string, keyof CropData];
let columns: Column[] = [
    ["Name", "name"],
    ["Season", "season"],
    ["Seed Cost", "seed_cost"],
    ["Sell Price", "sell_price"],
    ["Days to Grow", "days_to_grow"],
    ["Regrowth Period", "regrowth_period"],
    ["Num Harvests", "num_harvests"],
    ["Num Crops", "num_crops"],
    ["Profit", "profit"],
    ["Daily Profit", "daily_profit"]
];

function hydrateTable() {
    console.log("Hydrating!");
    let table = document.getElementById("crop-table");
    if (!(table instanceof HTMLTableElement)) {
        throw new Error("crop-table should be a <table>");
    }

    table.replaceChildren();

    // Get the inputs
    let current_day = document.querySelector<HTMLInputElement>("#day")!.valueAsNumber;

    // Table header
    let thead = table.createTHead();
    let row = thead.insertRow();
    for (let [col_name, _] of columns) {
        row.insertCell().appendChild(document.createTextNode(col_name));
    }

    // Rows in the table body
    let tbody = table.createTBody();
    for (let data of crop_definitions) {
        let output = calculate(data, current_day);
        let row = tbody.insertRow();
        for (let [_, col_attr] of columns) {
            let value = output[col_attr];
            row.insertCell().appendChild(document.createTextNode(value.toString()));
        }
    }
}

// Hydrate the table
if (document.readyState === "loading") {
    // Loading hasn't finished yet
    document.addEventListener("DOMContentLoaded", hydrateTable);
} else {
    // `DOMContentLoaded` has already fired
    hydrateTable();
}

// Add listener to the inputs
// TODO: don't recreate the table! just edit it
document.getElementById("input-panel")!.addEventListener("change", hydrateTable);