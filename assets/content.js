/* Placeholder content. In the Shopify build each block below becomes either
   a theme-editor section (studio copy, case studies) or Shopify data
   (products, collections, partner colours, piece positions). */
window.JCVD = {
  links: { instagram: "https://www.instagram.com/jcvd______________/", email: "joao@jcvd.com.br", press: "press@jcvd.com.br", blog: "https://impactado.substack.com/", whatsapp: "https://wa.me/12674415390", catalogEndpoint: "https://script.google.com/macros/s/AKfycbyeMPxFmI2t8lLBQPHLVJCkN0YWs6-BzGNNXAb51m2dd47KQqvWUkjq1iAduCcio3En/exec", linkedin: "https://www.linkedin.com/in/joaocamposd/" },

  pastWork: [
    ["logo-shahi.webp", "https://www.shahi.co.in"], ["logo-carhartt.webp", "https://www.carhartt.com"], ["logo-edl.webp", "https://www.emilydawnlong.com"],
    ["logo-novakaeru.webp", "https://novakaeru.com"], ["logo-cfda.webp", "https://cfda.com"], ["logo-lii.webp", "https://lii-studio.com"],
    ["logo-blab.webp", "https://www.bcorporation.net"], ["logo-amadeu.webp", "https://www.amadeumaterials.com"], ["logo-patagonia.webp", "https://www.patagonia.com"]
  ],

  catalogImages: ["orange.jpg", "cat-red.jpg", "cat-black.jpg", "cat-shirt.jpg"],

  cases: [
    { id: "sourcing", label: "Case study 1: Sourcing", title: "CFDA x VOGUE FASHION FUND", when: "June–October 2026",
      short: "Connecting top emerging U.S. designers to premium Brazilian biomaterials.",
      body: "Curation, sourcing, and fulfillment for the Council of Fashion Designers of America, connecting New York’s top emerging designers to premium Brazilian biomaterials. 5 of the 10 designers in the cohort chose to work with my materials, including all 3 winners: LII, Emily Dawn Long, and Aisling Camps.",
      cover: "cs1-cover.jpg", images: ["cs1-a.jpg", "cs1-b.jpg", "cs1-c.jpg", "ov1.jpg"],
      /* phone: collage under the text (x / y / w / h, y from the collage top; later images sit on top) */
      mcollage: [ { src: "cs1-b.jpg", x: 20, y: 0, w: 210, h: 298 }, { src: "cs1-a.jpg", x: 56, y: 256, w: 228, h: 346 }, { src: "cs1-c.jpg", x: 184, y: 71, w: 201, h: 301 } ],
      /* desktop: photos placed as in the Figma frame (x/y/w/h in the 1440x900 frame) */
      layout: [ { src: "cs1-a.jpg", x: 472, y: 226, w: 252, h: 376 }, { src: "cs1-b.jpg", x: 806, y: 226, w: 233, h: 376 },
        { src: "cs1-c.jpg", x: 1110, y: 226, w: 252, h: 378 },
        { src: "vogue.jpg", x: 659, y: 660, w: 486, h: 122, href: "https://www.vogue.com/article/cfda-vogue-fashion-fund-sustainability-challenge-10-16-2026" } ],
      mobile: ["cs1-a.jpg", "cs1-c.jpg", "cs1-b.jpg", { src: "vogue.jpg", contain: true, href: "https://www.vogue.com/article/cfda-vogue-fashion-fund-sustainability-challenge-10-16-2026" }] },
    { id: "market", label: "Case study 2: Market entry", title: "eie.", when: "Ongoing since May 2026",
      short: "Bringing an independent Brazilian accessories brand to the U.S. market.",
      body: 'Brought Belo Horizonte-based independent accessories brand eie. to New York, acting as a brand agent to the U.S. market. Curated pieces, handled import and distribution, and placed products with select retailers and influencers. Explore their pieces <a class="go" data-to="p-eie"><u>here</u></a>.',
      cover: "ov2.jpg", images: ["cs2-graffiti.jpg", "cs2-necklaces.jpg", "eie-still.jpg"],
      mcollage: [ { src: "eie-still.jpg", x: 23, y: 0, w: 335, h: 187 }, { src: "hero-partners.jpg", x: 181, y: 145, w: 207, h: 259 } ],
      layout: [ { src: "cs2-graffiti.jpg", x: 462, y: 288, w: 476, h: 357 }, { src: "cs2-necklaces.jpg", x: 977, y: 209, w: 385, h: 482 } ],
      mobile: ["cs2-graffiti.jpg", "cs2-necklaces.jpg", "eie-still.jpg"] },
    { id: "design", label: "Case study 3: Design & production", title: "Archive album merch", when: "Winter 2026",
      short: "Making one-of-a-kind merch for a Brooklyn-based music artist.",
      body: "In less than 1 month, produced 100 flash drives and 30 hand-printed beanies to celebrate the launch of music artist Arewà Basit’s new album.",
      cover: "ov3.jpg", images: ["cs3-tan.jpg", "cs3-brown.jpg", "cs3-detail.jpg"],
      mcollage: [ { src: "cs3-tan.jpg", x: 20, y: 0, w: 290, h: 193 }, { src: "cs3-brown.jpg", x: 92, y: 158, w: 290, h: 193 }, { src: "cs3-detail.jpg", x: 20, y: 316, w: 290, h: 193 } ],
      layout: [ { src: "cs3-tan.jpg", x: 472, y: 190, w: 432, h: 288 }, { src: "cs3-brown.jpg", x: 930, y: 190, w: 432, h: 288 },
        { src: "cs3-detail.jpg", x: 701, y: 512, w: 432, h: 288 } ],
      mobile: ["cs3-tan.jpg", "cs3-brown.jpg", "cs3-detail.jpg"] }
  ],

  /* collections: pieces are placed on the stage with x / y / width in % and a rotation.
     In Shopify these become sliders on each piece, so the layout is edited visually. */
  collections: [
    { handle: "inverno-2026", label: "003 - INVERNO ‘26", season: "INVERNO 2026", desc: "", pieces: [] },
    { handle: "outono-2026", label: "002 - OUTONO ‘26", season: "OUTONO 2026",
      desc: "Autumn 2026 is all about imperfection: bags that showcase the natural flaws from the latex-coating process, celebrating the unique traits of LaVeg.",
      pieces: [
        { product: "carta-chocolate", img: "cut-carta-chocolate.webp", x: 4, y: 44, w: 34, r: -3, label: ["the carta", "in chocolate LaVeg"], lx: 0, ly: -14 },
        { product: "volta-black", img: "cut-volta-black.webp", x: 48, y: 2, w: 24, r: 8, label: ["the volta", "in black LaVeg"], lx: -60, ly: 16 },
        { product: "carta-olive", img: "cut-carta-olive.webp", x: 66, y: 62, w: 32, r: -6, label: ["the carta", "in olive LaVeg"], lx: -12, ly: 88 }
      ] },
    { handle: "primavera-2026", label: "001 - PRIMAVERA ‘26", season: "PRIMAVERA 2026",
      desc: "The debut: Homebound, made with ceramicist Nathalyn Nunoo. Bespoke handbags inspired by leaving and returning home.",
      pieces: [
        { product: "carta-white", img: "carta-white.jpg", x: 10, y: 14, w: 40, r: 0, label: ["the carta", "in white LaVeg"], lx: 0, ly: -14 },
        { product: "volta-black", img: "cut-volta-black.webp", x: 62, y: 30, w: 22, r: -6, label: ["the volta", "in black LaVeg"], lx: -70, ly: 10 }
      ] }
  ],

  partners: [
    { handle: "arewa", label: "Arewà Basit", name: "Arewà Basit", color: "#c59ad3",
      desc: "In February of 2026, I designed and produced a limited run of merch to celebrate the release of multidisciplinary artist Arewà Basit’s debut studio album — Archive.",
      pieces: [
        { product: "archive-beanie", img: "cut-beanie.webp", x: 58, y: 52, w: 36, r: 0, label: ["archive beanie", "hand printed"], lx: 102, ly: 50 },
        { product: "archive-drive", img: "cut-usb.webp", x: 22, y: 6, w: 36, r: -64, label: ["archive drive", "engraved steel"], lx: -40, ly: 30 }
      ] },
    { handle: "eie", label: "eie.", name: "eie.", color: "#9fc7e6", logo: "eie-logo.png",
      desc: "Artisanal jewelry by eie., an independent accessories brand from Belo Horizonte.", pieces: [],
      layout: {
        d: [ { src: "necklace1.jpg", x: 739, y: 196, w: 175, h: 217, label: "eie. necklace", lx: 623, ly: 276 },
             { src: "necklace1.jpg", x: 1187, y: 196, w: 175, h: 217, label: "eie. necklace", lx: 1077, ly: 305 } ],
        m: [ { src: "necklace1.jpg", x: 207, y: 140, w: 175, h: 217, label: "eie. necklace", lx: 90, ly: 230 },
             { src: "necklace1.jpg", x: 20, y: 400, w: 175, h: 217, label: "eie. necklace", lx: 210, ly: 490 } ] } }
  ],
  partnersIntro: "Artistic collaboration is a core part of the JCVD universe. Here are products that I designed for my clients, as well as pieces from my favorite Brazilian artists, whose work I’m proud to distribute.",
  partnersImage: "partner-model.jpg",

  products: {
    "carta-white": { name: "CARTA", variant: "in white LaVeg", collection: "primavera-2026", price: 380, soldOut: true, edge: "#8fcbe0",
      images: ["carta-white.jpg", "carta-chocolate-2.jpg", "carta-chocolate.jpg"],
      desc: "in white LaVeg with teal silk lining. part of the homebound collection with bespoke ceramic hardware by nathalyn nunoo. launched spring 2026.",
      specs: ["dimension: 27cm L x 20cm H x 8cm W", "dimension: 10” L x 8” H x 4” W", "", "exterior: 100% LaVeg", "lining: 100% silk", "", "one of one, handmade in my brooklyn studio"],
      care: "Wipe with a soft dry cloth. Keep away from direct sun and heat. Store stuffed, in its dust bag." },
    "carta-chocolate": { name: "CARTA", variant: "in chocolate LaVeg", collection: "outono-2026", price: 420, soldOut: false, edge: "#c2452f",
      images: ["carta-chocolate.jpg", "carta-chocolate-2.jpg", "carta-white.jpg"],
      desc: "in chocolate LaVeg with a fraying orange lining. latex-coated by hand, every bag is different. outono 2026.",
      specs: ["dimension: 27cm L x 20cm H x 8cm W", "dimension: 10” L x 8” H x 4” W", "", "exterior: 100% LaVeg", "lining: 100% cotton", "", "handmade in my brooklyn studio"],
      care: "Wipe with a soft dry cloth. Keep away from direct sun and heat." },
    "carta-olive": { name: "CARTA", variant: "in olive LaVeg", collection: "outono-2026", price: 420, soldOut: true, edge: "#c2452f",
      images: ["carta-chocolate-2.jpg", "carta-chocolate.jpg"],
      desc: "in olive LaVeg. outono 2026.", specs: ["dimension: 27cm L x 20cm H x 8cm W", "", "exterior: 100% LaVeg"], care: "Wipe with a soft dry cloth." },
    "volta-black": { name: "VOLTA", variant: "in black LaVeg", collection: "outono-2026", price: 620, soldOut: false, edge: "#d24a33",
      images: ["carta-chocolate.jpg", "carta-chocolate-2.jpg"],
      desc: "in black LaVeg with an orange lining. a modular all-day bag that folds into a triangle.", specs: ["dimension: 43cm L x 43cm H x 15cm W", "", "exterior: 100% LaVeg"], care: "Wipe with a soft dry cloth." },
    "archive-drive": { name: "ARCHIVE DRIVE", variant: "engraved steel", collection: "partner:arewa", price: 30, soldOut: false, edge: "#c59ad3",
      images: ["cut-usb.webp"], desc: "engraved flash drive carrying the full album.", specs: ["32 GB", "stainless steel"], care: "—" },
    "archive-beanie": { name: "ARCHIVE BEANIE", variant: "hand printed", collection: "partner:arewa", price: 45, soldOut: false, edge: "#c59ad3",
      images: ["cut-beanie.webp"], desc: "brushed cotton beanie, hand-printed with vegetable-based inks.", specs: ["100% organic cotton", "one size"], care: "Hand wash cold." }
  }
};
