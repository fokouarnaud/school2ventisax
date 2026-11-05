/* Figures interactives des sections (voir courses/figures.py).
 * Rien n'est téléchargé avant que l'apprenant ne touche « Afficher la figure interactive » :
 * styles, kit, fragment SVG (fichier statique du site, sans script) puis script de la figure.
 * Le thème suit celui du site (prefers-color-scheme). Aucun script en ligne : compatible avec la CSP. */
(() => {
  const loaded = new Map();
  const dark = window.matchMedia("(prefers-color-scheme: dark)");

  function once(key, make) {
    if (!loaded.has(key)) loaded.set(key, make());
    return loaded.get(key);
  }
  function stylesheet(href) {
    return once(href, () => new Promise((resolve, reject) => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      link.onload = resolve;
      link.onerror = reject;
      document.head.appendChild(link);
    }));
  }
  function script(src) {
    return once(src, () => new Promise((resolve, reject) => {
      const tag = document.createElement("script");
      tag.src = src;
      tag.onload = resolve;
      tag.onerror = reject;
      document.body.appendChild(tag);
    }));
  }
  function theme() {
    for (const root of document.querySelectorAll(".live-figure .iso")) root.dataset.theme = dark.matches ? "dark" : "light";
  }
  dark.addEventListener("change", theme);

  async function show(figure) {
    const button = figure.querySelector(".live-figure-load");
    const status = figure.querySelector(".live-figure-status");
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    status.textContent = figure.dataset.loading;
    try {
      const [response] = await Promise.all([
        fetch(figure.dataset.html, { credentials: "same-origin" }),
        stylesheet(figure.dataset.kitCss),
        stylesheet(figure.dataset.css),
        script(figure.dataset.kit),
      ]);
      if (!response.ok) throw new Error(response.status);
      const holder = document.createElement("div");
      holder.className = "live-figure-body";
      holder.innerHTML = await response.text(); // fichier statique du site, produit par figures/<nom>/build.mjs
      button.remove();
      status.textContent = "";
      figure.appendChild(holder);
      theme();
      await script(figure.dataset.js);
    } catch (error) {
      button.disabled = false;
      button.removeAttribute("aria-busy");
      status.textContent = figure.dataset.error;
    }
  }

  for (const figure of document.querySelectorAll(".live-figure")) {
    figure.querySelector(".live-figure-load").addEventListener("click", () => show(figure));
  }
})();
