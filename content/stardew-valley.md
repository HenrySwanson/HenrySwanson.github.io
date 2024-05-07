+++
title = "Stardew Valley Crop Calculator"
[extra]
stylesheet = "/stardew.css"
+++

<script src="/crops.js" async></script>

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
    <td><label for="enable-multiseason">Multi-season?:</label></td>
    <td><input type="checkbox" id="enable-multiseason" name="enable-multiseason"/></td>
  </tr>
  <tr>
    <td><label for="enable-quality">Enable Quality?:</label></td>
    <td><input type="checkbox" id="enable-quality" name="enable-quality"/></td>
  </tr>
</table>
<table>
  <tr>
    <td><label for="farmer-level">Farmer Level:</label></td>
    <td><input type="number" id="farmer-level" name="farmer-level" min="1" max="10" value="1"/></td>
  </tr>
  <tr>
    <td><label for="enable-tiller">Tiller Profession?:</label></td>
    <td><input type="checkbox" id="enable-tiller" name="enable-tiller"/></td>
  </tr>
</table>
<table>
  <tr>
    <td colspan=3>Average Quality Factor:</td>
    <td id="average-quality">1.00</td>
  </tr>
  <tr>
    <td id="percent-normal"></td>
    <td id="percent-silver"></td>
    <td id="percent-gold"></td>
    <td id="percent-iridium"></td>
  </tr>
</table>
</div>

<div class="rounded-box">
<table id="crop-table" class="sortable"></table>
</div>

<nav id="test-area"></nav>