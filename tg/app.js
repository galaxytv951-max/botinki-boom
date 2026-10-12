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
  // Названия намеренно без брендов и без маркировок: это тестовая витрина.
  const CATS = {
    sneaker: { label: "кроссы", words: "кроссовки кроссы спорт" },
    high: { label: "высокие", words: "высокие хайтопы баскетбольные" },
    canvas: { label: "кеды", words: "кеды текстиль парусина" },
    boot: { label: "ботинки", words: "ботинки берцы сапоги" },
    classic: { label: "классика", words: "туфли классика офис" },
    avant: { label: "авангард", words: "авангард странные необычные дизайнерские" },
    home: { label: "дома", words: "тапки домашние угги" },
  };

  const COLORS = {
    white: { label: "белые", css: "#ffffff" },
    black: { label: "чёрные", css: "#1a1028" },
    red: { label: "красные", css: "#e5253d" },
    blue: { label: "синие", css: "#2455d6" },
    gray: { label: "серые", css: "#9a9aa8" },
    beige: { label: "бежевые", css: "#d9c3a0" },
    yellow: { label: "жёлтые", css: "#ffe600" },
    green: { label: "зелёные", css: "#58d628" },
    silver: { label: "серебристые", css: "linear-gradient(135deg,#f4f6fa,#a9b0bd)" },
    multi: { label: "разноцветные", css: "conic-gradient(#ff3d8f,#ffe600,#3df0ff,#b8ff3d,#ff3d8f)" },
  };

  // [id, название, цена, категория, цвет, мин. размер, макс. размер, шутка]
  const RAW = [
    [1, "Кроссы побега от понедельника", 4990, "sneaker", "green", 38, 46, "+3 к скорости, −1 к достоинству"],
    [2, "Оксфорды «я на совещании»", 8900, "classic", "black", 39, 46, "Шуршат так, будто ты важен"],
    [3, "Тапки судьбы", 1290, "home", "blue", 36, 45, "Решают, идти ли на кухню"],
    [4, "Ботинки грозы", 6400, "boot", "yellow", 38, 47, "Громче соседей сверху"],
    [5, "Туфли дипломата", 7200, "classic", "blue", 39, 46, "Лакированные как твои отговорки"],
    [6, "Угги для переговоров с котом", 3100, "home", "beige", 36, 44, "Кот всё равно выиграл"],
    [7, "Белые кроссы «не наступай»", 7490, "sneaker", "white", 36, 46, "Чистые ровно до первой лужи"],
    [8, "Красно-чёрные «я в игре»", 11900, "high", "red", 40, 47, "Прыжок на 3 см выше здравого смысла"],
    [9, "Баскетболки с синей душой", 10900, "high", "white", 39, 46, "Мяч не нужен, понты уже в комплекте"],
    [10, "Серые высокие «я разминаюсь»", 9900, "high", "gray", 38, 46, "Разминка длиной в жизнь"],
    [11, "Чёрные кеды для плохих стихов", 3990, "canvas", "black", 35, 46, "Идеальны для творческого кризиса"],
    [12, "Белые кеды «свободен в субботу»", 3790, "canvas", "white", 35, 46, "Белые ровно пять минут"],
    [13, "Красные кеды громкого настроения", 3890, "canvas", "red", 36, 46, "Слышно даже в тишине"],
    [14, "Синие кеды тихого омута", 3690, "canvas", "blue", 36, 45, "Тихие, но с историей"],
    [15, "Жёлтые кеды «вспышка»", 3790, "canvas", "yellow", 35, 45, "Видны из космоса и из бухгалтерии"],
    [16, "Чёрные башни-ботинки", 24900, "avant", "black", 38, 46, "Выглядят так, будто ходят сами"],
    [17, "Бежевые бугры судьбы", 21900, "avant", "beige", 38, 46, "Одна нога выше другой. Так задумано"],
    [18, "Платформы «космонавт-бухгалтер»", 18900, "avant", "black", 39, 47, "Баланс дебета и кредита на 6 см выше"],
    [19, "Угольные тракторы", 19900, "avant", "black", 38, 46, "Пашут асфальт без спроса"],
    [20, "Носок-бегемот с пальцем", 15900, "avant", "beige", 36, 45, "Два пальца — это уже философия"],
    [21, "Чёрные берцы «завтра сдам отчёт»", 8900, "boot", "black", 38, 47, "Шнуровка до самого дедлайна"],
    [22, "Серебряные ковбои с другой планеты", 14900, "avant", "silver", 37, 45, "Мерцают, даже когда не просят"],
    [23, "Зелёные подушки-сапоги", 13900, "avant", "green", 36, 45, "Пуховик, который решил ходить"],
    [24, "Чёрные клинья неясного назначения", 16900, "avant", "black", 38, 46, "Куда они — туда и ты"],
    [25, "Белые пуфики на липучках", 12900, "avant", "white", 36, 45, "Сидеть мягко, идти странно"],
    [26, "Жёлтые резиновые «лужам привет»", 5900, "boot", "yellow", 36, 46, "Лужи теперь твои друзья"],
    [27, "Челси на танковом ходу", 17900, "boot", "black", 38, 47, "Пробивают любые встречи"],
    [28, "Объёмные кроссы «облачко»", 12400, "sneaker", "blue", 36, 46, "Подошва выше амбиций"],
    [29, "Ботинки «художник сломался»", 9900, "avant", "multi", 37, 46, "Пятна — это задумка"],
    [30, "Панк-ботинки на каменном ходу", 19900, "avant", "black", 37, 46, "Три пряжки, ноль извинений"],
    [31, "Серебряные кроссы-астероид", 16900, "avant", "silver", 37, 46, "Прилетели без пересадок"],
  ];

  const norm = (s) => String(s).toLowerCase().replace(/ё/g, "е");

  const products = RAW.map(([id, name, price, cat, color, min, max, joke]) => ({
    id, name, price, cat, color, min, max, joke,
    img: `assets/shoe-${id}.png`,
    hay: norm(`${name} ${joke} ${CATS[cat].label} ${CATS[cat].words} ${COLORS[color].label}`),
  }));
  const byId = (id) => products.find((p) => p.id === id);
  const rub = (n) => `${n.toLocaleString("ru-RU")} ₽`;

  const SIZES = [];
  for (let s = 36; s <= 47; s++) SIZES.push(s);
  const PRICE_MAX = 25000;

  // размер «в наличии», если входит в линейку и не из тех, что «уже разобрали» (псевдослучайно, но стабильно)
  const inStock = (p, s) => s >= p.min && s <= p.max && (p.id * 13 + s * 7) % 8 !== 0;

  // ---------- состояние ----------
  const st = { q: "", cat: "all", size: 0, colors: new Set(), maxPrice: PRICE_MAX, sort: "def" };
  const randKey = new Map();

  const cart = new Map(); // "id:размер" -> количество
  const keyOf = (id, size) => `${id}:${size}`;
  const parseKey = (k) => {
    const [id, size] = k.split(":");
    return { p: byId(Number(id)), size: Number(size) };
  };
  let panel = null; // "cart" | "filter" | "pick" | null

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
  const qInput = $("q");
  const panels = { cart: sheet, filter: $("fsheet"), pick: $("psheet") };

  // приветствие по имени из Telegram
  const user = inTG && tg.initDataUnsafe && tg.initDataUnsafe.user;
  if (user && user.first_name) {
    $("greet").textContent = `привет, ${user.first_name}! скидка 42% на здравый смысл`;
  }

  // ---------- хелперы ----------
  const totalQty = () => { let n = 0; cart.forEach((q) => (n += q)); return n; };
  const totalSum = () => { let s = 0; cart.forEach((q, k) => (s += q * parseKey(k).p.price)); return s; };
  const qtyOfProduct = (id) => {
    let n = 0;
    cart.forEach((q, k) => { if (parseKey(k).p.id === id) n += q; });
    return n;
  };

  let toastTimer;
  function ping(text) {
    toast.textContent = text;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 1900);
  }

  // ---------- витрина ----------
  // анимируем только то, что на экране (экономия батареи и FPS)
  const io = "IntersectionObserver" in window
    ? new IntersectionObserver(
        (entries) => entries.forEach((e) => e.target.classList.toggle("live", e.isIntersecting)),
        { rootMargin: "40px" }
      )
    : null;

  const cards = new Map(); // id -> элемент (создаём один раз, потом только переставляем)

  function buildCards() {
    grid.innerHTML = products
      .map(
        (p, i) => `
        <article class="card" data-id="${p.id}" data-p="${i % 2}" data-c="${i % 3}" style="animation-delay:${Math.min(i, 8) * 50}ms">
          <div class="art">
            <img src="${p.img}" width="320" height="320" alt="${p.name}" decoding="async" draggable="false" ${i > 1 ? 'loading="lazy"' : ""} />
            <span class="inbag" hidden></span>
          </div>
          <div class="tags"><span>${CATS[p.cat].label}</span><span>${p.min}–${p.max}</span></div>
          <p class="joke">${p.joke}</p>
          <h3>${p.name}</h3>
          <div class="price">${rub(p.price)}</div>
          <div class="ctl"><button class="add" data-act="add" type="button">В корзину. Бух.</button></div>
        </article>`
      )
      .join("");
    grid.querySelectorAll(".card").forEach((el) => {
      cards.set(Number(el.dataset.id), el);
      io ? io.observe(el) : el.classList.add("live");
    });
  }

  function refreshBadges() {
    cards.forEach((el, id) => {
      const n = qtyOfProduct(id);
      const b = el.querySelector(".inbag");
      b.hidden = !n;
      if (n) b.textContent = `${n} в 🛒`;
    });
  }

  // ---------- поиск и фильтры ----------
  function matches(p) {
    if (st.cat !== "all" && p.cat !== st.cat) return false;
    if (st.size && !inStock(p, st.size)) return false;
    if (st.colors.size && !st.colors.has(p.color)) return false;
    if (p.price > st.maxPrice) return false;

    const tokens = norm(st.q).split(/\s+/).filter(Boolean);
    for (const t of tokens) {
      if (/^\d+$/.test(t) && Number(t) >= 30 && Number(t) <= 50) {
        if (!inStock(p, Number(t))) return false; // «42» в поиске = размер
        continue;
      }
      if (p.hay.includes(t)) continue;
      // «кроссовки», «красный», «серебро» — режем окончание, чтобы находило по корню
      if (t.length >= 5 && p.hay.includes(t.slice(0, Math.max(4, t.length - 2)))) continue;
      return false;
    }
    return true;
  }

  function sortList(list) {
    const l = list.slice();
    if (st.sort === "cheap") l.sort((a, b) => a.price - b.price);
    else if (st.sort === "exp") l.sort((a, b) => b.price - a.price);
    else if (st.sort === "name") l.sort((a, b) => a.name.localeCompare(b.name, "ru"));
    else if (st.sort === "rand") l.sort((a, b) => randKey.get(a.id) - randKey.get(b.id));
    return l;
  }

  const filterCount = () =>
    st.colors.size + (st.maxPrice < PRICE_MAX ? 1 : 0) + (["cheap", "exp", "name"].includes(st.sort) ? 1 : 0);
  let lastKey = "";
  function apply(animate) {
    const list = sortList(products.filter(matches));
    const shown = new Set(list.map((p) => p.id));

    // порядок + шахматная раскраска считаем по видимым карточкам
    list.forEach((p, i) => {
      const el = cards.get(p.id);
      el.classList.remove("hide");
      el.dataset.p = i % 2;
      el.dataset.c = i % 3;
      grid.appendChild(el);
    });
    cards.forEach((el, id) => { if (!shown.has(id)) el.classList.add("hide"); });

    $("noRes").hidden = list.length > 0;
    $("found").textContent =
      list.length === products.length
        ? `Всего ${products.length} пар. Выбирай, пока ботинки не передумали`
        : `Найдено: ${list.length} из ${products.length}`;

    // чипы
    document.querySelectorAll("#filters .chip").forEach((c) => c.classList.toggle("on", c.dataset.cat === st.cat));
    document.querySelectorAll("#sizeRow .chip").forEach((c) => c.classList.toggle("on", Number(c.dataset.size) === st.size));
    document.querySelectorAll("#swatches .sw").forEach((c) => c.classList.toggle("on", st.colors.has(c.dataset.color)));
    document.querySelectorAll("#sortRow .chip").forEach((c) => c.classList.toggle("on", c.dataset.sort === st.sort));
    $("qClear").hidden = !qInput.value;
    $("priceVal").textContent = st.maxPrice >= PRICE_MAX ? "любая" : rub(st.maxPrice);
    $("applyBtn").textContent = list.length ? `Показать · ${list.length}` : "Ничего нет";
    const fc = filterCount();
    $("fBadge").hidden = !fc;
    $("fBadge").textContent = fc;

    // оставшиеся карточки «выпрыгивают» заново, как желе из формы (только если порядок/состав реально изменился)
    const key = list.map((p) => p.id).join(",");
    if (animate && key !== lastKey && !reduceMotion) {
      list.slice(0, 10).forEach((p, i) => {
        const el = cards.get(p.id);
        if (!el.animate) return;
        el.animate(
          [
            { opacity: 0, transform: "translateY(16px) scale(.86, .8)" },
            { opacity: 1, transform: "translateY(-3px) scale(1.05, .96)", offset: 0.55 },
            { opacity: 1, transform: "translateY(0) scale(.98, 1.02)", offset: 0.8 },
            { opacity: 1, transform: "none" },
          ],
          { duration: 520, delay: i * 40, easing: "ease-out", fill: "backwards" }
        );
      });
    }
    lastKey = key;
    if (panel === "filter") syncUI();
  }

  function buildControls() {
    $("filters").innerHTML =
      `<button class="chip on" data-cat="all" type="button">все</button>` +
      Object.entries(CATS).map(([k, c]) => `<button class="chip" data-cat="${k}" type="button">${c.label}</button>`).join("");

    $("sizeRow").innerHTML =
      `<span class="row-label">размер</span>` +
      SIZES.map((s) => `<button class="chip sm" data-size="${s}" type="button">${s}</button>`).join("");

    $("swatches").innerHTML = Object.entries(COLORS)
      .map(([k, c]) => `<button class="sw" data-color="${k}" type="button"><i style="background:${c.css}"></i>${c.label}</button>`)
      .join("");

    $("sortRow").innerHTML = [["def", "как есть"], ["cheap", "дешевле"], ["exp", "дороже"], ["name", "по алфавиту"]]
      .map(([k, l]) => `<button class="chip" data-sort="${k}" type="button">${l}</button>`)
      .join("");
  }

  function resetAll() {
    st.q = "";
    qInput.value = "";
    st.cat = "all";
    st.size = 0;
    st.colors.clear();
    st.maxPrice = PRICE_MAX;
    $("price").value = PRICE_MAX;
    st.sort = "def";
    apply(true);
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
        .map(([key, q]) => {
          const { p, size } = parseKey(key);
          return `
          <div class="row" data-key="${key}">
            <div class="thumb"><img src="${p.img}" width="64" height="64" alt="" /></div>
            <div class="info">
              <b>${p.name}</b>
              <small>размер ${size}</small>
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
        if (panel === "cart") {
          mb.setParams({
            text: qty ? `Оформить бум · ${rub(sum)}` : "Закрыть",
            color: "#ff3d8f",
            text_color: "#ffffff",
            is_visible: true,
          });
        } else if (panel) {
          mb.hide(); // в фильтрах и выборе размера свои кнопки внутри панели
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
      dock.classList.toggle("show", qty > 0 && !panel);
    }
  }

  function setQty(key, q) {
    q > 0 ? cart.set(key, q) : cart.delete(key);
    if (panel === "cart") renderSheet();
    refreshBadges();
    syncUI();
    bumpBadge();
  }

  function addToCart(id, size) {
    const key = keyOf(id, size);
    setQty(key, (cart.get(key) || 0) + 1);
    haptic.ok();
    ping(`${byId(id).name}, р. ${size} — топочет в корзину`);
    jelly(cards.get(id).querySelector(".art"));
  }

  // ---------- панели (корзина / параметры / размер) ----------
  function openPanel(name) {
    if (panel === name) return;
    if (panel) closePanel();
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    panel = name;
    if (name === "cart") renderSheet();
    const el = panels[name];
    el.classList.add("open");
    el.setAttribute("aria-hidden", "false");
    overlay.classList.add("open");
    document.body.classList.add("lock");
    if (inTG) {
      safe(() => tg.BackButton.show());
      safe(() => tg.disableVerticalSwipes());
    }
    haptic.tap();
    syncUI();
  }

  function closePanel() {
    if (!panel) return;
    const el = panels[panel];
    panel = null;
    el.classList.remove("open");
    el.setAttribute("aria-hidden", "true");
    overlay.classList.remove("open");
    document.body.classList.remove("lock");
    if (inTG) {
      safe(() => tg.BackButton.hide());
      safe(() => tg.enableVerticalSwipes());
    }
    syncUI();
  }

  function checkout() {
    if (!cart.size) return closePanel();
    haptic.ok();
    const msg = "Оплаты пока нет — это только интерфейс 😎";
    if (inTG && typeof tg.showAlert === "function") safe(() => tg.showAlert(msg));
    else ping(msg);
  }

  function mainAction() {
    panel === "cart" ? checkout() : openPanel("cart");
  }

  // ---------- выбор размера ----------
  let pickId = 0;
  let pickSize = 0;

  function renderPicker() {
    const p = byId(pickId);
    $("sizeGrid").innerHTML = SIZES.filter((s) => s >= p.min && s <= p.max)
      .map((s) => {
        const ok = inStock(p, s);
        return `<button class="size${s === pickSize ? " on" : ""}" data-size="${s}" type="button"${ok ? "" : " disabled"}>${s}</button>`;
      })
      .join("");
    $("pHint").textContent = pickSize
      ? `Размер ${pickSize}. Отличный выбор. Ну, почти.`
      : "Выбери размер — ботинки не гадалки. Зачёркнутые уже разобрали.";
  }

  function startAdd(id) {
    const p = byId(id);
    // если в фильтре уже выбран размер — кладём сразу его
    if (st.size && inStock(p, st.size)) return addToCart(id, st.size);
    pickId = id;
    pickSize = 0;
    $("pImg").src = p.img;
    $("pName").textContent = p.name;
    $("pPrice").textContent = rub(p.price);
    renderPicker();
    openPanel("pick");
  }

  // ---------- события ----------
  grid.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const card = btn.closest(".card");
    haptic.tap();
    jelly(card.querySelector(".art"));
    startAdd(Number(card.dataset.id));
  });

  $("sizeGrid").addEventListener("click", (e) => {
    const b = e.target.closest(".size");
    if (!b || b.disabled) return;
    pickSize = Number(b.dataset.size);
    haptic.pick();
    renderPicker();
    jelly($("sizeGrid").querySelector(".on"), 420);
  });

  $("pAdd").addEventListener("click", () => {
    if (!pickSize) {
      haptic.warn();
      jelly($("sizeGrid"), 420);
      ping("Сначала размер, потом бум");
      return;
    }
    const id = pickId;
    const size = pickSize;
    closePanel();
    addToCart(id, size);
  });

  sheetItems.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const key = btn.closest(".row").dataset.key;
    const cur = cart.get(key) || 0;
    const act = btn.dataset.act;
    haptic.tap();
    if (act === "inc") setQty(key, cur + 1);
    if (act === "dec") setQty(key, cur - 1);
    if (act === "del") setQty(key, 0);
  });

  // категории
  $("filters").addEventListener("click", (e) => {
    const chip = e.target.closest("[data-cat]");
    if (!chip) return;
    st.cat = chip.dataset.cat;
    haptic.pick();
    apply(true);
  });

  // размер (повторный тап снимает фильтр)
  $("sizeRow").addEventListener("click", (e) => {
    const chip = e.target.closest("[data-size]");
    if (!chip) return;
    const s = Number(chip.dataset.size);
    st.size = st.size === s ? 0 : s;
    haptic.pick();
    apply(true);
  });

  // поиск
  let qTimer;
  qInput.addEventListener("input", () => {
    $("qClear").hidden = !qInput.value;
    clearTimeout(qTimer);
    qTimer = setTimeout(() => {
      st.q = qInput.value;
      apply(true);
    }, 140);
  });
  qInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") qInput.blur(); // прячем клавиатуру
  });
  $("qClear").addEventListener("click", () => {
    qInput.value = "";
    st.q = "";
    haptic.tap();
    apply(true);
    qInput.focus();
  });

  // панель параметров
  $("filterBtn").addEventListener("click", () => openPanel("filter"));
  $("swatches").addEventListener("click", (e) => {
    const b = e.target.closest("[data-color]");
    if (!b) return;
    const c = b.dataset.color;
    st.colors.has(c) ? st.colors.delete(c) : st.colors.add(c);
    haptic.pick();
    jelly(b, 420);
    apply(true);
  });
  $("sortRow").addEventListener("click", (e) => {
    const b = e.target.closest("[data-sort]");
    if (!b) return;
    st.sort = b.dataset.sort;
    haptic.pick();
    apply(true);
  });
  $("price").addEventListener("input", (e) => {
    st.maxPrice = Number(e.target.value);
    apply(true);
  });
  $("applyBtn").addEventListener("click", closePanel);
  $("resetBtn").addEventListener("click", () => {
    haptic.warn();
    resetAll();
  });
  $("noResReset").addEventListener("click", () => {
    haptic.tap();
    resetAll();
  });

  // тап по большому кроссовку — он «боингает»
  $("heroStage").addEventListener("pointerdown", () => {
    jelly($("heroStage"), 700);
    haptic.tap();
  });

  $("shuffleBtn").addEventListener("click", () => {
    haptic.warn();
    products.forEach((p) => randKey.set(p.id, Math.random()));
    st.sort = "rand";
    apply(true);
    ping("Витрина в панике. Это нормально.");
  });

  $("cartBtn").addEventListener("click", () => openPanel("cart"));
  overlay.addEventListener("click", closePanel);
  dockBtn.addEventListener("click", () => openPanel("cart"));
  $("checkoutBtn").addEventListener("click", checkout);
  document.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", closePanel));
  $("clearBtn").addEventListener("click", () => {
    if (!cart.size) return;
    cart.clear();
    renderSheet();
    refreshBadges();
    syncUI();
    bumpBadge();
    haptic.warn();
    ping("Всё выкинуто. Ботинки в шоке.");
  });
  window.addEventListener("keydown", (e) => e.key === "Escape" && closePanel());

  if (inTG) {
    safe(() => tg.MainButton.onClick(mainAction));
    safe(() => tg.BackButton.onClick(closePanel));
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
  buildCards();
  buildControls();
  apply(false);
  syncUI();
})();
