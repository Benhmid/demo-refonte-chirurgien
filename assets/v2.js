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
  const U = "https://mauricemommaerts.clinic/wp-content/uploads/";
  const HOME_CASES = [
    { before: "2026/05/Naamloos.png", after: "2026/05/Naamloos-3.png", when: "12 mois après",
      desc: "Le lifting cervico-facial en plan profond améliore la ligne mandibulaire, les bajoues et le tiers moyen du visage en repositionnant les tissus mous descendus." },
    { before: "2026/08/Naamloos.png", after: "2026/08/Naamloos-2-1-uai-1032x1299.png", when: "12 mois après",
      desc: "Génioplastie de glissement associée à des implants PEEK sur mesure, pour accentuer les angles mandibulaires et le bord inférieur de la mandibule." },
    { before: "2026/09/voor_zwart_v1-1.png", after: "2026/09/na_zwart_v1.png", when: "12 mois après",
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
