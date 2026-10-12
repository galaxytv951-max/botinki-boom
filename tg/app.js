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
    if (btn.dataset.act === "inc") {
      setQty(id, cur + 1);
      haptic.tap();
      if (cur === 0) ping(`${byId(id).name} топочет в корзину`);
    } else {
      setQty(id, cur - 1);
      haptic.tap();
    }
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
    grid.querySelectorAll(".card").forEach((card) => {
      card.classList.toggle("hide", !(filter === "all" || card.dataset.tag === filter));
    });
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

  // ---------- старт ----------
  renderGrid(products);
  syncUI();
})();
