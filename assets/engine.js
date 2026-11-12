(function () {
  "use strict";
  var S = window.SCENES, C = window.JCVD;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var FIG = "assets/fig/", IMG = "assets/img/";
  var DESIGN = { d: { W: 1440, H: 900 }, m: { W: 402, H: 826 } };

  /* ---------------- chrome measurements (Figma frame coordinates) ---------------- */
  var CH = {
    d: {
      hdrLogo: { x: 72, y: 48, w: 112 }, tileGap: 34,
      menu: { x: 72, base: [154, 175, 196, 217], size: 13 },
      homeMenu: { x: 66, base: [110, 137, 164, 191], size: 18 },
      crumb: { x: 151, base: 196 },
      cart: { x: 1328, y: 51, w: 26, h: 32 },
      footer: { x: 72, base: 880 },
      hero: { ox: -79, oy: 0, s: 0.799 },
      partnertag: { x: 171, y: 88, size: 26, ix: 23, iy: -10 }
    },
    m: {
      hdrLogo: { x: 20, y: 28, w: 92 }, tileGap: 60,
      menu: { x: 20, base: [110, 133, 156, 179], size: 15 },
      homeMenu: { xs: [31, 106, 206, 309], base: 763, size: 13 },
      cart: { x: 346, y: 28, w: 18, h: 22 },
      hero: { ox: -239, oy: 85, s: 0.439 },
      partnertag: { x: 70, y: 52, size: 18, ix: 30, iy: -12 }
    }
  };
  var TILES = { A: { w: 276, h: 333, vx: 5, vy: 0 }, B: { w: 281, h: 330, vx: 0, vy: 313 }, C: { w: 283, h: 330, vx: 260, vy: 313 }, D: { w: 283, h: 326, vx: 260, vy: 623 } };
  var KEYS = ["A", "B", "C", "D"], M = 18, REF = { x: 717, y: 87 };

  var HOME_SENT = null, mode, sc, scName, scale = 1, ox = 0, EX = 0, OY = 0, FB = 0, SHIFT = 0, EXTRA = 0, HOMEDY = 0, nodes = [], stateName = null, stateT = 0, route = {}, current = null;
  var stage = $("#stage"), chrome = $("#chrome");

  /* the height that is really visible (in-app browsers report toolbars and overlays differently) */
  function viewH() {
    var h = [window.innerHeight, document.documentElement.clientHeight || 1e9];
    if (window.visualViewport) h.push(window.visualViewport.height);
    return Math.min.apply(null, h.filter(function (v) { return v > 100; }));
  }
  /* phone safe box: what browser chrome hides (status bar under Safari, the floating Safari bar at the bottom) */
  var SAFE = { t: 0, b: 0 };
  function measureSafe() {
    var p = document.createElement("div");
    p.style.cssText = "position:fixed;left:0;top:0;width:1px;height:1px;visibility:hidden;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)";
    document.body.appendChild(p); var cs = getComputedStyle(p); var t = parseFloat(cs.paddingTop) || 0, b = parseFloat(cs.paddingBottom) || 0; p.remove();
    var ua = navigator.userAgent, ig = /Instagram|FBAN|FBAV/.test(ua), ios = /iPhone|iPad|iPod/.test(ua);
    var safari = ios && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua) && !ig;
    SAFE.t = t; SAFE.b = ig ? Math.max(b, 16) : safari ? Math.max(b, 88) : Math.max(b, 24);
  }
  function ST() { return mode === "m" ? SAFE.t / scale : 0; }
  function pickMode() { return window.innerWidth <= 760 ? "m" : "d"; }
  function layout() {
    mode = pickMode(); measureSafe();
    var D = DESIGN[mode], vw = window.innerWidth, vh = viewH();
    scale = mode === "d" ? Math.min(vw / D.W, vh / D.H) : vw / D.W;
    ox = 0; EX = mode === "d" ? Math.max(0, vw / scale - D.W) : 0;
    OY = 0; FB = mode === "d" ? Math.max(0, vh / scale - D.H) : 0;
    HOMEDY = mode === "m" ? vh / scale - D.H : 0;   // short phones (Instagram browser): Home moves up to fit   // tall windows: footer stays at the bottom edge
    [stage, chrome].forEach(function (l) {
      l.style.width = (D.W + EX) + "px"; l.style.height = (vh / scale) + "px";
      var vo = window.visualViewport ? window.visualViewport.offsetTop : 0;   // follow the visible area if the browser pans it
      l.style.transform = "translate(0," + ((l === chrome ? OY * scale : 0) + vo) + "px) scale(" + scale + ")";
    });
    document.body.classList.toggle("is-m", mode === "m");
  }

  /* ---------------- element factory ---------------- */
  function lerp(a, b, t) { return a + (b - a) * t; }
  function lerpG(a, b, t) {
    if (t <= 0) return a; if (t >= 1) return b;
    var o = {}; for (var k in a) o[k] = (typeof a[k] === "number" && typeof b[k] === "number") ? lerp(a[k], b[k], t) : a[k];
    return o;
  }
  function build(e) {
    var n = document.createElement("div"); n.className = "el"; n.dataset.key = e.key;
    if (e.k === "text") {
      n.classList.add("t");
      if (e.align === "justify") n.classList.add("j"); else if (e.align === "right") n.classList.add("r"); else if (e.align === "center") n.classList.add("c");
      if (e.muted) n.classList.add("muted");
      if (e.xl) n.style.fontWeight = 200;
      if (e.wrap) n.style.whiteSpace = "normal";
      var keep = scName === "home" || /^(Innovative biomaterials|fashion and interiors|Request access|Produz algo legal)/.test(e.txt || "");   // Home and the catalog callout keep their drawn sizes
      var ts = keep ? e.s : typeSize(e.s), tl = e.lh * ts / e.s;
      n.style.fontSize = ts + "px"; n.style.lineHeight = tl + "px";
      n.innerHTML = relabel(e.html);
    } else if (e.k === "vtext") {
      n.classList.add("v"); n.style.fontSize = (e.f[0].g.w * 0.94) + "px";
      if (e.vtop) n.classList.add("vtop");
      n.innerHTML = "<span>" + e.html + "</span>";
    } else if (e.k === "img") {
      var far = rectOf(e, e.f[0].g)[1] > 1400;      // well below the first screens: load when it gets close
      n.innerHTML = '<img class="im" alt="" decoding="async"' + (far ? ' loading="lazy"' : "") + ' src="' + FIG + e.src + '">';
      if (e.soft) n.style.boxShadow = "3px 5px 14px rgba(40,36,32,.16)";
      if (e.f.some(function (f) { return f.g.c0 !== undefined; }) || Object.keys(e.st).some(function (s) { return e.st[s].g.c0 !== undefined; })) n.classList.add("clip");
    } else if (e.k === "box") { n.style.background = e.col; }
    else if (e.k === "frame") { n.classList.add("pframe"); n.style.border = Math.max(2, e.sw) + "px solid " + e.col; }
    else if (e.k === "icon") { n.classList.add("icon"); n.innerHTML = '<img alt="" src="' + FIG + e.src + '">'; }
    else if (e.k === "flogo") {       // footer logo = the header logo (same relief tiles), centred in its box
      var fg = e.f[0].g, gapT = 60, tot = KEYS.reduce(function (a, k) { return a + TILES[k].w - 2 * M; }, 0) + 3 * gapT, fs = fg.w / tot, fx = -M * fs, html = "";
      KEYS.forEach(function (k) { html += '<img alt="" src="assets/logo/' + k + '-s.webp" style="position:absolute;left:' + fx + 'px;top:' + ((fg.h - 333 * fs) / 2 + (333 - TILES[k].h) * fs - M * fs) + 'px;width:' + TILES[k].w * fs + 'px;height:' + TILES[k].h * fs + 'px">'; fx += (TILES[k].w - 2 * M + gapT) * fs; });
      n.innerHTML = html; n.setAttribute("aria-label", "JCVD");
    }
    else if (e.k === "marquee") {
      n.classList.add("marq");
      n.innerHTML = '<div class="track">' + C.pastWork.concat(C.pastWork).concat(C.pastWork).map(function (l) { return '<a href="' + l[1] + '" target="_blank" rel="noopener"><img src="' + IMG + l[0] + '" alt="" style="height:' + logoH(l[0]) + '%"></a>'; }).join("") + "</div>";
    }
    return n;
  }
  function RDX() { return spread(1104.5); }   // shared shift of everything aligned to the right margin
  function spread(cx) { return EX * Math.max(0, Math.min(1, (cx - 260) / 920)); }   // left column stays put, right edge moves fully
  function cxOf(g) { return g.c0 !== undefined ? (g.c0 + g.c2) / 2 : g.cx !== undefined ? g.cx : g.x + (g.w || 0) / 2; }
  /* an extra image placed in frame coordinates (case studies, partner pieces) */
  function addImg(it, opts) {
    opts = opts || {};
    var g = { cx: it.x + it.w / 2, cy: it.y + it.h / 2, w: it.w, h: it.h, r: 0, c0: it.x, c1: it.y, c2: it.x + it.w, c3: it.y + it.h };
    var e = { k: "img", src: "../img/" + it.src, f: sc.els.length ? sc.els[0].f.map(function () { return { g: g, o: 1 }; }) : [{ g: g, o: 1 }], st: {}, ralign: opts.ralign ? 1 : 0, key: "X:" + it.src };
    var n = build(e); n.firstChild.style.objectFit = it.contain ? "contain" : "cover"; if (it.contain) n.style.background = "#fff";
    stage.appendChild(n); var nd = { e: e, n: n }; nodes.push(nd);
    if (it.href) { nd.n.classList.add("go"); nd.n.addEventListener("click", function () { window.open(it.href, "_blank", "noopener"); }); }
    return nd;
  }
  function addText(html, x, y, w, opts) {
    opts = opts || {};
    var e = { k: "text", html: html, txt: html.replace(/<[^>]+>/g, ""), s: opts.s || 15, lh: opts.lh || 23, align: opts.align || "left", st: {}, ralign: opts.ralign ? 1 : 0,
      f: (sc.els.length ? sc.els[0].f : [0]).map(function () { return { g: { x: x, y: y, w: w, h: opts.lh || 23 }, o: 1 }; }) };
    var n = build(e); n.style.whiteSpace = "normal"; stage.appendChild(n); var nd = { e: e, n: n }; nodes.push(nd); return nd;
  }
  function wireLinks(root) { $$("[data-to]", root).forEach(function (a) { a.addEventListener("click", function (ev) { ev.stopPropagation(); nav(a.dataset.to); }); }); }
  /* phone footer on every page: header-style logo (links to Contact) with "JCVD, LLC 2026" centred under it */
  function phoneFooter() {
    var fl = nodes.filter(function (nd) { return nd.e.k === "flogo" && !nd.hidden; }).pop();
    nodes.forEach(function (nd) { if (nd.e.k === "text" && /^(INSTAGRAM|JCVD, LLC)/.test(nd.e.txt || "")) nd.hidden = true; });
    if (!fl) return;
    if (fl.hidden) return;
    var e2 = { k: "text", key: "T:footcap", txt: "JCVD, LLC 2026", html: "JCVD, LLC 2026", s: 12, lh: 16, align: "center", st: {}, noanchor: 1,
      f: fl.e.f.map(function (f) { var g = f.g, cx = g.x + g.w / 2; return { g: { x: cx - 80, y: g.y + g.h + 8, w: 160, h: 16 }, o: f.o }; }) };
    var n = build(e2); n.style.whiteSpace = "nowrap"; n.style.color = "var(--foot)"; stage.appendChild(n); nodes.push({ e: e2, n: n, dy: fl.dy || 0, push: fl.push || 0, anchor: null });
  }
  /* phone landing pages: logo on top, the whole hero photo below it, caption under the photo,
     everything kept inside the part of the screen that browser chrome leaves visible */
  var HEROM = { about: ["180.jpg", /^JCVD is me/], projects: ["72.jpg", /^My work is truly/], products: ["190.jpg", /^the CARTA bag/], partners: ["eie-still.jpg", /^eie\. artisanal/] };
  function heroM(name) {
    var h = HEROM[name]; if (!h) return;
    var im = nodes.filter(function (nd) { return nd.e.k === "img" && nd.e.src && nd.e.src.indexOf(h[0]) >= 0; })[0];
    var cap = nodes.filter(function (nd) { return nd.e.k === "text" && h[1].test(nd.e.txt || ""); })[0];
    if (!im) return;
    var vh = viewH() / scale, st = SAFE.t / scale, sb = SAFE.b / scale;
    var g0 = im.e.f[0].g, aspect = g0.w / g0.h, oldBot = rectOf(im.e, g0)[3];
    var top = CH.m.hdrLogo.y + st + 30 + 16, capH = cap ? 70 : 0;
    var avail = vh - sb - top - capH - 12, w = 362, hh = w / aspect;
    if (hh > avail) { hh = Math.max(220, avail); w = hh * aspect; }
    var x0 = 20, box = { c0: x0, c1: top, c2: x0 + w, c3: top + hh, cx: x0 + w / 2, cy: top + hh / 2, w: w, h: hh, r: 0 };
    var d1 = im.e.f.length > 1 ? rectOf(im.e, im.e.f[1].g)[1] - rectOf(im.e, g0)[1] : 0;
    im.e = Object.assign({}, im.e, { f: im.e.f.map(function (f, k) { var g = Object.assign({}, box); if (k) { g.c1 += d1; g.c3 += d1; g.cy += d1; } return { g: g, o: f.o }; }) });
    im.n.classList.add("clip"); im.dy = 0; im.anchor = null;
    var capBot = top + hh;
    if (cap) {
      cap.n.style.whiteSpace = "normal"; cap.n.style.textAlign = "right"; cap.wfix = 240; cap.n.style.width = "240px";
      var cg = cap.e.f[0].g, cy = top + hh + 12;
      cap.e = Object.assign({}, cap.e, { f: cap.e.f.map(function (f, k) { return { g: Object.assign({}, f.g, { x: 382 - 240, y: cy + (k ? d1 : 0), w: 240 }), o: f.o }; }) });
      cap.dy = 0; cap.anchor = null; capBot = cy + cap.n.offsetHeight;
    }
    var bodyTop = capBot + 56, below = nodes.filter(function (nd) { return nd !== im && nd !== cap && rectOf(nd.e, nd.e.f[0].g)[1] > oldBot - 10; });
    if (!below.length) return;
    var first = Math.min.apply(null, below.map(function (nd) { return rectOf(nd.e, nd.e.f[0].g)[1] + (nd.dy || 0); }));
    below.forEach(function (nd) { nd.dy = (nd.dy || 0) + bodyTop - first; });
  }
  /* ---------------- layout system (landing pages) ----------------
     One template for About, Projects, Products and Partners, on both screen sizes.
     Spacing scale: phone 8 / 16 / 24 / 56, desktop 60 / 120.  Hero photos are 4:5.
     phone:   logo -24- hero (20 margins) -24- caption (left, 170 wide) -56- body (260, centred) -56- next section
     desktop: menu top = hero top = caption top; caption sits left of the hero (right-aligned, 60 away);
              body starts 120 under the menu, 260 wide; next section 120 under the body.
     Everything is stacked from measured heights, so nothing can overlap. */
  var LAND = {
    about:    { img: "hero-about.jpg",    src: /^180\.jpg$/,       cap: /^JCVD is me/,        capHtml: "JCVD is me: João Campos do Vale Dourado." },
    projects: { img: "hero-projects.jpg", src: /^72\.jpg$/,        cap: /^My work is truly/,  capHtml: "Material sourcing for the<br>CFDA/Vogue Fashion Fund", to: "case-0" },
    products: { img: "hero-products.jpg", src: /^190\.jpg$/,       cap: /^the CARTA bag/,     capHtml: "the VOLTA bag<br>primavera 2026", to: "product-volta-black" },
    partners: { img: "hero-partners.jpg", src: /eie-still\.jpg$/, cap: /^eie\. artisanal/,   capHtml: "eie. artisanal jewelry", to: "p-eie" }
  };
  var COPY = {
    "I grew up in": "I grew up in Belo Horizonte, Brazil, and moved to Philadelphia at 18 to study <b class=\"w\">international relations</b>. My first job was in India, interning at the social impact team of <b class=\"w\">the country’s largest garment manufacturer</b>. In NYC, I’ve done a bit of everything: consulting, modeling, and over 5 years of helping companies become <b class=\"w\">B Corps</b> — the highest global sustainability rating. In 2025, I founded JCVD as a laboratory of sorts.",
    "JCVD is now a design": "JCVD is now a design studio — part sourcing agency, <b class=\"w\">part production manager, and wholeheartedly a connector</b>. Ultimately, I’m working to bring Brazil to the world, e o mundo de volta ao Brasil.<br><br>Bora nessa juntos?",
    "With a focus on": "With a focus on accessories, <b class=\"w\">I design products for the JCVD brand and for select global clients</b>. My design philosophy is shaped by Brazilian modernism, nature’s raw beauty, and contrasting textures. I call it ecobrutalista.",
    "Each one of my projects": "My projects explore the full life cycle of a product, <b class=\"w\">from design and production to partnerships and fulfillment</b>. My network spans Brazil, the U.S., and beyond, helping deliver solutions to creative and commercial challenges. My sweet spot is finding where a beautiful image meets an even better story — and sharing that story across the globe.<br><br><a class=\"go\" data-to=\"contact\"><u>Reach out</u></a> to explore custom projects.",
    "explore collections": "<u>Explore collections.</u>"
  };
  var SYS = {
    d: { menuTop: 140.7, menuBot: 220.6, heroW: 504, heroH: 630, right: 1362, capW: 220, m: 60, l: 120, bodyX: 72, bodyW: 260 },
    m: { logoBot: 53, x: 20, heroW: 362, m: 24, l: 56, capW: 220, bodyW: 260 }
  };
  function landing(name) {
    var L = LAND[name], Y = SYS[mode], isD = mode === "d";
    var im = nodes.filter(function (nd) { return nd.e.k === "img" && L.src.test(nd.e.src || ""); })[0];
    var cap = nodes.filter(function (nd) { return nd.e.k === "text" && L.cap.test(nd.e.txt || ""); })[0];
    if (!im) return;
    var body = nodes.filter(function (nd) { return nd.e.k === "text" && (isD ? nd.e.botal : nd.e.flow); });
    if (name === "partners") body = nodes.filter(function (nd) { return nd.e.k === "text" && /^Artistic collaboration/.test(nd.e.txt || ""); });
    body.sort(function (a, b) { return a.e.f[0].g.y - b.e.f[0].g.y; });
    body.forEach(function (nd) { for (var k in COPY) if ((nd.e.txt || "").indexOf(k) === 0) { nd.n.innerHTML = COPY[k]; nd.e = Object.assign({}, nd.e, { txt: nd.n.textContent }); wireLinks(nd.n); } });   // never touch the shared scene data
    var r0 = rectOf(im.e, im.e.f[0].g), oldBodyTop = body.length ? body[0].e.f[0].g.y : r0[3];
    var oldBodyBot = body.reduce(function (a, nd) { var g = nd.e.f[0].g; return Math.max(a, g.y + (g.h || 0)); }, oldBodyTop);
    // 1. hero: fixed 4:5 box, each scroll frame keeps its own offset from the first
    var top = isD ? Y.menuTop : Y.logoBot + ST() + Y.m, W = Y.heroW, H = isD ? Y.heroH : W * 5 / 4;
    var x0 = isD ? Y.right - W : Y.x;
    im.e = Object.assign({}, im.e, { ralign: isD ? 1 : 0, f: im.e.f.map(function (f) { var r = rectOf(im.e, f.g), dx = r[0] - r0[0], dy = r[1] - r0[1];
      return { o: f.o, g: { c0: x0 + dx, c1: top + dy, c2: x0 + W + dx, c3: top + H + dy, cx: x0 + W / 2 + dx, cy: top + H / 2 + dy, w: W, h: H, r: 0 } }; }) });
    im.n.classList.add("clip"); im.n.firstChild.src = IMG + L.img; im.n.firstChild.alt = L.capHtml.replace(/<br>/g, ", "); im.n.firstChild.style.objectFit = "cover"; im.dy = 0; im.anchor = null;
    if (L.to) go(im, function () { nav(L.to); });
    // 2. caption
    var capBot = top + H;
    if (cap) {
      cap.n.innerHTML = L.capHtml; cap.n.style.whiteSpace = "normal"; cap.wfix = Y.capW; cap.n.style.width = Y.capW + "px";
      cap.n.style.textAlign = isD ? "right" : "left"; cap.n.classList.remove("j", "c", "r");
      if (!isD) { cap.n.style.fontSize = "13px"; cap.n.style.lineHeight = "19.5px"; }   // phone: captions one step under the text
      var cy = isD ? top : top + H + Y.m, cx = isD ? x0 - Y.m - Y.capW : Y.x, c0 = cap.e.f[0].g;
      cap.e = Object.assign({}, cap.e, { txt: cap.n.textContent, noanchor: 1, capbot: undefined, capimg: undefined, ralign: isD ? 1 : 0, f: cap.e.f.map(function (f, k) { var r = rectOf(im.e, im.e.f[k].g);
        return { o: f.o, g: Object.assign({}, f.g, { x: cx, y: cy + (r[1] - top), w: Y.capW }) }; }) });
      cap.dy = 0; cap.anchor = im; cap.push = 0;
      if (!isD) capBot = cy + Math.max(cap.n.offsetHeight, 2 * 19.5);   // caption slot: at least two lines, so the body lands at the same height on every page
      if (L.to) go(cap, function () { nav(L.to); });
    }
    // 3. body column, paragraphs one blank line apart
    var yy = isD ? Y.menuBot + Y.l : capBot + Y.l, bx = isD ? Y.bodyX : (402 - Y.bodyW) / 2;
    body.forEach(function (nd, i) {
      nd.wfix = Y.bodyW; nd.n.style.width = Y.bodyW + "px"; nd.n.style.whiteSpace = "normal"; nd.n.classList.add("j"); nd.anchor = null;
      nd.e = Object.assign({}, nd.e, { noanchor: 1, f: nd.e.f.map(function (f) { return { o: f.o, g: Object.assign({}, f.g, { x: bx, w: Y.bodyW }) }; }) });
      nd.dy = yy - nd.e.f[0].g.y;
      if (nd.e.endTop !== undefined) nd.e.f.forEach(function (f, k) { if (k > 0) f.g = Object.assign({}, f.g, { y: (isD ? Y.menuBot + Y.l : nd.e.endTop) - nd.dy }); });
      var h = nd.n.offsetHeight; yy += h + (nd.e.lh || 23);
      nd.oneLine = isD && h < 1.6 * (nd.e.lh || 20); nd.prevNode = body[i - 1];
    });
    var bodyBot = yy - (body.length ? (body[body.length - 1].e.lh || 23) : 0);
    if (!isD && name === "products" && body.length) {        // phone: link to the collections, on the left margin
      var ex = mText("<u>Explore collections.</u>", Y.x, bodyBot + Y.l, 200, { ref: body[0] });
      go(ex, function () { window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }); });   // to the end: the collection list with the footer under it
      bodyBot = bodyBot + Y.l + ex.n.offsetHeight;
    }
    // 4. everything below the old body moves so the next section starts one large step under the new one
    var rest = nodes.filter(function (nd) { return nd !== im && nd !== cap && body.indexOf(nd) < 0 && rectOf(nd.e, nd.e.f[0].g)[1] > oldBodyBot - 4; });
    if (!rest.length) return;
    var restTop = Math.min.apply(null, rest.map(function (nd) { return rectOf(nd.e, nd.e.f[0].g)[1]; }));
    var shift = isD ? 0 : bodyBot + Y.l - restTop;
    if (isD && name === "partners") shift = 699 - restTop;   // desktop: the partner list rests where the Products collection list rests
    if (isD && name === "projects") { stackD(im, cap, rest, top, H, Y); return; }
    if (isD && name !== "partners") return;        // desktop: later sections arrive with the scroll, as drawn
    rest.forEach(function (nd) { nd.dy = (nd.dy || 0) + shift; });
    if (!isD && name === "projects") {   // phone: sections stacked one large step apart (callout, then the case studies)
      var cl = clusters(rest.filter(function (nd) { return nd.e.k !== "flogo" && !/^(INSTAGRAM|JCVD, LLC)/.test(nd.e.txt || ""); }), 0, 40);
      var yS = bodyBot + Y.l;
      var XL = 96;   // the case-study block gets extra air from the paper cards above and below it
      cl.forEach(function (c, i) { var isCase = c.nodes.some(function (nd) { return nd.e.k === "vtext"; }), prev = cl[i - 1];
        if (isCase && prev) yS += XL - Y.l;
        var d = yS - c.top; c.nodes.forEach(function (nd) { nd.dy = (nd.dy || 0) + d; }); yS = c.bot + d + Y.l; });
    }
    if (!isD && (name === "products" || name === "partners")) {   // phone: the list sits low, so scrolling to the end leaves the text under the logo and the list at the bottom
      var lst = rest.filter(function (nd) { return nd.e.k === "text" && /OUTONO|PARTNER PRODUCTS|AREWÀ|Arewà|JCVD PRODUCTS/.test(nd.e.txt || ""); });
      if (lst.length) {
        lst.forEach(function (nd) { var g = nd.e.f[0].g; setGeo(nd, 50, topOf(nd), g.w); nd.dy = (nd.dy || 0); });
        var lt = Math.min.apply(null, lst.map(topOf)), lb = Math.max.apply(null, lst.map(botOf)), bt = topOf(body[0]);
        var target = bodyBot + Y.l;      // the list follows the text one large step down, the footer one more step under it
        lst.forEach(function (nd) { nd.dy = (nd.dy || 0) + target - lt; });
        var fy = target + (lb - lt) + Y.l, fl = nodes.filter(function (nd) { return nd.e.k === "flogo" && !nd.hidden; }).pop();
        if (fl) { setGeo(fl, 154, fy, 94, 30.13); fl.dy = 0; } else fl = footerM(fy);
        var ref = lst[0], r0 = ref.e.f[0].g.y;   // the footer scrolls with the list
        fl.e = Object.assign({}, fl.e, { f: fl.e.f.map(function (f, k) { var rk = ref.e.f[Math.min(k, ref.e.f.length - 1)].g.y; return { o: f.o, g: Object.assign({}, f.g, { y: fy - (ref.dy || 0) + (ref.dy || 0) + (rk - r0) }) }; }) });
      }
    }
    if (!isD && name === "about") aboutEndM(bodyBot);
  }
  /* ---------------- phone templates (from the Chagas frames) ---------------- */
  /* place a node at (x, y) in display coordinates; its later scroll frames keep their own offsets */
  function setGeo(nd, x, y, w, h) {
    var r0 = rectOf(nd.e, nd.e.f[0].g); y -= (nd.dy || 0);
    nd.e = Object.assign({}, nd.e, { f: nd.e.f.map(function (f) { var r = rectOf(nd.e, f.g), dx = r[0] - r0[0], dy = r[1] - r0[1], g;
      if (nd.e.k === "img") g = { c0: x + dx, c1: y + dy, c2: x + w + dx, c3: y + h + dy, cx: x + w / 2 + dx, cy: y + h / 2 + dy, w: w, h: h, r: 0 };
      else g = Object.assign({}, f.g, { x: x + dx, y: y + dy, w: w, h: h === undefined ? f.g.h : h });
      return { o: f.o, g: g }; }) });
    nd.anchor = null; nd.e.noanchor = 1; nd.e.ralign = 0;
    if (nd.e.k === "img") { nd.n.classList.add("clip"); nd.n.firstChild.style.objectFit = "cover"; }
  }
  function topOf(nd) { return rectOf(nd.e, nd.e.f[0].g)[1] + (nd.dy || 0) + (nd.push || 0); }
  function botOf(nd) { return nd.e.k === "text" ? topOf(nd) + nd.n.offsetHeight : rectOf(nd.e, nd.e.f[0].g)[3] + (nd.dy || 0) + (nd.push || 0); }
  /* a text block in display coordinates; with `ref` it scrolls together with that node */
  function mText(html, x, y, w, o) {
    o = o || {};
    var nd = addText(html, x, y, w, { s: o.s || 15, lh: o.lh || (o.s ? o.s * 1.5 : 23), align: o.align || "left" });
    nd.wfix = w; nd.n.style.width = w + "px"; nd.e.noanchor = 1;
    if (o.align === "justify") nd.n.classList.add("j");
    if (o.caps) nd.n.style.textTransform = "uppercase";
    if (o.ref) { var r0 = rectOf(o.ref.e, o.ref.e.f[0].g); nd.e.f = nd.e.f.map(function (f, k) { var r = rectOf(o.ref.e, o.ref.e.f[Math.min(k, o.ref.e.f.length - 1)].g); return { o: f.o, g: Object.assign({}, f.g, { y: f.g.y + r[1] - r0[1] }) }; }); }
    wireLinks(nd.n); return nd;
  }
  function mImg(src, x, y, w, h) { var nd = addImg({ src: src, x: x, y: y, w: w, h: h }); nd.e.noanchor = 1; return nd; }
  /* phone footer block: the header logo with INSTAGRAM - EMAIL under it */
  function footerM(y) {
    var e = { k: "flogo", key: "X:flogo", st: {}, f: (sc.els.length ? sc.els[0].f : [0]).map(function () { return { g: { x: 154, y: y, w: 94, h: 30.13 }, o: 1 }; }) };
    var n = build(e); stage.appendChild(n); var nd = { e: e, n: n }; nodes.push(nd); go(nd, function () { nav("contact"); });
    return nd;
  }
  /* About, after the text: past work, the logo strip, then Projects | Products (same size photos, cropped), then the footer */
  function aboutEndM(y) {
    byText(/^explore (projects|products)$/i).forEach(function (nd) { nd.n.innerHTML = nd.n.textContent; });
    var pw = byText(/^past work$/)[0], mq = els(function (e) { return e.k === "marquee"; })[0];
    var lp = byText(/^explore projects$/i)[0], lr = byText(/^explore products$/i)[0];
    var ip = els(function (e) { return e.k === "img" && e.oid === 272; })[0], ir = els(function (e) { return e.k === "img" && e.oid === 358; })[0];
    var fl = els(function (e) { return e.k === "flogo"; })[0], M2 = SYS.m;
    [pw, mq, lp, lr, ip, ir, fl].forEach(function (nd) { if (nd) nd.dy = 0; });   // placed in absolute page positions below
    y += M2.l;
    if (pw) { setGeo(pw, 71, y, 260); pw.dy = 0; pw.wfix = 260; pw.n.style.textAlign = "right"; y += 20 + M2.m; }
    if (mq) { setGeo(mq, 0, y, 402, 73); mq.dy = 0; y += 73 + M2.l; }
    if (lp) { setGeo(lp, 20, y, 154); lp.dy = 0; lp.wfix = 154; lp.n.style.textAlign = "right"; }
    if (lr) { setGeo(lr, 228, y, 154); lr.dy = 0; lr.wfix = 154; lr.n.style.textAlign = "left"; }
    y += 20 + 8;
    if (ip) { setGeo(ip, 0, y, 174, 232); ip.dy = 0; ip.n.firstChild.src = IMG + "hero-projects.jpg"; }
    if (ir) { setGeo(ir, 228, y, 174, 232); ir.dy = 0; ir.n.firstChild.src = IMG + "hero-products.jpg"; }
    y += 232 + M2.l;
    if (fl) { setGeo(fl, 154, y, 94, 30.13); fl.dy = 0; }
  }
  /* phone contact: one size, everything centred on the page */
  function contactM() {
    var isD = mode === "d", M2 = SYS.m, x = isD ? 420 : 20, w = isD ? 600 : 362, mid = x + w / 2;
    if (isD) nodes.forEach(function (nd) { if (nd.e.k === "text" || nd.e.k === "icon") nd.hidden = true; });
    else { nodes.forEach(function (nd) { nd.hidden = true; }); cum = cum.map(function () { return 0; }); }   // built page: plain scrolling
    var L = C.links, o = { align: "center" }, parts = [], y = 0;
    function t(html, gap) { var nd = mText(html, x, 0, w, o); parts.push([nd, y]); y += nd.n.offsetHeight + gap; }
    t("Showroom appointments, custom projects and products, press:", 8);
    t('<a href="mailto:' + L.email + '">' + L.email + '</a><br><a href="mailto:' + L.press + '">' + L.press + "</a>", M2.l);
    t('Marcas e produtores no Brasil:<br><a href="' + L.whatsapp + '" target="_blank" rel="noopener"><u>pode vir de zap</u></a>', M2.l);
    var row = [["icon-d4.png", 28, 28, L.instagram], ["icon-d5.png", 30, 27, L.linkedin], ["icon-wa.svg", 28, 28, L.whatsapp]], gapI = 24;
    var rowW = row.reduce(function (a, r) { return a + r[1]; }, 0) + gapI * (row.length - 1), iy = y; y += 28 + M2.l;
    t('Peek into my brain through my blog, <a href="' + L.blog + '" target="_blank" rel="noopener"><u>Impactado.</u></a>', 0);
    var top = isD ? SYS.d.menuTop : M2.logoBot + ST(), foot = isD ? 860 : 874 - 24 - 52 + ST(), y0 = Math.max(top + M2.l, top + (foot - top - y) / 2);
    parts.forEach(function (p) { setGeo(p[0], x, y0 + p[1], w); p[0].dy = 0; p[0].wfix = w; p[0].n.style.textAlign = "center"; });
    var ix = mid - rowW / 2;
    row.forEach(function (r, k) {
      var e = { k: "icon", src: r[0], key: "X:ci" + k, st: {}, f: (sc.els.length ? sc.els[0].f : [0]).map(function () { return { g: { x: ix, y: y0 + iy + (28 - r[2]) / 2, w: r[1], h: r[2] }, o: 1 }; }) };
      var n = build(e); stage.appendChild(n); var nd = { e: e, n: n }; nodes.push(nd); n.setAttribute("aria-label", ["Instagram", "LinkedIn", "WhatsApp"][k]);
      go(nd, function () { window.open(r[3], "_blank", "noopener"); }); ix += r[1] + gapI;
    });
    if (!isD) footerM(Math.max(foot, y0 + y + M2.l));
  }
  /* phone case study (opened): label, title, date, text in the body column, the photo collage under it, footer */
  function caseDetailM(i) {
    var c = C.cases[i], M2 = SYS.m;
    nodes.forEach(function (nd) { nd.hidden = true; }); cum = cum.map(function () { return 0; });   // built page: plain scrolling
    var x = (402 - M2.bodyW) / 2, w = M2.bodyW, y = M2.logoBot + ST() + M2.l;
    var a = mText(c.label, x, y, w, { caps: 1 }); y += a.n.offsetHeight + M2.m;
    var t = mText(c.title, x, y, w); y += t.n.offsetHeight;
    var d = mText(c.when, x, y, w, { s: 13, lh: 19.5, caps: 1 }); y += d.n.offsetHeight + M2.m;
    var b = mText(c.body, x, y, w, { align: "justify" }); y += b.n.offsetHeight + M2.l;
    var bot = y;
    (c.mcollage || []).forEach(function (it, k) { var im = mImg(it.src, it.x, y + it.y, it.w, it.h); im.n.style.animation = "fin .6s " + (0.2 + k * 0.22) + "s both"; bot = Math.max(bot, y + it.y + it.h); });
    footerM(bot + M2.l);
    caseNav({ prev: function () { nav("case-" + ((i + C.cases.length - 1) % C.cases.length)); }, next: function () { nav("case-" + ((i + 1) % C.cases.length)); }, close: function () { nav("projects"); } });
  }
  /* phone collection / partner page: description, SEE ALL (opens the collection list), products alternating sides */
  var ASPECT = { "cut-usb-v.webp": 900 / 163, "cut-carta-chocolate.webp": 346 / 512, "cut-carta-olive.webp": 344 / 468, "cut-volta-black.webp": 619 / 353, "cut-usb.webp": 163 / 900, "cut-beanie.webp": 679 / 900, "carta-white.jpg": 934 / 1400, "necklace1.jpg": 217 / 175 };
  function collectionM(o) {
    var M2 = SYS.m, items = [], desc = "";
    if (o.collection) { var col = C.collections.filter(function (c) { return c.handle === o.collection; })[0] || { pieces: [], desc: "" }; desc = col.desc; items = col.pieces.map(function (pc) { return { img: pc.img, product: pc.product }; }); }
    if (o.partner) { var pt = C.partners.filter(function (x) { return x.handle === o.partner; })[0]; desc = pt.desc;
      items = pt.pieces.length ? pt.pieces.map(function (pc) { return { img: pc.img === "cut-usb.webp" ? "cut-usb-v.webp" : pc.img, product: pc.product }; }) : ((pt.layout && pt.layout.m) || []).map(function (it) { return { img: it.src, label: it.label }; }); }
    nodes.forEach(function (nd) { nd.hidden = true; }); cum = cum.map(function () { return 0; });   // built page: plain scrolling
    var x = (402 - M2.bodyW) / 2, y = M2.logoBot + ST() + M2.l;
    if (desc) { var dn = mText(desc, x, y, M2.bodyW); y += dn.n.offsetHeight + M2.m; }
    var see = mText("SEE ALL", 101, y, 200, { s: 13, lh: 19.5, align: "center" }); y += see.n.offsetHeight;
    var here = o.collection ? "c-" + o.collection : "p-" + o.partner;
    var list = C.collections.map(function (c) { return '<a class="go" data-to="c-' + c.handle + '">' + c.label + "</a>"; }).join("<br>") + '<br><br><a class="go" data-to="partners">PARTNER PRODUCTS</a>';
    if (o.partner) list = C.partners.map(function (p) { return '<a class="go" data-to="p-' + p.handle + '">' + p.label + "</a>"; }).join("<br>") + '<br><br><a class="go" data-to="products">JCVD PRODUCTS</a>';
    var ln = mText(list, 71, y + 12, 260, { align: "center" }); markCurrent(ln.n); ln.hidden = true; ln.n.classList.add("dropmenu"); ln.n.style.zIndex = 4;   // drops over the page, like the main menu
    var below = [];
    y += M2.l;
    items.forEach(function (it, k) {
      var ar = ASPECT[it.img] || 1, w = Math.min(175, 260 / ar), h = w * ar, right = (k + (o.partner ? 1 : 0)) % 2 === 0;
      var ix = right ? 382 - w : 20, im = mImg(it.img, ix, y, w, h); im.n.firstChild.style.objectFit = "contain"; below.push(im);
      var p = it.product && C.products[it.product], html;
      if (p) html = '<span style="font-weight:400">the ' + p.name + "</span><br>" + p.variant + "<br>" + (p.soldOut ? "<i>out of stock</i>" : "$" + p.price);
      else html = it.label || "";
      var tw = right ? Math.min(140, ix - 16 - x) : Math.min(140, 382 - (ix + w + 16)), tx = right ? ix - 16 - tw : ix + w + 16;
      var tn = mText(html, tx, y, tw, { s: 12, lh: 18 }); tn.n.style.textAlign = right ? "right" : "left";
      var th = tn.n.offsetHeight; setGeo(tn, tx, y + (h - th) / 2, tw); below.push(tn);
      if (p) { go(im, function () { nav("product-" + it.product); }); go(tn, function () { nav("product-" + it.product); }); }
      y += h + M2.m;
    });
    var fl = footerM(y - M2.m + M2.l); below.push(fl);
    go(see, function () { ln.hidden = !ln.hidden; render(); });
    var closeDrop = function (ev) { if (!document.body.contains(ln.n)) { document.removeEventListener("click", closeDrop, true); return; } if (!ln.hidden && !ln.n.contains(ev.target) && !see.n.contains(ev.target)) { ln.hidden = true; render(); } };
    document.addEventListener("click", closeDrop, true);
  }
  /* phone product page: photo (3:4, swipe), name + price, collection + add to cart, description, specs / care / policies */
  function pdpM(id) {
    var p = C.products[id], M2 = SYS.m, D = SYS.d, isD = mode === "d", cl = collOf(p);
    var keep = isD ? byText(/reach out to inquire/)[0] : null;
    nodes.forEach(function (nd) { nd.hidden = true; }); cum = cum.map(function () { return 0; });   // built page: plain scrolling
    if (keep) { keep.hidden = false; keep.pin = true; go(keep, function () { nav("contact"); }); }
    $("#crumb").style.display = "none";
    /* desktop: split page. Photo (and its dots) fixed on the right, the text column on the left scrolls. Phone: one column. */
    var W = isD ? 472 : 362, H = W * 4 / 3, imgs = p.images;
    var ix = isD ? D.right - W : 20, iy = isD ? D.menuTop : M2.logoBot + ST() + M2.m;
    var im = mImg(imgs[0], ix, iy, W, H); im.pin = isD;
    var dots = mText(imgs.map(function (s, k) { return '<span data-k="' + k + '" style="opacity:' + (k ? .3 : 1) + '">•</span>'; }).join("&nbsp;&nbsp;&nbsp;"), ix + W / 2 - 100, iy + H + 12, 200, { s: 13, lh: 16, align: "center" }); dots.pin = isD;
    var y = iy + H + 12;
    var i = 0, setI = function (n) { i = (n + imgs.length) % imgs.length; im.n.firstChild.src = IMG + imgs[i]; $$("span", dots.n).forEach(function (d, k) { d.style.opacity = k === i ? 1 : .3; }); };
    var x0 = null;
    im.n.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    im.n.addEventListener("touchend", function (e) { if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 30) setI(i + (dx < 0 ? 1 : -1)); x0 = null; });
    go(im, function () { setI(i + 1); });
    $$("span", dots.n).forEach(function (d) { d.style.cursor = "pointer"; d.addEventListener("click", function (ev) { ev.stopPropagation(); setI(+d.dataset.k); }); });
    var L0 = isD ? D.bodyX : 20, R0 = isD ? D.bodyX + D.bodyW : 382;
    y = isD ? D.menuBot + D.l : y + 16 + 16;
    var nm = mText("the " + p.name, L0, y, 200, { s: 18, lh: 24 });
    var pr = mText("$" + p.price, R0 - 120, y + 3, 120, { s: 15 }); pr.n.style.textAlign = "right";
    y += 24;
    var co = mText('<a class="go" data-to="' + cl.to + '">' + cl.label + "</a>", L0, y + 2, 200, { s: 13, lh: 19.5, caps: 1 });
    if (p.soldOut) { var so = mText("<i>sold out</i>", R0 - 120, y + 2, 120, { s: 13, lh: 19.5 }); so.n.style.textAlign = "right"; }
    else {
      var btn = mText("ADD TO CART", R0 - 86, y, 86, { s: 12, lh: 22, align: "center" }); btn.n.classList.add("atc");
      go(btn, function () { cartAdd(id); });
    }
    y += 24 + (isD ? D.m : M2.l);
    var x = isD ? D.bodyX : (402 - M2.bodyW) / 2;
    var d = mText(p.desc, x, y, M2.bodyW, { s: 13, lh: 19.5, align: "justify" }); y += d.n.offsetHeight + M2.m;
    var specs = p.specs.map(function (l) { return l || "&nbsp;"; }).join("<br>");
    var acc = mText('<div class="acc"><a class="go" data-acc="0">SPECS</a><div class="accb"><div><p>' + specs + '</p></div></div><a class="go" data-acc="1">CARE</a><div class="accb"><div><p>' + p.care + '</p></div></div></div>', x, y, M2.bodyW, { s: 13, lh: 19.5 });
    var fl = isD ? { push: 0 } : footerM(y + acc.n.offsetHeight + M2.l), h0 = acc.n.offsetHeight;
    var bodies = $$(".accb", acc.n);
    $$("[data-acc]", acc.n).forEach(function (a) { a.addEventListener("click", function (ev) {
      ev.stopPropagation(); var k = +a.dataset.acc, open = !bodies[k].classList.contains("open");
      bodies.forEach(function (b, j) { b.classList.toggle("open", j === k && open); });
    }); });
    var ro = new ResizeObserver(function () { if (!document.body.contains(acc.n)) { ro.disconnect(); return; } fl.push = Math.max(0, acc.n.offsetHeight - h0); nodes.forEach(function (nd) { if (nd.e.key === "T:footcap") nd.push = fl.push; }); fixEnd(); render(); });   // only what sits under the accordion moves
    ro.observe(acc.n);
    if (p.collection.indexOf("partner:") === 0) { var pt = C.partners.filter(function (q) { return "partner:" + q.handle === p.collection; })[0]; if (pt) { document.documentElement.style.setProperty("--pc", pt.color); document.body.classList.add("pborder"); } }
  }
  /* header arrows (‹ › ×) next to the logo: case studies on the phone */
  var cnav = document.createElement("div"); cnav.id = "casenav"; chrome.appendChild(cnav);
  var chev = function (d) { return '<svg viewBox="0 0 14 24" width="14" height="24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="' + d + '"/></svg>'; };
  cnav.innerHTML = '<button type="button" data-a="prev" aria-label="Previous">' + chev("M12 2 2 12l10 10") + '</button><button type="button" data-a="next" aria-label="Next">' + chev("M2 2l10 10L2 22") + '</button><button type="button" data-a="close" aria-label="Close"><svg viewBox="0 0 22 22" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M2 2l18 18M20 2 2 20"/></svg></button>';
  var cnavFn = {};
  $$("button", cnav).forEach(function (b) { b.addEventListener("click", function (ev) { ev.stopPropagation(); var f = cnavFn[b.dataset.a]; if (f) f(); }); });
  function caseNav(fns, noClose) {
    cnavFn = fns || {}; cnav.style.display = fns ? "flex" : "none";
    $("[data-a=close]", cnav).style.display = fns && fns.close ? "" : "none";
    cnav.style.transform = "translate(" + (382 + EX - (fns && fns.close ? 92 : 56)) + "px," + (SYS.m.logoBot - 25 + ST()) + "px)";
  }
  /* collection lists: new labels; a list that gains a line pushes what sits right under it */
  function relabel(h) {
    if (!h) return h;
    h = h.replace(/002 - OUTONO 2026/g, "002 - OUTONO ‘26").replace(/001 - PRIMAVERA 2026/g, "001 - PRIMAVERA ‘26").replace(/JCVD x AREWÀ/g, "Arewà Basit").replace(/^PARTNER PRODUCTS<br>(?=Arewà)/, "");
    if (/^(<[^>]+>)*002 - OUTONO ‘26/.test(h) && /<br>/.test(h)) h = "003 - INVERNO ‘26<br>" + h;   // lists only
    return h;
  }
  function relabelPush() {
    nodes.forEach(function (nd) {
      if (nd.e.k !== "text" || !/OUTONO 2026<br>|^002 - OUTONO 2026/.test(nd.e.html || "") || nd.hidden) return;
      var g = nd.e.f[0].g, bot = g.y + (g.h || 0);
      nodes.forEach(function (o) { if (o === nd || o.e.k !== "text") return; var h = o.e.f[0].g; if (Math.abs(h.x - g.x) < 8 && h.y >= bot - 2 && h.y < bot + 60) o.push = (o.push || 0) + (nd.e.lh || 23); });
    });
  }
  /* type scale: Title 18, Body 15, Label 13, Small 12 (Home keeps its own sizes) */
  function typeSize(s) { return s >= 16.5 ? 18 : s >= 14 ? 15 : s >= 12.5 ? 13 : 12; }
  /* landing pages: left text column starts at the same line on every page, paragraphs equally spaced */
  function restack() {
    if (mode === "m") return flowM();
    var bal = nodes.filter(function (nd) { return nd.e.botal; });
    if (!bal.length) return;
    bal.forEach(function (nd) { nd.wfix = nd.e.botw; nd.n.style.width = nd.e.botw + "px"; });
    bal.sort(function (a, b) { return a.e.f[0].g.y - b.e.f[0].g.y; });
    var yy = 655;
    if (bal.some(function (nd) { return nd.e.fitstart; })) {      // Products: "explore collections" must be fully visible on the first screen
      var tot = 0; bal.forEach(function (nd, i) { tot += nd.n.offsetHeight + (i ? 0.6 * (nd.e.lh || 20) : 0); });
      yy = Math.min(655, 792 - tot);
    }
    bal.forEach(function (nd, i) { nd.dy = yy - nd.e.f[0].g.y;
      if (nd.e.endTop !== undefined) nd.e.f.forEach(function (f, k) { if (k > 0) f.g = Object.assign({}, f.g, { y: nd.e.endTop - nd.dy }); });
      yy += nd.n.offsetHeight + 0.6 * (nd.e.lh || 20); nd.oneLine = nd.n.offsetHeight < 1.6 * (nd.e.lh || 20); nd.prevNode = bal[i - 1]; });
  }
  /* phone: rewritten paragraphs keep their spacing; everything under them moves down by the extra length */
  /* group nodes into sections: boxes that overlap or sit within `thr` of each other vertically, at frame k (display y incl. dy) */
  function clusters(list, k, thr) {
    var items = list.map(function (nd) { var r = rectOf(nd.e, nd.e.f[Math.min(k, nd.e.f.length - 1)].g), h = nd.e.k === "text" ? Math.max(r[3] - r[1], nd.n.offsetHeight) : r[3] - r[1], t = r[1] + (k === 0 ? (nd.dy || 0) : 0); return { nd: nd, t: t, b: t + h }; }).sort(function (a, b) { return a.t - b.t; });
    var out = [];
    items.forEach(function (it) { var c = out[out.length - 1]; if (c && it.t <= c.bot + thr) { c.nodes.push(it.nd); c.bot = Math.max(c.bot, it.b); } else out.push({ nodes: [it.nd], top: it.t, bot: it.b }); });
    return out;
  }
  /* desktop: the right column is one stack (hero, then each section one large step under the last) that scrolls 1:1;
     the paragraph on the left stays pinned as before */
  function stackD(im, cap, rest, top, H, Y) {
    var L = cum.length - 1, cl = clusters(rest, L, 40);
    var y = top + H + Y.l, tgt = [];
    cl.forEach(function (c) { tgt.push(y); y += (c.bot - c.top) + Y.l; });
    var last = cl[cl.length - 1], endTop = 233;                  // the last section rests where it was drawn to rest
    var travel = Math.max(cum[1] || 0, tgt[tgt.length - 1] - endTop);
    var old = cum.slice(); cum = cum.map(function (v) { return old[L] ? v * travel / old[L] : v; });
    function moveY(nd, yk) { nd.e = Object.assign({}, nd.e, { noanchor: 1, f: nd.e.f.map(function (f, k) { var r = rectOf(nd.e, f.g), d = yk(k) - r[1], g = Object.assign({}, f.g);
      if (g.c0 !== undefined) { g.c1 += d; g.c3 += d; } if (g.cy !== undefined) g.cy += d; if (g.y !== undefined) g.y += d; return { o: f.o, g: g }; }) }); nd.dy = 0; nd.push = 0; nd.anchor = null; }
    moveY(im, function (k) { return top - cum[k]; });
    if (cap) moveY(cap, function (k) { return top - cum[k]; });
    cl.forEach(function (c, i) { c.nodes.forEach(function (nd) { var r = rectOf(nd.e, nd.e.f[L].g), off = r[1] - c.top; moveY(nd, function (k) { return tgt[i] + off - cum[k]; }); }); });
  }
  function flowM() {
    var fl = nodes.filter(function (nd) { return nd.e.flow; }).sort(function (a, b) { return a.e.f[0].g.y - b.e.f[0].g.y; });
    if (!fl.length) return;
    var y0 = fl[0].e.f[0].g.y, yy = y0, oldBot = 0;
    fl.forEach(function (nd) { nd.n.style.width = nd.e.f[0].g.w + "px"; nd.n.style.whiteSpace = "normal";
      oldBot = Math.max(oldBot, nd.e.f[0].g.y + (nd.e.f[0].g.h || 0)); nd.dy = yy - nd.e.f[0].g.y; yy += nd.n.offsetHeight + (nd.e.lh || 20); });
    var d = (yy - (fl[fl.length - 1].e.lh || 20)) - oldBot;
    nodes.forEach(function (nd) { if (nd.e.flow || nd.e.k === "marquee" && false) return; var r = rectOf(nd.e, nd.e.f[0].g); if (r[1] > y0 + 4) nd.dy = (nd.dy || 0) + d; });
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (sc && LAND[scName] && window.scrollY < 5) mount(scName); else if (sc) { restack(); render(); } });
  function rectOf(e, g) {
    if (e.k === "img") return g.c0 !== undefined ? [g.c0, g.c1, g.c2, g.c3] : [g.cx - g.w / 2, g.cy - g.h / 2, g.cx + g.w / 2, g.cy + g.h / 2];
    return [g.x, g.y, g.x + (g.w || 0), g.y + (g.h || 0)];
  }
  function gapOf(a, b, hx, vy) {
    var ox = Math.min(a[2], b[2]) - Math.max(a[0], b[0]), oy = Math.min(a[3], b[3]) - Math.max(a[1], b[1]);
    var gx = Math.max(a[0], b[0]) - Math.min(a[2], b[2]), gy = Math.max(a[1], b[1]) - Math.min(a[3], b[3]);
    if (ox > 0 && gy < vy) return Math.max(0, gy); if (oy > 0 && gx < hx) return Math.max(0, gx); return -1;
  }
  /* wide screens: labels, captions, prices and thumbnails move with the photo they sit next to */
  function anchors() {
    var imgs = nodes.filter(function (nd) { return nd.e.k === "img"; });
    nodes.forEach(function (nd) {
      nd.anchor = null; if (nd.e.k === "marquee" || nd.e.noanchor) return;
      var best = null, bg = 1e9, f = nd.e.f;
      imgs.forEach(function (im) {
        if (im === nd) return;
        if (nd.e.k === "img") { var a = f[0].g, b = im.e.f[0].g; if (b.w * b.h < 2.2 * a.w * a.h) return; }
        for (var i = 0; i < f.length; i++) if (f[i].o > 0.5 && im.e.f[i].o > 0.5) {
          var gp = gapOf(rectOf(nd.e, f[i].g), rectOf(im.e, im.e.f[i].g), 120, 40); if (gp >= 0 && gp < bg) { bg = gp; best = im; } break;
        }
      });
      nd.anchor = best;
    });
    nodes.forEach(function (nd) { var a = nd.anchor, k = 0; while (a && a.anchor && k++ < 6) a = a.anchor; nd.anchor = a; });
    nodes.forEach(function (nd) { if (nd.e.capimg) nd.anchor = imgs.filter(function (im) { return im.e.src === nd.e.capimg; })[0] || nd.anchor; });   // hero captions always travel with their photo
  }
  function apply(nd, g, o) {
    var e = nd.e, n = nd.n;
    g = Object.assign({}, g);
    var ndy = nd.dy || 0;
    var dx = (nd.dx || 0) + (nd.hx || 0), dy = ndy + (nd.push || 0) - (nd.pin ? 0 : SHIFT) + OY;
    if (e.k === "marquee") { if (EX) g.w += EX; }
    else if (dx) { if (g.cx !== undefined) { g.cx += dx; if (g.c0 !== undefined) { g.c0 += dx; g.c2 += dx; } } else g.x += dx; }
    if (dy) ["y", "cy", "c1", "c3"].forEach(function (k) { if (g[k] !== undefined) g[k] += dy; });
    if (e.k === "img") {
      var cl = n.classList.contains("clip"), c0 = cl ? (g.c0 !== undefined ? g.c0 : g.cx - g.w / 2) : 0, c1 = cl ? (g.c1 !== undefined ? g.c1 : g.cy - g.h / 2) : 0;
      if (cl) { var cw = g.c0 !== undefined ? g.c2 - g.c0 : g.w, chh = g.c0 !== undefined ? g.c3 - g.c1 : g.h; n.style.width = cw + "px"; n.style.height = chh + "px"; }
      n.style.transform = "translate(" + c0 + "px," + c1 + "px)";
      var im = n.firstChild; im.style.width = g.w + "px"; im.style.height = g.h + "px";
      im.style.transform = "translate(" + (g.cx - g.w / 2 - c0) + "px," + (g.cy - g.h / 2 - c1) + "px) rotate(" + (g.r || 0) + "deg)" + (e.flip ? " scaleY(-1)" : "");
    } else if (e.k === "vtext") {
      n.style.transform = "translate(" + g.x + "px," + g.y + "px)"; n.style.width = g.w + "px"; n.style.height = g.h + "px"; n.style.lineHeight = g.w + "px";
    } else {
      n.style.transform = "translate(" + g.x + "px," + g.y + "px)";
      n.style.width = (nd.wfix || (e.k === "text" && e.align !== "justify" ? g.w + 1 : g.w)) + "px";
      if (e.k !== "text") n.style.height = g.h + "px";
    }
    if (nd.oneLine && mode === "d") { var yb = (g.y + (n.offsetHeight || 20)), fb = 800 + FB; if (yb > fb) o = 0; }
    n.style.opacity = o;
    n.style.visibility = o < 0.02 ? "hidden" : "visible";
  }

  /* ---------------- scenes ---------------- */
  var cum = [];
  function mount(name, opts) {
    scName = name; sc = S[mode][name]; stateName = null; stateT = 0;
    stage.innerHTML = ""; nodes = []; stripCtl = null; stateHook = function () {}; caseNav(null);
    sc.els.forEach(function (e) { var n = build(e); stage.appendChild(n); nodes.push({ e: e, n: n }); });
    cum = [0]; (sc.dist || []).forEach(function (d) { cum.push(cum[cum.length - 1] + d); });
    anchors();
    if (name === "home" && mode === "d") nodes.forEach(function (nd) {   // desktop: the sentence runs on two lines, bottom edge kept where it was
      if (!/^JCVD is a sustainable/.test(nd.e.txt || "")) return;
      var g = nd.e.f[0].g; nd.wfix = 400; nd.n.style.width = "400px"; nd.n.style.whiteSpace = "normal"; nd.n.style.textWrap = "balance"; nd.n.style.textAlign = "left"; nd.n.classList.remove("j");
      nd.dy = g.y + g.h - nd.n.offsetHeight - g.y;
    });
    if (name === "home" && mode === "m") nodes.forEach(function (nd) { nd.dy = HOME_SENT !== null && nd.e.k === "text" ? HOME_SENT - nd.e.f[0].g.y : HOMEDY; });
    if (LAND[name]) landing(name); else restack();
    if (false) { bal.forEach(function (nd) { nd.wfix = nd.e.botw; nd.n.style.width = nd.e.botw + "px"; });
      bal.sort(function (a, b) { return a.e.f[0].g.y - b.e.f[0].g.y; });
      var yy = null, bot = 0;                       // restack at the new width, one blank line apart
      bal.forEach(function (nd) { var y0 = nd.e.f[0].g.y; if (yy === null) yy = y0; nd.dy = yy - y0; yy += nd.n.offsetHeight + 0.6 * (nd.e.lh || 20); if (y0 < 860) bot = yy - 0.6 * (nd.e.lh || 20); });
      var top0 = bal[0].e.f[0].g.y + bal[0].dy, sh = 655 - top0;   // every landing page: main text starts at the same line, the rest is read by scrolling
      bal.forEach(function (nd) { nd.dy += sh; }); }
    nodes.forEach(function (nd) { if (nd.e.capbot) { nd.n.style.width = nd.e.f[0].g.w + "px"; nd.dy = nd.e.capbot - (nd.e.f[0].g.y + nd.n.offsetHeight); } });   // hero captions end just above the photo
    bind(name, opts || {});
    if (mode === "m") phoneFooter();
    relabelPush();
    // whatever the screen height, the page scrolls until its last element (footer) is fully in view
    var last = 0;
    nodes.forEach(function (nd) { var f = nd.e.f[nd.e.f.length - 1]; if (f.o > 0.5 && !nd.hidden && nd.e.k !== "marquee") last = Math.max(last, rectOf(nd.e, f.g)[3] + (nd.dy || 0) + (nd.e.k === "text" ? 6 : 0)); });
    EXTRA = name === "home" ? 0 : Math.max(0, last + 24 - window.innerHeight / scale);
    window.__cum = cum; window.__scale = scale; window.__extra = EXTRA;
    $("#spacer").style.height = (window.innerHeight + (cum[cum.length - 1] + EXTRA) * scale) + "px";
    fixEnd();
    window.scrollTo(0, opts && opts.scrollEnd ? document.body.scrollHeight : 0);
    render();
    if (opts && opts.toCases) toCases(opts.caseIdx || 0);
  }
  /* phone: the page scrolls exactly until the footer sits 24 above the bottom edge (phone pages scroll uniformly) */
  function fixEnd() {
    var built = /^pdp/.test(scName);
    if ((mode !== "m" && !built) || scName === "home") return;
    var bot = 0;
    nodes.forEach(function (nd) { if (nd.hidden || nd.pin || nd.e.k === "marquee" || nd.e.f[0].o < 0.5) return; bot = Math.max(bot, botOf(nd)); });
    var travel = mode === "d" ? Math.max(0, bot + 100 - (800 + FB)) : Math.max(0, bot + 24 - viewH() / scale);   // desktop: text never rests under the footer fade
    $("#spacer").style.height = (window.innerHeight + travel * scale) + "px";
  }
  function scrollPose() {
    var p = window.scrollY / scale, n = sc.n, k = 0;
    while (k < n - 2 && p > cum[k + 1]) k++;
    var t = n > 1 ? Math.max(0, Math.min(1, (p - cum[k]) / (cum[k + 1] - cum[k] || 1))) : 0;
    return { k: k, t: t };
  }
  function render() {
    if (!sc) return;
    var ps = scrollPose();
    SHIFT = Math.max(0, window.scrollY / scale - cum[cum.length - 1]);
    nodes.forEach(function (nd) {
      var f = nd.e.f, a = f[ps.k], b = f[Math.min(ps.k + 1, f.length - 1)];
      var g = lerpG(a.g, b.g, ps.t), o = lerp(a.o, b.o, ps.t);
      var st = stateName && (nd.st || nd.e.st)[stateName];
      if (st) { g = lerpG(g, st.g, stateT); o = lerp(o, st.o, stateT); }
      if (nd.hidden) o = 0;
      if (nd.crumbM) o *= Math.max(0, 1 - Math.max(window.scrollY / scale / 40, stateT * 2));   // phone breadcrumb clears away as the photo rises
      nd._g = g; nd._o = o;
      if (!nd.anchor) nd.dx = !EX || nd.e.k === "marquee" ? 0 : nd.e.ralign ? RDX() : spread(cxOf(g));
    });
    nodes.forEach(function (nd) {        // About: the last paragraph follows the others at an even gap, then stays put at the top
      if (!nd.e.lockLast || !nd.prevNode) return; var p = nd.prevNode;
      var fy = p._g.y + (p.dy || 0) + p.n.offsetHeight + (nd.e.lh || 20);
      nd._g = Object.assign({}, nd._g, { y: Math.max(fy, SYS.d.menuBot + SYS.d.m) - (nd.dy || 0) }); nd._o = 1;   // settles on the body line
    });
    nodes.forEach(function (nd) { if (nd.anchor) nd.dx = nd.anchor.dx; apply(nd, nd._g, nd._o); });
    onScrollChrome(ps);
  }
  window.addEventListener("scroll", function () { requestAnimationFrame(render); }, { passive: true });

  function animateState(name) {
    var from = stateT, to, t0 = performance.now(), dur = 650;
    if (name === stateName && stateT > 0.5) { to = 0; }
    else if (stateName && name !== stateName && stateT > 0) { // switch state: drop old first
      var old = stateName; stateName = old; return tween(stateT, 0, 380, function () { stateName = name; stateHook(name); tween(0, 1, dur); });
    } else { if (stateName !== name) stateHook(name); stateName = name; to = 1; }
    tween(from, to, dur);
  }
  var stateHook = function () {};
  function tween(a, b, dur, done) {
    var t0 = performance.now();
    (function step(now) {
      var p = Math.min(1, (now - t0) / dur), e = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      stateT = a + (b - a) * e; render();
      if (p < 1) requestAnimationFrame(step); else { if (b === 0) stateName = null; if (done) done(); }
    })(t0);
  }

  /* ---------------- helpers for binding ---------------- */
  function els(pred) { return nodes.filter(function (nd) { return pred(nd.e); }); }
  function byText(re) { return els(function (e) { return (e.k === "text" || e.k === "vtext") && re.test(e.txt || ""); }); }
  function byOid(o) { return els(function (e) { return e.k === "img" && e.oid === o; }); }
  function go(nd, fn) { if (!nd) return; nd.n.classList.add("go"); nd.n.addEventListener("click", function (ev) { ev.stopPropagation(); fn(ev); });
    if (nd.n.tagName !== "A" && nd.n.tagName !== "BUTTON") { nd.n.setAttribute("role", "button"); nd.n.tabIndex = 0;
      if (!nd.n.getAttribute("aria-label")) { var lab = (nd.n.textContent || "").trim() || (nd.e && nd.e.alt) || ""; if (lab) nd.n.setAttribute("aria-label", lab.replace(/\s+/g, " ").slice(0, 80)); }
      nd.n.addEventListener("keydown", function (ev) { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); nd.n.click(); } }); } }
  /* links written into text (SPECS / CARE / data-to) without an href still take keyboard focus */
  document.addEventListener("keydown", function (ev) { var t = ev.target; if ((ev.key === "Enter" || ev.key === " ") && t && t.tagName === "A" && !t.hasAttribute("href")) { ev.preventDefault(); t.click(); } });
  new MutationObserver(function () { $$("a:not([href]):not([tabindex])").forEach(function (a) { a.tabIndex = 0; a.setAttribute("role", "button"); }); }).observe(document.body, { childList: true, subtree: true });
  function linkLines(nd, map) {
    var parts = nd.n.innerHTML.split("<br>");
    nd.n.innerHTML = parts.map(function (h) {
      var plain = h.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").trim();
      for (var k in map) if (plain.toUpperCase() === k.toUpperCase()) return '<a class="go" data-to="' + map[k] + '">' + h + "</a>";
      return h;
    }).join("<br>");
    $$("[data-to]", nd.n).forEach(function (a) { a.addEventListener("click", function (ev) { ev.stopPropagation(); nav(a.dataset.to); }); });
    markCurrent(nd.n);
  }
  /* clean URLs (jcvd.com.br/products) on the real site; #products inside the claude.ai preview, where paths can't be served */
  var PATHS = document.documentElement.getAttribute("data-routing") === "path";
  function here_() { return PATHS ? location.pathname.replace(/^\/+|\/+$/g, "") || "home" : location.hash.replace(/^#/, ""); }
  if (PATHS && location.pathname.length > 1 && /\/$/.test(location.pathname)) history.replaceState(null, "", location.pathname.replace(/\/+$/, "") + location.search);
  if (PATHS && location.hash.length > 1) history.replaceState(null, "", "/" + (location.hash.slice(1) === "home" ? "" : location.hash.slice(1)));   // old #links keep working
  function markCurrent(root) {
    var h = here_(), here = h;
    if (/^product-/.test(h)) { var p = C.products[h.slice(8)]; if (p) here = collOf(p).to; }
    $$("[data-to]", root).forEach(function (a) { a.style.fontWeight = a.dataset.to === here ? 400 : 300; a.style.color = a.dataset.to === here ? "#111" : ""; });
  }
  function nav(to) {
    if (to.indexOf("http") === 0 || to.indexOf("mailto") === 0) { window.open(to, "_blank", "noopener"); return; }
    if (to.indexOf("state:") === 0) { animateState(to.slice(6)); return; }
    if (PATHS) { var u = "/" + (to === "home" ? "" : to); if (u !== location.pathname) { history.pushState(null, "", u); go_(true); } return; }
    location.hash = to;
  }
  var COLL_LINKS = { "003 - INVERNO ‘26": "c-inverno-2026", "002 - OUTONO ‘26": "c-outono-2026", "001 - PRIMAVERA ‘26": "c-primavera-2026", "Arewà Basit": "p-arewa", "002 - OUTONO 2026": "c-outono-2026", "001 - PRIMAVERA 2026": "c-primavera-2026", "001 PRIMAVERA 2026": "c-primavera-2026", "PARTNER PRODUCTS": "partners", "JCVD x AREWÀ": "p-arewa", "eie.": "p-eie", "JCVD PRODUCTS": "products", "POLICIES": "policies", "PRODUCTS": "products", "INSTAGRAM - EMAIL": "", "EXPLORE PROJECTS": "projects" };
  function linkAllMenus() {
    els(function (e) { return e.k === "text"; }).forEach(function (nd) {
      var t = nd.e.txt;
      if (/OUTONO|PRIMAVERA|INVERNO|PARTNER PRODUCTS|AREWÀ|Arewà Basit|eie\.|JCVD PRODUCTS/.test(t) && !/drop built|copy|Exclusive|bag in|Autumn 2026|Artistic/.test(t)) linkLines(nd, COLL_LINKS);
      if (/^INSTAGRAM/.test(t)) {
        nd.n.innerHTML = '<a class="go" href="' + C.links.instagram + '" target="_blank" rel="noopener">INSTAGRAM</a> <span>' + (/ - /.test(t) ? "-" : "") + '</span> <a class="go" href="mailto:' + C.links.email + '">EMAIL</a>';
        nd.n.style.whiteSpace = "pre";
      }
      if (/^explore projects$/i.test(t)) go(nd, function () { nav("projects"); });
      if (/^explore products$/i.test(t)) go(nd, function () { nav("products"); });
    });
    els(function (e) { return e.k === "flogo"; }).forEach(function (nd) { go(nd, function () { nav("contact"); }); });
  }

  /* ---------------- per-scene behaviour ---------------- */
  function bind(name, o) {
    if (name === "projects" || name === "case" || name === "case2") paperCards();
    linkAllMenus();
    if (name === "about") {
      byText(/^(explore )?(products|projects)$/i).forEach(function (nd) { if (!nd.n.classList.contains("go")) go(nd, function () { nav(/products/i.test(nd.e.txt) ? "products" : "projects"); }); });
      els(function (e) { return e.k === "img"; }).forEach(function (nd) {
        if (nd.e.oid === 180) return;
        var src = nd.e.src; go(nd, function () { nav(nd.e.oid === 358 || nd.e.oid === 266 || nd.e.oid === 260 || nd.e.oid === 280 ? "products" : "projects"); });
      });
      byText(/Bora nessa juntos/).forEach(function (nd) {
        nd.n.innerHTML = nd.n.innerHTML.replace(/Bora nessa juntos\?/, '<a class="go vj" data-to="contact"><u>Bora nessa juntos?</u></a>');
        var a = $(".vj", nd.n); if (a) a.addEventListener("click", function (ev) { ev.stopPropagation(); nav("contact"); });
      });
      byText(/vem junto/).forEach(function (nd) {
        nd.n.innerHTML = nd.n.innerHTML.replace(/então vem junto\.?/, '<a class="go vj" data-to="contact"><u>então vem junto.</u></a>');
        var a = $(".vj", nd.n); if (a) a.addEventListener("click", function (ev) { ev.stopPropagation(); nav("contact"); });
      });
      marquee();
      if (mode === "d") { byOid(384).forEach(function (nd) { nd.n.firstChild.src = IMG + "hero-projects.jpg"; nd.n.firstChild.style.objectFit = "cover"; });
        byOid(358).forEach(function (nd) { nd.n.firstChild.src = IMG + "hero-products.jpg"; nd.n.firstChild.style.objectFit = "cover"; });
        byText(/^explore (projects|products)$/i).forEach(function (nd) { nd.n.innerHTML = nd.n.textContent; }); }
    }
    if (name === "projects") {
      byText(/Request access/).forEach(function (nd) { nd.n.innerHTML = nd.n.innerHTML.replace(/(<b>)?Request access(<\/b>)?/, '<a class="go req"><u>Request access</u></a>'); $(".req", nd.n).addEventListener("click", catalogForm); });
      byText(/Bora conversar/i).forEach(function (nd) { nd.n.innerHTML = nd.n.innerHTML.replace(/(<b>)?Bora conversar\.?(<\/b>)?/i, '<a class="go" data-to="contact"><u>Bora conversar.</u></a>'); $("[data-to]", nd.n).addEventListener("click", function () { nav("contact"); }); });
      reachCard();
      carousel(byOid(54)[0]);
      var covers = mode === "d" ? [44, 204, 36] : [44, 256];
      if (mode === "d") covers.forEach(function (oid, i) { byOid(oid).forEach(function (nd) { if (C.cases[i]) { nd.n.firstChild.src = IMG + C.cases[i].cover; nd.n.firstChild.style.objectFit = "cover"; } }); });
      covers.forEach(function (oid, i) { byOid(oid).forEach(function (nd) { go(nd, function () { nav("case-" + i); }); }); });
      byText(/CASE STUDY|CFDA|Connecting top/).forEach(function (nd) { go(nd, function () { var m = /CASE STUDY (\d)/.exec(nd.e.txt); nav("case-" + (m ? m[1] - 1 : 0)); }); });
      caseStrip();
    }
    if (name === "case" || name === "case2") { if (mode === "m") { lastCase = o.i || 0; caseDetailM(o.i || 0); } else bindCase(o.i || 0); }
    if (name === "products") {
      byText(/explore collections/i).forEach(function (nd) { if (!nd.n.classList.contains("go")) go(nd, function () { window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }); }); });

    }
    if (name === "collection" || name === "partner") {
      var map = { 342: "carta-chocolate", 364: "volta-black", 324: "volta-black", 244: "carta-olive", 208: "archive-beanie", 316: "archive-drive" };
      els(function (e) { return e.k === "img"; }).forEach(function (nd) { if (map[nd.e.oid]) go(nd, function () { nav("product-" + map[nd.e.oid]); }); });
      byText(/^the (carta|volta)/).forEach(function (nd) {
        var near = nearestImg(nd); if (near && map[near.e.oid]) go(nd, function () { nav("product-" + map[near.e.oid]); });
      });
      if (o.collection) {
        var col = C.collections.filter(function (c) { return c.handle === o.collection; })[0];
        byText(/This drop built/).forEach(function (nd) { if (col) nd.n.textContent = col.desc; });
        byText(/OUTONO|PRIMAVERA/).forEach(function (nd) { $$("a", nd.n).forEach(function (a) { markCurrent(nd.n); }); });
      }
      if (o.partner) {
        var p = C.partners.filter(function (x) { return x.handle === o.partner; })[0];
        document.documentElement.style.setProperty("--pc", p.color);
        $$(".pframe").forEach(function (f) { f.style.borderColor = p.color; });
        byText(/^X$/).concat(byText(/Arewà Basit/)).forEach(function (nd) { nd.hidden = true; });
        var tag = $("#partnertag"); tag.innerHTML = "<i>x</i>" + (p.logo ? '<img src="' + IMG + p.logo + '" alt="' + p.name + '" style="height:1.15em;width:auto;vertical-align:-0.2em">' : p.name);
        byText(/Exclusive brand|This drop built/).forEach(function (nd) { nd.n.textContent = p.desc; });
        if (!p.pieces.length) els(function (e) { return e.k === "img" || (e.k === "text" && /^the (carta|volta)/.test(e.txt)); }).forEach(function (nd) { nd.hidden = true; });
        if (p.layout && p.layout[mode] && mode === "d") p.layout[mode].forEach(function (it) {
          var ra = mode === "d"; addImg(it, { ralign: ra });
          if (it.label) addText(it.label, it.lx, it.ly, 110, { s: mode === "d" ? 15 : 10, lh: mode === "d" ? 23 : 15, ralign: ra });
        });
      }
    }
    if ((name === "collection" || name === "partner") && mode === "m") collectionM(o);
    if (name === "pdp" || name === "pdp_sold") pdpM(o.product);
    if (name === "e404" && o && o.soon) {   // shop pages before Shopify is connected
      var tx = nodes.filter(function (nd) { return nd.e.k === "text"; }).sort(function (a, b) { return a.e.f[0].g.y - b.e.f[0].g.y; });
      if (tx[0]) tx[0].n.innerHTML = "GOOD THINGS TAKE TIME";
      if (tx[1]) { tx[1].n.innerHTML = 'Our e-commerce is getting built.<br>Meanwhile, see my products on <a href="' + C.links.instagram + '" target="_blank" rel="noopener"><u>Instagram</u></a>.<br><br><a class="go" data-to="products"><u>Back to products</u></a>'; tx[1].n.style.whiteSpace = "nowrap"; wireLinks(tx[1].n); }
    }
    if (name === "contact") {
      byText(/jcvd\.com\.br/).forEach(function (nd) { nd.n.style.userSelect = "text"; });
      byText(/pode vir de zap/).forEach(function (nd) { go(nd, function () { nav(C.links.whatsapp); }); });
      byText(/Impactado/).forEach(function (nd) { nd.n.innerHTML = nd.n.innerHTML.replace(/(<b>)?Impactado\.?(<\/b>)?/, '<a class="go" href="' + C.links.blog + '" target="_blank" rel="noopener"><u>Impactado.</u></a>'); });
      var icons = els(function (e) { return e.k === "icon"; }).sort(function (a, b) { return a.e.f[0].g.x - b.e.f[0].g.x; });
      var dest = [C.links.instagram, C.links.linkedin, C.links.whatsapp];
      icons.forEach(function (nd, i) { go(nd, function () { nav(dest[i]); }); });
      contactM();
    }
  }
  function nearestImg(nd) {
    var g = nd.e.f[0].g, best = null, bd = 1e9;
    els(function (e) { return e.k === "img"; }).forEach(function (m) { var h = m.e.f[0].g, d = Math.hypot(h.cx - (g.x + g.w / 2), h.cy - (g.y + g.h / 2)); if (d < bd) { bd = d; best = m; } });
    return best;
  }

  /* callout cards (catalog, reach out): one sheet of paper lifted off the wall; the coloured offset layers go */
  function paperCards() {
    var bx = els(function (e) { return e.k === "box"; }), white = [];
    bx.forEach(function (nd) {
      if (/232,65,70|144,188,230/.test(nd.e.col)) { nd.hidden = true; return; }
      if (/249,248,246|255,255,255/.test(nd.e.col)) { nd.n.classList.add("paper"); nd.n.style.background = ""; white.push(nd); }
    });
    white.forEach(function (a) { var ra = rectOf(a.e, a.e.f[0].g);     // a sheet drawn inside a bigger sheet: keep only the outer one
      white.forEach(function (b) { if (a === b) return; var rb = rectOf(b.e, b.e.f[0].g);
        if (rb[0] <= ra[0] + 1 && rb[1] <= ra[1] + 1 && rb[2] >= ra[2] - 1 && rb[3] >= ra[3] - 1 && (rb[2] - rb[0]) * (rb[3] - rb[1]) > (ra[2] - ra[0]) * (ra[3] - ra[1])) a.hidden = true; }); });
  }
  /* the reach-out card: desktop sends people to the products; the phone keeps "reach out" and adds an "explore products" card under it (in caseStrip) */
  function reachCard() {
    var t = byText(/REACH OUT NOW|TO EXPLORE A CUSTOM/);
    if (mode !== "d") { t.forEach(function (nd) { go(nd, function () { nav("contact"); }); }); return; }
    t.forEach(function (nd) {
      if (/^REACH/.test(nd.e.txt)) { nd.n.textContent = "EXPLORE PRODUCTS"; nd.dy = (nd.dy || 0) + 9; go(nd, function () { nav("products"); });
        var bx = els(function (e) { return e.k === "box" && /249,248,246/.test(e.col) && e.f[0].g.w < 300; })[0], X = bx ? bx.e.f[0].g.x : 72, W = bx ? bx.e.f[0].g.w : 223;
        nd.e = Object.assign({}, nd.e, { noanchor: 1, f: nd.e.f.map(function (f) { return { o: f.o, g: Object.assign({}, f.g, { x: X, w: W }) }; }) }); nd.anchor = null;
        nd.wfix = W; nd.n.style.width = W + "px"; nd.n.style.textAlign = "center"; }
      else nd.hidden = true;
    });
    els(function (e) { return e.k === "box" && /249,248,246/.test(e.col) && e.f[0].g.w < 300; }).forEach(function (nd) { go(nd, function () { nav("products"); }); });
  }
  /* catalog request form */
  function catalogForm() {
    var box = els(function (e) { return e.k === "box" && /249,248,246|255,255,255/.test(e.col); }).sort(function (a, b) { return b.e.f[0].g.w * b.e.f[0].g.h - a.e.f[0].g.w * a.e.f[0].g.h; })[0]; if (!box) return;
    var texts = byText(/Innovative biomaterials|fashion and interiors|Request access|Produz algo legal/);
    texts.forEach(function (nd) { nd.hidden = true; });
    var g = currentG(box);
    var f = document.createElement("form"); f.className = "catform"; f.noValidate = true;
    f.style.cssText = "left:18px;top:0;right:18px;bottom:0;font-size:" + (mode === "d" ? 14 : 10) + "px;gap:" + (mode === "d" ? 14 : 10) + "px";
    f.innerHTML = '<label for="f-name">Name <input id="f-name" autocomplete="name"></label><label for="f-company">Company <input id="f-company" autocomplete="organization"></label><label for="f-email">Email <input id="f-email" type="email" autocomplete="email"></label><input class="hp" tabindex="-1" aria-hidden="true" name="website"><button class="send" type="submit">SEND ME THE CATALOG →</button><p class="err" hidden></p>';
    var cx = document.createElement("button"); cx.type = "button"; cx.className = "catx"; cx.setAttribute("aria-label", "Close"); cx.textContent = "×";
    cx.addEventListener("click", function (ev) { ev.preventDefault(); ev.stopPropagation(); f.remove(); texts.forEach(function (nd) { nd.hidden = false; }); render(); });
    f.appendChild(cx);
    box.n.appendChild(f); render(); $("#f-name").focus({ preventScroll: true });
    f.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var n = $("#f-name").value.trim(), m = $("#f-email").value.trim();
      if (!n || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(m)) { var er = $(".err", f); er.hidden = false; er.textContent = "Add your name and a valid email."; return; }
      if ($(".hp", f).value) return;   // bots fill the hidden field
      var btn = $(".send", f); btn.disabled = true; btn.textContent = "sending…";
      var done = function () { f.outerHTML = '<div class="catdone" style="inset:0">Catalog sent! Check your inbox :)</div>'; };
      var url = C.links.catalogEndpoint;
      if (!url) { done(); return; }     // preview: no endpoint yet
      /* Google Apps Script web app (JCVD catalog requests sheet): logs the row, emails the catalog, notifies João */
      fetch(url, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ name: n, company: $("#f-company").value.trim(), email: m }) })
        .then(done, function () { btn.disabled = false; btn.textContent = "SEND ME THE CATALOG →"; var er = $(".err", f); er.hidden = false; er.textContent = "Couldn’t send. Try again, or write to " + C.links.email + "."; });
    });
  }
  function currentG(nd) {
    var ps = scrollPose(), f = nd.e.f, g = Object.assign({}, lerpG(f[ps.k].g, f[Math.min(ps.k + 1, f.length - 1)].g, ps.t)); if (g.x !== undefined) g.x += (nd.dx || 0) + (nd.hx || 0); if (g.y !== undefined) g.y += OY - SHIFT + (nd.dy || 0); return g;
  }
  /* catalog carousel (3 s) + lightbox */
  var carTimer;
  function carousel(nd) {
    clearInterval(carTimer); if (!nd) return;
    var list = C.catalogImages, i = 0, im = nd.n.firstChild;
    im.src = IMG + list[0]; im.style.objectFit = "cover";
    var swap = function (n) { i = (n + list.length) % list.length; im.style.opacity = 0; setTimeout(function () { im.src = IMG + list[i]; im.style.objectFit = "cover"; im.style.opacity = 1; }, 450); };
    carTimer = setInterval(function () { swap(i + 1); }, 3000);
    nd.n.classList.add("carouselimg");
    go(nd, function () { lightbox(list.map(function (s) { return IMG + s; }), i); });
    var x0 = null;
    nd.n.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    nd.n.addEventListener("touchend", function (e) { if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) { swap(i + (dx < 0 ? 1 : -1)); e.preventDefault(); } x0 = null; });
    var arrow = document.createElement("span"); arrow.className = "carr"; arrow.textContent = "→";
    nd.n.appendChild(arrow); nd.n.classList.add("carouselwrap");
    arrow.style.right = "14px"; arrow.style.top = "calc(50% - 17px)";
    arrow.addEventListener("click", function (e) { e.stopPropagation(); swap(i + 1); });
  }
  function lightbox(list, i) {
    var lb = document.createElement("div"); lb.id = "lightbox";
    var draw = function () { lb.innerHTML = '<img src="' + list[i] + '" alt=""><div class="ctl"><button type="button" data-a="-1">←</button><button type="button" data-a="x">×</button><button type="button" data-a="1">→</button></div>'; };
    draw(); document.body.appendChild(lb);
    lb.onclick = function (e) { var a = e.target.dataset.a; if (a === "x" || e.target === lb) lb.remove(); else if (a) { i = (i + +a + list.length) % list.length; draw(); } };
  }
  /* past-work logos: sized by area, not height, so wide wordmarks and tall stacked marks read the same; heavy marks a touch smaller */
  var LOGO = { "logo-shahi.webp": [3.39, .72], "logo-carhartt.webp": [5.44, .85], "logo-patagonia.webp": [5.06, .85], "logo-lii.webp": [1.52, .8],
    "logo-edl.webp": [1.14, 1], "logo-cfda.webp": [2.7, 1], "logo-novakaeru.webp": [7.0, 1.1], "logo-blab.webp": [0.585, 1.1], "logo-amadeu.webp": [1.24, 1.15] };
  function logoH(src) { var L = LOGO[src] || [2.6, 1]; return Math.min(62, 34 * Math.sqrt(2.6 / L[0]) * L[1]).toFixed(1); }
  /* past-work marquee */
  function marquee() {
    var m = $(".marq"); if (!m) return; var tr = $(".track", m), x = null, base = 0.45, v = base, drag = null, moved = 0;
    var pw = byText(/^past work$/)[0], started = false, visT = 0, phase = 1, L = 0, Rr = null, t2 = 0;
    m.style.touchAction = "pan-y";
    m.addEventListener("pointerdown", function (e) { drag = { lx: e.clientX, t: performance.now() }; moved = 0; v = 0; started = true; try { m.setPointerCapture(e.pointerId); } catch (er) {} });
    m.addEventListener("pointermove", function (e) {
      if (!drag) return; var now = performance.now(), dx = (e.clientX - drag.lx) / scale;
      x += dx; moved += Math.abs(dx); v = dx / Math.max(1, (now - drag.t) / 16.7); drag.lx = e.clientX; drag.t = now;
    });
    var end = function () { drag = null; v = Math.max(-40, Math.min(40, v)); };
    m.addEventListener("pointerup", end); m.addEventListener("pointercancel", end);
    var wheelT = 0;
    m.addEventListener("wheel", function (e) {      // trackpad: two-finger swipe sideways moves through the logos
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault(); started = true; if (phase === 1) { L = 0; phase = 2; }
      x -= e.deltaX / scale; v = 0; wheelT = performance.now();
    }, { passive: false });
    m.addEventListener("click", function (e) { if (moved > 6) { e.preventDefault(); e.stopPropagation(); } }, true);
    $$("img", m).forEach(function (i) { i.draggable = false; });
    (function tick(now) {
      if (!document.body.contains(m)) return;
      var third = tr.scrollWidth / 3, W = parseFloat(m.style.width) || 1440, r = m.getBoundingClientRect();
      if (x === null && third > 0 && r.width) {
        x = -third; L = null; phase = 1;        // nothing shown yet; the strip builds up under "past work"
      }
      Rr = W;                                   // the strip runs the full width of the screen
      if (x === null) { m.style.clipPath = "inset(0 100% 0 0)"; requestAnimationFrame(tick); return; }
      if (!started) {
        var on = r.top < window.innerHeight * 0.92 && r.bottom > 0 && parseFloat(m.style.opacity || 1) > 0.6;
        if (on) { visT = visT || now; if (now - visT > 80) started = true; } else visT = 0;
      } else if (!drag && performance.now() - wheelT > 900) { v += (base - v) * 0.03; x += v; }   // rolls left → right
      if (started && phase === 1) {             // 1. builds up from the left edge, ending at the right limit
        if (L === null) L = 0;
        L = Math.min(Rr, L + 5); if (L >= Rr) { phase = 2; t2 = now; }
      }
      if (third > 0) { while (x < -2 * third) x += third; while (x > -third) x -= third; }
      m.style.clipPath = phase === 3 ? "none" : L === null ? "inset(0 100% 0 0)" : "inset(0 " + Math.max(0, W - (phase === 1 ? L : Rr)) + "px 0 0)";
      tr.style.transform = "translateX(" + x + "px)"; requestAnimationFrame(tick);
    })(performance.now());
  }
  /* case studies */
  var lastCase = 0, stripCtl = null;
  function bindCase(i) {
    var c = C.cases[i]; lastCase = i;
    var icons = els(function (e) { return e.k === "icon"; }).sort(function (a, b) { return a.e.f[0].g.x - b.e.f[0].g.x; });
    if (icons.length === 2) { // desktop frame has only ‹ › drawn; add the ×
      var g = icons[1].e.f[0].g, x = document.createElement("button"); x.type = "button"; x.className = "el go"; x.textContent = "×";
      x.style.cssText = "font-size:30px;line-height:23px;transform:translate(" + (g.x + 31 + spread(g.x)) + "px," + g.y + "px)"; stage.appendChild(x); icons.push({ n: x, e: {} });
      x.addEventListener("click", function () { nav("projects"); });
    } else if (icons[2]) go(icons[2], function () { nav("projects"); });
    go(icons[0], function () { nav("case-" + ((i + C.cases.length - 1) % C.cases.length)); });
    go(icons[1], function () { nav("case-" + ((i + 1) % C.cases.length)); });
    // text always comes from the case data
    byText(/CASE STUDY/).forEach(function (nd) { nd.n.innerHTML = nd.e.k === "vtext" ? "<span>" + c.label.toUpperCase() + "</span>" : c.label.toUpperCase(); });
    byText(/CFDA x|^eie\.$/).forEach(function (nd) { nd.n.textContent = c.title; });
    byText(/JUNE/).forEach(function (nd) { nd.n.textContent = c.when.toUpperCase(); });
    byText(/^Connected|^Brought/).forEach(function (nd) { nd.n.innerHTML = c.body; wireLinks(nd.n); });
    var imgs = els(function (e) { return e.k === "img"; });
    if (mode === "d" && c.layout) {                 // desktop: photos placed as in the Figma frame, right edge on the margin
      imgs.forEach(function (nd) { nd.hidden = true; });
      c.layout.forEach(function (it) { addImg(it, { ralign: 1 }); });
    } else if (mode === "m" && c.mobile) {
      imgs.slice().sort(function (a, b) { return rectOf(a.e, a.e.f[0].g)[1] - rectOf(b.e, b.e.f[0].g)[1]; }).forEach(function (nd, k) {
        var it = c.mobile[k]; if (!it) { nd.hidden = true; return; } if (typeof it === "string") it = { src: it };
        var im = nd.n.firstChild; im.src = IMG + it.src; im.style.objectFit = it.contain ? "contain" : "cover";
        if (it.contain) {        // a wide card (Vogue article): slot takes the card's own proportions
          var w0 = rectOf(nd.e, nd.e.f[0].g); var wd = w0[2] - w0[0], ht = wd * 122 / 486;
          nd.e = Object.assign({}, nd.e, { f: nd.e.f.map(function (f) { var g = Object.assign({}, f.g); var top = g.c0 !== undefined ? g.c1 : g.cy - g.h / 2;
            g.c0 = w0[0]; g.c2 = w0[2]; g.c1 = top; g.c3 = top + ht; g.cx = (w0[0] + w0[2]) / 2; g.cy = top + ht / 2; g.w = wd; g.h = ht; return { g: g, o: f.o }; }) });
          nd.n.classList.add("clip");
        }
        if (it.href) go(nd, function () { window.open(it.href, "_blank", "noopener"); });
      });
    } else if (!((mode === "d" && i === 0) || (mode === "m" && i < 2))) {
      imgs.forEach(function (nd, k) { nd.n.firstChild.src = IMG + c.images[k % c.images.length]; nd.n.firstChild.style.objectFit = "cover"; });
    }
    reachCard();
    if (mode === "m") {
      els(function (e) { return e.k === "vtext"; }).forEach(function (nd) { nd.hidden = true; });
      var ttl = els(function (e) { return e.k === "text" && !/^(Connected|Brought|REACH|TO EXPLORE|INSTAGRAM|JCVD)/.test(e.txt) && e.f[0].g.y > 300; }).sort(function (a, b) { return a.e.f[0].g.y - b.e.f[0].g.y; })[0];
      if (ttl) {
        var h1 = ttl.n.offsetHeight || ttl.e.lh, tg = ttl.e.f[0].g;
        ttl.n.innerHTML = c.label.toUpperCase() + "<br>" + ttl.n.innerHTML + '<br><span class="cdate">' + c.when.toUpperCase() + "</span>";
        ttl.wfix = 215; ttl.n.style.whiteSpace = "normal";
        var under = nodes.filter(function (nd) { return nd !== ttl && rectOf(nd.e, nd.e.f[0].g)[1] > tg.y + 4; });
        requestAnimationFrame(function () {
          var d = Math.max(0, ttl.n.offsetHeight - h1) + 6; under.forEach(function (nd) { nd.push = d; });
          var sp = $("#spacer"); sp.style.height = (parseFloat(sp.style.height) + d * scale) + "px"; render();
        });
      }
    }
    // images arrive one by one
    els(function (e) { return e.k === "img"; }).forEach(function (nd, k) { nd.n.style.animation = "fin .6s " + (0.2 + k * 0.22) + "s both"; });
    var x0 = null;
    stage.ontouchstart = function (e) { x0 = e.touches[0].clientX; };
    stage.ontouchend = function (e) { if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50) nav("case-" + ((i + (dx < 0 ? 1 : -1) + C.cases.length) % C.cases.length)); x0 = null; };
  }
  /* product page */
  function bindPdp(id) {
    var p = C.products[id];
    byText(/^the CARTA/).forEach(function (nd) { nd.n.innerHTML = mode === "d" ? "the <b>" + p.name + "</b> " + p.variant + "." : "the " + p.name; });
    if (mode === "m") byText(/^the CARTA/).forEach(function (nd) { var g = nd.e.f[0].g; nd.wfix = 300; nd.hx = g.w + 1 - 300; nd.n.style.textAlign = "right"; });
    byText(/^\$\d/).forEach(function (nd) { nd.n.textContent = "$" + p.price; });
    byText(/^in white LaVeg/).forEach(function (nd) { nd.n.textContent = p.desc; });
    byText(/^dimension/).forEach(function (nd) { nd.n.innerHTML = p.specs.slice(0, 2).join("<br>"); });
    byText(/^exterior/).forEach(function (nd) { nd.n.innerHTML = p.specs.slice(3, 5).join("<br>") || ""; });
    byText(/^one of one/).forEach(function (nd) { nd.n.textContent = p.specs[6] || ""; });
    byText(/ADD TO CART/).forEach(function (nd) { go(nd, function () { cartAdd(id); }); });
    els(function (e) { return e.k === "box" && /249,249,249/.test(e.col); }).forEach(function (nd) { go(nd, function () { cartAdd(id); }); });
    els(function (e) { return e.k === "text" && /SPECS|CARE|POLICIES/.test(e.txt) && !/dimension/.test(e.txt); }).forEach(function (nd) {
      linkLines(nd, { SPECS: "state:specs", CARE: "state:care", POLICIES: "policies" });
    });
    byText(/^PRODUCTS/).forEach(function (nd) { var cl = collOf(p); linkLines(nd, { PRODUCTS: "products", "001 PRIMAVERA 2026": cl.to }); var parts = nd.n.innerHTML.split("<br>"); if (parts[1]) { nd.n.innerHTML = parts[0] + "<br>" + parts[1].replace(/>[^<]*PRIMAVERA 2026</, ">" + cl.label + "<"); } $$("[data-to]", nd.n).forEach(function (a) { a.onclick = function (ev) { ev.stopPropagation(); nav(a.dataset.to); }; }); markCurrent(nd.n); });
    byText(/reach out to inquire/).forEach(function (nd) { go(nd, function () { nav("contact"); }); });
    var big = els(function (e) { return e.k === "img" && e.f[0].g.w > 200; });
    var thumbs = els(function (e) { return e.k === "img" && e.f[0].g.w <= 200; });
    var imgs = p.images.map(function (s) { return IMG + s; });
    var main = big.filter(function (nd) { return nd.e.oid === 358 || nd.e.oid === 376 || nd.e.oid === 352; });
    var hero = main[main.length - 1] || big[big.length - 1];
    if (hero) { var hi = hero.n.firstChild; hi.src = imgs[0]; hi.style.objectFit = "cover"; big.forEach(function (nd) { if (nd !== hero && nd.e.oid !== 284 && nd.e.oid !== 26 && nd.e.oid !== 22) nd.hidden = true; }); }
    thumbs.forEach(function (nd, k) { var t = nd.n.firstChild; t.src = imgs[k % imgs.length]; t.style.objectFit = "cover"; go(nd, function () { if (hero) hero.n.firstChild.src = imgs[k % imgs.length]; }); });
    if (mode === "m" && hero) mobileSwipe(hero, imgs);
    if (p.collection.indexOf("partner:") === 0) {
      var pt = C.partners.filter(function (x) { return "partner:" + x.handle === p.collection; })[0];
      if (pt) { document.documentElement.style.setProperty("--pc", pt.color); document.body.classList.add("pborder"); }
    }
    if (p.soldOut) { byText(/ADD TO CART/).forEach(function (nd) { nd.hidden = true; }); els(function (e) { return e.k === "box" && e.f[0].g.w < 220 && e.f[0].g.h < 70; }).forEach(function (nd) { nd.hidden = true; }); }
    var cl = collOf(p); var cr = $("#crumb"); cr.textContent = cl.label; cr.onclick = function () { nav(cl.to); };
    accordion(p);
    if (mode === "m") byText(/^PRODUCTS/).forEach(function (nd) { nd.crumbM = true; });
  }
  function accordion(p) {
    var lab = els(function (e) { return e.k === "text" && /^SPECS\s*CARE\s*POLICIES$/.test((e.txt || "").trim()) && e.f.some(function (f) { return f.o > 0.5; }); })[0];
    if (!lab) return;
    nodes.forEach(function (nd) {                 // Figma's opened-state frames are replaced by the accordion
      nd.st = {};
      if (nd.e.f.every(function (f) { return f.o < 0.5; })) nd.hidden = true;
    });
    var specs = p.specs.map(function (l) { return l || "&nbsp;"; }).join("<br>");
    lab.n.innerHTML = '<div class="acc"><a class="go" data-acc="0">SPECS</a><div class="accb"><div><p>' + specs + '</p></div></div><a class="go" data-acc="1">CARE</a><div class="accb"><div><p>' + p.care + '</p></div></div><a class="go" data-to="policies">POLICIES</a></div>';
    lab.wfix = mode === "d" ? 330 : 300; lab.n.style.whiteSpace = "normal";
    var lg = lab.e.f[0].g, top0 = lg.y, x0 = lg.x - 10, x1 = lg.x + lab.wfix + 10;
    var below = nodes.filter(function (nd) { if (nd === lab) return false; var r = rectOf(nd.e, nd.e.f[0].g); return r[1] > top0 + 4 && r[2] > x0 && r[0] < x1; });
    var bodies = $$(".accb", lab.n), h0 = null;
    $$("[data-acc]", lab.n).forEach(function (a) {
      a.addEventListener("click", function (ev) {
        ev.stopPropagation(); var i = +a.dataset.acc, open = !bodies[i].classList.contains("open");
        bodies.forEach(function (b, k) { b.classList.toggle("open", k === i && open); });
        if (open) setTimeout(function () {         // bring the opened text into view
          var b = lab.n.getBoundingClientRect().bottom, lim = window.innerHeight - (mode === "d" ? 100 : 40);
          if (b > lim) window.scrollBy({ top: b - lim, behavior: "smooth" });
        }, 600);
      });
    });
    $("[data-to]", lab.n).addEventListener("click", function (ev) { ev.stopPropagation(); nav("policies"); });
    var base = null;
    var ro = new ResizeObserver(function () {
      if (!document.body.contains(lab.n)) { ro.disconnect(); return; }
      var h = lab.n.offsetHeight; if (h0 === null) { h0 = h; base = parseFloat($("#spacer").style.height); } var push = Math.max(0, h - h0);
      below.forEach(function (nd) { nd.push = push; });
      $("#spacer").style.height = (base + push * scale) + "px"; render();
    });
    ro.observe(lab.n);
  }
  /* product page: Care opens under the CARE label (desktop Figma only drew Specs) */
  function careState(p) {
    if (mode === "m") {
      els(function (e) { return e.st && e.st.care && e.st.care.o === 1 && e.f[0].o === 0 && /LaVeg/.test(e.txt || ""); }).forEach(function (nd) { nd.n.textContent = p.care; });
      return;
    }
    var lab = byText(/^SPECS$/)[0], dim = byText(/^dimension/)[0], ext = byText(/^exterior/)[0], one = byText(/^one of one/)[0], cp = byText(/^CARE\s*POLICIES$/)[0];
    if (!lab || !dim || !cp) return;
    var specsHtml = { lab: lab.n.innerHTML, dim: dim.n.innerHTML, cp: cp.n.innerHTML };
    nodes.forEach(function (nd) { nd.st = Object.assign({}, nd.e.st); if (nd.e.st.specs) nd.st.care = nd.e.st.specs; });
    var lh = lab.e.lh, ls = lab.e.st.specs.g, ds = dim.e.st.specs.g, cs = cp.e.st.specs.g, os = one ? one.e.st.specs.g : ds;
    var gap = cs.y - (os.y + (one ? one.e.f[0].g.h || lh : lh));
    stateHook = function (name) {
      var care = name === "care";
      lab.n.innerHTML = care ? "SPECS<br>CARE" : specsHtml.lab;
      dim.n.innerHTML = care ? p.care : specsHtml.dim;
      cp.n.innerHTML = care ? "POLICIES" : specsHtml.cp;
      [lab, cp].forEach(function (nd) { $$("[data-to]", nd.n).forEach(function (a) { a.onclick = function (ev) { ev.stopPropagation(); nav(a.dataset.to); }; }); });
      if (care) {
        var cy = ds.y + lh, ch = dim.n.offsetHeight || lh * 2;
        dim.st.care = { g: Object.assign({}, ds, { y: cy }), o: 1 };
        cp.st.care = { g: Object.assign({}, cs, { y: cy + ch + gap }), o: 1 };
        [ext, one].forEach(function (nd) { if (nd) nd.st.care = { g: nd.e.st.specs.g, o: 0 }; });
        lab.st.care = { g: ls, o: 1 };
        cp.n.innerHTML = '<a class="go" data-to="policies">POLICIES</a>';
        $$("[data-to]", cp.n).forEach(function (a) { a.onclick = function (ev) { ev.stopPropagation(); nav(a.dataset.to); }; });
        lab.n.innerHTML = '<a class="go" data-to="state:specs">SPECS</a><br><a class="go" data-to="state:care">CARE</a>';
        $$("[data-to]", lab.n).forEach(function (a) { a.onclick = function (ev) { ev.stopPropagation(); nav(a.dataset.to); }; });
      }
    };
  }
  /* phone: swipe sideways through the case studies */
  function caseStrip() {
    if (mode !== "m") return;
    var v1 = byText(/CASE STUDY 1/)[0], v2 = byText(/CASE STUDY 2/)[0];
    var ims = byOid(44).sort(function (a, b) { return a.e.f[0].g.cx - b.e.f[0].g.cx; });
    var title = byText(/^CFDA/)[0], cap = byText(/^Connecting top/)[0];
    if (!v1 || !ims[0]) return;
    var STEP = 285, IW = 207, IH = 385;
    [v2, ims[1], title].concat(byOid(86)).forEach(function (nd) { if (nd) nd.hidden = true; });
    // the slot: label | photo, text under the photo, all starting on the photo's top line
    var T = topOf(ims[0]), dyS = ims[0].dy || 0;
    setGeo(ims[0], 97, T, IW, IH); ims[0].dy = dyS;
    v1.e.vtop = 1; v1.n.classList.add("vtop"); setGeo(v1, 73, T, 14, IH); v1.dy = dyS; v1.n.style.fontSize = "13px";
    if (cap) { cap.e = Object.assign({}, cap.e, { s: 13, lh: 19.5, wrap: 1, align: "justify" }); setGeo(cap, 97, T + IH + 16, IW); cap.dy = dyS;
      cap.n.style.fontSize = "13px"; cap.n.style.lineHeight = "19.5px"; cap.n.style.whiteSpace = "normal"; cap.n.classList.add("j"); cap.wfix = IW; }
    var base = [v1, ims[0], cap].filter(Boolean), group = base.slice(), c0 = C.cases[0];
    ims[0].n.firstChild.src = IMG + c0.cover; ims[0].n.firstChild.style.objectFit = "cover";
    if (cap) cap.n.textContent = c0.short;
    // reach-out button and footer follow the slot at the standard gaps
    var capB = cap ? T + IH + 16 + cap.n.offsetHeight : T + IH, M2 = SYS.m;
    var boxes = els(function (e) { return e.k === "box"; }).filter(function (nd) { return topOf(nd) > T + 100; });
    boxes.forEach(function (nd) { if (!/249,248,246/.test(nd.e.col)) nd.hidden = true; else { setGeo(nd, 90, capB + 96, 222, 56); nd.dy = dyS; nd.n.classList.add("paper"); nd.n.style.background = ""; } });
    byText(/REACH OUT NOW|TO EXPLORE A CUSTOM/).forEach(function (nd) { var k = /REACH/.test(nd.e.txt) ? 0 : 1; setGeo(nd, 90, capB + 96 + 10 + k * 18, 222); nd.dy = dyS; nd.wfix = 222; nd.n.style.textAlign = "center"; });
    var rb = boxes.filter(function (nd) { return !nd.hidden; })[0], rt = byText(/^REACH OUT NOW/)[0], DY = 56 + M2.m, ey = capB + 96 + DY;
    function cloneDown(nd, txt) {   // second card: a copy of the reach-out card, one small step under it
      var e2 = JSON.parse(JSON.stringify(nd.e)); e2.key += ":expl"; e2.f.forEach(function (f) { f.g.y += DY; });
      var n = build(e2); stage.appendChild(n); var c = { e: e2, n: n, dy: nd.dy || 0, push: nd.push || 0, anchor: null, wfix: nd.wfix }; nodes.push(c);
      if (nd.n.classList.contains("paper")) { n.classList.add("paper"); n.style.background = ""; }
      if (txt) { n.textContent = txt; n.style.width = nd.n.style.width; n.style.textAlign = "center"; e2.f.forEach(function (f) { f.g.y += 9; }); }
      go(c, function () { nav("products"); }); return c;
    }
    if (rb) cloneDown(rb); if (rt) cloneDown(rt, "EXPLORE PRODUCTS");
    var fl = els(function (e) { return e.k === "flogo"; })[0]; if (fl) { setGeo(fl, 154, ey + 56 + M2.l, 94, 30.13); fl.dy = dyS; }
    for (var i = 1; i < C.cases.length; i++) (function (i) {
      var c = C.cases[i];
      base.forEach(function (nd) {
        var e2 = JSON.parse(JSON.stringify(nd.e));
        e2.f.forEach(function (f) { var g = f.g; if (g.cx !== undefined) { g.cx += STEP * i; if (g.c0 !== undefined) { g.c0 += STEP * i; g.c2 += STEP * i; } } else g.x += STEP * i; });
        var n = build(e2); stage.appendChild(n); var c2 = { e: e2, n: n, anchor: null, dy: nd.dy || 0, push: nd.push || 0 }; nodes.push(c2); group.push(c2);
        if (e2.k === "vtext") n.innerHTML = "<span>" + c.label.toUpperCase() + "</span>";
        else if (e2.k === "img") { n.firstChild.src = IMG + c.cover; n.firstChild.style.objectFit = "cover"; }
        else { n.textContent = c.short; n.style.fontSize = "13px"; n.style.lineHeight = "19.5px"; }
        go(c2, function () { nav("case-" + i); });
      });
    })(i);
    var idx = 0, hx = 0;
    var set = function (j, anim) {
      idx = Math.max(0, Math.min(C.cases.length - 1, j)); var from = hx, to = -idx * STEP, t0 = performance.now();
      if (!anim) { hx = to; group.forEach(function (nd) { nd.hx = hx; }); render(); return; }
      (function step(now) { var q = Math.min(1, (now - t0) / 420), e = 1 - Math.pow(1 - q, 3); hx = from + (to - from) * e; group.forEach(function (nd) { nd.hx = hx; }); render(); if (q < 1) requestAnimationFrame(step); })(t0);
    };
    stripCtl = { set: set, band: function () { var r = ims[0].n.getBoundingClientRect(); return [r.top - 60, r.bottom + 140]; }, idx: function () { return idx; } };
    stripCtl.nav = { prev: function () { set(idx - 1, true); }, next: function () { set(idx + 1, true); } };
  }
  var sx0 = null, sy0 = null;
  stage.addEventListener("touchstart", function (e) { if (!stripCtl) return; var t = e.touches[0], b = stripCtl.band(); sx0 = t.clientY >= b[0] && t.clientY <= b[1] ? t.clientX : null; sy0 = t.clientY; }, { passive: true });
  stage.addEventListener("touchend", function (e) { if (!stripCtl || sx0 === null) return; var t = e.changedTouches[0], dx = t.clientX - sx0, dy = t.clientY - sy0; if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) stripCtl.set(stripCtl.idx() + (dx < 0 ? 1 : -1), true); sx0 = null; });
  function toCases(i) {
    if (mode === "d") { window.scrollTo(0, cum[cum.length - 1] * scale); render(); return; }
    var im = byOid(44)[0]; if (!im) return;
    window.scrollTo(0, Math.max(0, (rectOf(im.e, im.e.f[0].g)[1] - 150) * scale)); render();
    if (stripCtl) stripCtl.set(i, false);
  }
  function collOf(p) {
    if (p.collection.indexOf("partner:") === 0) { var pt = C.partners.filter(function (x) { return "partner:" + x.handle === p.collection; })[0]; return { label: pt.label, to: "p-" + pt.handle }; }
    var c = C.collections.filter(function (x) { return x.handle === p.collection; })[0]; return { label: c.label, to: "c-" + c.handle };
  }
  function mobileSwipe(hero, imgs) {
    var i = 0, im = hero.n.firstChild, x0 = null;
    var dots = document.createElement("div"); dots.style.cssText = "position:absolute;left:0;right:0;bottom:8px;display:flex;justify-content:center;gap:5px;filter:drop-shadow(0 0 2px rgba(255,255,255,.8))";
    dots.innerHTML = imgs.map(function (s, k) { return '<i style="width:4px;height:4px;border-radius:50%;background:#111;opacity:' + (k ? .3 : 1) + '"></i>'; }).join("");
    hero.n.appendChild(dots);
    var set = function (n) { i = (n + imgs.length) % imgs.length; im.src = imgs[i]; $$("i", dots).forEach(function (d, k) { d.style.opacity = k === i ? 1 : .3; }); };
    hero.n.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    hero.n.addEventListener("touchend", function (e) { if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 30) set(i + (dx < 0 ? 1 : -1)); x0 = null; });
    hero.n.addEventListener("click", function () { set(i + 1); });
  }

  /* ---------------- chrome: logo tiles, menu, cart, footer ---------------- */
  var tilesBox = $("#tiles");
  tilesBox.setAttribute("role", "button"); tilesBox.tabIndex = 0; tilesBox.setAttribute("aria-label", "JCVD: menu and home");
  tilesBox.addEventListener("keydown", function (ev) { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); var t = $(".tile", tilesBox); if (t) t.click(); } });
  KEYS.forEach(function (k) {
    var w = document.createElement("span"); w.className = "tile"; w.dataset.k = k;
    w.style.width = TILES[k].w + "px"; w.style.height = TILES[k].h + "px";
    w.innerHTML = '<img src="assets/logo/' + k + '.webp" alt=""><img class="s" src="assets/logo/' + k + '-s.webp" alt="">';
    w.addEventListener("click", function () { if (mode === "m" && current !== "home" && !document.body.classList.contains("menu-open")) { document.body.classList.add("menu-open"); onScrollChrome(); } else nav("home"); });
    tilesBox.appendChild(w);
  });
  function logoPose(home, animate) {
    var c = CH[mode], p = {};
    if (home) {
      var hdx = spread(711), hs = c.hero.s, hox = c.hero.ox, hoy = c.hero.oy;
      if (mode === "m") {     // phone: logo, sentence and menu always fit one screen; sentence sits 2/3 of the way from logo to menu
        var topMin = 52, menuTop = c.homeMenu.base + HOMEDY - 16, sentH = 40;
        var avail = menuTop - topMin, H0 = 949 * hs, logoH = Math.max(160, Math.min(H0, (avail - sentH) * 0.74));
        var g = (avail - sentH - logoH) / 3;
        var cxl = hox + (REF.x + 271.5) * hs; hs = hs * logoH / H0; hox = cxl - (REF.x + 271.5) * hs;
        hoy = topMin - REF.y * hs; HOME_SENT = topMin + logoH + 2 * g;
      }
      KEYS.forEach(function (k) { p[k] = { x: hdx + hox + (REF.x + TILES[k].vx) * hs, y: hoy + (REF.y + TILES[k].vy) * hs, s: hs }; });
    }
    else {
      var total = KEYS.reduce(function (a, k) { return a + TILES[k].w - 2 * M; }, 0) + 3 * c.tileGap;
      var s = c.hdrLogo.w / total, x = c.hdrLogo.x - M * s;
      KEYS.forEach(function (k) { p[k] = { x: x, y: c.hdrLogo.y + ST() - M * s + (333 - TILES[k].h) * s, s: s }; x += (TILES[k].w - 2 * M + c.tileGap) * s; });
    }
    $$(".tile", tilesBox).forEach(function (t, i) {
      var q = p[t.dataset.k];
      t.style.transition = animate ? "" : "none";
      t.style.transitionDelay = animate ? ((home ? 3 - i : i) * 70) + "ms" : "0ms";
      t.style.transform = "translate(" + q.x + "px," + q.y + "px) scale(" + q.s + ")";
      if (!animate) { void t.offsetWidth; t.style.transition = ""; }
    });
    tilesBox.classList.toggle("small", !home);
  }
  var menuLinks = $$("#menu a");
  function menuPose(home, active) {
    var c = CH[mode];
    menuLinks.forEach(function (a, i) {
      var size, x, base;
      if (home) { size = c.homeMenu.size; x = mode === "d" ? c.homeMenu.x : c.homeMenu.xs[i]; base = mode === "d" ? c.homeMenu.base[i] : c.homeMenu.base + HOMEDY; }
      else { size = c.menu.size; x = c.menu.x; base = c.menu.base[i] + ST() + (mode === "d" && document.body.classList.contains("partner") ? 22 : 0); }
      var lh = size * 1.3, top = base - (lh / 2 + 0.375 * size);
      a.style.fontSize = size + "px"; a.style.lineHeight = lh + "px";
      a._pose = "translate(" + x + "px," + top + "px)"; a._hid = undefined; a.style.transitionDelay = "0ms";
      if (mode === "m" && !home && !document.body.classList.contains("menu-open")) {
        a._hid = true; a.style.transitionDelay = (3 - i) * 45 + "ms";
        a.style.transform = "translate(" + (c.hdrLogo.x + 4) + "px," + (c.hdrLogo.y + ST() + 4) + "px) scale(.28)";
        a.style.opacity = 0; a.style.pointerEvents = "none";
      } else a.style.transform = a._pose;
      a.classList.toggle("grey", !home && mode === "d" && a.dataset.k !== active);
    });
    var cr = $("#crumb"); if (mode === "d") { cr.style.transform = "translate(" + c.crumb.x + "px," + (c.crumb.base - (13 * 1.3 / 2 + 0.375 * 13)) + "px)"; cr.style.lineHeight = 13 * 1.3 + "px"; }
    var cb = $("#cartbtn"); cb.style.transform = "translate(" + (mode === "d" ? 1362 + spread(1104.5) - c.cart.w : c.cart.x + EX) + "px," + (c.cart.y + ST()) + "px)"; cb.style.width = c.cart.w + "px"; cb.style.height = c.cart.h + "px";
    var ft = $("#footer");
    if (mode === "d") { ft.style.display = "flex"; ft.style.transform = "translate(" + (1362 + RDX() - (ft.offsetWidth || 80)) + "px," + (c.footer.base + FB - 12) + "px)"; }   // same spot on every page
    else ft.style.display = "none";
    var HRX = 1362 + spread(1104.5);     // right edge of the landing-page hero photo
    var pt = $("#partnertag"); pt.style.transform = "translate(" + c.partnertag.x + "px," + c.partnertag.y + "px)"; pt.style.fontSize = c.partnertag.size + "px"; pt.style.setProperty("--ix", c.partnertag.ix + "px"); pt.style.setProperty("--iy", c.partnertag.iy + "px");
    var mlh = c.menu.size * 1.3, mtop = c.menu.base[0] + ST() - (mlh / 2 + 0.375 * c.menu.size), mpad = 14;
    var mp = $("#menupanel"); mp.style.transform = "translate(" + (c.menu.x - mpad) + "px," + (mtop - mpad) + "px)"; mp.style.width = "130px"; mp.style.height = (c.menu.base[3] - c.menu.base[0] + mlh + 2 * mpad) + "px";
  }
  function onScrollChrome(ps) {
    var y = window.scrollY;
    if (mode === "m" && stripCtl && stripCtl.nav) { var b = stripCtl.band(), on = b[0] + 60 < window.innerHeight * 0.55 && b[1] - 140 > 120;
      if (on !== !!cnav._on) { cnav._on = on; caseNav(on ? stripCtl.nav : null); } }
    document.body.classList.toggle("collapsed", y > 30);
    // mobile: the Figma frames only show the menu list at the top of About, Projects and Products;
    // everywhere else it stays folded into the logo until the logo is tapped.
    var topMenu = false;   // phone: the menu lives in the logo on every page except Home
    if (y < 10 && topMenu) document.body.classList.remove("menu-open");
    var open = document.body.classList.contains("menu-open");
    var hideMenu = mode === "m" && scName !== "home" && !open && (y > 30 || !topMenu);
    menuLinks.forEach(function (a, i) {
      var hid = !!hideMenu; if (a._hid === hid) return; a._hid = hid;
      if (mode === "m" && scName !== "home") {
        var c = CH.m;
        a.style.transitionDelay = (hid ? 3 - i : i) * 45 + "ms";
        a.style.transform = hid ? "translate(" + (c.hdrLogo.x + 4) + "px," + (c.hdrLogo.y + ST() + 4) + "px) scale(.28)" : a._pose;
      }
      a.style.opacity = hid ? 0 : 1; a.style.pointerEvents = hid ? "none" : "";
    });
    veils(hideMenu);
  }
  /* stone veils over the stage: text scrolls under the menu / header / footer and disappears */
  var vT = $("#veilTop"), vC = $("#veilCol"), vB = $("#veilBot");
  function setV(v, on, vars) { v.classList.toggle("on", on); if (on) for (var k in vars) v.style.setProperty("--" + k, vars[k] + "px"); }
  function veils(hideMenu) {
    var s = scale, home = scName === "home";
    if (home) { [vT, vC, vB].forEach(function (v) { v.classList.remove("on"); }); return; }
    // mobile: full-width band under the logo + cart
    setV(vT, mode === "m", { a: (60 + ST()) * s, b: (82 + ST()) * s });
    // menu column (logo + menu + breadcrumb), fading out below the last menu item
    var menuOn = mode === "d" || !hideMenu, bot = 0, right = 0;
    if (menuOn) {
      menuLinks.concat($("#crumb").style.display === "block" ? [$("#crumb")] : []).forEach(function (a) { var r = a.getBoundingClientRect(); bot = Math.max(bot, r.bottom); right = Math.max(right, r.right); });
      if (document.body.classList.contains("partner")) right = Math.max(right, $("#partnertag").getBoundingClientRect().right);
    }
    var cR = mode === "d" ? Math.max(right + 26 * s, 344 * s) : right + 26 * s;   // desktop: covers the whole 260 body column
    setV(vC, menuOn, { a: bot + 12 * s, b: bot + (mode === "d" ? 42 : 46) * s, c: cR, d: cR + (mode === "d" ? 84 : 34) * s });
    // desktop: footer band — nothing rests below 826 in the frame
    setV(vB, mode === "d", { a: (800 + FB) * s, b: (856 + FB) * s, c: 520 * s, d: 600 * s });   // footer fade covers the text column, not the photos
  }
  $("#menu").addEventListener("click", function () { document.body.classList.remove("menu-open"); });
  $("#footer").innerHTML = '<span>JCVD, LLC 2026</span>';

  /* ---------------- cart ---------------- */
  var cart = [];
  try { cart = JSON.parse(localStorage.getItem("jcvd-cart") || "[]"); } catch (e) { cart = []; }
  function saveCart() { try { localStorage.setItem("jcvd-cart", JSON.stringify(cart)); } catch (e) {} drawCart(); }
  function cartAdd(id) { var it = cart.filter(function (x) { return x.id === id; })[0]; if (it) it.q++; else cart.push({ id: id, q: 1 }); saveCart(); document.body.classList.add("cart-open"); }
  function drawCart() {
    var n = cart.reduce(function (a, x) { return a + x.q; }, 0), tot = 0;
    $("#cartbtn .n").textContent = n ? n : "";
    $("#cart .items").innerHTML = cart.length ? cart.map(function (x) { var p = C.products[x.id]; tot += p.price * x.q;
      return '<div class="item"><img src="' + IMG + p.images[0] + '" alt=""><div>the <b>' + p.name + "</b><br>" + p.variant + "<br>$" + p.price + " × " + x.q + '</div><button type="button" data-rm="' + x.id + '"><u>remove</u></button></div>'; }).join("") : "<p>Your cart is empty.</p>";
    $("#cart .tot b").textContent = "$" + tot;
    $$("[data-rm]").forEach(function (b) { b.onclick = function () { cart = cart.filter(function (x) { return x.id !== b.dataset.rm; }); saveCart(); }; });
  }
  $("#cartbtn").onclick = function () { document.body.classList.add("cart-open"); };
  $("#scrim").onclick = $("#cart .close").onclick = function () { document.body.classList.remove("cart-open"); };
  $("#cart .checkout").onclick = function () { $("#cart .note").textContent = "Preview only: at launch this opens Shopify checkout (Shop Pay, Apple Pay, cards)."; };
  $("#cart .pol").onclick = function () { document.body.classList.remove("cart-open"); nav("policies"); };

  /* ---------------- router ---------------- */
  var SHOP_LIVE = false;   // flip to true when Shopify is connected: collections, partner pages and product pages open again
  function parse(h) {
    h = h || "home";
    if (!SHOP_LIVE && (h === "collections" || h === "partners" || /^(c|p|product)-/.test(h))) return { scene: "e404", soon: true, nav: "products" };
    if (h === "home") return { scene: "home" };
    if (h === "about" || h === "contact" || h === "policies" || h === "projects" || h === "products") return { scene: h, shop: SHOP_LIVE && h === "products" };
    if (h === "collections") return { scene: "products", shop: true, scrollEnd: true };
    var m;
    if ((m = /^case-(\d)$/.exec(h))) { var i = +m[1]; return { scene: mode === "m" && i === 1 ? "case2" : "case", i: i, nav: "projects" }; }
    if ((m = /^c-(.+)$/.exec(h))) return { scene: "collection", collection: m[1], shop: true, nav: "products" };
    if (h === "partners") return { scene: "partners", shop: true, nav: "products" };
    if ((m = /^p-(.+)$/.exec(h)) && C.partners.some(function (p) { return p.handle === m[1]; })) return { scene: "partner", partner: m[1], shop: true, nav: "products", partnerOn: true };
    if ((m = /^product-(.+)$/.exec(h)) && C.products[m[1]]) return { scene: C.products[m[1]].soldOut ? "pdp_sold" : "pdp", product: m[1], shop: true, nav: "products", pdp: true };
    return { scene: "e404" };
  }
  function go_(animate) {
    var h = here_(), r = parse(h);
    if (r.scene === "projects" && /^case/.test(current || "")) { r.toCases = true; r.caseIdx = lastCase; }   // closing a case study lands back on the case studies
    var wasHome = current === "home", isHome = r.scene === "home";
    document.body.className = [isHome ? "home" : "", r.shop ? "shop" : "", r.partnerOn ? "partner" : "", r.pdp ? "pdp" : "", mode === "m" ? "is-m" : ""].join(" ");
    var active = r.nav || r.scene;
    menuPose(isHome, active);
    $("#crumb").style.display = r.pdp && mode === "d" ? "block" : "none";
    var flying = animate && wasHome !== isHome;
    logoPose(isHome, animate);
    clearInterval(carTimer);
    if (animate) {
      stage.classList.add("out");
      setTimeout(function () { mount(r.scene, r); stage.classList.remove("out"); }, flying ? 520 : 260);
    } else mount(r.scene, r);
    current = r.scene;
    var TT = { home: "", about: "About", projects: "Projects", products: "Products", contact: "Contact", policies: "Policies", partners: "Partner products" };
    var t = r.soon ? "Shop coming soon" : r.scene === "case" || r.scene === "case2" ? C.cases[r.i] && C.cases[r.i].title : TT[r.scene] !== undefined ? TT[r.scene] : r.scene === "e404" ? "Page not found" : "";
    document.title = t ? t + " · JCVD" : "JCVD · sustainable design studio, Brooklyn & Brazil";
    var h1 = $("#pageh1"); if (!h1) { h1 = document.createElement("h1"); h1.id = "pageh1"; h1.className = "sr"; document.body.insertBefore(h1, document.body.firstChild); }
    h1.textContent = t || "JCVD is a sustainable design studio with one foot in Brooklyn and the other in Brazil.";
    setTimeout(render, 950);   // re-measure the veils once the menu has settled
  }
  window.addEventListener("hashchange", function () { if (!PATHS) go_(true); });
  window.addEventListener("popstate", function () { if (PATHS) go_(true); });
  if (PATHS) $$("#menu a").forEach(function (a) { var k = a.getAttribute("href").replace(/^#/, ""); a.setAttribute("href", "/" + k);
    a.addEventListener("click", function (ev) { if (ev.metaKey || ev.ctrlKey || ev.shiftKey) return; ev.preventDefault(); nav(k); }); });
  /* the wall slides up as you scroll, a little slower than the page, like moving down along it */
  (function () {
    var root = document.documentElement.style, raf = 0;
    function wall() { raf = 0; var w = Math.max(window.innerWidth, 1300), period = w * 2400 / 1920;
      root.setProperty("--gw", w + "px"); root.setProperty("--gy", (-(window.scrollY * 0.7) % period) + "px"); }
    window.addEventListener("scroll", function () { if (!raf) raf = requestAnimationFrame(wall); }, { passive: true });
    window.addEventListener("resize", wall); wall();
  })();
  /* back / forward with a two-finger sideways swipe (the preview frame swallows the browser's own gesture),
     plus the Backspace key outside form fields */
  (function () {
    var acc = 0, lastT = 0, fired = false, hint = document.createElement("div");
    hint.id = "swipehint"; document.body.appendChild(hint);
    function show(v) {
      var p = Math.min(1, Math.abs(v) / 140); hint.style.opacity = p * 0.9;
      hint.className = v > 0 ? "fwd" : "back"; hint.style.setProperty("--p", p);
    }
    window.addEventListener("wheel", function (e) {
      if (e.ctrlKey || Math.abs(e.deltaX) <= Math.abs(e.deltaY) * 1.5) return;
      if (e.target.closest && e.target.closest(".marq")) return;           // the logo strip uses sideways swipes itself
      if (stripCtl) { var b = stripCtl.band(); if (e.clientY >= b[0] && e.clientY <= b[1]) return; }
      var now = performance.now(); if (now - lastT > 260) { acc = 0; fired = false; } lastT = now;
      if (fired) return;
      acc += e.deltaX; show(acc);
      if (Math.abs(acc) > 140) {
        fired = true; hint.style.opacity = 0;
        var cm = /^case-(\d)$/.exec(here_());
        if (cm && mode === "d") nav("case-" + ((+cm[1] + (acc < 0 ? -1 : 1) + C.cases.length) % C.cases.length));
        else if (window.top !== window.self) { if (acc < 0) history.back(); else history.forward(); }
      }
      clearTimeout(show.t); show.t = setTimeout(function () { hint.style.opacity = 0; }, 280);
    }, { passive: true });
    window.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { document.body.classList.remove("cart-open", "menu-open"); return; }
      if (e.key !== "Backspace" || e.metaKey || e.ctrlKey || window.top === window.self) return;
      var t = e.target; if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      e.preventDefault(); history.back();
    });
  })();
  var rt;
  function onResize() { clearTimeout(rt); rt = setTimeout(function () { var m0 = mode; layout(); if (m0 !== mode) go_(false); else {
    menuPose(current === "home", (parse(here_()).nav || current)); logoPose(current === "home", false);
    if (current === "home" && mode === "m") { window.scrollTo(0, 0); nodes.forEach(function (nd) { nd.dy = HOME_SENT !== null && nd.e.k === "text" ? HOME_SENT - nd.e.f[0].g.y : HOMEDY; }); }
    render(); } }, 120); }
  window.addEventListener("resize", onResize);
  window.addEventListener("orientationchange", onResize);
  if (window.visualViewport) { window.visualViewport.addEventListener("resize", onResize); window.visualViewport.addEventListener("scroll", function () { layout(); }); }
  setTimeout(onResize, 600); setTimeout(onResize, 1500);   // in-app browsers settle their toolbars after load
  layout(); drawCart(); go_(false);
  /* first load of Home: background, then J, C, V, D, then the sentence, then the menu, each after the previous has loaded */
  (function intro() {
    if (current !== "home") return;
    var b = document.body, tiles = $$(".tile", tilesBox);
    b.classList.add("intro");
    var wait = function (src) { return new Promise(function (r) { var i = new Image(); i.onload = i.onerror = function () { r(); }; i.src = src; if (i.complete) r(); }); };
    var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
    var BEAT = 400;   // one steady beat between every element
    var chain = wait("assets/img/stone.jpg").then(function () { $("#ground").style.opacity = 1; return sleep(BEAT + 200); });
    // each letter arrives as just its letter shape (the flat logo), drifting up into place on the beat; then the carved tiles settle in around them
    tiles.forEach(function (t) { var lm = new Image(); lm.className = "lm"; lm.alt = ""; lm.src = $("img", t).src;
      lm.style.webkitMaskImage = lm.style.maskImage = "url(assets/logo/" + t.dataset.k + "-m.png)"; t.appendChild(lm); });
    tiles.forEach(function (t) { chain = chain.then(function () { return Promise.all([wait($("img", t).src), wait("assets/logo/" + t.dataset.k + "-m.png")]); }).then(function () { t.classList.add("in"); return sleep(BEAT); }); });
    chain = chain.then(function () { return sleep(BEAT * 0.4); }).then(function () { b.classList.add("intro-full"); return sleep(BEAT * 1.2); });
    chain.then(function () { stage.classList.add("in"); return sleep(BEAT * 1.1); })
      .then(function () { $("#menu").classList.add("in"); return sleep(1000); })
      .then(function () { b.classList.remove("intro", "intro-full"); $("#ground").style.opacity = ""; $$(".tile .lm", tilesBox).forEach(function (n) { n.remove(); }); });
  })();
})();
