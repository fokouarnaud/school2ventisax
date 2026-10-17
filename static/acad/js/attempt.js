// Page de tentative : état de sauvegarde (HTMX), compteur de réponses et chrono.
// Le temps fait foi côté serveur : ce chrono n'est qu'un affichage, l'envoi automatique est garanti par le serveur.
(function () {
  "use strict";
  document.documentElement.classList.add("js");

  var root = document.querySelector("[data-attempt]");
  if (!root) return;
  var labels = root.dataset;

  function stateOf(form) { return form.querySelector(".save-state"); }

  function updateAnswered() {
    var total = root.querySelectorAll(".question").length;
    var done = 0;
    root.querySelectorAll(".question").forEach(function (q) {
      if (q.querySelector("input[name=choices]:checked")) done += 1;
    });
    var out = document.querySelector("[data-answered]");
    if (out) out.textContent = labels.answeredLabel.replace("%(done)s", done).replace("%(total)s", total);
  }

  document.body.addEventListener("htmx:beforeRequest", function (e) {
    var s = stateOf(e.detail.elt);
    if (s) { s.classList.remove("is-error"); s.textContent = labels.saving; }
  });
  document.body.addEventListener("htmx:afterRequest", function (e) {
    var s = stateOf(e.detail.elt);
    if (!s) return;
    var status = e.detail.xhr.status;
    if (e.detail.successful) {
      s.textContent = labels.saved;
    } else if (status === 409) {
      s.classList.add("is-error");
      s.textContent = labels.closed;
      window.location.reload();
    } else {
      s.classList.add("is-error");
      s.textContent = labels.failed;
    }
  });
  root.addEventListener("change", updateAnswered);
  updateAnswered();

  var timer = document.querySelector("[data-remaining]");
  if (!timer) return;
  var output = timer.querySelector("output");
  var end = Date.now() + parseInt(timer.dataset.remaining, 10) * 1000;

  function tick() {
    var left = Math.max(0, Math.round((end - Date.now()) / 1000));
    var m = Math.floor(left / 60), s = left % 60;
    output.textContent = m + ":" + (s < 10 ? "0" : "") + s;
    timer.classList.toggle("is-low", left <= 300);
    if (left === 0) {
      // Recharger : le serveur envoie la tentative expirée et redirige vers le résultat.
      window.location.reload();
      return;
    }
    window.setTimeout(tick, 1000);
  }
  tick();
})();
