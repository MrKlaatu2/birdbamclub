/* Bird Bam monthly contests: settings and live leaderboard.
   Add each month's contest to CONTESTS below. The site shows the contest whose dates include today
   (Los Angeles time); between contests it shows the most recent one.
   Leaderboard sheet layout: column A = name, B = points or mahjongs, C = instant-prize emoji (optional).
   type "points": individual points race (HalloWIN). type "meter": club-wide total with price tiers (Thankswinning). */
window.CONTESTS = [
{
  name: "HalloWIN",
  type: "points",
  accent: "#E0611C",
  titleHtml: 'Hallo<span class="hl">win</span>',
  unit: "Points",
  fine: "No purchase necessary. 18+. See official rules.",
  from: "2026-10-01", until: "2026-10-29",
  month: "2026-10",
  rules: "hallowin.html",
  sheetId: "1iG343i1XB4FFVFYNLmLlYAfweuvKpJaipB6JhAoMstc",
  sheetTab: "Sheet1",
  /* "Publish to web" CSV link for this month's leaderboard sheet (File > Share > Publish to web > Sheet1 > CSV) */
  csvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vT1IYkLAnJTBHznZ48DeUFrOJV5598wN84yUfM7kqg_A6njcO8uTiXVWiQFWfj0alUlJfeVgycL3BvO/pub?gid=0&single=true&output=csv",
  key: [["👻","Free open play pass"],["🎃","$10 gift certificate"],["🦇","Snack bag"]],
  winners: 5,   /* how many top places win prizes (highlighted on the leaderboard) */
  points: [["Bams, Dots, Craks","+1 to +9 (face value)"],["Flowers","+10"],["Green Dragon","+15"],["Red Dragon","+20"],["Bird Bam","+25"],["Soap","0"],["Winds","Trick! −5"],["Joker","Draw 2 more tiles"]],
  /* Final standings (Oct 31, 2026), shown if the sheet can't be reached */
  snapshot: [["Albert L.", "6", ""], ["Allison C.", "5", ""], ["Allison L.", "78", "🦇"], ["Alyson M.", "-5", ""], ["Amy C.", "5", ""], ["Anat P.", "17", ""], ["Andrea Y.", "12", ""], ["Anna R.", "177", "🎃"], ["Annie W.", "33", "🦇"], ["Audrey I.", "-3", ""], ["Barbara R.", "21", ""], ["Bing W.", "275", "🦇🦇👻"], ["Bonnie B.", "6", ""], ["Bonnie S.", "7", ""], ["Bruclee F.", "-2", ""], ["Cami H.", "5", ""], ["Camryn K.", "33", ""], ["Carrie G.", "5", ""], ["Cathy M.", "38", "🦇🦇"], ["Cheryl G.", "14", ""], ["Deb G.", "25", ""], ["Debbie W.", "20", ""], ["Deidre B.", "30", ""], ["Donna W.", "62", ""], ["Doribeth E.", "5", ""], ["Elizabeth S.", "35", "👻"], ["Ellen H.", "5", ""], ["Eloise Z.", "0", "🎃👻🎃"], ["Erica P.", "34", ""], ["Ester W.", "22", ""], ["Fonda S.", "34", "👻🦇"], ["Gina F.", "39", ""], ["Gwenda C.", "0", "🎃"], ["Hanna S.", "4", "🦇"], ["Hemali D.", "91", ""], ["Iris M.", "7", ""], ["Jack Z.", "5", "👻🦇🎃"], ["Jane G.", "158", "🎃🎃🎃🎃"], ["Jane M.", "-10", ""], ["Jane S.", "12", ""], ["Jen U.", "23", ""], ["Jerry S.", "5", ""], ["Jill S.", "43", ""], ["Joanne R.", "-5", ""], ["Joni G.", "8", ""], ["Judy G.", "1", ""], ["Julie B.", "7", ""], ["Kabrel G.", "85", "🦇"], ["Karen C.", "16", ""], ["Kathlene B.", "10", ""], ["Kelly K.", "12", ""], ["Keston J.", "28", ""], ["Kyra H.", "9", ""], ["Lacy J.", "15", ""], ["Lara R.", "11", ""], ["Laura M.", "17", ""], ["Leah L.", "83", "🦇"], ["Lori C.", "38", ""], ["Lori G.", "93", "👻"], ["Lori S.", "7", "🦇"], ["Manette R.", "80", "👻👻"], ["Margarita W.", "10", ""], ["Marilyn F.", "29", ""], ["Marsha A.", "256", "🦇👻"], ["Marsha P.", "42", "🦇🦇🦇"], ["Mary Ann H.", "52", "🎃🎃🦇🦇"], ["Megan P.", "5", ""], ["Melissa B.", "9", ""], ["Merrin F.", "25", ""], ["Michael K.", "39", ""], ["Michele G.", "20", ""], ["Michelle C.", "43", ""], ["Michelle R.", "15", ""], ["Mike S.", "18", ""], ["Mindy C.", "13", "🦇"], ["Mona L.", "2", ""], ["Mona M.", "8", ""], ["Myrna L.", "20", ""], ["Nancy L.", "58", "🎃"], ["Nancy W.", "0", "👻"], ["Natalie B.", "13", ""], ["Nate Z.", "9", ""], ["Pamela H.", "36", ""], ["Patricia G.", "4", ""], ["Patty P.", "262", "🦇🎃🎃🦇🦇🦇"], ["Phyllis M.", "18", ""], ["Rachel C.", "51", "🎃"], ["Randi G.", "16", ""], ["Ravi D.", "35", ""], ["Rebecca F.", "16", ""], ["Rob H.", "8", ""], ["Robert C.", "-3", ""], ["Robin B.", "5", ""], ["Sanam A.", "333", "🦇🦇👻🦇👻"], ["Sanoo K.", "81", ""], ["Sarah A.", "64", ""], ["Sarah B.", "28", ""], ["Sarah Z.", "389", "🦇🦇👻🦇"], ["Shelly S.", "16", "🦇🎃"], ["Sherrie B.", "73", "🦇"], ["Shohreh B.", "11", ""], ["Simone M.", "-4", "🦇"], ["Stephanie S.", "72", "🎃🎃"], ["Stephen L.", "39", "🦇"], ["Stephen W.", "22", ""], ["Susan H.", "16", ""], ["Suzan K.", "25", ""], ["Tina K.", "6", ""], ["Tina L.", "38", ""], ["Tracy L.", "35", "🦇👻🦇"], ["Tracy N.", "14", ""], ["Vanessa M.", "0", "👻"], ["Var G.", "79", ""], ["Xiomara B.", "5", ""]]
},
{
  name: "Thankswinning",
  type: "meter",
  accent: "#D4952B",
  titleHtml: 'Thanks<span class="hl">winning</span>',
  tagline: "Mahj together · Win together",
  unit: "Mahjongs",
  month: "2026-11",
  from: "2026-10-30", until: "2026-11-30",
  rules: "thankswinning.html",
  /* The Google Sheet (for Claude) and its "Publish to web" CSV link (for the website) */
  sheetId: "1A_NNkLi_nhZf4DR_QZPeOjpmOFwPX3R_GsoCJoeu-Cc",
  sheetTab: "Sheet1",
  csvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQVMIQ2mxKoY6KpxjgpTVtAkVxKCXTBKcRro4nENEOpJtSO6mqyEYLB6KlUZI39-U3dPy_IgpjZJPiQ/pub?gid=0&single=true&output=csv",
  goalName: "Holiday Party",
  /* [club mahjongs, party ticket price] */
  tiers: [[0,"$50"],[100,"$45"],[200,"$40"],[300,"$35"],[400,"$30"],[500,"$25"],[600,"$20"],[700,"FREE"]],
  winners: 3,
  prizes: [["1st","$100 gift certificate"],["2nd","$50 gift certificate"],["3rd","$25 gift certificate"]],
  fine: "Open to players 18+. Void where prohibited. See official rules.",
  snapshot: []
}
];

(function(){
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-US",{timeZone:"America/Los_Angeles",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date()).map(x=>[x.type,x.value]));
  const today = `${p.year}-${p.month}-${p.day}`;
  const list = window.CONTESTS;
  window.CONTEST = list.find(c => today >= c.from && today <= c.until) || [...list].reverse().find(c => today > c.until) || list[0];
  window.contestByName = name => list.find(c => c.name.toLowerCase() === String(name).toLowerCase());
})();

/* Club meter: where the total sits on the price tiers */
window.meterStatus = function(total, c){
  c = c || window.CONTEST;
  const t = c.tiers, goal = t[t.length-1][0];
  let cur = 0; t.forEach((x,i) => { if(total >= x[0]) cur = i; });
  const next = t[cur+1] || null;
  return {total, goal, pct: Math.min(100, total / goal * 100), price: t[cur][1], next, toNext: next ? next[0] - total : 0, done: !next};
};

/* Renders the Mahj Meter into an element (styles in css/meter.css) */
window.renderMeter = function(el, total, c, opts){
  c = c || window.CONTEST; opts = opts || {};
  const m = window.meterStatus(total, c);
  const ticks = c.tiers.map(([v,price]) => `<span class="tick${total >= v ? " on" : ""}" style="left:${v / m.goal * 100}%"><i></i><em>${v}</em><b>${price}</b></span>`).join("");
  const msg = m.done ? `🎉 We did it! The ${c.goalName} is <b>FREE</b> for November players!`
    : `<b>${m.toNext}</b> more mahjong${m.toNext === 1 ? "" : "s"} until the price drops to <b>${m.next[1]}</b>!`;
  el.innerHTML = `<div class="meter${opts.compact ? " compact" : ""}">
    <div class="meter-top"><p class="meter-total"><span>Club total</span><b>${total.toLocaleString()}</b> mahjongs</p>
    <p class="meter-price"><span>${c.goalName} price now</span><b>${m.price}</b></p></div>
    <div class="meter-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${m.goal}" aria-valuenow="${Math.min(total, m.goal)}" aria-label="Club mahjongs toward a free ${c.goalName}"><div class="meter-fill" style="width:${m.pct}%"></div>${ticks}</div>
    <p class="meter-msg">${msg}</p></div>`;
  return m;
};

window.loadLeaderboard = async function(c){
  c = c || window.CONTEST;
  const urls = [c.csvUrl, c.sheetId && `https://docs.google.com/spreadsheets/d/${c.sheetId}/gviz/tq?tqx=out:csv&headers=0&sheet=${encodeURIComponent(c.sheetTab)}`].filter(Boolean);
  let rows = c.snapshot || [], live = false;
  for(const url of urls){
    try {
      const res = await fetch(url, {cache: "no-store"});
      if(!res.ok) continue;
      const parsed = parseCSV(await res.text()).filter(r => r[0] && r[0].trim() && r[1] !== undefined && r[1] !== "" && !isNaN(+r[1]));
      if(parsed.length){ rows = parsed; live = true; break; }
    } catch(e){ /* try the next source, then the snapshot */ }
  }
  const list = rows.map(r => ({name: String(r[0]).trim(), pts: +r[1], prizes: (r[2] || "").trim()}))
                   .sort((a,b) => b.pts - a.pts || a.name.localeCompare(b.name));
  let rank = 0, prev = null;
  list.forEach((p,i) => { if(p.pts !== prev){ rank = i + 1; prev = p.pts; } p.rank = rank; });
  const total = list.reduce((n,p) => n + (p.pts > 0 ? p.pts : 0), 0);
  return {list, live, total};
};

function parseCSV(text){
  const out = []; let row = [], cell = "", q = false;
  for(let i = 0; i < text.length; i++){
    const ch = text[i];
    if(q){
      if(ch === '"'){ if(text[i+1] === '"'){ cell += '"'; i++; } else q = false; }
      else cell += ch;
    } else if(ch === '"') q = true;
    else if(ch === ","){ row.push(cell); cell = ""; }
    else if(ch === "\n"){ row.push(cell); out.push(row); row = []; cell = ""; }
    else if(ch !== "\r") cell += ch;
  }
  if(cell || row.length){ row.push(cell); out.push(row); }
  return out;
}
