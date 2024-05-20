+++
title = "Stardew Valley Crop Calculator"
[extra]
stylesheet = "/stardew.css"
+++

<script src="/js/stardew-main.js" async></script>

<div id="root"></div>

{% div_wrapper(class="centeredtext") %}
This calculator makes a few assumptions, some of which are atypical:
- All crops are planted only once, and watered until no longer productive.
  - This means that crops that don't regrow are not replanted, even if there would be time to do so.
  - This affects how we compute "daily" profit. We only count the days that you'd need to water plant, to avoid penalizing crops that don't fit evenly into the season.
- All seeds are bought from Pierre's, except those that can't. For those, I selected a seed cost in an arbitrary way.
  - Ancient Fruit, Broccoli, Carrot, Powdermelon, Summer Squash: must be foraged. Labeled as 0g for now, but will be updated to use Seed Maker cost later.
  - Coffee Beans: cost of a normal-quality harvested bean (15g)
  - Pineapple, Taro Root: must be obtained via trade; cost is the cost of the traded goods (Magma Cap and 2x Bone Fragment, respectively)
  - Tea Leaves: must be crafted, set cost to 0g.
- All crops that can be irrigated are (Rice, Taro Root)
- Giant Crops are not considered
- All crops are available to purchase (i.e., we don't track the fact that Garlic is not available until Year 2)
- No further processing of crops
  - This includes Artisan Goods
  - But also, this makes Sunflowers and Rice unprofitable. I will get around to fixing that.
{% end %}

{% div_wrapper(class="centeredtext") %}
Images and crop data taken from the [Stardew Valley Wiki](https://stardewvalleywiki.com/Crops), source is available on [GitHub](https://github.com/HenrySwanson/HenrySwanson.github.io).
{% end %}
