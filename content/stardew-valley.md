+++
title = "Stardew Valley Crop Calculator"
[extra]
stylesheet = "/stardew.css"
+++

<script src="/crops.js" async></script>

<div>
<table id="input-panel">
  <tr>
    <td><label for="season">Season:</label></td>
    <td>
      <select id="season" name="season">
        <option value="spring">Spring</option>
      </select>
    </td>
  </tr>
  <tr>
    <td><label for="day">Day (1-28):</label></td>
    <td><input type="number" id="day" name="day" min="1" max="28" value="1"/></td>
  </tr>
</table>

<table id="crop-table" class="sortable"></table>