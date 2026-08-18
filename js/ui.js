export function toast(message, type = "info") {
  let host = document.getElementById("toast-host");
  if (!host) {
    host = document.createElement("div");
    host.id = "toast-host";
    document.body.appendChild(host);
  }
  const node = document.createElement("div");
  node.className = `toast toast--${type}`;
  node.textContent = message;
  host.appendChild(node);
  requestAnimationFrame(() => node.classList.add("toast--show"));
  setTimeout(() => {
    node.classList.remove("toast--show");
    setTimeout(() => node.remove(), 300);
  }, 3200);
}

export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else if (k === "html") node.innerHTML = v;
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) node.setAttribute(k, v);
  }
  for (const c of [].concat(children)) {
    if (c == null) continue;
    node.appendChild(typeof c === "string" || typeof c === "number" ? document.createTextNode(c) : c);
  }
  return node;
}

export function qs(sel, root = document) { return root.querySelector(sel); }
export function qsa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

export function formatDate(ts) {
  if (!ts) return "No deadline";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function statusLabel(status) {
  return (status || "").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

// Renders the shared nav bar's right-hand side based on auth state.
export function renderNavAuth(container, user, profile, isAdmin) {
  container.innerHTML = "";
  if (!user) {
    container.appendChild(el("a", { href: "login.html", class: "hide-mobile" }, "Log in"));
    container.appendChild(el("a", { href: "signup.html", class: "btn btn--accent btn--sm" }, "Sign up"));
    return;
  }
  if (isAdmin) {
    container.appendChild(el("a", { href: "admin/index.html" }, "Admin"));
  } else {
    container.appendChild(el("a", { href: "dashboard.html", class: "hide-mobile" }, "Dashboard"));
    container.appendChild(el("span", { class: "mono muted nav-name" }, (profile && profile.name) || user.email));
  }
  const logoutBtn = el("button", { class: "btn btn--outline btn--sm" }, "Log out");
  logoutBtn.addEventListener("click", async () => {
    const { logOut } = await import("./auth.js");
    await logOut();
    window.location.href = "index.html";
  });
  container.appendChild(logoutBtn);
}
