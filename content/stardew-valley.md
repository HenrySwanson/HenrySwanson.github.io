+++
title = "Stardew Valley Crop Calculator"
[extra]
stylesheet = "/stardew.css"
+++

<script src="/crops.js" async></script>

Note: Only the "Season" and "Day" inputs work at the moment.

<div id="input-panel" class="rounded-box">
<table>
  <tr>
    <td><label for="season">Season:</label></td>
    <td>
      <select id="season" name="season">
        <option value="spring">Spring</option>
        <option value="summer">Summer</option>
        <option value="fall">Fall</option>
        <option value="winter">Winter</option>
      </select>
    </td>
  </tr>
  <tr>
    <td><label for="day">Day (1-28):</label></td>
    <td><input type="number" id="day" name="day" min="1" max="28" value="1"/></td>
  </tr>
</table>
<table>
  <tr>
    <td><label for="multiseason">Multi-season?:</label></td>
    <td><input type="checkbox" id="multiseason" name="multiseason"/></td>
  </tr>
  <tr>
    <td><label for="quality">Enable Quality?:</label></td>
    <td><input type="checkbox" id="quality" name="quality"/></td>
  </tr>
</table>
<table>
  <tr>
    <td><label for="farmer_level">Farmer Level:</label></td>
    <td><input type="number" id="farmer_level" name="farmer_level" min="1" max="10" value="1"/></td>
  </tr>
  <tr>
    <td><label for="tiller">Tiller Profession?:</label></td>
    <td><input type="checkbox" id="tiller" name="tiller"/></td>
  </tr>
</table>
</div>

<div class="rounded-box">
<table id="crop-table" class="sortable"></table>
</div>