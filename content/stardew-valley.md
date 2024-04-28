+++
title = "Stardew Valley Crop Calculator"
+++

<script src="/crops.js" async></script>

<div id="input-panel">
  <label for="season">Season:</label>
  <select id="season" name="season">
    <option value="spring">Spring</option>
  </select>

  <label for="day">Day (1-28):</label>
  <input type="number" id="day" name="day" min="1" max="28" value="1"/>
</div>

<table id="crop-table"></table>