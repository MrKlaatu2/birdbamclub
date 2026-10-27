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
  snapshot: [["Albert L.", "6", ""], ["Allison C.", "5", ""], ["Allison L.", "78", "🦇"], ["Alyson M.", "-5", ""], ["Amy C.", "5", ""], ["Anat P.", "17", ""], ["Andrea Y.", "12", ""], ["Anna R.", "128", "🎃"], ["Annie W.", "33", "🦇"], ["Audrey I.", "-3", ""], ["Bing W.", "267", "🦇"], ["Bonnie B.", "6", ""], ["Bonnie S.", "7", ""], ["Bruclee F.", "-2", ""], ["Cami H.", "5", ""], ["Camryn K.", "33", ""], ["Cathy M.", "28", "🦇"], ["Deb G.", "25", ""], ["Debbie W.", "20", ""], ["Deidre B.", "30", ""], ["Donna W.", "62", ""], ["Elizabeth S.", "35", "👻"], ["Ellen H.", "5", ""], ["Eloise Z.", "0", "🎃👻🎃"], ["Erica P.", "34", ""], ["Ester W.", "22", ""], ["Fonda S.", "39", "👻🦇"], ["Gina F.", "39", ""], ["Gwenda C.", "0", "🎃"], ["Hanna S.", "4", "🦇"], ["Hemali D.", "91", ""], ["Iris M.", "7", ""], ["Jack Z.", "5", "👻🦇🎃"], ["Jane G.", "158", "🎃🎃🎃🎃"], ["Jane S.", "12", ""], ["Jerry S.", "5", ""], ["Jill S.", "43", ""], ["Joanne R.", "-5", ""], ["Joni G.", "8", ""], ["Judy G.", "1", ""], ["Julie B.", "7", ""], ["Kabrel G.", "88", ""], ["Karen C.", "16", ""], ["Kathlene B.", "10", ""], ["Kelly K.", "12", ""], ["Keston J.", "28", ""], ["Kyra H.", "9", ""], ["Lacy J.", "15", ""], ["Lara R.", "11", ""], ["Laura M.", "17", ""], ["Leah L.", "83", "🦇"], ["Lori C.", "38", ""], ["Lori G.", "76", "👻"], ["Lori S.", "7", "🦇"], ["Manette R.", "55", "👻"], ["Margarita W.", "10", ""], ["Marilyn F.", "29", ""], ["Marsha A.", "186", "🦇👻"], ["Marsha P.", "42", "🦇🦇🦇"], ["Mary Ann H.", "52", "🎃🎃🦇🦇"], ["Megan P.", "5", ""], ["Melissa B.", "9", ""], ["Merrin F.", "25", ""], ["Michael K.", "39", ""], ["Michele G.", "20", ""], ["Michelle C.", "43", ""], ["Michelle R.", "15", ""], ["Mike S.", "18", ""], ["Mindy C.", "16", ""], ["Mona L.", "2", ""], ["Mona M.", "8", ""], ["Myrna L.", "20", ""], ["Nancy L.", "54", "🎃"], ["Natalie B.", "13", ""], ["Nate Z.", "9", ""], ["Pamela H.", "41", ""], ["Patricia G.", "4", ""], ["Patty P.", "194", "🦇🎃🎃🦇🦇"], ["Rachel C.", "51", "🎃"], ["Randi G.", "16", ""], ["Ravi D.", "35", ""], ["Rebecca F.", "16", ""], ["Rob H.", "8", ""], ["Robert C.", "-3", ""], ["Robin B.", "5", ""], ["Sanam A.", "230", "🦇🦇👻🦇👻"], ["Sanoo K.", "54", ""], ["Sarah A.", "64", ""], ["Sarah B.", "28", ""], ["Sarah Z.", "314", "🦇🦇👻🦇"], ["Shelly S.", "16", "🦇🎃"], ["Sherrie B.", "43", "🦇"], ["Shohreh B.", "11", ""], ["Simone M.", "-4", "🦇"], ["Stephanie S.", "47", "🎃🎃"], ["Stephen L.", "39", "🦇"], ["Stephen W.", "22", ""], ["Suzan K.", "25", ""], ["Tina K.", "6", ""], ["Tina L.", "23", ""], ["Tracy L.", "35", "🦇👻🦇"], ["Tracy N.", "14", ""], ["Vanessa M.", "0", "👻"], ["Var G.", "79", ""], ["Xiomara B.", "5", ""]]
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
