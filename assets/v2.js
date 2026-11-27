// Refonte v2 — script commun à toutes les pages :
// en-tête, menu mobile, apparitions, comparateurs avant/après, filtres, formulaire.
(() => {
  const root = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Bordure de l'en-tête + barre d'action mobile une fois le haut de page dépassé
  const header = $(".header");
  const mobileCta = $("#mobile-cta");
  const top = $("main > section");
  if (top) {
    new IntersectionObserver(([e]) => {
      header.classList.toggle("is-scrolled", !e.isIntersecting);
      mobileCta && mobileCta.classList.toggle("is-on", !e.isIntersecting);
    }, { rootMargin: "-120px 0px 0px 0px" }).observe(top);
  }

  // Menu mobile
  const burger = $(".burger");
  const overlay = $(".overlay");
  if (burger && overlay) {
    const setMenu = (open) => {
      root.classList.toggle("menu-open", open);
      burger.setAttribute("aria-expanded", String(open));
      overlay.toggleAttribute("inert", !open);
      document.body.style.overflow = open ? "hidden" : "";
    };
    overlay.setAttribute("inert", "");
    burger.addEventListener("click", () => setMenu(!root.classList.contains("menu-open")));
    $$("a", overlay).forEach((a) => a.addEventListener("click", () => setMenu(false)));
    document.addEventListener("keydown", (e) => e.key === "Escape" && setMenu(false));
  }

  // Accueil : ouverture cinématique, la vidéo s'agrandit jusqu'au plein écran au défilement
  const cine = $(".cine");
  if (cine && !reduced) {
    const sticky = $(".cine__sticky", cine), slot = $(".cine__slot", cine);
    const frame = $(".cine__frame", cine);
    const text = $(".cine__text", cine), card = $(".doc-card", cine);
    const lines = $$(".cine__lines p", cine);
    frame.appendChild($("video", slot));
    cine.classList.add("is-on");
    const clamp = (v) => Math.min(Math.max(v, 0), 1);
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    let box, raf = 0;
    const measure = () => {
      const a = sticky.getBoundingClientRect(), b = slot.getBoundingClientRect();
      box = { t: b.top - a.top, l: b.left - a.left, w: b.width, h: b.height, W: a.width, H: a.height };
    };
    // La vidéo plein écran s'arrête sous la barre de menu : la tête de la sculpture reste visible.
    const hd = $(".header");
    const headerOffset = () => (hd ? hd.offsetHeight : 0);
    const update = () => {
      raf = 0;
      const r = cine.getBoundingClientRect();
      const range = Math.max(cine.offsetHeight - sticky.offsetHeight, 1);
      const p = clamp(-r.top / range);
      const e = ease(clamp(p / 0.4)), k = 1 - e, T = headerOffset();
      Object.assign(frame.style, {
        top: box.t * k + T * e + "px", left: box.l * k + "px",
        width: box.w + (box.W - box.w) * e + "px", height: box.h + (box.H - T - box.h) * e + "px",
        borderRadius: 28 * k + "px",
      });
      frame.style.setProperty("--vs", (1 + .04 * e).toFixed(4));
      frame.style.setProperty("--dark", clamp((p - .3) / .2).toFixed(3));
      const fade = clamp(p / .22);
      text.style.opacity = 1 - fade;
      text.style.transform = `translateY(${-36 * fade}px)`;
      if (card) card.style.opacity = 1 - clamp(p / .12);
      lines.forEach((el, i) => {
        const a = .42 + i * .18, last = i === lines.length - 1;
        const vin = clamp((p - a) / .06), vout = last ? 0 : clamp((p - a - .13) / .05);
        el.style.opacity = vin * (1 - vout);
        el.style.transform = `translateY(${(1 - vin) * 28 - vout * 28}px)`;
      });
    };
    const req = () => { if (!raf) raf = requestAnimationFrame(update); };
    measure(); update();
    addEventListener("scroll", req, { passive: true });
    addEventListener("resize", () => { measure(); req(); });
  }

  // Apparitions au défilement
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
  }), { rootMargin: "0px 0px -8% 0px", threshold: 0.06 });
  $$(".reveal").forEach((el) => io.observe(el));

  // Comparateurs avant / après (un ou plusieurs par page)
  const setPos = (ba, v) => ba.style.setProperty("--pos", v + "%");
  $$(".ba").forEach((ba) => {
    const range = $("input", ba);
    range.addEventListener("input", () => setPos(ba, range.value));
  });

  // Démonstration : la poignée du premier comparateur glisse une fois
  const firstBa = $(".ba[data-demo]");
  if (firstBa && !reduced) {
    const range = $("input", firstBa);
    const demo = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      demo.disconnect();
      let touched = false;
      range.addEventListener("pointerdown", () => (touched = true), { once: true });
      const t0 = performance.now() + 500, dur = 1800;
      const tick = (now) => {
        if (touched) return;
        const t = Math.min(Math.max((now - t0) / dur, 0), 1);
        const v = 50 - 18 * Math.sin(t * Math.PI * 2) * (1 - t * 0.2);
        setPos(firstBa, v.toFixed(2)); range.value = v;
        if (t < 1) requestAnimationFrame(tick); else { setPos(firstBa, 50); range.value = 50; }
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.6 });
    demo.observe(firstBa);
  }

  // Accueil : onglets qui changent le cas affiché dans le comparateur
  const U = "media/";
  const HOME_CASES = [
    { before: "2026/05/Naamloos.webp", after: "2026/05/Naamloos-3.webp", when: "12 mois après",
      desc: "Le lifting cervico-facial en plan profond améliore la ligne mandibulaire, les bajoues et le tiers moyen du visage en repositionnant les tissus mous descendus." },
    { before: "2026/08/Naamloos.webp", after: "2026/08/Naamloos-2-1-uai-1032x1299.webp", when: "12 mois après",
      desc: "Génioplastie de glissement associée à des implants PEEK sur mesure, pour accentuer les angles mandibulaires et le bord inférieur de la mandibule." },
    { before: "2026/09/voor_zwart_v1-1.webp", after: "2026/09/na_zwart_v1.webp", when: "12 mois après",
      desc: "Les deux mâchoires avancées en une seule intervention redonnent au visage le soutien qui lui manquait et rétablissent les proportions du profil. Une rhinoplastie complète l'ensemble." },
  ];
  const tabs = $$(".case[data-case]");
  if (tabs.length) {
    const ba = $("#ba");
    const range = $("input", ba);
    HOME_CASES.forEach((c) => { const i = new Image(); i.src = U + c.after; });
    tabs.forEach((btn) => btn.addEventListener("click", () => {
      const c = HOME_CASES[+btn.dataset.case];
      tabs.forEach((b) => b.setAttribute("aria-selected", String(b === btn)));
      const swap = () => {
        $("#ba-before").src = U + c.before;
        $("#ba-after").src = U + c.after;
        $("#ba-when").textContent = c.when;
        $("#case-desc").textContent = c.desc;
        range.value = 50; setPos(ba, 50);
        requestAnimationFrame(() => ba.classList.remove("is-swapping"));
      };
      if (reduced) return swap();
      ba.classList.add("is-swapping");
      setTimeout(swap, 220);
    }));
  }

  // Filtres (page Résultats, page Interventions)
  $$("[data-filters]").forEach((bar) => {
    const target = $(bar.dataset.filters);
    const btns = $$("button", bar);
    btns.forEach((b) => b.addEventListener("click", () => {
      const f = b.dataset.f;
      btns.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      $$("[data-cat]", target).forEach((item) => {
        item.hidden = f !== "all" && !item.dataset.cat.split(" ").includes(f);
      });
    }));
  });

  // Accueil : carte du visage interactive
  const fmap = $(".fmap");
  if (fmap) {
    const it = (name, dur) => [name, dur];
    const ZONES = {
      front: { t: "Front et sourcils", d: "Lifting frontal et lifting des sourcils, pour la partie haute du visage.",
        items: [it("Lifting frontal", ""), it("Lifting des sourcils", ""), it("Correction de la ligne des cheveux et reconstruction du front", "")],
        g: "lifting", f: "lifting", form: "Lifting du visage et du cou" },
      paupieres: { t: "Paupières", d: "La blépharoplastie retire l'excès de peau, et parfois de graisse, pour un regard plus ouvert et reposé.",
        items: [it("Blépharoplastie supérieure", "45 min"), it("Blépharoplastie inférieure", "1,5 h"), it("SOOF lift et blépharoplastie inférieure combinés", "4 h")],
        g: "paupieres", f: "paupieres", form: "Chirurgie des paupières" },
      nez: { t: "Nez", d: "Rhinoplastie totale, secondaire ou ethnique, correction de la bosse ou de la pointe, septoplastie.",
        items: [it("Rhinoplastie totale", "2 h"), it("Partie osseuse (bosse)", "1 h"), it("Pointe (cartilage)", "1,5 h"), it("Septoplastie", "1 h")],
        g: "nez", f: "nez", form: "Rhinoplastie" },
      pommettes: { t: "Pommettes et volumes", d: "Restaurer ou affiner les volumes du visage, par la graisse du patient, l'os ou un implant sur mesure.",
        items: [it("Lipofilling du visage complet", "3 h"), it("Réduction des boules de Bichat", "1 h"), it("Ostéotomie malaire bilatérale", "2 h"), it("Onlay malaire sur mesure", "1,5 h")],
        g: "lipofilling", f: "ortho", form: "Lipofilling et injectables" },
      oreilles: { t: "Oreilles", d: "Correction des oreilles décollées et du lobe.",
        items: [it("Correction des oreilles décollées, par côté", "1 h"), it("Correction du lobe de l'oreille, par côté", "1 h")],
        g: "oreilles", f: "", form: "Menton et contours" },
      levres: { t: "Lèvre supérieure", d: "Lifting de la lèvre supérieure, liposuccion péri-orale et injectables.",
        items: [it("Lifting de la lèvre supérieure", "1,5 h"), it("Liposuccion péri-orale (bourrelets)", "1 h"), it("Produit de comblement, par ml", "30 min")],
        g: "lifting", f: "", form: "Lipofilling et injectables" },
      machoires: { t: "Mâchoires", d: "La chirurgie des mâchoires corrige leur position et l'asymétrie faciale. Le Pr Mommaerts est un pionnier des implants conçus sur mesure à partir d'un scanner.",
        items: [it("Intervention bimaxillaire", "4 h"), it("Ostéotomie mandibulaire", "2 h"), it("Réduction de l'angle mandibulaire", "1 h"), it("Implant enveloppant sur mesure", "2 h")],
        g: "orthognathique", f: "ortho", form: "Chirurgie orthognathique" },
      menton: { t: "Menton", d: "Génioplastie, chirurgie du menton, seule ou associée à la chirurgie des mâchoires.",
        items: [it("Mentoplastie étendue", "2-3 h"), it("Mentoplastie (petite)", "2 h")],
        g: "menton", f: "ortho", form: "Menton et contours" },
      cou: { t: "Cou et ovale", d: "Du mini-lifting au lifting cervico-facial en plan profond, qui améliore la ligne mandibulaire et les bajoues.",
        items: [it("Mini-lifting du cou et de l'ovale du visage", "4 h"), it("Lifting du cou", "4-5 h"), it("Lifting cervico-facial assisté par endoscopie", "4-5 h"), it("Réduction de la pomme d'Adam", "")],
        g: "lifting", f: "lifting", form: "Lifting du visage et du cou" },
    };
    const XY = {};
    const body = $("#fmap-body"), glow = $(".fmap__glow", fmap);
    const ctrls = $$("[data-zone]", fmap);
    ctrls.forEach((b) => {
      if (b.classList.contains("fmap__dot")) XY[b.dataset.zone] = [b.style.left, b.style.top];
    });
    const render = (z) => {
      const d = ZONES[z];
      const rows = d.items.map(([n, t]) => `<li>${n}${t ? `<span><i class="ph-light ph-clock" aria-hidden="true"></i>${t}</span>` : ""}</li>`).join("");
      body.innerHTML = `<h3>${d.t}</h3><p>${d.d}</p><ul class="fmap__list">${rows}</ul>
        <div class="fmap__actions">
          <a class="btn btn--ink" href="contact.html?intervention=${encodeURIComponent(d.form)}">Demander un devis <i class="ph-light ph-arrow-right" aria-hidden="true"></i></a>
          <a class="link" href="interventions.html#${d.g}">Détails et durées</a>
          ${d.f ? `<a class="link" href="resultats.html?f=${d.f}">Voir les résultats</a>` : ""}
        </div>`;
    };
    let current = "";
    const select = (z, user) => {
      if (z === current) return;
      current = z;
      ctrls.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.zone === z)));
      if (glow && XY[z]) { glow.style.left = XY[z][0]; glow.style.top = XY[z][1]; }
      if (!user || reduced) return render(z);
      body.classList.add("is-swap");
      setTimeout(() => { render(z); requestAnimationFrame(() => body.classList.remove("is-swap")); }, 180);
    };
    ctrls.forEach((b) => b.addEventListener("click", () => select(b.dataset.zone, true)));
    select("nez", false);
  }

  // Page Résultats : filtre pré-sélectionné depuis l'URL (resultats.html?f=nez)
  const pf = new URLSearchParams(location.search).get("f");
  if (pf) { const fb = $(`[data-filters] button[data-f="${CSS.escape(pf)}"]`); fb && fb.click(); }

  // Formulaire (démo : à brancher sur l'outil de prise de rendez-vous du cabinet)
  $$(".form").forEach((form) => form.addEventListener("submit", (e) => {
    e.preventDefault();
    const missing = $$("[required]", form).find((f) => !f.value.trim() || (f.type === "email" && !f.checkValidity()));
    if (missing) { missing.focus(); missing.reportValidity && missing.reportValidity(); return; }
    // Version de test (page en noindex) : ne pas laisser croire qu'une demande est partie
    if ($('meta[name="robots"][content*="noindex"]')) {
      $(".form__ok", form).innerHTML =
        '<h3>Version de test</h3><p class="sub">Ce formulaire n\'est pas encore relié au cabinet : aucune demande n\'a été envoyée. ' +
        'Pour un rendez-vous, appelez le <a class="link" href="tel:+3235001005">+32 3 500 10 05</a>.</p>';
    }
    form.classList.add("is-sent");
  }));

  // Version de test : étiquette visible pour ne pas confondre avec le site officiel
  if ($('meta[name="robots"][content*="noindex"]')) {
    const tag = document.createElement("div");
    tag.className = "demo-tag";
    tag.textContent = "Maquette de démonstration, pas le site officiel";
    document.body.appendChild(tag);
  }

  // Pré-remplir l'intervention depuis l'URL (contact.html?intervention=…)
  const pre = new URLSearchParams(location.search).get("intervention");
  const sel = $("#f-int");
  if (pre && sel) [...sel.options].forEach((o) => { if (o.text === pre) sel.value = o.value || o.text; });
})();
