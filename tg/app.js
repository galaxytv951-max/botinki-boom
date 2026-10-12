(() => {
  "use strict";

  // ---------- Telegram ----------
  const tg = window.Telegram && window.Telegram.WebApp;
  const inTG = !!(tg && tg.initData); // true только внутри настоящего Telegram

  const safe = (fn) => {
    try { fn(); } catch (_) { /* старые версии клиента: молча пропускаем */ }
  };

  if (tg) {
    safe(() => tg.ready());
    safe(() => tg.expand());
  }
  if (inTG) {
    document.documentElement.classList.add("in-tg");
    safe(() => tg.setHeaderColor("#fff6dc"));
    safe(() => tg.setBackgroundColor("#fff6dc"));
    safe(() => tg.setBottomBarColor("#fff6dc"));

    // на телефоне открываем на весь экран: пропадает верхняя шапка Telegram с названием
    // (нужен клиент с Bot API 8.0+; на старых просто останется обычный режим)
    const mobile = /^(android|android_x|ios)$/.test(tg.platform || "");
    if (mobile && typeof tg.requestFullscreen === "function" && tg.isVersionAtLeast && tg.isVersionAtLeast("8.0")) {
      safe(() => tg.requestFullscreen());
    }
  }

  // ---------- желе ----------
  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // «боинг»: сплющило → вытянуло → успокоилось
  const JELLY = [
    { transform: "scale(1, 1)" },
    { transform: "scale(1.16, .8)", offset: 0.18 },
    { transform: "scale(.88, 1.16)", offset: 0.4 },
    { transform: "scale(1.08, .94)", offset: 0.62 },
    { transform: "scale(.98, 1.03)", offset: 0.82 },
    { transform: "scale(1, 1)" },
  ];
  function jelly(el, duration) {
    if (!el || reduceMotion || !el.animate) return;
    el.animate(JELLY, { duration: duration || 560, easing: "ease-out" });
  }

  const haptic = {
    tap: () => inTG && safe(() => tg.HapticFeedback.impactOccurred("light")),
    pick: () => inTG && safe(() => tg.HapticFeedback.selectionChanged()),
    ok: () => inTG && safe(() => tg.HapticFeedback.notificationOccurred("success")),
    warn: () => inTG && safe(() => tg.HapticFeedback.notificationOccurred("warning")),
  };

  // ---------- данные ----------
  const products = [
    { id: 1, name: "Кроссы побега от понедельника", price: 4990, tag: "run", joke: "+3 к скорости, −1 к достоинству", img: "assets/shoe-1.png" },
    { id: 2, name: "Оксфорды «я на совещании»", price: 8900, tag: "formal", joke: "Шуршат так, будто ты важен", img: "assets/shoe-2.png" },
    { id: 3, name: "Тапки судьбы", price: 1290, tag: "home", joke: "Решают, идти ли на кухню", img: "assets/shoe-3.png" },
    { id: 4, name: "Ботинки грозы", price: 6400, tag: "run", joke: "Громче соседей сверху", img: "assets/shoe-4.png" },
    { id: 5, name: "Туфли дипломата", price: 7200, tag: "formal", joke: "Лакированные как твои отговорки", img: "assets/shoe-5.png" },
    { id: 6, name: "Угги для переговоров с котом", price: 3100, tag: "home", joke: "Кот всё равно выиграл", img: "assets/shoe-6.png" },
  ];
  const byId = (id) => products.find((p) => p.id === id);
  const rub = (n) => `${n.toLocaleString("ru-RU")} ₽`;

  const cart = new Map(); // id -> количество
  let cartOpen = false;

  // ---------- DOM ----------
  const $ = (id) => document.getElementById(id);
  const grid = $("grid");
  const toast = $("toast");
  const cartCount = $("cartCount");
  const sheet = $("sheet");
  const overlay = $("overlay");
  const sheetItems = $("sheetItems");
  const sheetTotal = $("sheetTotal");
  const dock = $("dock");
  const dockBtn = $("dockBtn");

  // приветствие по имени из Telegram
  const user = inTG && tg.initDataUnsafe && tg.initDataUnsafe.user;
  if (user && user.first_name) {
    $("greet").textContent = `привет, ${user.first_name}! скидка 42% на здравый смысл`;
  }

  // ---------- хелперы ----------
  const totalQty = () => { let n = 0; cart.forEach((q) => (n += q)); return n; };
  const totalSum = () => { let s = 0; cart.forEach((q, id) => (s += q * byId(id).price)); return s; };

  let toastTimer;
  function ping(text) {
    toast.textContent = text;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 1700);
  }

  // ---------- витрина ----------
  function ctlHtml(id) {
    const q = cart.get(id) || 0;
    return q
      ? `<button class="step" data-act="dec" aria-label="Меньше">−</button><em>${q}</em><button class="step" data-act="inc" aria-label="Больше">+</button>`
      : `<button class="add" data-act="inc">В корзину. Бух.</button>`;
  }

  let filter = "all";

  function renderGrid(list) {
    grid.innerHTML = list
      .map(
        (p, i) => `
        <article class="card${filter === "all" || filter === p.tag ? "" : " hide"}" data-id="${p.id}" data-tag="${p.tag}" style="animation-delay:${i * 50}ms">
          <div class="art"><img src="${p.img}" width="320" height="320" alt="${p.name}" decoding="async" draggable="false" ${i > 1 ? 'loading="lazy"' : ""} /></div>
          <p class="joke">${p.joke}</p>
          <h3>${p.name}</h3>
          <div class="price">${rub(p.price)}</div>
          <div class="ctl">${ctlHtml(p.id)}</div>
        </article>`
      )
      .join("");
    observeCards();
  }

  // анимируем только то, что на экране (экономия батареи и FPS)
  const io = "IntersectionObserver" in window
    ? new IntersectionObserver(
        (entries) => entries.forEach((e) => e.target.classList.toggle("live", e.isIntersecting)),
        { rootMargin: "40px" }
      )
    : null;

  function observeCards() {
    grid.querySelectorAll(".card").forEach((c) => (io ? io.observe(c) : c.classList.add("live")));
  }

  function refreshCardCtl(id) {
    const card = grid.querySelector(`.card[data-id="${id}"] .ctl`);
    if (card) card.innerHTML = ctlHtml(id);
  }

  // ---------- корзина ----------
  function renderSheet() {
    if (!cart.size) {
      sheetItems.innerHTML = `
        <div class="empty">
          <img src="assets/shoe-3.png" width="130" height="130" alt="" />
          <p>Пусто, как обещания понедельника.</p>
        </div>`;
    } else {
      sheetItems.innerHTML = [...cart.entries()]
        .map(([id, q]) => {
          const p = byId(id);
          return `
          <div class="row" data-id="${id}">
            <div class="thumb"><img src="${p.img}" width="64" height="64" alt="" /></div>
            <div class="info">
              <b>${p.name}</b>
              <span>${rub(p.price * q)}</span>
              <div class="qty">
                <button data-act="dec" aria-label="Меньше">−</button>
                <em>${q}</em>
                <button data-act="inc" aria-label="Больше">+</button>
              </div>
            </div>
            <button class="del" data-act="del" aria-label="Убрать">🗑</button>
          </div>`;
        })
        .join("");
    }
    sheetTotal.textContent = rub(totalSum());
  }

  function bumpBadge() {
    cartCount.classList.remove("pop");
    void cartCount.offsetWidth;
    cartCount.classList.add("pop");
  }

  function syncUI() {
    const qty = totalQty();
    const sum = totalSum();
    cartCount.textContent = qty;

    if (inTG) {
      const mb = tg.MainButton;
      safe(() => {
        if (cartOpen) {
          mb.setParams({
            text: qty ? `Оформить бум · ${rub(sum)}` : "Закрыть",
            color: "#ff3d8f",
            text_color: "#ffffff",
            is_visible: true,
          });
        } else if (qty) {
          mb.setParams({
            text: `Корзина · ${qty} шт · ${rub(sum)}`,
            color: "#ff3d8f",
            text_color: "#ffffff",
            is_visible: true,
          });
        } else {
          mb.hide();
        }
      });
    } else {
      dockBtn.textContent = `Корзина · ${qty} шт · ${rub(sum)}`;
      dock.classList.toggle("show", qty > 0 && !cartOpen);
    }
  }

  function setQty(id, q) {
    q > 0 ? cart.set(id, q) : cart.delete(id);
    refreshCardCtl(id);
    if (cartOpen) renderSheet();
    syncUI();
    bumpBadge();
  }

  function openCart() {
    if (cartOpen) return;
    cartOpen = true;
    renderSheet();
    sheet.classList.add("open");
    overlay.classList.add("open");
    sheet.setAttribute("aria-hidden", "false");
    document.body.classList.add("lock");
    if (inTG) {
      safe(() => tg.BackButton.show());
      safe(() => tg.disableVerticalSwipes());
    }
    haptic.tap();
    syncUI();
  }

  function closeCart() {
    if (!cartOpen) return;
    cartOpen = false;
    sheet.classList.remove("open");
    overlay.classList.remove("open");
    sheet.setAttribute("aria-hidden", "true");
    document.body.classList.remove("lock");
    if (inTG) {
      safe(() => tg.BackButton.hide());
      safe(() => tg.enableVerticalSwipes());
    }
    syncUI();
  }

  function checkout() {
    if (!cart.size) return closeCart();
    haptic.ok();
    const msg = "Оплаты пока нет — это только интерфейс 😎";
    if (inTG && typeof tg.showAlert === "function") safe(() => tg.showAlert(msg));
    else ping(msg);
  }

  function mainAction() {
    cartOpen ? checkout() : openCart();
  }

  // ---------- события ----------
  grid.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const id = Number(btn.closest(".card").dataset.id);
    const cur = cart.get(id) || 0;
    const card = btn.closest(".card");
    if (btn.dataset.act === "inc") {
      setQty(id, cur + 1);
      haptic.tap();
      if (cur === 0) ping(`${byId(id).name} топочет в корзину`);
    } else {
      setQty(id, cur - 1);
      haptic.tap();
    }
    jelly(card.querySelector(".art"));
    jelly(card.querySelector(".ctl em"), 420);
  });

  sheetItems.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const id = Number(btn.closest(".row").dataset.id);
    const cur = cart.get(id) || 0;
    const act = btn.dataset.act;
    haptic.tap();
    if (act === "inc") setQty(id, cur + 1);
    if (act === "dec") setQty(id, cur - 1);
    if (act === "del") setQty(id, 0);
  });

  $("filters").addEventListener("click", (e) => {
    const chip = e.target.closest("[data-filter]");
    if (!chip) return;
    filter = chip.dataset.filter;
    haptic.pick();
    document.querySelectorAll(".chip").forEach((c) => c.classList.toggle("on", c === chip));
    let n = 0;
    grid.querySelectorAll(".card").forEach((card) => {
      const show = filter === "all" || card.dataset.tag === filter;
      card.classList.toggle("hide", !show);
      // оставшиеся карточки «выпрыгивают» заново, как желе из формы
      if (show && !reduceMotion && card.animate) {
        card.animate(
          [
            { opacity: 0, transform: "translateY(16px) scale(.86, .8)" },
            { opacity: 1, transform: "translateY(-3px) scale(1.05, .96)", offset: 0.55 },
            { opacity: 1, transform: "translateY(0) scale(.98, 1.02)", offset: 0.8 },
            { opacity: 1, transform: "none" },
          ],
          { duration: 520, delay: n++ * 45, easing: "ease-out", fill: "backwards" }
        );
      }
    });
  });

  // тап по большому кроссовку — он «боингает»
  $("heroStage").addEventListener("pointerdown", () => {
    jelly($("heroStage"), 700);
    haptic.tap();
  });

  $("shuffleBtn").addEventListener("click", () => {
    haptic.warn();
    renderGrid([...products].sort(() => Math.random() - 0.5));
    ping("Витрина в панике. Это нормально.");
  });

  $("cartBtn").addEventListener("click", openCart);
  $("sheetClose").addEventListener("click", closeCart);
  overlay.addEventListener("click", closeCart);
  dockBtn.addEventListener("click", openCart);
  $("checkoutBtn").addEventListener("click", checkout);
  $("clearBtn").addEventListener("click", () => {
    if (!cart.size) return;
    const ids = [...cart.keys()];
    cart.clear();
    ids.forEach(refreshCardCtl);
    renderSheet();
    syncUI();
    bumpBadge();
    haptic.warn();
    ping("Всё выкинуто. Ботинки в шоке.");
  });
  window.addEventListener("keydown", (e) => e.key === "Escape" && closeCart());

  if (inTG) {
    safe(() => tg.MainButton.onClick(mainAction));
    safe(() => tg.BackButton.onClick(closeCart));
  }

  // ---------- желейный скролл ----------
  // Две пружины: пока крутишь палец, карточки слегка вытягиваются и кренятся,
  // а когда отпустил — пружинят обратно с небольшим перелётом.
  // Нечётные и чётные карточки идут на разных пружинах, поэтому получается волна.
  if (!reduceMotion) {
    const appEl = document.querySelector(".app");
    // x — наклон/вытяжка карточки;
    // l — «запаздывание» ботинка внутри карточки (он ползёт по инерции);
    // q — сжатие ботинка: при рывке прижался, потом разжался с перелётом и подпрыгнул.
    // Значения c малы нарочно: пружины недодемпфированы, поэтому качаются.
    const springs = [
      { name: "a", x: 0, v: 0, k: 140, c: 7.5, l: 0, lv: 0, lk: 75, lc: 4.4, q: 0, qv: 0, qk: 120, qc: 5 },
      { name: "b", x: 0, v: 0, k: 100, c: 6.5, l: 0, lv: 0, lk: 60, lc: 4, q: 0, qv: 0, qk: 95, qc: 4.4 },
    ];
    const rest = (p, v) => Math.abs(p) < 0.01 && Math.abs(v) < 0.08;
    const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
    let lastY = window.scrollY;
    let lastT = 0;
    let smooth = 0;
    let raf = 0;
    let calm = 0;

    const paint = () => {
      springs.forEach((s) => {
        const n = s.name;
        // карточка: крен + вытяжка
        appEl.style.setProperty(`--${n}-sk`, `${(s.x * 3.4).toFixed(3)}deg`);
        appEl.style.setProperty(`--${n}-sx`, (1 - Math.abs(s.x) * 0.04).toFixed(4));
        appEl.style.setProperty(`--${n}-sy`, (1 + Math.abs(s.x) * 0.075).toFixed(4));
        // ботинок внутри: сдвиг по инерции + сплющивание (q<0 после остановки = растянулся вверх)
        appEl.style.setProperty(`--${n}-ty`, `${(s.l * 11).toFixed(2)}px`);
        appEl.style.setProperty(`--${n}-ssy`, clamp(1 - s.q * 0.2, 0.62, 1.32).toFixed(4));
        appEl.style.setProperty(`--${n}-ssx`, clamp(1 + s.q * 0.12, 0.8, 1.2).toFixed(4));
      });
    };

    const tick = (t) => {
      const dt = clamp((t - lastT) / 1000, 0.001, 0.032);
      lastT = t;
      const y = window.scrollY;
      const speed = (y - lastY) / dt; // px/сек, со знаком
      lastY = y;
      smooth += (speed - smooth) * 0.3;
      const target = clamp(smooth / 1100, -1.4, 1.4);
      const press = Math.abs(target); // сжатие не зависит от направления

      let alive = Math.abs(target) > 0.01;
      springs.forEach((s) => {
        let acc = -s.k * (s.x - target) - s.c * s.v;
        s.v += acc * dt;
        s.x += s.v * dt;

        acc = -s.lk * (s.l - target) - s.lc * s.lv;
        s.lv += acc * dt;
        s.l += s.lv * dt;

        acc = -s.qk * (s.q - press) - s.qc * s.qv;
        s.qv += acc * dt;
        s.q += s.qv * dt;

        if (!rest(s.x, s.v) || !rest(s.l, s.lv) || !rest(s.q, s.qv)) alive = true;
      });
      paint();

      calm = alive ? 0 : calm + 1;
      if (calm > 6) {
        // всё успокоилось: ровняем и выключаем цикл, чтобы не жечь батарею
        springs.forEach((s) => { s.x = s.v = s.l = s.lv = s.q = s.qv = 0; });
        paint();
        document.body.classList.remove("moving");
        raf = 0;
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener(
      "scroll",
      () => {
        if (raf) return;
        lastT = performance.now();
        calm = 0;
        document.body.classList.add("moving");
        raf = requestAnimationFrame(tick);
      },
      { passive: true }
    );
  }

  // ---------- старт ----------
  renderGrid(products);
  syncUI();
})();
