/* Bird Bam monthly contest: settings and live leaderboard.
   Each month: update CONTEST below (later this comes from the website Google Sheet).
   The leaderboard sheet layout: column A = name, B = points, C = instant-prize emoji (optional). */
window.CONTEST = {
  name: "HalloWIN",
  month: "2026-10",
  rules: "hallowin.html",
  sheetId: "1iG343i1XB4FFVFYNLmLlYAfweuvKpJaipB6JhAoMstc",
  sheetTab: "Sheet1",
  /* "Publish to web" CSV link for this month's leaderboard sheet (File > Share > Publish to web > Sheet1 > CSV) */
  csvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vT1IYkLAnJTBHznZ48DeUFrOJV5598wN84yUfM7kqg_A6njcO8uTiXVWiQFWfj0alUlJfeVgycL3BvO/pub?gid=0&single=true&output=csv",
  key: [["👻","Free open play pass"],["🎃","$10 gift certificate"],["🦇","Snack bag"]],
  winners: 5,   /* how many top places win prizes (highlighted on the leaderboard) */
  points: [["Bams, Dots, Craks","+1 to +9 (face value)"],["Flowers","+10"],["Green Dragon","+15"],["Red Dragon","+20"],["Bird Bam","+25"],["Soap","0"],["Winds","Trick! −5"],["Joker","Draw 2 more tiles"]],
  /* Backup copy shown if the sheet can't be reached (updated Oct 17, 2026) */
  snapshot: [["Albert L.", "6", ""], ["Allison C.", "5", ""], ["Allison L.", "40", "🦇"], ["Anat P.", "17", ""], ["Andrea Y.", "12", ""], ["Anna R.", "45", ""], ["Annie W.", "26", "🦇"], ["Audrey I.", "-3", ""], ["Bing W.", "164", "🦇"], ["Bonnie S.", "7", ""], ["Bruclee F.", "-2", ""], ["Camryn K.", "33", ""], ["Cathy M.", "28", "🦇"], ["Deb G.", "25", ""], ["Debbie W.", "20", ""], ["Deidre B.", "25", ""], ["Donna W.", "62", ""], ["Elizabeth S.", "-5", ""], ["Eloise Z.", "0", "🎃👻"], ["Erica P.", "34", ""], ["Fonda S.", "32", "👻🦇"], ["Gwenda C.", "0", "🎃"], ["Hanna S.", "4", "🦇"], ["Jack Z.", "5", "👻🦇🎃"], ["Jane G.", "95", "🎃🎃"], ["Jerry S.", "5", ""], ["Jill S.", "13", ""], ["Joni G.", "8", ""], ["Judy G.", "1", ""], ["Julie B.", "7", ""], ["Kabrel G.", "88", ""], ["Kathlene B.", "10", ""], ["Kyra H.", "9", ""], ["Leah L.", "77", ""], ["Lori C.", "26", ""], ["Lori G.", "76", "👻"], ["Lori S.", "7", "🦇"], ["Manette R.", "10", ""], ["Margarita W.", "10", ""], ["Marsha A.", "91", "🦇"], ["Marsha P.", "29", "🦇🦇"], ["Mary Ann H.", "22", "🎃🎃🦇🦇"], ["Megan P.", "5", ""], ["Melissa B.", "9", ""], ["Michael K.", "34", ""], ["Michele G.", "20", ""], ["Michelle C.", "43", ""], ["Michelle R.", "15", ""], ["Mike S.", "18", ""], ["Nancy L.", "33", ""], ["Nate Z.", "9", ""], ["Pamela H.", "41", ""], ["Patricia G.", "-1", ""], ["Patty P.", "134", "🦇🎃🎃🦇"], ["Rachel C.", "51", "🎃"], ["Rob H.", "8", ""], ["Robert C.", "-3", ""], ["Sanam A.", "161", "🦇🦇👻"], ["Sanoo K.", "33", ""], ["Sarah B.", "28", ""], ["Sarah Z.", "202", "🦇🦇👻🦇"], ["Shelly S.", "19", "🦇"], ["Sherrie B.", "12", "🦇"], ["Shohreh B.", "7", ""], ["Simone M.", "1", "🦇"], ["Stephanie S.", "33", "🎃"], ["Stephen L.", "21", "🦇"], ["Stephen W.", "22", ""], ["Tina K.", "6", ""], ["Tina L.", "10", ""], ["Tracy N.", "14", ""], ["Vanessa M.", "0", "👻"], ["Var G.", "79", ""]]
};

window.loadLeaderboard = async function(){
  const c = window.CONTEST;
  const urls = [c.csvUrl, `https://docs.google.com/spreadsheets/d/${c.sheetId}/gviz/tq?tqx=out:csv&headers=0&sheet=${encodeURIComponent(c.sheetTab)}`].filter(Boolean);
  let rows = c.snapshot, live = false;
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
  return {list, live};
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
