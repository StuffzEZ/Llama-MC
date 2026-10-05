document.addEventListener("DOMContentLoaded", () => {
  // Footer year
  document.getElementById("year").textContent = new Date().getFullYear();

  // Copy server IP
  const copyBtn = document.getElementById("copy-ip");
  const copyLabel = document.getElementById("copy-label");
  copyBtn.addEventListener("click", async () => {
    const ip = copyBtn.dataset.ip;
    try { await navigator.clipboard.writeText(ip); copyLabel.textContent = "Copied!"; }
    catch { copyLabel.textContent = "Press Ctrl+C to copy"; }
    setTimeout(() => (copyLabel.textContent = ip), 1600);
  });

  // ---------- Live player count ----------
  // Edit these two addresses if your domains change
  const JAVA_ADDRESS = "play.llamamc.stufy.qzz.io";
  const BEDROCK_ADDRESS = "play.llamamc.stufy.qzz.io:19134";
  const API = "https://api.mcstatus.io/v2/status";
  const $ = id => document.getElementById(id);

  async function getStatus(edition, address) {
    const res = await fetch(`${API}/${edition}/${address}`);
    if (!res.ok) throw new Error("Status request failed");
    return res.json();
  }

  async function updatePlayers() {
    const [java] = await Promise.allSettled([
      getStatus("java", JAVA_ADDRESS),
    ]);
    // Only count editions that answered and are online
    const up = [java]
      .filter(r => r.status === "fulfilled" && r.value.online)
      .map(r => r.value.players);

    const pulse = $("pulse");
    if (!up.length) {
      $("player-count").textContent = "0";
      $("stat-online").textContent = "--";
      $("stat-max").textContent = "--";
      pulse.style.background = "#f87171"; // red = offline / unreachable
      return;
    }
    const online = up.reduce((n, p) => n + (p.online || 0), 0);
    const max = up.reduce((n, p) => n + (p.max || 0), 0);
    $("player-count").textContent = online;
    $("stat-online").textContent = online;
    $("stat-max").textContent = max;
    pulse.style.background = "";
  }
  updatePlayers();
  setInterval(updatePlayers, 60000);

  // ---------- Carousel ----------
  const carousel = document.getElementById("carousel");
  const track = carousel.querySelector(".track");
  const slides = [...carousel.querySelectorAll(".slide")];
  const dotsWrap = carousel.querySelector(".dots");
  const glow = carousel.querySelector(".glow");
  let index = 0, timer;

  // One blurred "glow" layer per slide (the TV backlight effect)
  slides.forEach((slide, i) => {
    const g = document.createElement("div");
    g.style.backgroundImage = `url("${slide.querySelector("img").src}")`;
    glow.appendChild(g);

    const dot = document.createElement("button");
    dot.type = "button";
    dot.setAttribute("aria-label", `Go to image ${i + 1}`);
    dot.addEventListener("click", () => { goTo(i); restart(); });
    dotsWrap.appendChild(dot);
  });

  function goTo(i) {
    index = (i + slides.length) % slides.length;
    track.style.transform = `translateX(-${index * 100}%)`;
    [...glow.children].forEach((g, n) => g.classList.toggle("active", n === index));
    [...dotsWrap.children].forEach((d, n) => d.classList.toggle("active", n === index));
  }
  function restart() { clearInterval(timer); timer = setInterval(() => goTo(index + 1), 6000); }

  carousel.querySelector(".prev").addEventListener("click", () => { goTo(index - 1); restart(); });
  carousel.querySelector(".next").addEventListener("click", () => { goTo(index + 1); restart(); });
  carousel.addEventListener("mouseenter", () => clearInterval(timer));
  carousel.addEventListener("mouseleave", restart);

  // Swipe support
  let startX = null;
  track.addEventListener("pointerdown", e => (startX = e.clientX));
  track.addEventListener("pointerup", e => {
    if (startX !== null && Math.abs(e.clientX - startX) > 50) goTo(index + (e.clientX < startX ? 1 : -1));
    startX = null;
  });

  goTo(0);
  restart();

  // ---------- Lightbox ----------
  const lb = document.getElementById("lightbox");
  const lbImg = lb.querySelector("img");
  const lbCap = lb.querySelector("figcaption");

  function showLightbox(i) {
    index = (i + slides.length) % slides.length;
    const s = slides[index];
    lbImg.src = s.querySelector("img").src;
    lbImg.alt = s.querySelector("img").alt;
    lbCap.textContent = `${s.querySelector("h3").textContent} — ${s.querySelector("p").textContent}`;
    lb.hidden = false;
    document.body.style.overflow = "hidden";
    clearInterval(timer);
  }
  function closeLightbox() {
    lb.hidden = true;
    document.body.style.overflow = "";
    goTo(index);
    restart();
  }

  slides.forEach((s, i) => s.querySelector("img").addEventListener("click", () => showLightbox(i)));
  lb.querySelector(".lb-close").addEventListener("click", closeLightbox);
  lb.querySelector(".prev").addEventListener("click", () => showLightbox(index - 1));
  lb.querySelector(".next").addEventListener("click", () => showLightbox(index + 1));
  lb.addEventListener("click", e => { if (e.target === lb) closeLightbox(); });
  document.addEventListener("keydown", e => {
    if (lb.hidden) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") showLightbox(index - 1);
    if (e.key === "ArrowRight") showLightbox(index + 1);
  });
});