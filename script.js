const platno = document.getElementById("igra");
const ctx = platno.getContext("2d");
const tockeEl = document.getElementById("tocke");
const casEl = document.getElementById("cas");
const tezavnostEl = document.getElementById("tezavnost");
const zacetekGumb = document.getElementById("zacetek");
const premorGumb = document.getElementById("premor");
const navodilaGumb = document.getElementById("navodila");

const SIRINA = platno.width;
const VISINA = platno.height;

const polmerZoge = 10;
const visinaPloscka = 14;
const srednjiPloscek = 110;
const hitrostPloscka = 4;
const odmikPlosckaSpodaj = 18;

const vrsticeOpek = 5;
const stolpciOpek = 5;
const razmikOpek = 10;
const odmikOpekZgoraj = 52;
const odmikOpekStran = 18;
const visinaOpeke = 24;

const paleteOpek = [
  { base: "#ff6454", edge: "#ffe2c3", glow: "rgba(255, 100, 84, 0.34)", crta: "#7f2f28" },
  { base: "#ffc247", edge: "#fff4c2", glow: "rgba(255, 194, 71, 0.34)", crta: "#8f5d14" },
  { base: "#28c7d0", edge: "#e4ffff", glow: "rgba(40, 199, 208, 0.34)", crta: "#0d5f75" }
];

const tezavnosti = {
  easy: 136,
  medium: srednjiPloscek,
  hard: 88
};

let sirinaOpeke;
let opeke = [];
let xZoga;
let yZoga;
let dx;
let dy;
let xPloscek;
let sirinaPloscka = tezavnosti[tezavnostEl.value];
let desnoDrzi = false;
let levoDrzi = false;
let tocke = 0;
let preteceneSekunde = 0;
let timerId = null;
let frameId = null;
let stanjeIgre = "ready";

function zapisCasa(sekundeSkupaj) {
  const minute = String(Math.floor(sekundeSkupaj / 60)).padStart(2, "0");
  const sekunde = String(sekundeSkupaj % 60).padStart(2, "0");
  return `${minute}:${sekunde}`;
}

function osveziTocke() {
  tockeEl.textContent = String(tocke);
}

function osveziCas() {
  casEl.textContent = zapisCasa(preteceneSekunde);
}

function pocistiPlatno() {
  ctx.clearRect(0, 0, SIRINA, VISINA);
}

function potZaZaobljenRect(x, y, sirina, visina, radij) {
  const praviRadij = Math.min(radij, sirina / 2, visina / 2);

  ctx.beginPath();
  ctx.moveTo(x + praviRadij, y);
  ctx.lineTo(x + sirina - praviRadij, y);
  ctx.quadraticCurveTo(x + sirina, y, x + sirina, y + praviRadij);
  ctx.lineTo(x + sirina, y + visina - praviRadij);
  ctx.quadraticCurveTo(x + sirina, y + visina, x + sirina - praviRadij, y + visina);
  ctx.lineTo(x + praviRadij, y + visina);
  ctx.quadraticCurveTo(x, y + visina, x, y + visina - praviRadij);
  ctx.lineTo(x, y + praviRadij);
  ctx.quadraticCurveTo(x, y, x + praviRadij, y);
  ctx.closePath();
}

function narisiKrog(x, y, polmer, polnilo) {
  ctx.beginPath();
  ctx.arc(x, y, polmer, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.fillStyle = polnilo;
  ctx.fill();
}


function narisiZogo() {
  ctx.save();
  ctx.shadowBlur = 18;
  ctx.shadowColor = "rgba(255, 209, 98, 0.55)";

  const preliv = ctx.createRadialGradient(xZoga - 3, yZoga - 4, 2, xZoga, yZoga, polmerZoge + 2);
  preliv.addColorStop(0, "#fffdf0");
  preliv.addColorStop(0.35, "#ffe07f");
  preliv.addColorStop(1, "#ff8a45");

  narisiKrog(xZoga, yZoga, polmerZoge, preliv);

  ctx.shadowBlur = 0;
  narisiKrog(xZoga - 3, yZoga - 4, 2.5, "rgba(255, 255, 255, 0.7)");
  ctx.restore();
}

function narisiPloscek() {
  const yPloscek = VISINA - visinaPloscka - odmikPlosckaSpodaj;
  const preliv = ctx.createLinearGradient(xPloscek, yPloscek, xPloscek, yPloscek + visinaPloscka);
  preliv.addColorStop(0, "#5fe0d2");
  preliv.addColorStop(0.5, "#21b5be");
  preliv.addColorStop(1, "#0e86ab");

  ctx.save();
  ctx.shadowBlur = 20;
  ctx.shadowColor = "rgba(42, 189, 197, 0.42)";
  potZaZaobljenRect(xPloscek, yPloscek, sirinaPloscka, visinaPloscka, 8);
  ctx.fillStyle = preliv;
  ctx.fill();
  ctx.restore();

  potZaZaobljenRect(xPloscek + 6, yPloscek + 2, sirinaPloscka - 12, 3, 2);
  ctx.fillStyle = "rgba(255, 255, 255, 0.42)";
  ctx.fill();

  ctx.save();
  ctx.strokeStyle = "rgba(8, 80, 110, 0.55)";
  ctx.lineWidth = 1.5;
  potZaZaobljenRect(xPloscek, yPloscek, sirinaPloscka, visinaPloscka, 8);
  ctx.stroke();
  ctx.restore();
}

function ustvariOpeke() {
  sirinaOpeke = (SIRINA - odmikOpekStran * 2 - razmikOpek * (stolpciOpek - 1)) / stolpciOpek;
  opeke = [];

  for (let vrstica = 0; vrstica < vrsticeOpek; vrstica += 1) {
    opeke[vrstica] = [];

    for (let stolpec = 0; stolpec < stolpciOpek; stolpec += 1) {
      const xOpeka = odmikOpekStran + stolpec * (sirinaOpeke + razmikOpek);
      const yOpeka = odmikOpekZgoraj + vrstica * (visinaOpeke + razmikOpek);

      opeke[vrstica][stolpec] = {
        x: xOpeka,
        y: yOpeka,
        aktivna: true,
        paleta: paleteOpek[vrstica % paleteOpek.length]
      };
    }
  }
}

function narisiOpeko(opeka) {
  const preliv = ctx.createLinearGradient(opeka.x, opeka.y, opeka.x, opeka.y + visinaOpeke);
  preliv.addColorStop(0, opeka.paleta.edge);
  preliv.addColorStop(0.2, opeka.paleta.base);
  preliv.addColorStop(1, opeka.paleta.base);

  ctx.save();
  ctx.shadowBlur = 18;
  ctx.shadowColor = opeka.paleta.glow;
  potZaZaobljenRect(opeka.x, opeka.y, sirinaOpeke, visinaOpeke, 8);
  ctx.fillStyle = preliv;
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = opeka.paleta.crta;
  ctx.lineWidth = 1.5;
  potZaZaobljenRect(opeka.x, opeka.y, sirinaOpeke, visinaOpeke, 8);
  ctx.stroke();
  ctx.restore();

  potZaZaobljenRect(opeka.x + 6, opeka.y + 3, sirinaOpeke - 12, 4, 2);
  ctx.fillStyle = "rgba(255, 255, 255, 0.42)";
  ctx.fill();
}

function narisiOpeke() {
  for (let vrstica = 0; vrstica < vrsticeOpek; vrstica += 1) {
    for (let stolpec = 0; stolpec < stolpciOpek; stolpec += 1) {
      const opeka = opeke[vrstica][stolpec];
      if (!opeka.aktivna) {
        continue;
      }

      narisiOpeko(opeka);
    }
  }
}

function premakniPloscek() {
  if (desnoDrzi) {
    xPloscek = Math.min(xPloscek + hitrostPloscka, SIRINA - sirinaPloscka);
  } else if (levoDrzi) {
    xPloscek = Math.max(xPloscek - hitrostPloscka, 0);
  }
}

function odbijOdPloscka(naslednjiX) {
  const sredinaPloscka = xPloscek + sirinaPloscka / 2;
  const zadetek = (naslednjiX - sredinaPloscka) / (sirinaPloscka / 2);
  dx = zadetek * 1.5;
  dy = -Math.abs(dy);
}

function preveriOpeke(naslednjiX, naslednjiY) {
  for (let vrstica = 0; vrstica < vrsticeOpek; vrstica += 1) {
    for (let stolpec = 0; stolpec < stolpciOpek; stolpec += 1) {
      const opeka = opeke[vrstica][stolpec];
      if (!opeka.aktivna) {
        continue;
      }

      const zadaneOpeko =
        naslednjiX + polmerZoge > opeka.x &&
        naslednjiX - polmerZoge < opeka.x + sirinaOpeke &&
        naslednjiY + polmerZoge > opeka.y &&
        naslednjiY - polmerZoge < opeka.y + visinaOpeke;

      if (!zadaneOpeko) {
        continue;
      }

      opeka.aktivna = false;
      tocke += 1;
      osveziTocke();

      const prekrivanjeLevo = naslednjiX + polmerZoge - opeka.x;
      const prekrivanjeDesno = opeka.x + sirinaOpeke - (naslednjiX - polmerZoge);
      const prekrivanjeZgoraj = naslednjiY + polmerZoge - opeka.y;
      const prekrivanjeSpodaj = opeka.y + visinaOpeke - (naslednjiY - polmerZoge);
      const najmanjsePrekrivanje = Math.min(
        prekrivanjeLevo,
        prekrivanjeDesno,
        prekrivanjeZgoraj,
        prekrivanjeSpodaj
      );

      if (najmanjsePrekrivanje === prekrivanjeLevo || najmanjsePrekrivanje === prekrivanjeDesno) {
        dx = -dx;
      } else {
        dy = -dy;
      }

      if (tocke === vrsticeOpek * stolpciOpek) {
        koncajIgro(true);
      }

      return;
    }
  }
}

function posodobiIgro() {
  premakniPloscek();

  let naslednjiX = xZoga + dx;
  let naslednjiY = yZoga + dy;
  const yPloscek = VISINA - visinaPloscka - odmikPlosckaSpodaj;

  preveriOpeke(naslednjiX, naslednjiY);
  if (stanjeIgre !== "playing") {
    return;
  }

  naslednjiX = xZoga + dx;
  naslednjiY = yZoga + dy;

  if (naslednjiX + polmerZoge > SIRINA || naslednjiX - polmerZoge < 0) {
    dx = -dx;
    naslednjiX = xZoga + dx;
  }

  if (naslednjiY - polmerZoge < 0) {
    dy = -dy;
    naslednjiY = yZoga + dy;
  } else if (
    naslednjiY + polmerZoge >= yPloscek &&
    naslednjiY + polmerZoge <= yPloscek + visinaPloscka &&
    naslednjiX > xPloscek &&
    naslednjiX < xPloscek + sirinaPloscka &&
    dy > 0
  ) {
    odbijOdPloscka(naslednjiX);
    naslednjiX = xZoga + dx;
    naslednjiY = yZoga + dy;
  } else if (naslednjiY + polmerZoge > VISINA) {
    koncajIgro(false);
    return;
  }

  xZoga = naslednjiX;
  yZoga = naslednjiY;
}

//ozadje igre (valovi)
function narisiOzadje() {
  const morje = ctx.createLinearGradient(0, 0, 0, VISINA);
  morje.addColorStop(0, "#62dce2");
  morje.addColorStop(0.34, "#28bfd0");
  morje.addColorStop(0.68, "#1493b4");
  morje.addColorStop(1, "#0b618b");
  ctx.fillStyle = morje;
  ctx.fillRect(0, 0, SIRINA, VISINA);

  ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
  ctx.beginPath();
  ctx.moveTo(0, 70);
  ctx.quadraticCurveTo(110, 48, 230, 72);
  ctx.quadraticCurveTo(355, 96, 470, 70);
  ctx.quadraticCurveTo(592, 44, 720, 74);
  ctx.lineTo(720, 112);
  ctx.lineTo(0, 112);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
  ctx.beginPath();
  ctx.moveTo(0, 154);
  ctx.quadraticCurveTo(98, 130, 212, 156);
  ctx.quadraticCurveTo(332, 184, 438, 156);
  ctx.quadraticCurveTo(572, 126, 720, 160);
  ctx.lineTo(720, 212);
  ctx.lineTo(0, 212);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
  ctx.beginPath();
  ctx.moveTo(0, 286);
  ctx.quadraticCurveTo(118, 260, 232, 288);
  ctx.quadraticCurveTo(338, 314, 455, 286);
  ctx.quadraticCurveTo(580, 258, 720, 292);
  ctx.lineTo(720, 480);
  ctx.lineTo(0, 480);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
  ctx.beginPath();
  ctx.moveTo(0, 382);
  ctx.quadraticCurveTo(110, 360, 220, 386);
  ctx.quadraticCurveTo(356, 416, 478, 386);
  ctx.quadraticCurveTo(600, 356, 720, 392);
  ctx.lineTo(720, 480);
  ctx.lineTo(0, 480);
  ctx.closePath();
  ctx.fill();

  ctx.save();
  ctx.strokeStyle = "rgba(244, 255, 255, 0.46)";
  ctx.lineWidth = 3.2;

  ctx.beginPath();
  ctx.moveTo(0, 246);
  ctx.quadraticCurveTo(88, 228, 170, 244);
  ctx.quadraticCurveTo(272, 262, 360, 242);
  ctx.quadraticCurveTo(472, 222, 560, 244);
  ctx.quadraticCurveTo(640, 262, 720, 240);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, 326);
  ctx.quadraticCurveTo(92, 308, 176, 324);
  ctx.quadraticCurveTo(270, 342, 360, 322);
  ctx.quadraticCurveTo(456, 304, 548, 322);
  ctx.quadraticCurveTo(628, 340, 720, 320);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, 420);
  ctx.quadraticCurveTo(94, 404, 180, 418);
  ctx.quadraticCurveTo(282, 434, 370, 416);
  ctx.quadraticCurveTo(472, 398, 560, 416);
  ctx.quadraticCurveTo(642, 432, 720, 412);
  ctx.stroke();
  ctx.restore();
}

function narisiPrizor() {
  pocistiPlatno();
  narisiOzadje();
  narisiOpeke();
  narisiPloscek();
  narisiZogo();
}

function zankaIgre() {
  if (stanjeIgre !== "playing") {
    narisiPrizor();
    return;
  }

  posodobiIgro();
  narisiPrizor();

  if (stanjeIgre === "playing") {
    frameId = window.requestAnimationFrame(zankaIgre);
  }
}

function ustaviIgro() {
  if (frameId !== null) {
    window.cancelAnimationFrame(frameId);
    frameId = null;
  }

  if (timerId !== null) {
    window.clearInterval(timerId);
    timerId = null;
  }
}

function nastaviTezavnost() {
  sirinaPloscka = tezavnosti[tezavnostEl.value] ?? tezavnosti.medium;
  xPloscek = Math.min(Math.max(xPloscek, 0), SIRINA - sirinaPloscka);
}

function ponastaviIgro() {
  nastaviTezavnost();
  xZoga = SIRINA / 2;
  yZoga = VISINA - 70;
  dx = 1 * (Math.random() > 0.5 ? 1 : -1);
  dy = -2;
  xPloscek = (SIRINA - sirinaPloscka) / 2;
  desnoDrzi = false;
  levoDrzi = false;
  tocke = 0;
  preteceneSekunde = 0;

  ustvariOpeke();
  osveziTocke();
  osveziCas();
}

function zazeniCas() {
  timerId = window.setInterval(() => {
    if (stanjeIgre === "playing") {
      preteceneSekunde += 1;
      osveziCas();
    }
  }, 1000);
}

function prikaziNavodila() {
  Swal.fire({
    title: "Navodila",
    icon: "info",
    confirmButtonText: "Razumem",
    buttonsStyling: false,
    customClass: {
      popup: "verano-alert verano-alert-info",
      confirmButton: "verano-alert-button"
    },
    html: `
      <p>Cilj igre je razbiti vseh 25 poletnih blokov.</p>
      <p>Plošček premikaš z levo in desno puščico ali s tipkama A in D, žogico pa držiš nad valovi.</p>
    `
  });
}

function prikaziKonec(zmaga) {
  Swal.fire({
    title: zmaga ? "Zmaga!" : "Konec igre",
    icon: zmaga ? "success" : "error",
    confirmButtonText: "V redu",
    buttonsStyling: false,
    customClass: {
      popup: `verano-alert ${zmaga ? "verano-alert-success" : "verano-alert-error"}`,
      confirmButton: "verano-alert-button"
    },
    html: `
      <p>${zmaga ? "Razbil si vse bloke in osvojil plažo." : "Žogica je padla v morje mimo ploščka."}</p>
      <p>Točke: <strong>${tocke}</strong></p>
      <p>Čas: <strong>${zapisCasa(preteceneSekunde)}</strong></p>
    `
  });
}

function koncajIgro(zmaga) {
  stanjeIgre = zmaga ? "won" : "lost";
  ustaviIgro();
  narisiPrizor();
  zacetekGumb.disabled = false;
  premorGumb.disabled = true;
  premorGumb.textContent = "Pavza";
  prikaziKonec(zmaga);
}

function pripraviIgro() {
  ustaviIgro();
  ponastaviIgro();
  stanjeIgre = "ready";
  zacetekGumb.disabled = false;
  premorGumb.disabled = true;
  premorGumb.textContent = "Pavza";
  narisiPrizor();
}

function nastaviGumbeMedIgro() {
  zacetekGumb.disabled = true;
  premorGumb.disabled = false;
  premorGumb.textContent = "Pavza";
}

function zacniIgro() {
  ustaviIgro();
  ponastaviIgro();
  stanjeIgre = "playing";
  nastaviGumbeMedIgro();
  zazeniCas();
  narisiPrizor();
  frameId = window.requestAnimationFrame(zankaIgre);
}

function tipkaDol(event) {
  const tipka = event.key.toLowerCase();

  if (event.key === "ArrowRight" || tipka === "d") {
    event.preventDefault();
    desnoDrzi = true;
  } else if (event.key === "ArrowLeft" || tipka === "a") {
    event.preventDefault();
    levoDrzi = true;
  }
}

function tipkaGor(event) {
  const tipka = event.key.toLowerCase();

  if (event.key === "ArrowRight" || tipka === "d") {
    event.preventDefault();
    desnoDrzi = false;
  } else if (event.key === "ArrowLeft" || tipka === "a") {
    event.preventDefault();
    levoDrzi = false;
  }
}

function nadaljujIgro() {
  if (stanjeIgre !== "paused") {
    return;
  }

  stanjeIgre = "playing";
  zazeniCas();
  frameId = window.requestAnimationFrame(zankaIgre);
  premorGumb.textContent = "Pavza";
}

function pavzirajIgro() {
  if (stanjeIgre !== "playing") {
    return;
  }

  ustaviIgro();
  stanjeIgre = "paused";
  premorGumb.textContent = "Nadaljuj";
  narisiPrizor();
}

function preklopiPremor() {
  if (stanjeIgre === "playing") {
    pavzirajIgro();
  } else if (stanjeIgre === "paused") {
    nadaljujIgro();
  }
}

function spremeniTezavnost() {
  nastaviTezavnost();

  if (stanjeIgre !== "playing") {
    narisiPrizor();
  }
}

document.addEventListener("keydown", tipkaDol);
document.addEventListener("keyup", tipkaGor);
tezavnostEl.addEventListener("change", spremeniTezavnost);
zacetekGumb.addEventListener("click", zacniIgro);
premorGumb.addEventListener("click", preklopiPremor);
navodilaGumb.addEventListener("click", prikaziNavodila);

pripraviIgro();
