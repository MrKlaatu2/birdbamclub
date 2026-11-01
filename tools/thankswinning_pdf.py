#!/usr/bin/env python3
"""Build the printable Thankswinning PDF: page 1 = Mahj Meter + top 3, then the full leaderboard.

Usage: python3 -I thankswinning_pdf.py rows.json turkey.png fonts_dir out.pdf
  rows.json  : the Google Sheet values array (A = name, B = mahjongs), no header row
  turkey.png : images/thankswinning-turkey.png from the website repo
  fonts_dir  : folder with barlow-condensed-latin-{700,800}-normal.woff2 and barlow-latin-{400,600}-normal.woff2
Prints a JSON summary (players, total, price, pages, layout problems).
"""
import base64, html, json, math, re, sys, datetime
from zoneinfo import ZoneInfo
from playwright.sync_api import sync_playwright

rows_path, turkey_path, fonts_dir, out_path = sys.argv[1:5]

TIERS = [(0, "$50"), (100, "$45"), (200, "$40"), (300, "$35"), (400, "$30"), (500, "$25"), (600, "$20"), (700, "FREE")]
PRIZES = ["$100 gift certificate", "$50 gift certificate", "$25 gift certificate"]

players = []
for r in json.load(open(rows_path, encoding="utf-8")):
    r = list(r) + ["", ""]
    name = re.sub(r"\s+", " ", str(r[0] or "")).strip()
    n = str(r[1] or "").strip().replace(",", "")
    if not name or not re.fullmatch(r"[+-]?\d+(\.\d+)?", n):
        continue
    v = float(n)
    players.append({"name": name, "n": int(v) if v.is_integer() else v})
players.sort(key=lambda p: (-p["n"], p["name"].lower()))
prev, rank = None, 0
for i, p in enumerate(players):
    if p["n"] != prev:
        rank, prev = i + 1, p["n"]
    p["rank"] = rank
N = len(players)
total = sum(p["n"] for p in players if p["n"] > 0)

goal = TIERS[-1][0]
cur = max(i for i, t in enumerate(TIERS) if total >= t[0])
price = TIERS[cur][1]
nxt = TIERS[cur + 1] if cur + 1 < len(TIERS) else None
pct = min(100, total / goal * 100)

today = datetime.datetime.now(ZoneInfo("America/Los_Angeles"))
updated = f"Updated {today:%A}, {today:%B} {today.day}"

b64 = lambda p: base64.b64encode(open(p, "rb").read()).decode()
turkey = b64(turkey_path)
fonts = "".join(
    f"@font-face{{font-family:'{fam}';font-weight:{w};src:url(data:font/woff2;base64,{b64(f'{fonts_dir}/{file}')}) format('woff2')}}"
    for fam, w, file in [("BC", 700, "barlow-condensed-latin-700-normal.woff2"), ("BC", 800, "barlow-condensed-latin-800-normal.woff2"),
                         ("B", 400, "barlow-latin-400-normal.woff2"), ("B", 600, "barlow-latin-600-normal.woff2")])

CSS = fonts + """
@page{size:Letter;margin:0}
*{box-sizing:border-box;margin:0;padding:0}
:root{--burg:#7C2524;--gold:#D4952B;--gs:#F6E8C8;--green:#5D7F2E;--brown:#4A2F1B}
html,body{background:#fff;color:#1d1b18;-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{font-family:'B',sans-serif}
.page{width:8.5in;height:11in;padding:.4in .45in;display:flex;flex-direction:column;overflow:hidden;break-after:page;page-break-after:always}
.page:last-child{break-after:auto;page-break-after:auto}
.hero{display:flex;align-items:center;justify-content:center;gap:.25in}
.hero img{height:1.7in}
.eyebrow{font-family:'BC';font-weight:700;font-size:13pt;letter-spacing:.14em;text-transform:uppercase;color:var(--brown)}
h1{font-family:'BC';font-weight:800;font-size:58pt;line-height:.9;text-transform:uppercase;color:var(--burg)}
h1 span{color:var(--gold)}
.tag{font-family:'BC';font-weight:800;font-size:17pt;letter-spacing:.06em;text-transform:uppercase;color:var(--green);margin-top:4px}
.upd{font-family:'BC';font-weight:700;font-size:13pt;letter-spacing:.06em;color:var(--brown);margin-top:6px}
.meter{margin-top:.3in;border:5px solid var(--burg);border-radius:22px;padding:.25in .3in .2in;box-shadow:10px 10px 0 var(--gold)}
.mtop{display:flex;justify-content:space-between;align-items:flex-end}
.lab{display:block;font-family:'BC';font-weight:700;font-size:15pt;letter-spacing:.12em;text-transform:uppercase;color:var(--brown)}
.tot b{font-family:'BC';font-weight:800;font-size:72pt;line-height:.9;color:var(--burg)}
.tot{font-family:'BC';font-weight:700;font-size:22pt;color:var(--brown)}
.pr{text-align:right}
.pr b{display:inline-block;font-family:'BC';font-weight:800;font-size:58pt;line-height:1;color:#fff;background:var(--green);border-radius:14px;padding:4px 22px}
.bar{position:relative;height:.5in;margin:.55in .15in .55in;background:var(--gs);border:3px solid var(--brown);border-radius:999px}
.fill{position:absolute;left:0;top:0;bottom:0;border-radius:999px;background:var(--gold);min-width:.3in}
.tk{position:absolute;top:-3px;bottom:-3px;width:0}
.tk i{position:absolute;left:-1.5px;top:0;bottom:0;width:3px;background:rgba(74,47,27,.35)}
.tk.first i,.tk.last i{display:none}
.tk b{position:absolute;top:calc(100% + 8px);left:50%;transform:translateX(-50%);font-family:'BC';font-weight:800;font-size:19pt;color:#A99E88;white-space:nowrap}
.tk em{position:absolute;bottom:calc(100% + 6px);left:50%;transform:translateX(-50%);font-style:normal;font-family:'B';font-weight:600;font-size:13pt;color:#A99E88;white-space:nowrap}
.tk.on em{color:var(--brown)}
.tk.on b{color:var(--burg)}
.tk.last b{color:var(--green)}
.msg{text-align:center;font-family:'BC';font-weight:800;font-size:24pt;color:var(--brown);text-transform:uppercase;letter-spacing:.02em}
.msg em{font-style:normal;color:var(--burg)}
.top3h{font-family:'BC';font-weight:800;font-size:22pt;text-transform:uppercase;letter-spacing:.06em;color:var(--burg);text-align:center;margin-top:.32in}
.top3{display:grid;grid-template-columns:repeat(3,1fr);gap:.18in;margin-top:.1in}
.top3 div{border:3px solid #DDD5BF;border-top:10px solid var(--gold);border-radius:14px;padding:.12in;text-align:center}
.top3 div:first-child{border-top-color:var(--burg)}
.top3 .pl{font-family:'BC';font-weight:800;font-size:15pt;letter-spacing:.12em;color:var(--brown)}
.top3 .nm{font-family:'BC';font-weight:800;font-size:22pt;line-height:1.1;margin-top:2px}
.top3 .ct{font-family:'BC';font-weight:800;font-size:26pt;color:var(--burg);line-height:1.1}
.top3 .pz{font-weight:600;font-size:11pt;color:var(--green)}
.spacer{flex:1}
.foot{text-align:center;font-weight:600;font-size:12pt;color:var(--brown);border-top:3px solid var(--burg);padding-top:.1in}
.foot b{color:var(--burg)}
.lh{display:flex;align-items:center;justify-content:space-between;border-bottom:4px solid var(--burg);padding-bottom:.08in;margin-bottom:.1in}
.lh h2{font-family:'BC';font-weight:800;font-size:30pt;text-transform:uppercase;color:var(--burg);line-height:1}
.lh h2 span{color:var(--gold)}
.lh p{font-family:'BC';font-weight:700;font-size:13pt;color:var(--brown);text-align:right}
.grid{display:flex;gap:.14in;font-size:%(fs)spt}
.col{flex:1 1 0;min-width:0}
.row{display:flex;align-items:center;gap:.35em;padding:.12em .3em;border-bottom:1px solid #DCD6C8;white-space:nowrap;line-height:1.2}
.row.top{background:#F6E8C8;border-bottom-color:#E5C98E}
.rk{flex:none;width:1.7em;text-align:right;font-family:'BC';font-weight:800;color:var(--burg)}
.nmc{flex:1 1 auto;min-width:0;overflow:hidden;font-weight:600}
.n{flex:none;min-width:1.8em;text-align:right;font-family:'BC';font-weight:800}
.empty{font-family:'BC';font-weight:700;font-size:20pt;color:var(--brown);text-align:center;margin-top:1in}
"""

esc = html.escape


def meter_page():
    ticks = "".join(
        f'<span class="tk{" on" if total >= v else ""}{" first" if i == 0 else ""}{" last" if i == len(TIERS) - 1 else ""}" style="left:{v / goal * 100}%"><i></i><em>{v}</em><b>{p}</b></span>'
        for i, (v, p) in enumerate(TIERS))
    if nxt:
        msg = f'<em>{nxt[0] - total}</em> more mahjong{"s" if nxt[0] - total != 1 else ""} until the price drops to <em>{nxt[1]}</em>!'
    else:
        msg = 'We did it! The Holiday Party is <em>FREE</em> for November players!'
    top = [p for p in players if p["n"] > 0][:3]
    cards = "".join(
        f'<div><p class="pl">{["1ST", "2ND", "3RD"][i]}</p><p class="nm">{esc(top[i]["name"]) if i < len(top) else "–"}</p>'
        f'<p class="ct">{(str(top[i]["n"]) + " mahjongs") if i < len(top) else "&nbsp;"}</p><p class="pz">{PRIZES[i]}</p></div>'
        for i in range(3))
    return f'''<div class="page">
  <div class="hero"><img src="data:image/png;base64,{turkey}"><div>
    <p class="eyebrow">November open play contest</p><h1>Thanks<span>winning</span></h1>
    <p class="tag">Mahj together · Win together</p><p class="upd">{esc(updated)}</p></div></div>
  <div class="meter">
    <div class="mtop"><p class="tot"><span class="lab">Club total</span><b>{total:,}</b> mahjongs</p>
      <p class="pr"><span class="lab">Holiday Party price now</span><b>{price}</b></p></div>
    <div class="bar"><div class="fill" style="width:{pct}%"></div>{ticks}</div>
    <p class="msg">{msg}</p>
  </div>
  <p class="top3h">Top mahjers</p>
  <div class="top3">{cards}</div>
  <div class="spacer"></div>
  <p class="foot">Every mahjong at open play counts! Holiday Party: <b>Sat, Dec 12, 6–10:30 PM</b>.<br>Attend 1+ November open play for the club price.<br>Full leaderboard &amp; rules: <b>birdbamclub.com/thankswinning.html</b></p>
</div>'''


def row(p):
    return (f'<div class="row{" top" if p["rank"] <= 3 and p["n"] > 0 else ""}"><span class="rk">{p["rank"]}</span>'
            f'<span class="nmc">{esc(p["name"])}</span><span class="n">{p["n"]}</span></div>')


def list_pages(fs, cols, pages):
    out = []
    for pi, (start, rpc) in enumerate(pages):
        chunk = players[start:start + rpc * cols]
        colsh = "".join('<div class="col">' + "".join(row(p) for p in chunk[c * rpc:(c + 1) * rpc]) + "</div>" for c in range(cols))
        cont = " (continued)" if pi else ""
        out.append(f'<div class="page"><div class="lh"><h2>Thanks<span>winning</span> leaderboard{cont}</h2>'
                   f'<p>{esc(updated)}<br>{N} players · {total:,} club mahjongs</p></div><div class="grid">{colsh}</div></div>')
    return "".join(out)


def build(fs, cols, pages):
    body = meter_page()
    if N:
        body += list_pages(fs, cols, pages)
    return f'<!doctype html><html><head><meta charset="utf-8"><style>{CSS.replace("%(fs)s", str(fs))}</style></head><body>{body}</body></html>'


CHECK_JS = """() => {
  const bad = [];
  document.querySelectorAll('.page').forEach((pg, i) => {
    if (pg.scrollHeight > pg.clientHeight + 1) bad.push('page' + i + ' tall');
    const pb = pg.getBoundingClientRect().bottom;
    pg.querySelectorAll('.grid, .foot, .top3').forEach(el => { if (el.getBoundingClientRect().bottom > pb - 0.38 * 96 + 1) bad.push('page' + i + ' bottom'); });
  });
  document.querySelectorAll('.nmc').forEach(el => { if (el.scrollWidth > el.clientWidth + 1) bad.push('wide:' + el.textContent.slice(0, 20)); });
  return bad;
}"""

with sync_playwright() as pw:
    browser = pw.chromium.launch()
    page = browser.new_page(viewport={"width": 816, "height": 1056})
    page.emulate_media(media="print")

    def problems(fs, cols, pages):
        page.set_content(build(fs, cols, pages), wait_until="load")
        page.evaluate("document.fonts.ready")
        return page.evaluate(CHECK_JS)

    choice = None
    if N:
        fs = 16.0
        while fs >= 11.0 and not choice:          # try to fit the whole list on one page
            for cols in (2, 3):
                rpc = math.ceil(N / cols)
                if not problems(fs, cols, [(0, rpc)]):
                    choice = (fs, cols, [(0, rpc)])
                    break
            fs -= 0.5
        if not choice:                            # otherwise 11pt, 3 columns, as many pages as needed
            fs, cols, pages, start = 11.0, 3, [], 0
            while start < N:
                k = math.ceil((N - start) / cols)
                while k > 1 and problems(fs, cols, pages + [(start, k)]):
                    k -= 1
                pages.append((start, k))
                start += k * cols
            choice = (fs, cols, pages)
    else:
        choice = (12.0, 3, [])
    fs, cols, pages = choice
    page.set_content(build(fs, cols, pages), wait_until="load")
    page.evaluate("document.fonts.ready")
    bad = page.evaluate(CHECK_JS)
    page.pdf(path=out_path, format="Letter", print_background=True, margin={"top": "0", "bottom": "0", "left": "0", "right": "0"})
    browser.close()

print(json.dumps({"players": N, "total": total, "price": price, "font_pt": fs, "columns": cols,
                  "pages": 1 + len(pages), "layout_problems": bad, "names": [p["name"] for p in players]}, ensure_ascii=False))
