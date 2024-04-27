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
    profit: number,
    daily_profit: number,
};

function calculate(crop: CropDefinition): CropData {
    let profit = crop.sell_price - crop.seed_cost;
    let daily_profit = profit / crop.days_to_grow;
    return {
        name: crop.name,
        season: Season.fromString(crop.season),
        seed_cost: crop.seed_cost,
        sell_price: crop.sell_price,
        days_to_grow: crop.days_to_grow,
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

    // Table header
    let thead = table.createTHead();
    let row = thead.insertRow();
    for (let [col_name, _] of columns) {
        row.insertCell().appendChild(document.createTextNode(col_name));
    }

    // Rows in the table body
    let tbody = table.createTBody();
    for (let data of crop_definitions) {
        let output = calculate(data);
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