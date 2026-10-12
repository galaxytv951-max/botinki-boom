const products = [
  { id: 1, name: "Кроссы побега от понедельника", price: 4990, tag: "run", joke: "+3 к скорости, −1 к достоинству", img: "assets/shoe-1.png" },
  { id: 2, name: "Оксфорды «я на совещании»", price: 8900, tag: "formal", joke: "Шуршат так, будто ты важен", img: "assets/shoe-2.png" },
  { id: 3, name: "Тапки судьбы", price: 1290, tag: "home", joke: "Решают, идти ли на кухню", img: "assets/shoe-3.png" },
  { id: 4, name: "Ботинки грозы", price: 6400, tag: "run", joke: "Громче соседей сверху", img: "assets/shoe-4.png" },
  { id: 5, name: "Туфли дипломата", price: 7200, tag: "formal", joke: "Лакированные как твои отговорки", img: "assets/shoe-5.png" },
  { id: 6, name: "Угги для переговоров с котом", price: 3100, tag: "home", joke: "Кот всё равно выиграл", img: "assets/shoe-6.png" },
];

const grid = document.getElementById("grid");
const toast = document.getElementById("toast");
const cartCount = document.getElementById("cartCount");
const cursorBoot = document.getElementById("cursorBoot");
const cartDrawer = document.getElementById("cartDrawer");
const cartOverlay = document.getElementById("cartOverlay");
const cartItemsEl = document.getElementById("cartItems");
const cartTotalEl = document.getElementById("cartTotal");

// корзина: id -> количество
const cart = new Map();

const rub = (n) => `${n.toLocaleString("ru-RU")} ₽`;
const byId = (id) => products.find((p) => p.id === id);

function render(list) {
  grid.innerHTML = list
    .map(
      (p, i) => `
      <article class="card" style="animation-delay:${i * 60}ms" data-tag="${p.tag}">
        <div class="card-art"><img src="${p.img}" alt="${p.name}" draggable="false" /></div>
        <span class="tag">${p.joke}</span>
        <h3>${p.name}</h3>
        <div class="price">${rub(p.price)}</div>
        <button class="add" type="button" data-id="${p.id}">В корзину. Бух.</button>
      </article>`
    )
    .join("");
}

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function ping(text) {
  toast.textContent = text;
  toast.classList.add("show");
  clearTimeout(ping._t);
  ping._t = setTimeout(() => toast.classList.remove("show"), 1800);
}

function totalQty() {
  let n = 0;
  cart.forEach((q) => (n += q));
  return n;
}

function renderCart() {
  const qty = totalQty();
  cartCount.textContent = qty;

  if (!cart.size) {
    cartItemsEl.innerHTML = `
      <div class="cart-empty">
        <img src="assets/shoe-3.png" alt="" draggable="false" />
        <p>Пусто, как обещания понедельника.</p>
      </div>`;
    cartTotalEl.textContent = rub(0);
    return;
  }

  let total = 0;
  cartItemsEl.innerHTML = [...cart.entries()]
    .map(([id, q]) => {
      const p = byId(id);
      total += p.price * q;
      return `
      <div class="cart-row" data-id="${id}">
        <div class="cart-thumb"><img src="${p.img}" alt="" draggable="false" /></div>
        <div class="cart-info">
          <b>${p.name}</b>
          <span>${rub(p.price * q)}</span>
          <div class="qty">
            <button type="button" data-act="dec" aria-label="Меньше">−</button>
            <em>${q}</em>
            <button type="button" data-act="inc" aria-label="Больше">+</button>
          </div>
        </div>
        <button class="cart-del" type="button" data-act="del" aria-label="Убрать">🗑</button>
      </div>`;
    })
    .join("");
  cartTotalEl.textContent = rub(total);
}

function bumpBadge() {
  cartCount.classList.remove("pop");
  void cartCount.offsetWidth;
  cartCount.classList.add("pop");
}

function openCart() {
  cartDrawer.classList.add("open");
  cartOverlay.classList.add("open");
  cartDrawer.setAttribute("aria-hidden", "false");
}

function closeCart() {
  cartDrawer.classList.remove("open");
  cartOverlay.classList.remove("open");
  cartDrawer.setAttribute("aria-hidden", "true");
}

render(products);
renderCart();

document.getElementById("filters").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-filter]");
  if (!btn) return;
  document.querySelectorAll(".chip").forEach((c) => c.classList.toggle("on", c === btn));
  const f = btn.dataset.filter;
  [...grid.children].forEach((card) => {
    const show = f === "all" || card.dataset.tag === f;
    card.classList.toggle("hide", !show);
  });
});

grid.addEventListener("click", (e) => {
  const btn = e.target.closest(".add");
  if (!btn) return;
  const id = Number(btn.dataset.id);
  cart.set(id, (cart.get(id) || 0) + 1);
  renderCart();
  bumpBadge();
  ping(`${byId(id).name} уже топочет в корзину`);
});

cartItemsEl.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-act]");
  if (!btn) return;
  const id = Number(btn.closest(".cart-row").dataset.id);
  const act = btn.dataset.act;
  if (act === "inc") cart.set(id, cart.get(id) + 1);
  if (act === "dec") {
    const q = cart.get(id) - 1;
    q > 0 ? cart.set(id, q) : cart.delete(id);
  }
  if (act === "del") cart.delete(id);
  renderCart();
  bumpBadge();
});

document.getElementById("cartBtn").addEventListener("click", openCart);
document.getElementById("cartClose").addEventListener("click", closeCart);
cartOverlay.addEventListener("click", closeCart);
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeCart();
});

document.getElementById("clearBtn").addEventListener("click", () => {
  if (!cart.size) return;
  cart.clear();
  renderCart();
  bumpBadge();
  ping("Всё выкинуто. Ботинки в шоке.");
});

document.getElementById("checkoutBtn").addEventListener("click", () => {
  ping(cart.size ? "Оплаты пока нет — это только интерфейс 😎" : "Сначала накидай шума в корзину");
});

document.getElementById("shuffleBtn").addEventListener("click", () => {
  render(shuffle(products));
  ping("Витрина в панике. Это нормально.");
});

window.addEventListener("pointermove", (e) => {
  cursorBoot.style.left = `${e.clientX}px`;
  cursorBoot.style.top = `${e.clientY}px`;
});
