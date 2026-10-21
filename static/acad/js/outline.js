// Sommaire du lecteur : ouvert par défaut à partir de 960px, replié sur mobile.
if (window.matchMedia("(min-width: 960px)").matches) document.getElementById("sommaire").open = true;
// Le lien « Sommaire » du bas de section ouvre le sommaire replié en plus d'y remonter.
document.addEventListener("click", function (e) {
  if (e.target.closest && e.target.closest('a[href="#sommaire"]')) document.getElementById("sommaire").open = true;
});
