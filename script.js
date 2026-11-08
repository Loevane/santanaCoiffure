document.documentElement.classList.add("js");
const $ = (s, c = document) => c.querySelector(s),
  $$ = (s, c = document) => [...c.querySelectorAll(s)];
const header = $(".header"),
  burger = $(".burger"),
  menu = $("#menu");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
$("#year").textContent = new Date().getFullYear();

// Menu mobile
const setMenu = (o) => {
  menu.classList.toggle("open", o);
  burger.setAttribute("aria-expanded", o);
  document.body.style.overflow = o ? "hidden" : "";
};
burger.addEventListener("click", () =>
  setMenu(!menu.classList.contains("open")),
);
$$("a", menu).forEach((a) => a.addEventListener("click", () => setMenu(false)));
addEventListener("keydown", (e) => {
  if (e.key === "Escape") setMenu(false);
});

// Onglets des prestations
$$(".tabs button").forEach((b) =>
  b.addEventListener("click", () => {
    $$(".tabs button").forEach((x) => x.classList.toggle("on", x === b));
    $$(".panel").forEach((p) =>
      p.classList.toggle("on", p.id === b.dataset.tab),
    );
  }),
);

// Parallax, header, lien actif
const layers = $$(".parallax"),
  links = $$('.menu a[href^="#"]:not(.btn)');
const secs = links.map((a) => $(a.getAttribute("href")));
let tick = false;
function update() {
  header.classList.toggle("solid", scrollY > 40);
  if (!reduce)
    layers.forEach((l) => {
      const r = l.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      l.style.transform = `translate3d(0,${(-r.top * l.dataset.speed).toFixed(1)}px,0)`;
    });
  let cur = -1;
  secs.forEach((s, i) => {
    if (s.getBoundingClientRect().top < innerHeight * 0.4) cur = i;
  });
  links.forEach((a, i) => a.classList.toggle("act", i === cur));
  tick = false;
}
addEventListener(
  "scroll",
  () => {
    if (!tick) {
      tick = true;
      requestAnimationFrame(update);
    }
  },
  { passive: true },
);

// Avis : carrousel (avis de secours, remplacés par ceux de Planity via avis.php)
let reviews = [
  {
    r: 5,
    t: "Peu d’attente, accueil souriant et sympathique, ambiance décontractée, prestation conforme à mes attentes. Je reviendrai et je recommande.",
    d: "2026-10-16",
  },
  {
    r: 5,
    t: "Une coiffeuse au top ! Très gentille, dynamique et super agréable. Elle réalise de très belles coiffures. Je recommande à 100 %.",
    d: "2026-10-16",
  },
  {
    r: 5,
    t: "Toujours satisfaite des prestations, un super accueil. Je ressors bien coiffée et en plus j’ai passé un très bon moment.",
    d: "2026-10-01",
  },
  { r: 5, t: "Tout est impeccable.", d: "2026-09-30" },
  {
    r: 5,
    t: "Un accueil très sympathique, une professionnelle à l’écoute. Je recommande Santana coiffure.",
    d: "2026-09-26",
  },
  { r: 5, t: "Parfait, comme d’habitude.", d: "2026-09-22" },
  {
    r: 5,
    t: "Au top… Santana est très accueillante, toujours le sourire, et le travail est fait à 100 %. Je recommande.",
    d: "2026-09-06",
  },
];
const track = $("#track"),
  dots = $("#dots"),
  car = $(".carousel");
let idx = 0,
  timer,
  shown = 0,
  lastSig = "";
const per = () => (innerWidth > 900 ? 3 : innerWidth > 600 ? 2 : 1);
const maxIdx = () => Math.max(0, reviews.length - per());
function build() {
  track.textContent = "";
  reviews.forEach((v) => {
    const n = Math.min(5, Math.max(0, Math.round(v.r))),
      d = new Date(v.d);
    const s = document.createElement("div"),
      f = document.createElement("figure"),
      st = document.createElement("div"),
      q = document.createElement("blockquote"),
      c = document.createElement("figcaption");
    s.className = "slide";
    st.className = "stars";
    st.setAttribute("role", "img");
    st.setAttribute("aria-label", "Note " + n + " sur 5");
    st.textContent = "★".repeat(n) + "☆".repeat(5 - n);
    q.textContent = v.t;
    c.textContent =
      "Avis Planity" +
      (isNaN(d)
        ? ""
        : " · " +
          d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" }));
    f.append(st, q, c);
    s.append(f);
    track.append(s);
  });
  go(0);
  drawDots();
}
function drawDots() {
  dots.textContent = "";
  for (let i = 0; i <= maxIdx(); i++) {
    const b = document.createElement("button");
    b.type = "button";
    b.setAttribute("aria-label", "Avis " + (i + 1));
    b.onclick = () => {
      go(i);
      restart();
    };
    dots.append(b);
  }
  go(idx);
}
function go(i) {
  const p = per(),
    m = maxIdx();
  idx = i > m ? 0 : i < 0 ? m : i;
  car.style.setProperty("--per", p);
  track.style.transform = `translateX(${(-idx * 100) / p}%)`;
  [...dots.children].forEach((b, k) => b.classList.toggle("on", k === idx));
}
function restart() {
  clearInterval(timer);
  if (!reduce) timer = setInterval(() => go(idx + 1), 5000);
}
$("#prev").onclick = () => {
  go(idx - 1);
  restart();
};
$("#next").onclick = () => {
  go(idx + 1);
  restart();
};
car.addEventListener("mouseenter", () => clearInterval(timer));
car.addEventListener("mouseleave", restart);
car.addEventListener("focusin", () => clearInterval(timer));
let x0 = 0;
car.addEventListener(
  "touchstart",
  (e) => {
    x0 = e.touches[0].clientX;
  },
  { passive: true },
);
car.addEventListener("touchend", (e) => {
  const dx = e.changedTouches[0].clientX - x0;
  if (Math.abs(dx) > 40) {
    go(idx + (dx < 0 ? 1 : -1));
    restart();
  }
});
addEventListener("resize", () => {
  drawDots();
  update();
});

// Note et avis en direct depuis Planity (via avis.php, mis en cache 15 min côté serveur)
const fmt = (n) =>
  Number(n).toLocaleString("fr-FR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
async function live() {
  try {
    const res = await fetch("avis.php", { cache: "no-store" });
    if (!res.ok) return;
    const d = await res.json();
    if (d.rating > 0 && d.rating <= 5)
      $$("[data-rating]").forEach((e) => (e.textContent = fmt(d.rating)));
    if (d.count > 0)
      $$("[data-count]").forEach((e) => (e.textContent = d.count));
    if (Array.isArray(d.reviews)) {
      const list = d.reviews
        .filter((v) => v && typeof v.t === "string" && v.t.trim())
        .slice(0, 12);
      const sig = JSON.stringify(list);
      if (list.length && sig !== lastSig) {
        lastSig = sig;
        reviews = list;
        build();
      }
    }
  } catch (e) {
    /* on garde les valeurs affichées */
  }
}

// Formulaire de contact
const form = $("#cform"),
  msg = $("#fmsg");
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }
  const b = $("button[type=submit]", form);
  b.disabled = true;
  msg.className = "";
  msg.textContent = "Envoi en cours…";
  try {
    const r = await fetch(form.action, {
        method: "POST",
        body: new FormData(form),
      }),
      d = await r.json();
    msg.textContent = d.message;
    msg.className = d.ok ? "ok" : "err";
    if (d.ok) form.reset();
  } catch (_) {
    msg.textContent = "L’envoi a échoué. Merci d’appeler le salon.";
    msg.className = "err";
  }
  b.disabled = false;
});

build();
restart();
update();
live();
setInterval(live, 600000);
