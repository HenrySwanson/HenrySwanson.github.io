(()=>{"use strict";const e=JSON.parse('[{"name":"Blue Jazz","season":"Spring","seed_cost":30,"sell_price":50,"days_to_grow":7},{"name":"Carrot","season":"Spring","seed_cost":0,"sell_price":35,"days_to_grow":3},{"name":"Cauliflower","season":"Spring","seed_cost":80,"sell_price":175,"days_to_grow":12},{"name":"Coffee Bean","season":"Spring","seed_cost":15,"sell_price":15,"days_to_grow":10,"regrowth_period":2,"yield":4,"percent_chance_extra":2},{"name":"Garlic","season":"Spring","seed_cost":40,"sell_price":60,"days_to_grow":4},{"name":"Green Bean","season":"Spring","seed_cost":60,"sell_price":40,"days_to_grow":10,"regrowth_period":3},{"name":"Kale","season":"Spring","seed_cost":70,"sell_price":110,"days_to_grow":6},{"name":"Parsnip","season":"Spring","seed_cost":20,"sell_price":35,"days_to_grow":4},{"name":"Potato","season":"Spring","seed_cost":50,"sell_price":80,"days_to_grow":6,"percent_chance_extra":25},{"name":"Rhubarb","season":"Spring","seed_cost":100,"sell_price":220,"days_to_grow":13},{"name":"Rice","season":"Spring","seed_cost":40,"sell_price":30,"days_to_grow":6},{"name":"Strawberry","season":"Spring","seed_cost":100,"sell_price":120,"days_to_grow":8,"regrowth_period":4,"percent_chance_extra":2},{"name":"Tulip","season":"Spring","seed_cost":20,"sell_price":30,"days_to_grow":6}]');var t;function r(e,r){var o,s,n,a,i;let l=28-r,d=0,c=0;if(l>=e.days_to_grow&&(d+=1,c+=e.days_to_grow,e.regrowth_period)){let t=Math.floor((l-e.days_to_grow)/e.regrowth_period);d+=t,c+=t*e.regrowth_period}let _=d*(null!==(o=e.yield)&&void 0!==o?o:1)+(null!==(s=e.percent_chance_extra)&&void 0!==s?s:0)/100,p=_*e.sell_price-e.seed_cost,u=p/c;return{name:e.name,season:t.fromString(e.season),seed_cost:e.seed_cost,sell_price:e.sell_price,days_to_grow:e.days_to_grow,regrowth_period:null!==(n=e.regrowth_period)&&void 0!==n?n:null,yield:null!==(a=e.yield)&&void 0!==a?a:null,percent_chance_extra:null!==(i=e.percent_chance_extra)&&void 0!==i?i:null,useful_days:c,num_harvests:d,num_crops:_,profit:p,daily_profit:u}}!function(e){e[e.SPRING=0]="SPRING",e[e.SUMMER=1]="SUMMER",e[e.FALL=2]="FALL"}(t||(t={})),function(e){e.fromString=function(t){switch(t.toUpperCase()){case"SPRING":return e.SPRING;case"SUMMER":return e.SUMMER;case"FALL":return e.FALL;default:throw new Error(`Unknown season ${t}`)}}}(t||(t={}));const o=[["Name",e=>e.name],["Season",e=>t[e.season]],["Seed Cost",e=>e.seed_cost.toString()],["Sell Price",e=>e.sell_price.toString()],["Days to Grow",e=>e.days_to_grow.toString()],["Regrowth Period",e=>{var t,r;return null!==(r=null===(t=e.regrowth_period)||void 0===t?void 0:t.toString())&&void 0!==r?r:"-"}],["Yield",e=>{var t;let r=null!==(t=e.yield)&&void 0!==t?t:1;return e.percent_chance_extra?`${r} + ${e.percent_chance_extra}%`:r.toString()}],["Useful Days",e=>e.useful_days.toString()],["Num Harvests",e=>e.num_harvests.toString()],["Num Crops",e=>{let t=e.num_crops;return Number.isInteger(t)?t.toString():e.num_crops.toFixed(2)}],["Profit",e=>e.profit.toFixed(2)],["Daily Profit",e=>Number.isFinite(e.daily_profit)?e.daily_profit.toFixed(2):"-"]];class s{constructor(e,t){this.data=t,this.row=e;for(let[e,t]of o){let e=t(this.data);this.row.insertCell().appendChild(document.createTextNode(e))}}}class n{constructor(e){this.table=e,this.rows=[];let t=this.table.createTHead();this.tbody=this.table.createTBody();let r=t.insertRow();for(let[e,[t,s]]of o.entries()){let o=r.insertCell();o.appendChild(document.createTextNode(t)),o.addEventListener("click",(t=>{this.sortRows(e)}))}this.recalculateRows(1)}recalculateRows(t){this.tbody.replaceChildren();for(let o of e){let e=r(o,t),n=this.tbody.insertRow();this.rows.push(new s(n,e))}}sortRows(e){let t=this.table.querySelectorAll("thead td"),r=!0;for(let[o,s]of t.entries())e===o?"descending"===s.getAttribute("aria-sort")?(s.setAttribute("aria-sort","ascending"),r=!1):s.setAttribute("aria-sort","descending"):s.removeAttribute("aria-sort");this.rows.sort(((t,o)=>{let s=t.row.children[e].textContent>o.row.children[e].textContent?1:-1;return r?s:-s}));for(let e of this.rows)this.tbody.appendChild(e.row)}}function a(){console.log("Initializing!");let e=document.getElementById("crop-table");if(!(e instanceof HTMLTableElement))throw new Error("crop-table should be a <table>");let t=document.getElementById("input-panel"),r=document.querySelector("#day"),o=new n(e);t.addEventListener("change",(e=>{let t=r.valueAsNumber;o.recalculateRows(t)}))}"loading"===document.readyState?document.addEventListener("DOMContentLoaded",a):a()})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUFHQyxLQUNmLElBR0lDLEVBSFFGLEVBQUV2QyxJQUFJMEMsU0FBU3hCLEdBQUt5QixZQUNwQkgsRUFBRXhDLElBQUkwQyxTQUFTeEIsR0FBS3lCLFlBRU4sR0FBSyxFQUUvQixPQUFJWCxFQUNPUyxHQUVDQSxDQUNaLElBSUosSUFBSyxJQUFJekMsS0FBT0UsS0FBS1UsS0FDakJWLEtBQUthLE1BQU1SLFlBQVlQLEVBQUlBLElBRW5DLEVBR0osU0FBUzRDLElBQ0xDLFFBQVFDLElBQUksaUJBR1osSUFBSW5DLEVBQVFILFNBQVN1QyxlQUFlLGNBQ3BDLEtBQU1wQyxhQUFpQnFDLGtCQUNuQixNQUFNLElBQUkxRCxNQUFNLGtDQUdwQixJQUFJMkQsRUFBY3pDLFNBQVN1QyxlQUFlLGVBQ3RDRyxFQUFvQjFDLFNBQVMyQyxjQUFnQyxRQUc3REMsRUFBa0IsSUFBSTFDLEVBQVVDLEdBR3BDc0MsRUFBWTNCLGlCQUFpQixVQUFXQyxJQUNwQyxJQUFJRyxFQUFjd0IsRUFBa0JHLGNBQ3BDRCxFQUFnQjNCLGdCQUFnQkMsRUFBWSxHQUVwRCxDQUs0QixZQUF4QmxCLFNBQVM4QyxXQUVUOUMsU0FBU2MsaUJBQWlCLG1CQUFvQnNCLEdBRzlDQSxHIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vLy4vc3JjL2Nyb3BzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIlwidXNlIHN0cmljdFwiO1xyXG5cclxuLy8gc2hvdWxkIGkgcHVsbCB0aGlzIGZyb20gYSBKU09OIGxpa2UgaSdtIGRvaW5nIG5vdz8gb3Igc2hvdWxkIGkganVzdFxyXG4vLyBoYXJkLWNvZGUgaXQgaW5saW5lIChtaWdodCBiZSBtb3JlIHJlYWRhYmxlKVxyXG5pbXBvcnQgQ1JPUF9ERUZJTklUSU9OUyBmcm9tIFwiLi9jcm9wcy5qc29uXCI7XHJcblxyXG4vKiA9PT09PT09PSBDQUxDVUxBVElPTiA9PT09PT09PSAqL1xyXG5cclxudHlwZSBDcm9wRGVmaW5pdGlvbiA9IHR5cGVvZiBDUk9QX0RFRklOSVRJT05TW251bWJlcl07XHJcblxyXG5lbnVtIFNlYXNvbiB7XHJcbiAgICBTUFJJTkcsIFNVTU1FUiwgRkFMTFxyXG59XHJcblxyXG5uYW1lc3BhY2UgU2Vhc29uIHtcclxuICAgIGV4cG9ydCBmdW5jdGlvbiBmcm9tU3RyaW5nKHM6IHN0cmluZyk6IFNlYXNvbiB7XHJcbiAgICAgICAgc3dpdGNoIChzLnRvVXBwZXJDYXNlKCkpIHtcclxuICAgICAgICAgICAgY2FzZSBcIlNQUklOR1wiOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFNlYXNvbi5TUFJJTkc7XHJcbiAgICAgICAgICAgIGNhc2UgXCJTVU1NRVJcIjpcclxuICAgICAgICAgICAgICAgIHJldHVybiBTZWFzb24uU1VNTUVSO1xyXG4gICAgICAgICAgICBjYXNlIFwiRkFMTFwiOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFNlYXNvbi5GQUxMO1xyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIHNlYXNvbiAke3N9YCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG50eXBlIENyb3BEYXRhID0ge1xyXG4gICAgbmFtZTogc3RyaW5nLFxyXG4gICAgc2Vhc29uOiBTZWFzb24sXHJcbiAgICBzZWVkX2Nvc3Q6IG51bWJlcixcclxuICAgIHNlbGxfcHJpY2U6IG51bWJlcixcclxuICAgIGRheXNfdG9fZ3JvdzogbnVtYmVyLFxyXG4gICAgcmVncm93dGhfcGVyaW9kOiBudW1iZXIgfCBudWxsLFxyXG4gICAgeWllbGQ6IG51bWJlciB8IG51bGwsXHJcbiAgICBwZXJjZW50X2NoYW5jZV9leHRyYTogbnVtYmVyIHwgbnVsbCxcclxuICAgIHVzZWZ1bF9kYXlzOiBudW1iZXIsXHJcbiAgICBudW1faGFydmVzdHM6IG51bWJlcixcclxuICAgIG51bV9jcm9wczogbnVtYmVyLFxyXG4gICAgcHJvZml0OiBudW1iZXIsXHJcbiAgICBkYWlseV9wcm9maXQ6IG51bWJlcixcclxufTtcclxuXHJcbmZ1bmN0aW9uIGNhbGN1bGF0ZShjcm9wOiBDcm9wRGVmaW5pdGlvbiwgc3RhcnRfZGF5OiBudW1iZXIpOiBDcm9wRGF0YSB7XHJcbiAgICBsZXQgZGF5c19sZWZ0ID0gMjggLSBzdGFydF9kYXk7ICAvLyBwbGFudGluZyBvbiBkYXkgMjggaXMgemVybyBkYXlzIGxlZnRcclxuXHJcbiAgICAvLyBXaGF0J3MgdGhlIHByb2ZpdD8gRGVwZW5kcyBob3cgbWFueSBoYXJ2ZXN0cyB3ZSBjYW4gZ2V0IHRoaXMgc2Vhc29uLlxyXG4gICAgbGV0IG51bV9oYXJ2ZXN0cyA9IDA7XHJcbiAgICBsZXQgdXNlZnVsX2RheXMgPSAwO1xyXG4gICAgaWYgKGRheXNfbGVmdCA+PSBjcm9wLmRheXNfdG9fZ3Jvdykge1xyXG4gICAgICAgIG51bV9oYXJ2ZXN0cyArPSAxO1xyXG4gICAgICAgIHVzZWZ1bF9kYXlzICs9IGNyb3AuZGF5c190b19ncm93O1xyXG4gICAgICAgIGlmIChjcm9wLnJlZ3Jvd3RoX3BlcmlvZCkge1xyXG4gICAgICAgICAgICBsZXQgZXh0cmFfaGFydmVzdHMgPSBNYXRoLmZsb29yKChkYXlzX2xlZnQgLSBjcm9wLmRheXNfdG9fZ3JvdykgLyBjcm9wLnJlZ3Jvd3RoX3BlcmlvZCk7XHJcbiAgICAgICAgICAgIG51bV9oYXJ2ZXN0cyArPSBleHRyYV9oYXJ2ZXN0cztcclxuICAgICAgICAgICAgdXNlZnVsX2RheXMgKz0gZXh0cmFfaGFydmVzdHMgKiBjcm9wLnJlZ3Jvd3RoX3BlcmlvZDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gV2UgY2FuIHNvbWV0aW1lcyBnZXQgbXVsdGlwbGUgY3JvcHMgcGVyIGhhcnZlc3RcclxuICAgIGxldCBudW1fY3JvcHMgPSBudW1faGFydmVzdHMgKiAoY3JvcC55aWVsZCA/PyAxKSArICgoY3JvcC5wZXJjZW50X2NoYW5jZV9leHRyYSA/PyAwKSAvIDEwMCk7XHJcblxyXG4gICAgbGV0IHByb2ZpdCA9IG51bV9jcm9wcyAqIGNyb3Auc2VsbF9wcmljZSAtIGNyb3Auc2VlZF9jb3N0O1xyXG4gICAgbGV0IGRhaWx5X3Byb2ZpdCA9IHByb2ZpdCAvIHVzZWZ1bF9kYXlzO1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgbmFtZTogY3JvcC5uYW1lLFxyXG4gICAgICAgIHNlYXNvbjogU2Vhc29uLmZyb21TdHJpbmcoY3JvcC5zZWFzb24pLFxyXG4gICAgICAgIHNlZWRfY29zdDogY3JvcC5zZWVkX2Nvc3QsXHJcbiAgICAgICAgc2VsbF9wcmljZTogY3JvcC5zZWxsX3ByaWNlLFxyXG4gICAgICAgIGRheXNfdG9fZ3JvdzogY3JvcC5kYXlzX3RvX2dyb3csXHJcbiAgICAgICAgcmVncm93dGhfcGVyaW9kOiBjcm9wLnJlZ3Jvd3RoX3BlcmlvZCA/PyBudWxsLFxyXG4gICAgICAgIHlpZWxkOiBjcm9wLnlpZWxkID8/IG51bGwsXHJcbiAgICAgICAgcGVyY2VudF9jaGFuY2VfZXh0cmE6IGNyb3AucGVyY2VudF9jaGFuY2VfZXh0cmEgPz8gbnVsbCxcclxuICAgICAgICB1c2VmdWxfZGF5cyxcclxuICAgICAgICBudW1faGFydmVzdHMsXHJcbiAgICAgICAgbnVtX2Nyb3BzLFxyXG4gICAgICAgIHByb2ZpdCxcclxuICAgICAgICBkYWlseV9wcm9maXQsXHJcbiAgICB9O1xyXG59XHJcblxyXG4vKiA9PT09PT09PSBHVUkgPT09PT09PT0gKi9cclxuXHJcbi8vIERlZmluZXMgdGhlIHNldCBvZiBjb2x1bW5zIGZvciB0aGUgd2hvbGUgdGFibGUuXHJcbnR5cGUgQ29sdW1uID0gW3N0cmluZywgKChjcm9wOiBDcm9wRGF0YSkgPT4gc3RyaW5nKV07XHJcbmNvbnN0IENPTFVNTlM6IENvbHVtbltdID0gW1xyXG4gICAgW1wiTmFtZVwiLCAoY3JvcDogQ3JvcERhdGEpID0+IHsgcmV0dXJuIGNyb3AubmFtZTsgfV0sXHJcbiAgICBbXCJTZWFzb25cIiwgKGNyb3A6IENyb3BEYXRhKSA9PiB7XHJcbiAgICAgICAgcmV0dXJuIFNlYXNvbltjcm9wLnNlYXNvbl07XHJcbiAgICB9XSxcclxuICAgIFtcIlNlZWQgQ29zdFwiLCAoY3JvcDogQ3JvcERhdGEpID0+IHsgcmV0dXJuIGNyb3Auc2VlZF9jb3N0LnRvU3RyaW5nKCk7IH1dLFxyXG4gICAgW1wiU2VsbCBQcmljZVwiLCAoY3JvcDogQ3JvcERhdGEpID0+IHsgcmV0dXJuIGNyb3Auc2VsbF9wcmljZS50b1N0cmluZygpOyB9XSxcclxuICAgIFtcIkRheXMgdG8gR3Jvd1wiLCAoY3JvcDogQ3JvcERhdGEpID0+IHsgcmV0dXJuIGNyb3AuZGF5c190b19ncm93LnRvU3RyaW5nKCk7IH1dLFxyXG4gICAgW1wiUmVncm93dGggUGVyaW9kXCIsIChjcm9wOiBDcm9wRGF0YSkgPT4ge1xyXG4gICAgICAgIHJldHVybiBjcm9wLnJlZ3Jvd3RoX3BlcmlvZD8udG9TdHJpbmcoKSA/PyBcIi1cIjtcclxuICAgIH1dLFxyXG4gICAgW1wiWWllbGRcIiwgKGNyb3A6IENyb3BEYXRhKSA9PiB7XHJcbiAgICAgICAgbGV0IHlpZWxkX251bSA9IGNyb3AueWllbGQgPz8gMTtcclxuICAgICAgICBpZiAoY3JvcC5wZXJjZW50X2NoYW5jZV9leHRyYSkge1xyXG4gICAgICAgICAgICByZXR1cm4gYCR7eWllbGRfbnVtfSArICR7Y3JvcC5wZXJjZW50X2NoYW5jZV9leHRyYX0lYDtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByZXR1cm4geWllbGRfbnVtLnRvU3RyaW5nKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfV0sXHJcbiAgICBbXCJVc2VmdWwgRGF5c1wiLCAoY3JvcDogQ3JvcERhdGEpID0+IHsgcmV0dXJuIGNyb3AudXNlZnVsX2RheXMudG9TdHJpbmcoKTsgfV0sXHJcbiAgICBbXCJOdW0gSGFydmVzdHNcIiwgKGNyb3A6IENyb3BEYXRhKSA9PiB7IHJldHVybiBjcm9wLm51bV9oYXJ2ZXN0cy50b1N0cmluZygpOyB9XSxcclxuICAgIFtcIk51bSBDcm9wc1wiLCAoY3JvcDogQ3JvcERhdGEpID0+IHtcclxuICAgICAgICBsZXQgbnVtX2Nyb3BzID0gY3JvcC5udW1fY3JvcHM7XHJcbiAgICAgICAgaWYgKE51bWJlci5pc0ludGVnZXIobnVtX2Nyb3BzKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gbnVtX2Nyb3BzLnRvU3RyaW5nKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBjcm9wLm51bV9jcm9wcy50b0ZpeGVkKDIpO1xyXG4gICAgfV0sXHJcbiAgICBbXCJQcm9maXRcIiwgKGNyb3A6IENyb3BEYXRhKSA9PiB7IHJldHVybiBjcm9wLnByb2ZpdC50b0ZpeGVkKDIpOyB9XSxcclxuICAgIFtcIkRhaWx5IFByb2ZpdFwiLCAoY3JvcDogQ3JvcERhdGEpID0+IHtcclxuICAgICAgICBpZiAoTnVtYmVyLmlzRmluaXRlKGNyb3AuZGFpbHlfcHJvZml0KSkge1xyXG4gICAgICAgICAgICByZXR1cm4gY3JvcC5kYWlseV9wcm9maXQudG9GaXhlZCgyKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIFwiLVwiO1xyXG4gICAgfV1cclxuXTtcclxuXHJcbmNsYXNzIENyb3BSb3cge1xyXG4gICAgZGF0YTogQ3JvcERhdGE7XHJcbiAgICByb3c6IEhUTUxUYWJsZVJvd0VsZW1lbnQ7XHJcblxyXG4gICAgY29uc3RydWN0b3Iocm93OiBIVE1MVGFibGVSb3dFbGVtZW50LCBkYXRhOiBDcm9wRGF0YSkge1xyXG4gICAgICAgIHRoaXMuZGF0YSA9IGRhdGE7XHJcbiAgICAgICAgdGhpcy5yb3cgPSByb3c7XHJcblxyXG4gICAgICAgIC8vIG5vdyBwb3B1bGF0ZSB0aGUgcm93XHJcbiAgICAgICAgZm9yIChsZXQgW18sIGNvbF9hdHRyXSBvZiBDT0xVTU5TKSB7XHJcbiAgICAgICAgICAgIGxldCB2YWx1ZSA9IGNvbF9hdHRyKHRoaXMuZGF0YSk7XHJcbiAgICAgICAgICAgIHRoaXMucm93Lmluc2VydENlbGwoKS5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSh2YWx1ZSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuY2xhc3MgQ3JvcFRhYmxlIHtcclxuICAgIHRhYmxlOiBIVE1MVGFibGVFbGVtZW50O1xyXG4gICAgdGJvZHk6IEhUTUxUYWJsZVNlY3Rpb25FbGVtZW50O1xyXG4gICAgcm93czogQ3JvcFJvd1tdO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHRhYmxlOiBIVE1MVGFibGVFbGVtZW50KSB7XHJcbiAgICAgICAgdGhpcy50YWJsZSA9IHRhYmxlO1xyXG4gICAgICAgIHRoaXMucm93cyA9IFtdO1xyXG5cclxuICAgICAgICAvLyBDcmVhdGUgdGFibGUgaGVhZGVyIGFuZCBib2R5XHJcbiAgICAgICAgbGV0IHRoZWFkID0gdGhpcy50YWJsZS5jcmVhdGVUSGVhZCgpO1xyXG4gICAgICAgIHRoaXMudGJvZHkgPSB0aGlzLnRhYmxlLmNyZWF0ZVRCb2R5KCk7XHJcblxyXG4gICAgICAgIC8vIFBvcHVsYXRlIGhlYWQgb25jZSwgaGVyZVxyXG4gICAgICAgIGxldCByb3cgPSB0aGVhZC5pbnNlcnRSb3coKTtcclxuICAgICAgICBmb3IgKGxldCBbaWR4LCBbY29sX25hbWUsIF9dXSBvZiBDT0xVTU5TLmVudHJpZXMoKSkge1xyXG4gICAgICAgICAgICBsZXQgY2VsbCA9IHJvdy5pbnNlcnRDZWxsKCk7XHJcbiAgICAgICAgICAgIGNlbGwuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoY29sX25hbWUpKTtcclxuICAgICAgICAgICAgY2VsbC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGV2ZW50KSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNvcnRSb3dzKGlkeCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gQm9keSBuZWVkcyB0byBiZSByZWNhbGN1bGF0ZWQgb2Z0ZW4sIHNvIHB1dCB0aGF0IGluIGl0c1xyXG4gICAgICAgIC8vIG93biBmdW5jdGlvbi5cclxuICAgICAgICB0aGlzLnJlY2FsY3VsYXRlUm93cygxKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVjYWxjdWxhdGVSb3dzKGN1cnJlbnRfZGF5OiBudW1iZXIpIHtcclxuICAgICAgICB0aGlzLnRib2R5LnJlcGxhY2VDaGlsZHJlbigpO1xyXG4gICAgICAgIGZvciAobGV0IGRlZiBvZiBDUk9QX0RFRklOSVRJT05TKSB7XHJcbiAgICAgICAgICAgIGxldCBkYXRhID0gY2FsY3VsYXRlKGRlZiwgY3VycmVudF9kYXkpO1xyXG4gICAgICAgICAgICBsZXQgcm93ID0gdGhpcy50Ym9keS5pbnNlcnRSb3coKTtcclxuICAgICAgICAgICAgdGhpcy5yb3dzLnB1c2gobmV3IENyb3BSb3cocm93LCBkYXRhKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgc29ydFJvd3MoaWR4OiBudW1iZXIpIHtcclxuICAgICAgICAvLyBVcGRhdGUgdGhlIGJ1dHRvbnMgaW4gdGhlIGhlYWRlciAoYWxzbyB0aGlzIGlzIGhvdyB3ZVxyXG4gICAgICAgIC8vIGRpc2NvdmVyIHdoaWNoIHdheSB3ZSdyZSBzb3J0aW5nKVxyXG4gICAgICAgIGxldCBoZWFkZXJzID0gdGhpcy50YWJsZS5xdWVyeVNlbGVjdG9yQWxsKCd0aGVhZCB0ZCcpO1xyXG4gICAgICAgIGxldCBzb3J0X2FzY2VuZGluZyA9IHRydWU7XHJcbiAgICAgICAgZm9yIChsZXQgW2ksIGhlYWRlcl0gb2YgaGVhZGVycy5lbnRyaWVzKCkpIHtcclxuICAgICAgICAgICAgaWYgKGlkeCA9PT0gaSkge1xyXG4gICAgICAgICAgICAgICAgLy8gVGhpcyBpcyB0aGUgcmlnaHQgY29sdW1uOyBmbGlwIHRoZSBzb3J0IG9yZGVyLCBvclxyXG4gICAgICAgICAgICAgICAgLy8gaWYgaXQncyBub3Qgc2V0LCBzb3J0IGFzc2NlbmRpbmcgYnkgZGVmYXVsdC5cclxuICAgICAgICAgICAgICAgIGxldCBzb3J0X2RpciA9IGhlYWRlci5nZXRBdHRyaWJ1dGUoJ2FyaWEtc29ydCcpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHNvcnRfZGlyID09PSBcImRlc2NlbmRpbmdcIikge1xyXG4gICAgICAgICAgICAgICAgICAgIGhlYWRlci5zZXRBdHRyaWJ1dGUoXCJhcmlhLXNvcnRcIiwgXCJhc2NlbmRpbmdcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgc29ydF9hc2NlbmRpbmcgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaGVhZGVyLnNldEF0dHJpYnV0ZShcImFyaWEtc29ydFwiLCBcImRlc2NlbmRpbmdcIik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvLyBDbGVhciB0aGUgc29ydCBhdHRyaWJ1dGVcclxuICAgICAgICAgICAgICAgIGhlYWRlci5yZW1vdmVBdHRyaWJ1dGUoXCJhcmlhLXNvcnRcIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFNvcnQgb3VyIGNvbGxlY3Rpb24gb2Ygcm93c1xyXG4gICAgICAgIHRoaXMucm93cy5zb3J0KChhLCBiKSA9PiB7XHJcbiAgICAgICAgICAgIGxldCBhX2tleSA9IGEucm93LmNoaWxkcmVuW2lkeF0udGV4dENvbnRlbnQhO1xyXG4gICAgICAgICAgICBsZXQgYl9rZXkgPSBiLnJvdy5jaGlsZHJlbltpZHhdLnRleHRDb250ZW50ITtcclxuXHJcbiAgICAgICAgICAgIGxldCByZXQgPSBhX2tleSA+IGJfa2V5ID8gMSA6IC0xO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgaWYgKHNvcnRfYXNjZW5kaW5nKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmV0O1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIC1yZXQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gVGhlbiB1c2UgdGhhdCB0byByZWFycmFuZ2UgdGhlIG5vZGVzIGluIHRoZSBib2R5XHJcbiAgICAgICAgZm9yIChsZXQgcm93IG9mIHRoaXMucm93cykge1xyXG4gICAgICAgICAgICB0aGlzLnRib2R5LmFwcGVuZENoaWxkKHJvdy5yb3cpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gaW5pdGlhbGl6ZSgpIHtcclxuICAgIGNvbnNvbGUubG9nKFwiSW5pdGlhbGl6aW5nIVwiKTtcclxuXHJcbiAgICAvLyBGaW5kIGFsbCB0aGUgZWxlbWVudHMgSSBuZWVkXHJcbiAgICBsZXQgdGFibGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNyb3AtdGFibGVcIik7XHJcbiAgICBpZiAoISh0YWJsZSBpbnN0YW5jZW9mIEhUTUxUYWJsZUVsZW1lbnQpKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiY3JvcC10YWJsZSBzaG91bGQgYmUgYSA8dGFibGU+XCIpO1xyXG4gICAgfVxyXG5cclxuICAgIGxldCBpbnB1dF9wYW5lbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiaW5wdXQtcGFuZWxcIikhO1xyXG4gICAgbGV0IGN1cnJlbnRfZGF5X2lucHV0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcjxIVE1MSW5wdXRFbGVtZW50PihcIiNkYXlcIikhO1xyXG5cclxuICAgIC8vIENyZWF0ZSBjb21wb25lbnRzXHJcbiAgICBsZXQgdGFibGVfY29tcG9uZW50ID0gbmV3IENyb3BUYWJsZSh0YWJsZSk7XHJcblxyXG4gICAgLy8gQXR0YWNoIGV2ZW50IGxpc3RlbmVyc1xyXG4gICAgaW5wdXRfcGFuZWwuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCAoZXZlbnQpID0+IHtcclxuICAgICAgICBsZXQgY3VycmVudF9kYXkgPSBjdXJyZW50X2RheV9pbnB1dC52YWx1ZUFzTnVtYmVyO1xyXG4gICAgICAgIHRhYmxlX2NvbXBvbmVudC5yZWNhbGN1bGF0ZVJvd3MoY3VycmVudF9kYXkpO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcblxyXG4vLyBBbHJpZ2h0eSwgd2UncmUgcmVhZHkgdG8gZ28hIFdhaXQgZm9yIHRoZSBET00gdG8gZmluaXNoIGxvYWRpbmcgKG9yIHNlZSBpZiBpdFxyXG4vLyBhbHJlYWR5IGhhcy5cclxuaWYgKGRvY3VtZW50LnJlYWR5U3RhdGUgPT09IFwibG9hZGluZ1wiKSB7XHJcbiAgICAvLyBMb2FkaW5nIGhhc24ndCBmaW5pc2hlZCB5ZXRcclxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJET01Db250ZW50TG9hZGVkXCIsIGluaXRpYWxpemUpO1xyXG59IGVsc2Uge1xyXG4gICAgLy8gYERPTUNvbnRlbnRMb2FkZWRgIGhhcyBhbHJlYWR5IGZpcmVkXHJcbiAgICBpbml0aWFsaXplKCk7XHJcbn0iXSwibmFtZXMiOlsiU2Vhc29uIiwiY2FsY3VsYXRlIiwiY3JvcCIsInN0YXJ0X2RheSIsImRheXNfbGVmdCIsIm51bV9oYXJ2ZXN0cyIsInVzZWZ1bF9kYXlzIiwiZGF5c190b19ncm93IiwicmVncm93dGhfcGVyaW9kIiwiZXh0cmFfaGFydmVzdHMiLCJNYXRoIiwiZmxvb3IiLCJudW1fY3JvcHMiLCJ5aWVsZCIsInBlcmNlbnRfY2hhbmNlX2V4dHJhIiwicHJvZml0Iiwic2VsbF9wcmljZSIsInNlZWRfY29zdCIsImRhaWx5X3Byb2ZpdCIsIm5hbWUiLCJzZWFzb24iLCJmcm9tU3RyaW5nIiwicyIsInRvVXBwZXJDYXNlIiwiU1BSSU5HIiwiU1VNTUVSIiwiRkFMTCIsIkVycm9yIiwiQ09MVU1OUyIsInRvU3RyaW5nIiwieWllbGRfbnVtIiwiTnVtYmVyIiwiaXNJbnRlZ2VyIiwidG9GaXhlZCIsImlzRmluaXRlIiwiQ3JvcFJvdyIsImNvbnN0cnVjdG9yIiwicm93IiwiZGF0YSIsInRoaXMiLCJfIiwiY29sX2F0dHIiLCJ2YWx1ZSIsImluc2VydENlbGwiLCJhcHBlbmRDaGlsZCIsImRvY3VtZW50IiwiY3JlYXRlVGV4dE5vZGUiLCJDcm9wVGFibGUiLCJ0YWJsZSIsInJvd3MiLCJ0aGVhZCIsImNyZWF0ZVRIZWFkIiwidGJvZHkiLCJjcmVhdGVUQm9keSIsImluc2VydFJvdyIsImlkeCIsImNvbF9uYW1lIiwiZW50cmllcyIsImNlbGwiLCJhZGRFdmVudExpc3RlbmVyIiwiZXZlbnQiLCJzb3J0Um93cyIsInJlY2FsY3VsYXRlUm93cyIsImN1cnJlbnRfZGF5IiwicmVwbGFjZUNoaWxkcmVuIiwiZGVmIiwicHVzaCIsImhlYWRlcnMiLCJxdWVyeVNlbGVjdG9yQWxsIiwic29ydF9hc2NlbmRpbmciLCJpIiwiaGVhZGVyIiwiZ2V0QXR0cmlidXRlIiwic2V0QXR0cmlidXRlIiwicmVtb3ZlQXR0cmlidXRlIiwic29ydCIsImEiLCJiIiwicmV0IiwiY2hpbGRyZW4iLCJ0ZXh0Q29udGVudCIsImluaXRpYWxpemUiLCJjb25zb2xlIiwibG9nIiwiZ2V0RWxlbWVudEJ5SWQiLCJIVE1MVGFibGVFbGVtZW50IiwiaW5wdXRfcGFuZWwiLCJjdXJyZW50X2RheV9pbnB1dCIsInF1ZXJ5U2VsZWN0b3IiLCJ0YWJsZV9jb21wb25lbnQiLCJ2YWx1ZUFzTnVtYmVyIiwicmVhZHlTdGF0ZSJdLCJzb3VyY2VSb290IjoiIn0=