// ==================== AYARLAR ====================
// GitHub kullanıcı adını buradan değiştir: Projeler bölümü public repolarını
// otomatik çeker. Kullanıcı bulunamazsa aşağıdaki fallbackProjects gösterilir.
const GITHUB_USERNAME = "berattanlasi";
const GITHUB_URL = `https://github.com/${GITHUB_USERNAME}`;
const GITHUB_PAGES_REPO = `${GITHUB_USERNAME.toLowerCase()}.github.io`;
const LINKEDIN_URL = "https://www.linkedin.com/in/berat-tanlasi-580220397/";
const X_URL = "https://x.com/Soren_49";
const PINTEREST_URL = "https://www.pinterest.com/b3rad_/";
const CONTACT_EMAIL = "tanlasiberat1@gmail.com";

// Global state
const state = {
  destinations: {},
  galleryFilter: "all",
  repos: null,
  reposPromise: null,
  map: null,
  cleanups: [],
};

// Elle yazılmış projeler. "repo" alanı GitHub'daki bir repoyla eşleşirse
// kart buradaki başlık/açıklamayla, GitHub'ın linkleri ve yıldızlarıyla gösterilir.
const fallbackProjects = [
  {
    repo: GITHUB_PAGES_REPO,
    title: "Portfolio Website",
    description:
      "A modern portfolio website built with HTML, CSS, and vanilla JavaScript. Features a live canvas background, smooth animations, and responsive design.",
    tags: ["HTML", "CSS", "JavaScript"],
    links: [
      { label: "Code", url: `${GITHUB_URL}/${GITHUB_PAGES_REPO}` },
      { label: "Live", url: `https://${GITHUB_PAGES_REPO}` },
    ],
  },
  {
    title: "Istanbul Travel App",
    description:
      "A travel guide application for exploring Istanbul. Built with vanilla JavaScript, featuring interactive maps and curated travel stories.",
    tags: ["JavaScript", "Leaflet", "Travel"],
    links: [{ label: "Code", url: GITHUB_URL }],
  },
];

const assetPath = (path) => encodeURI(path);
const topkapiImage = (fileName) => assetPath(`images/topkapi/${fileName}`);
const miniaturkImage = (fileName) => assetPath(`images/miniaturk/${fileName}`);
const profileImage = assetPath("images/profilresmi.png");
const fallbackProfileImage = topkapiImage("1.jpg");

// Klasörlerdeki fotoğraflar 1.jpg, 2.jpg ... şeklinde numaralı.
// Fotoğraf ekleyip çıkarırsan sadece count değerini güncellemen yeterli.
const numberedFiles = (count) =>
  Array.from({ length: count }, (_, index) => `${index + 1}.jpg`);
const pad = (number) => String(number).padStart(2, "0");

const galleryPlaces = {
  topkapi: { label: "Topkapi Palace", count: 16, image: topkapiImage },
  miniaturk: { label: "Miniaturk", count: 36, image: miniaturkImage },
};

const galleryImages = Object.entries(galleryPlaces).flatMap(([key, place]) =>
  numberedFiles(place.count).map((fileName, index) => ({
    src: place.image(fileName),
    place: place.label,
    placeKey: key,
    alt: `${place.label} photo ${index + 1}`,
    caption: `${place.label} · Frame ${pad(index + 1)}`,
  })),
);

const filterGallery = (filter) =>
  filter === "all"
    ? galleryImages
    : galleryImages.filter((image) => image.placeKey === filter);

// DOM Elements
const main = document.getElementById("app");
const lightbox = document.querySelector(".lightbox");
const lightboxPanel = lightbox.querySelector(".lightbox__panel");
const lightboxImage = lightbox.querySelector(".lightbox__image");
const lightboxCaption = lightbox.querySelector(".lightbox__caption");
const lightboxCounter = lightbox.querySelector(".lightbox__counter");
const lightboxPrimaryClose = lightbox.querySelector(".lightbox__close");
const lightboxCloseButtons = lightbox.querySelectorAll("[data-lightbox-close]");
const lightboxPrev = lightbox.querySelector("[data-lightbox-prev]");
const lightboxNext = lightbox.querySelector("[data-lightbox-next]");
const navLinks = document.querySelectorAll("[data-nav]");
const brandAvatar = document.getElementById("brand-avatar");

let activeGallery = [];
let activeGalleryIndex = 0;
let lastFocusedElement = null;

// Animasyon tercihleri: reduced-motion isteyen veya ince işaretçisi (fare) olmayan
// cihazlarda tilt/parallax gibi hareket ağırlıklı efektleri devre dışı bırakmak için kullanılır.
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;
const supportsFineHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

const setImageWithFallback = (image, src, fallback) => {
  if (!image) return;

  image.src = src;
  image.onerror = () => {
    image.onerror = null;
    image.src = fallback;
  };
};

setImageWithFallback(brandAvatar, assetPath("images/logo.jpg"), profileImage);
const footerLinks = { github: GITHUB_URL, linkedin: LINKEDIN_URL, x: X_URL, pinterest: PINTEREST_URL };
document.querySelectorAll("[data-social-link]").forEach((link) => {
  link.href = footerLinks[link.dataset.socialLink];
});
document.getElementById("year").textContent = new Date().getFullYear();

// ==================== TEMA (koyu / açık) ====================
// Varsayılan koyu tema. Ziyaretçinin seçimi localStorage'da saklanır;
// index.html'deki küçük script kayıtlı temayı sayfa çizilmeden uygular.
const THEME_STORAGE_KEY = "theme";
const themeToggle = document.getElementById("theme-toggle");
const themeColorMeta = document.querySelector('meta[name="theme-color"]');

const getTheme = () =>
  document.documentElement.dataset.theme === "light" ? "light" : "dark";

const applyTheme = (theme) => {
  document.documentElement.dataset.theme = theme;
  themeColorMeta?.setAttribute("content", theme === "light" ? "#f5f6fa" : "#05060a");
  themeToggle?.setAttribute(
    "aria-label",
    theme === "light" ? "Switch to dark theme" : "Switch to light theme",
  );
  window.dispatchEvent(new CustomEvent("themechange", { detail: theme }));
};

const saveTheme = (theme) => {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (error) {
    // Local storage may be unavailable in private browsing contexts.
  }
};

applyTheme(getTheme());

themeToggle?.addEventListener("click", () => {
  const nextTheme = getTheme() === "light" ? "dark" : "light";
  saveTheme(nextTheme);

  if (!document.startViewTransition || prefersReducedMotion) {
    applyTheme(nextTheme);
    return;
  }

  // Yeni tema, düğmenin olduğu yerden açılan bir daireyle ekranı kaplar
  const rect = themeToggle.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  const radius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  );

  const transition = document.startViewTransition(() => applyTheme(nextTheme));
  transition.ready.then(() => {
    document.documentElement.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
      {
        duration: 600,
        easing: "cubic-bezier(0.4, 0, 0.2, 1)",
        pseudoElement: "::view-transition-new(root)",
      },
    );
  });
});

// Sayfa değişince durdurulması gereken zamanlayıcı/observer'lar buraya eklenir
const addCleanup = (fn) => state.cleanups.push(fn);
const runCleanups = () => {
  state.cleanups.splice(0).forEach((fn) => fn());
};

// ==================== ROUTING ====================
const pageRoutes = ["home", "about", "travels", "projects", "gallery", "blog", "contact"];

const getRoute = () => {
  const hash = window.location.hash.replace(/^#/, "").toLowerCase();
  if (!hash) return "home";
  if (pageRoutes.includes(hash)) return hash;
  if (state.destinations[hash]) return hash;
  if (hash.startsWith("blog/") && getPost(hash.slice(5))) return hash;
  return "home";
};

const updateActiveNav = (route) => {
  let navRoute = route;
  if (state.destinations[route]) navRoute = "travels";
  if (route.startsWith("blog/")) navRoute = "blog";
  navLinks.forEach((link) => {
    if (link.dataset.nav === navRoute) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
};

const updateTitle = (route) => {
  const titles = {
    home: "Berat Tanlasi | Software Developer & Travel Writer",
    about: "About | Berat Tanlasi",
    travels: "Travel Stories | Berat Tanlasi",
    projects: "Projects | Berat Tanlasi",
    gallery: "Gallery | Berat Tanlasi",
    blog: "Blog | Berat Tanlasi",
    contact: "Contact | Berat Tanlasi",
  };
  const page = route.startsWith("blog/") ? getPost(route.slice(5)) : state.destinations[route];
  document.title = titles[route] || `${page?.title} | Berat Tanlasi`;
};

// ==================== UTILITY FUNCTIONS ====================
const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const renderParagraphs = (paragraphs) =>
  paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("");

const renderFacts = (facts) =>
  facts
    .map(
      (fact) => `
        <li>
          <span>${escapeHtml(fact.label)}</span>
          <strong>${escapeHtml(fact.value)}</strong>
        </li>
      `,
    )
    .join("");

// ==================== ICONS ====================
const strokeIcon = (paths) =>
  `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

const icons = {
  arrowRight: strokeIcon('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  arrowLeft: strokeIcon('<path d="M19 12H5M11 6l-6 6 6 6"/>'),
  pin: strokeIcon(
    '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>',
  ),
  clock: strokeIcon('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  sparkle: strokeIcon('<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8Z"/>'),
  code: strokeIcon('<path d="M8 8l-4 4 4 4M16 8l4 4-4 4M14 5l-4 14"/>'),
  pen: strokeIcon('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>'),
  camera: strokeIcon(
    '<path d="M4 8h3l2-3h6l2 3h3v11H4Z"/><circle cx="12" cy="13" r="3.5"/>',
  ),
  compass: strokeIcon('<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5Z"/>'),
  mail: strokeIcon('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>'),
  external: strokeIcon(
    '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  ),
  star: strokeIcon(
    '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.6l1-5.8-4.3-4.1 5.9-.9Z"/>',
  ),
  zoom: strokeIcon('<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5M11 8v6M8 11h6"/>'),
  calendar: strokeIcon(
    '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  ),
  user: strokeIcon('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
  github:
    '<svg class="icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.09 3.29 9.4 7.86 10.93.57.1.78-.25.78-.55 0-.27-.01-1.16-.02-2.1-3.2.7-3.87-1.36-3.87-1.36-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.64 1.59.24 2.76.12 3.05.74.8 1.18 1.83 1.18 3.09 0 4.42-2.7 5.4-5.26 5.68.41.36.78 1.08.78 2.17 0 1.57-.01 2.83-.01 3.22 0 .3.2.66.79.55A10.52 10.52 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z"/></svg>',
  x: '<svg class="icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.21-6.82-5.97 6.82H1.68l7.73-8.84L1.25 2.25h6.83l4.71 6.23Zm-1.16 17.52h1.83L7.08 4.13H5.12Z"/></svg>',
  pinterest:
    '<svg class="icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .8C5.8.8 2.6 5.1 2.6 8.7c0 2.18.82 4.12 2.6 4.84.29.12.55 0 .64-.32.06-.22.2-.79.26-1.02.09-.32.05-.43-.18-.71-.5-.6-.82-1.36-.82-2.45 0-3.15 2.36-5.97 6.14-5.97 3.35 0 5.19 2.05 5.19 4.78 0 3.6-1.59 6.64-3.96 6.64-1.3 0-2.28-1.08-1.96-2.4.37-1.58 1.1-3.29 1.1-4.43 0-1.02-.55-1.87-1.68-1.87-1.33 0-2.4 1.38-2.4 3.22 0 1.18.4 1.97.4 1.97s-1.35 5.73-1.6 6.74c-.47 2-.05 4.44-.03 4.69.02.15.21.19.29.07.12-.16 1.65-2.05 2.17-3.94.15-.53.84-3.31.84-3.31.42.8 1.63 1.5 2.92 1.5 3.84 0 6.44-3.5 6.44-8.19C21.4 4.53 17.85.8 12 .8Z"/></svg>',
  linkedin:
    '<svg class="icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45Z"/></svg>',
};

const socialLinks = [
  { label: "GitHub", url: GITHUB_URL, icon: icons.github, external: true },
  { label: "LinkedIn", url: LINKEDIN_URL, icon: icons.linkedin, external: true },
  { label: "X (Twitter)", url: X_URL, icon: icons.x, external: true },
  { label: "Pinterest", url: PINTEREST_URL, icon: icons.pinterest, external: true },
  { label: "Email", url: `mailto:${CONTACT_EMAIL}`, icon: icons.mail },
];

const renderSocialRow = () => `
  <div class="social-row" aria-label="Social links">
    ${socialLinks
      .map(
        (link) => `
          <a class="social-icon" href="${link.url}" title="${link.label}" aria-label="${link.label}"
            ${link.external ? 'target="_blank" rel="noopener noreferrer"' : ""}>${link.icon}</a>
        `,
      )
      .join("")}
  </div>
`;

// ==================== SHARED COMPONENTS ====================
const renderSectionHead = ({ kicker, title, text, link }) => `
  <div class="section-head reveal">
    <div>
      <p class="kicker">${escapeHtml(kicker)}</p>
      <h2 class="section-title">${title}</h2>
      ${text ? `<p class="section-text">${escapeHtml(text)}</p>` : ""}
    </div>
    ${link ? `<a class="text-link" href="${link.href}">${escapeHtml(link.label)} ${icons.arrowRight}</a>` : ""}
  </div>
`;

const cardMetaIcons = [icons.pin, icons.clock, icons.sparkle];

const renderDestinationCard = (story) => `
  <article class="destination-card spot reveal">
    <a class="destination-card__media" href="#${story.slug}" aria-label="Open the ${escapeHtml(story.title)} article">
      <img src="${story.homeImage}" alt="${escapeHtml(story.homeAlt)}" loading="lazy" decoding="async" />
      <span class="destination-card__badge">${escapeHtml(story.category)}</span>
    </a>
    <div class="destination-card__body">
      <h3 class="card-title">${escapeHtml(story.title)}</h3>
      <p class="card-copy">${escapeHtml(story.cardCopy)}</p>
      <div class="card-meta">
        ${story.cardMeta
          .map((item, index) => `<span>${cardMetaIcons[index] || ""}${escapeHtml(item)}</span>`)
          .join("")}
      </div>
      <a class="text-link" href="#${story.slug}">Read story ${icons.arrowRight}</a>
    </div>
  </article>
`;

const renderProjectCard = (project) => `
  <article class="project-card spot reveal">
    <div class="project-card__top">
      <span class="project-card__icon">${icons.code}</span>
      <div class="project-card__links">
        ${project.links
          .map(
            (link) => `
              <a href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(
                `${project.title} - ${link.label}`,
              )}" title="${escapeHtml(link.label)}">${link.label === "Live" ? icons.external : icons.github}</a>
            `,
          )
          .join("")}
      </div>
    </div>
    <h3>${escapeHtml(project.title)}</h3>
    <p>${escapeHtml(project.description)}</p>
    <div class="project-card__footer">
      <ul class="tag-list">
        ${project.tags.map((tag) => `<li>${escapeHtml(tag)}</li>`).join("")}
      </ul>
      ${typeof project.stars === "number" ? `<span class="project-card__stars">${icons.star}${project.stars}</span>` : ""}
    </div>
  </article>
`;

// ==================== GITHUB PROJECTS ====================
const GITHUB_CACHE_KEY = `gh-repos-v2:${GITHUB_USERNAME}`;

const readRepoCache = () => {
  try {
    const cached = JSON.parse(sessionStorage.getItem(GITHUB_CACHE_KEY));
    return Array.isArray(cached) ? cached : null;
  } catch (error) {
    return null;
  }
};

const writeRepoCache = (repos) => {
  try {
    sessionStorage.setItem(GITHUB_CACHE_KEY, JSON.stringify(repos));
  } catch (error) {
    // Session storage may be unavailable in private browsing contexts.
  }
};

const repoToProject = (repo) => {
  const repoName = repo.name.toLowerCase();
  const known = fallbackProjects.find((project) => project.repo === repoName);
  const links = [
    { label: "Code", url: repo.html_url },
    ...(repo.homepage ? [{ label: "Live", url: repo.homepage }] : []),
  ];
  if (repoName === GITHUB_PAGES_REPO && !repo.homepage) {
    links.push({ label: "Live", url: `https://${GITHUB_PAGES_REPO}` });
  }

  if (known) return { ...known, stars: repo.stargazers_count, links };

  return {
    repo: repoName,
    title: repo.name.replace(/[-_]+/g, " "),
    description: repo.description || "No description yet — check the code on GitHub.",
    tags: [repo.language, ...(repo.topics || [])].filter(Boolean).slice(0, 4),
    stars: repo.stargazers_count,
    links,
  };
};

const loadGithubRepos = () => {
  if (state.reposPromise) return state.reposPromise;

  const cached = readRepoCache();
  if (cached) {
    state.repos = cached;
    state.reposPromise = Promise.resolve(cached);
    return state.reposPromise;
  }

  state.reposPromise = fetch(
    `https://api.github.com/users/${encodeURIComponent(GITHUB_USERNAME)}/repos?sort=updated&per_page=12`,
  )
    .then((response) => (response.ok ? response.json() : []))
    .then((repos) =>
      repos.filter((repo) => !repo.fork && !repo.archived).map(repoToProject),
    )
    .catch(() => [])
    .then((projects) => {
      state.repos = projects;
      writeRepoCache(projects);
      return projects;
    });

  return state.reposPromise;
};

// GitHub repoları + GitHub'da karşılığı olmayan elle yazılmış projeler
const getProjects = () => {
  if (!state.repos?.length) return fallbackProjects;
  const repoNames = new Set(state.repos.map((project) => project.repo));
  return [
    ...state.repos,
    ...fallbackProjects.filter((project) => !repoNames.has(project.repo)),
  ];
};

const refreshProjectGrids = () => {
  main.querySelectorAll("[data-projects-grid]").forEach((grid) => {
    const limit = Number(grid.dataset.limit) || Infinity;
    grid.innerHTML = getProjects().slice(0, limit).map(renderProjectCard).join("");
  });
  main.querySelectorAll("[data-project-count]").forEach((element) => {
    element.textContent = getProjects().length;
  });
  main.querySelectorAll("[data-projects-source]").forEach((element) => {
    element.hidden = !state.repos?.length;
  });
  initScrollReveal();
};

const mountProjects = () => {
  loadGithubRepos().then(refreshProjectGrids);
};

// ==================== HOME: TYPING + CODE CARD + COUNTERS ====================
const typedPhrases = [
  "build web experiences.",
  "write travel stories.",
  "photograph Istanbul.",
  "turn routes into code.",
];

const startTyping = () => {
  const target = document.getElementById("typed");
  if (!target) return;

  if (prefersReducedMotion) {
    target.textContent = typedPhrases[0];
    return;
  }

  let phraseIndex = 0;
  let charIndex = 0;
  let deleting = false;
  let timer;

  const tick = () => {
    const phrase = typedPhrases[phraseIndex];
    charIndex += deleting ? -1 : 1;
    target.textContent = phrase.slice(0, charIndex);

    let delay = deleting ? 35 : 70;
    if (!deleting && charIndex === phrase.length) {
      deleting = true;
      delay = 1800;
    } else if (deleting && charIndex === 0) {
      deleting = false;
      phraseIndex = (phraseIndex + 1) % typedPhrases.length;
      delay = 350;
    }
    timer = setTimeout(tick, delay);
  };

  timer = setTimeout(tick, 600);
  addCleanup(() => clearTimeout(timer));
};

const codeSample = `const traveler = {
  name: "Berat Tanlasi",
  base: "Istanbul",
  stack: ["HTML", "CSS", "JavaScript"],
};

const route = ["Topkapi", "Miniaturk"];

for (const stop of route) {
  traveler.explore(stop);  // slowly
  traveler.capture(stop);  // one frame at a time
}

// next: write it down, ship it.`;

const tokenizeCode = (source) => {
  const pattern =
    /(\/\/[^\n]*)|("[^"\n]*")|\b(const|let|for|of|return|new)\b|\.([a-zA-Z_]\w*)(?=\()|([a-zA-Z_]\w*)(?=:)/g;
  const tokens = [];
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(source))) {
    if (match.index > lastIndex) {
      tokens.push({ text: source.slice(lastIndex, match.index) });
    }
    const [, comment, string, keyword, method, prop] = match;
    if (comment) tokens.push({ text: comment, type: "comment" });
    else if (string) tokens.push({ text: string, type: "string" });
    else if (keyword) tokens.push({ text: keyword, type: "keyword" });
    else if (method) tokens.push({ text: "." }, { text: method, type: "fn" });
    else if (prop) tokens.push({ text: prop, type: "prop" });
    lastIndex = pattern.lastIndex;
  }
  tokens.push({ text: source.slice(lastIndex) });
  return tokens;
};

const codeTokens = tokenizeCode(codeSample);

const renderCodeTokens = (limit = Infinity) => {
  let remaining = limit;
  let html = "";
  for (const token of codeTokens) {
    if (remaining <= 0) break;
    const part = token.text.slice(0, remaining);
    remaining -= part.length;
    html += token.type
      ? `<span class="tok-${token.type}">${escapeHtml(part)}</span>`
      : escapeHtml(part);
  }
  return html;
};

const startCodeTyping = () => {
  const target = document.getElementById("code-typing");
  if (!target) return;

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    target.innerHTML = renderCodeTokens();
    return;
  }

  let typed = 0;
  let timer;
  const type = () => {
    typed += 2;
    target.innerHTML = renderCodeTokens(typed);
    if (typed < codeSample.length) timer = setTimeout(type, 22);
    else target.parentElement.classList.add("is-done");
  };

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      type();
    },
    { threshold: 0.35 },
  );
  observer.observe(target);
  addCleanup(() => {
    observer.disconnect();
    clearTimeout(timer);
  });
};

const animateCount = (element) => {
  const end = Number(element.dataset.count);
  if (prefersReducedMotion || !end) {
    element.textContent = end;
    return;
  }

  const duration = 1200;
  const start = performance.now();
  const step = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = Math.round(end * eased);
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
};

const startCounters = () => {
  const counters = main.querySelectorAll("[data-count]");
  if (!counters.length) return;

  if (!("IntersectionObserver" in window)) {
    counters.forEach(animateCount);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        animateCount(entry.target);
      });
    },
    { threshold: 0.6 },
  );
  counters.forEach((counter) => observer.observe(counter));
  addCleanup(() => observer.disconnect());
};

// ==================== HERO: DÖNEN 3D DÜNYA ====================
// Kara parçaları globe-data.js'teki noktalardan çizilir (kütüphane yok).
// Fareyle / parmakla sürüklenebilir, bırakınca kendi kendine döner.
const ISTANBUL = { lat: 41.01, lon: 28.98 };
const toRad = (deg) => (deg * Math.PI) / 180;

const decodeGlobeLand = (() => {
  let cache = null;
  return () => {
    if (cache) return cache;
    const binary = atob(window.GLOBE_LAND || "");
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    const values = new Int16Array(bytes.buffer);
    const count = values.length / 2;
    cache = { count, cosLat: new Float32Array(count), sinLat: new Float32Array(count), lon: new Float32Array(count) };
    for (let i = 0; i < count; i += 1) {
      const lat = toRad(values[i * 2] / 10);
      cache.cosLat[i] = Math.cos(lat);
      cache.sinLat[i] = Math.sin(lat);
      cache.lon[i] = toRad(values[i * 2 + 1] / 10);
    }
    return cache;
  };
})();

const startGlobe = () => {
  const container = document.getElementById("globe");
  const canvas = container?.querySelector("canvas");
  const context = canvas?.getContext("2d");
  const label = document.getElementById("globe-label");
  if (!context || !window.GLOBE_LAND) return;

  const land = decodeGlobeLand();
  const TILT = toRad(24);
  const cosTilt = Math.cos(TILT);
  const sinTilt = Math.sin(TILT);
  const HUE_STEPS = 24;
  const AUTO_SPEED = 0.0022;

  let size = 0;
  let dpr = 1;
  let rotation = -toRad(ISTANBUL.lon);
  let velocity = AUTO_SPEED;
  let dragging = false;
  let lastX = 0;
  let frameId = null;
  let visible = true;
  let sprites = [];

  // Her renk tonu için bir kez yumuşak kenarlı nokta çiz, karede sadece kopyala
  const buildSprites = () => {
    const light = getTheme() === "light";
    sprites = Array.from({ length: HUE_STEPS }, (_, step) => {
      const sprite = document.createElement("canvas");
      sprite.width = 24;
      sprite.height = 24;
      const spriteContext = sprite.getContext("2d");
      const hue = 205 + (step / (HUE_STEPS - 1)) * 125;
      const color = `hsl(${hue}, 90%, ${light ? 52 : 68}%)`;
      const gradient = spriteContext.createRadialGradient(12, 12, 0, 12, 12, 12);
      gradient.addColorStop(0, color);
      gradient.addColorStop(0.45, color);
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      spriteContext.fillStyle = gradient;
      spriteContext.fillRect(0, 0, 24, 24);
      return sprite;
    });
  };

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    size = container.clientWidth;
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  // Küre üzerindeki bir noktayı ekrana yansıt (ortografik izdüşüm + eğim)
  const project = (cosLat, sinLat, lon, center, radius) => {
    const x = cosLat * Math.sin(lon + rotation);
    const z = cosLat * Math.cos(lon + rotation);
    const y2 = sinLat * cosTilt - z * sinTilt;
    const z2 = z * cosTilt + sinLat * sinTilt;
    return { x: center + x * radius, y: center - y2 * radius, z: z2 };
  };

  const draw = (time) => {
    const light = getTheme() === "light";
    const center = size / 2;
    const radius = size * 0.4;
    context.clearRect(0, 0, size, size);

    // Arka yüzdeki noktalar (kürenin içinden soluk görünür → derinlik hissi)
    context.globalAlpha = light ? 0.1 : 0.13;
    for (let i = 0; i < land.count; i += 1) {
      const p = project(land.cosLat[i], land.sinLat[i], land.lon[i], center, radius);
      if (p.z >= 0) continue;
      const hueStep = Math.min(HUE_STEPS - 1, Math.max(0, Math.floor((p.x / size) * HUE_STEPS)));
      context.drawImage(sprites[hueStep], p.x - 1.5, p.y - 1.5, 3, 3);
    }

    // Küre gövdesi
    const body = context.createRadialGradient(
      center - radius * 0.35,
      center - radius * 0.4,
      radius * 0.1,
      center,
      center,
      radius,
    );
    body.addColorStop(0, light ? "rgba(255, 255, 255, 0.85)" : "rgba(40, 48, 84, 0.75)");
    body.addColorStop(1, light ? "rgba(226, 230, 245, 0.85)" : "rgba(10, 12, 24, 0.85)");
    context.globalAlpha = 1;
    context.fillStyle = body;
    context.beginPath();
    context.arc(center, center, radius, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = light ? "rgba(124, 58, 237, 0.25)" : "rgba(140, 160, 255, 0.28)";
    context.lineWidth = 1;
    context.stroke();

    // Ön yüzdeki kara noktaları
    for (let i = 0; i < land.count; i += 1) {
      const p = project(land.cosLat[i], land.sinLat[i], land.lon[i], center, radius);
      if (p.z < 0) continue;
      const hueStep = Math.min(HUE_STEPS - 1, Math.max(0, Math.floor((p.x / size) * HUE_STEPS)));
      const dot = 2.2 + p.z * 2.2;
      context.globalAlpha = 0.35 + p.z * 0.65;
      context.drawImage(sprites[hueStep], p.x - dot / 2, p.y - dot / 2, dot, dot);
    }
    context.globalAlpha = 1;

    // Yörüngede dönen küçük uydu (süs)
    const orbitAngle = (time || 0) * 0.0004;
    context.save();
    context.translate(center, center);
    context.rotate(toRad(-18));
    const orbitA = radius * 1.22;
    const orbitB = radius * 0.36;
    const sx = Math.cos(orbitAngle) * orbitA;
    const sy = Math.sin(orbitAngle) * orbitB;
    const drawSatellite = () => {
      const satellite = context.createRadialGradient(sx, sy, 0, sx, sy, 9);
      satellite.addColorStop(0, "#ffffff");
      satellite.addColorStop(0.3, light ? "#7c3aed" : "#8bd0ff");
      satellite.addColorStop(1, "rgba(139, 208, 255, 0)");
      context.fillStyle = satellite;
      context.beginPath();
      context.arc(sx, sy, 9, 0, Math.PI * 2);
      context.fill();
    };
    context.setLineDash([3, 6]);
    context.strokeStyle = light ? "rgba(124, 58, 237, 0.28)" : "rgba(160, 170, 255, 0.25)";

    // Yörüngenin arka yarısı (üst kısım) kürenin arkasından geçer: kürenin
    // dairesi kırpılır, böylece çizgi ve uydu sadece kürenin dışında görünür
    context.save();
    context.beginPath();
    context.rect(-size, -size, size * 2, size * 2);
    context.arc(0, 0, radius, 0, Math.PI * 2);
    context.clip("evenodd");
    context.beginPath();
    context.ellipse(0, 0, orbitA, orbitB, 0, Math.PI, Math.PI * 2);
    context.stroke();
    if (Math.sin(orbitAngle) < 0) drawSatellite();
    context.restore();

    // Ön yarısı (alt kısım) kürenin önünden geçer
    context.beginPath();
    context.ellipse(0, 0, orbitA, orbitB, 0, 0, Math.PI);
    context.stroke();
    context.setLineDash([]);
    if (Math.sin(orbitAngle) >= 0) drawSatellite();
    context.restore();

    // İstanbul işareti: parlayan nokta + yayılan halkalar
    const ist = project(Math.cos(toRad(ISTANBUL.lat)), Math.sin(toRad(ISTANBUL.lat)), toRad(ISTANBUL.lon), center, radius);
    if (ist.z > 0) {
      const pulse = ((time || 0) % 2200) / 2200;
      for (const offset of [0, 0.5]) {
        const phase = (pulse + offset) % 1;
        context.strokeStyle = `rgba(255, 91, 158, ${(1 - phase) * 0.8 * ist.z})`;
        context.lineWidth = 2;
        context.beginPath();
        context.arc(ist.x, ist.y, 5 + phase * 22, 0, Math.PI * 2);
        context.stroke();
      }
      context.fillStyle = "#ff5b9e";
      context.beginPath();
      context.arc(ist.x, ist.y, 5, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = "#ffffff";
      context.beginPath();
      context.arc(ist.x, ist.y, 2, 0, Math.PI * 2);
      context.fill();
    }
    if (label) {
      label.style.transform = `translate(${ist.x + 14}px, ${ist.y - 16}px)`;
      label.style.opacity = ist.z > 0.15 ? String(Math.min(1, (ist.z - 0.15) * 4)) : "0";
    }
  };

  const loop = (time) => {
    if (!dragging) {
      velocity += (AUTO_SPEED - velocity) * 0.02; // bırakınca yavaşça normal hıza dön
      rotation += velocity;
    }
    draw(time);
    frameId = visible ? requestAnimationFrame(loop) : null;
  };

  const start = () => {
    if (prefersReducedMotion) {
      draw(0);
      return;
    }
    if (frameId === null && visible) frameId = requestAnimationFrame(loop);
  };

  const stop = () => {
    if (frameId !== null) cancelAnimationFrame(frameId);
    frameId = null;
  };

  // Sürükleyerek çevirme
  const onDown = (event) => {
    dragging = true;
    lastX = event.clientX;
    container.classList.add("is-dragging");
    container.setPointerCapture?.(event.pointerId);
  };
  const onMove = (event) => {
    if (!dragging) return;
    const dx = event.clientX - lastX;
    lastX = event.clientX;
    velocity = (dx / size) * 2.2;
    rotation += velocity;
    if (prefersReducedMotion) draw(0);
  };
  const onUp = () => {
    dragging = false;
    container.classList.remove("is-dragging");
  };

  buildSprites();
  resize();
  start();

  container.addEventListener("pointerdown", onDown);
  container.addEventListener("pointermove", onMove);
  container.addEventListener("pointerup", onUp);
  container.addEventListener("pointercancel", onUp);

  const onResize = () => {
    resize();
    draw(0);
  };
  const onTheme = () => {
    buildSprites();
    draw(0);
  };
  window.addEventListener("resize", onResize);
  window.addEventListener("themechange", onTheme);

  // Ekran dışındayken çizimi durdur
  const observer =
    "IntersectionObserver" in window
      ? new IntersectionObserver(([entry]) => {
          visible = entry.isIntersecting;
          if (visible) start();
          else stop();
        })
      : null;
  observer?.observe(container);

  addCleanup(() => {
    stop();
    observer?.disconnect();
    window.removeEventListener("resize", onResize);
    window.removeEventListener("themechange", onTheme);
  });
};

// ==================== PAGE RENDERING ====================
const renderHome = () => {
  const stories = Object.values(state.destinations);
  const stripImages = galleryImages
    .map((image, index) => ({ ...image, index }))
    .filter((_, index) => index % 4 === 0);
  const renderStrip = (hidden) =>
    stripImages
      .map(
        (image) => `
          <button class="photo-strip__item" type="button" data-gallery="main:all" data-index="${image.index}"
            ${hidden ? 'tabindex="-1" aria-hidden="true"' : `aria-label="${escapeHtml(image.caption)}"`}>
            <img src="${image.src}" alt="" loading="lazy" decoding="async" />
          </button>
        `,
      )
      .join("");

  main.innerHTML = `
    <section class="hero container" id="home">
      <div class="hero__text">
        <p class="eyebrow"><span class="eyebrow__dot"></span>Software Developer · Travel Writer</p>
        <h1 class="hero__title">Hi, I'm <span class="gradient-text">Berat Tanlasi</span></h1>
        <p class="hero__role" translate="no">I <span class="typed" id="typed"></span><span class="caret" aria-hidden="true"></span></p>
        <p class="hero__intro">
          I write code, wander through Istanbul and turn what I see into digital stories.
          This site is where those two passions meet.
        </p>
        <div class="hero__actions">
          <a class="button" href="#travels">Explore Travel Stories ${icons.arrowRight}</a>
          <a class="button button--ghost" href="#projects">View Projects</a>
        </div>
        ${renderSocialRow()}
      </div>

      <div class="hero__visual">
        <div class="globe" id="globe">
          <canvas role="img" aria-label="A rotating dotted globe with Istanbul highlighted"></canvas>
          <span class="globe__label" id="globe-label" aria-hidden="true">${icons.pin} Istanbul</span>
        </div>
      </div>
    </section>

    <section class="container">
      <div class="stats reveal">
        <div class="stat">
          <strong data-count="${stories.length}">${stories.length}</strong>
          <span>Travel stories</span>
        </div>
        <div class="stat">
          <strong data-count="${galleryImages.length}">${galleryImages.length}</strong>
          <span>Photographs</span>
        </div>
        <div class="stat">
          <strong data-project-count>${getProjects().length}</strong>
          <span>Projects</span>
        </div>
        <div class="stat">
          <strong>IST</strong>
          <span>Home base</span>
        </div>
      </div>
    </section>

    <section class="home-section container">
      <div class="code-meets">
        <div class="code-meets__text reveal">
          <p class="kicker">Where code meets the road</p>
          <h2 class="section-title">I debug the way I travel: <em>slowly, curiously,</em> one detail at a time.</h2>
          <p class="section-text">
            Technology and travel are not two separate worlds for me — they are two complementary rhythms.
            A palace courtyard teaches patience; a stubborn bug teaches the same thing.
          </p>
          <a class="text-link" href="#about">More about me ${icons.arrowRight}</a>
        </div>
        <div class="code-window reveal" translate="no">
          <div class="code-window__bar">
            <span></span><span></span><span></span>
            <p>journey.js</p>
          </div>
          <div class="code-window__body">
            <pre class="code-window__lines" aria-hidden="true">${codeSample
              .split("\n")
              .map((_, index) => index + 1)
              .join("\n")}</pre>
            <pre class="code-window__code"><code id="code-typing" aria-label="Code sample describing a journey through Istanbul"></code></pre>
          </div>
        </div>
      </div>
    </section>

    <section class="home-section container">
      ${renderSectionHead({
        kicker: "Travel journal",
        title: "Latest stories",
        link: { href: "#travels", label: "All stories" },
      })}
      <div class="destination-grid">
        ${stories.map(renderDestinationCard).join("")}
      </div>
    </section>

    <section class="home-section">
      <div class="container">
        ${renderSectionHead({
          kicker: "Through my lens",
          title: "Frames from the road",
          link: { href: "#gallery", label: "Open gallery" },
        })}
      </div>
      <div class="photo-strip reveal">
        <div class="photo-strip__track">
          ${renderStrip(false)}
          ${renderStrip(true)}
        </div>
      </div>
    </section>

    ${
      blogPosts.length
        ? `
          <section class="home-section container">
            ${renderSectionHead({
              kicker: "From the blog",
              title: "Latest writing",
              link: { href: "#blog", label: "All posts" },
            })}
            <div class="post-list">${renderPostCard(blogPosts[0])}</div>
          </section>
        `
        : ""
    }

    <section class="home-section container">
      ${renderSectionHead({
        kicker: "Things I've built",
        title: "Selected projects",
        link: { href: "#projects", label: "All projects" },
      })}
      <div class="projects-grid" data-projects-grid data-limit="3">
        ${getProjects().slice(0, 3).map(renderProjectCard).join("")}
      </div>
    </section>

    <section class="home-section container">
      ${renderCta()}
    </section>
  `;

  startGlobe();
  startTyping();
  startCodeTyping();
  startCounters();
  mountProjects();
};

const renderCta = () => `
  <div class="cta reveal">
    <div>
      <p class="kicker">Let's talk</p>
      <h2 class="section-title">Got a project idea or a tip for my next route?</h2>
      <p class="section-text">I'm always happy to talk about code, Istanbul, or both.</p>
    </div>
    <div class="cta__actions">
      <a class="button" href="#contact">Say hello ${icons.arrowRight}</a>
      <a class="button button--ghost" href="mailto:${CONTACT_EMAIL}">${icons.mail} Email me</a>
    </div>
  </div>
`;

const renderAbout = () => {
  const pillars = [
    {
      icon: icons.code,
      title: "Build",
      text: "Clean, responsive interfaces with HTML, CSS and vanilla JavaScript — this site included.",
    },
    {
      icon: icons.compass,
      title: "Explore",
      text: "Slow walks through Istanbul's palaces, parks and streets, written down as long-form stories.",
    },
    {
      icon: icons.camera,
      title: "Capture",
      text: "Photographs that keep the details: stone textures, shadows, and small-scale worlds.",
    },
  ];
  const toolbox = [
    "HTML",
    "CSS",
    "JavaScript",
    "Responsive design",
    "Git & GitHub",
    "Photography",
    "Travel writing",
  ];

  main.innerHTML = `
    <section class="about-hero container" id="about">
      <div class="about-content">
        <p class="kicker">About me</p>
        <h1 class="page-title">Where software & travel <span class="gradient-text">meet</span></h1>
        <p>
          For me, technology and travel are not two separate worlds - they are two complementary rhythms.
          I want to combine my passion for software development with my travel experiences in Istanbul
          to create digital stories.
        </p>
        <p>
          From the majestic silence of Topkapi Palace to the playful energy of Miniaturk,
          I observe every place while writing code. This website is the meeting point of those two passions -
          an attempt to bridge technology and humanity.
        </p>
        <p>
          Alongside building software projects, I enjoy telling the city's stories, taking photos,
          and learning. You can follow me on LinkedIn and GitHub, read my writing,
          and ask questions about my projects.
        </p>
        ${renderSocialRow()}
      </div>
      <figure class="about-photo">
        <img id="about-avatar" src="${profileImage}" alt="Portrait of Berat Tanlasi" decoding="async" />
        <figcaption>${icons.pin} Based in Istanbul</figcaption>
      </figure>
    </section>

    <section class="home-section container">
      ${renderSectionHead({ kicker: "What I do", title: "Three habits, one rhythm" })}
      <div class="pillars">
        ${pillars
          .map(
            (pillar) => `
              <article class="pillar spot reveal">
                <span class="pillar__icon">${pillar.icon}</span>
                <h3>${pillar.title}</h3>
                <p>${pillar.text}</p>
              </article>
            `,
          )
          .join("")}
      </div>
    </section>

    <section class="home-section container">
      ${renderSectionHead({ kicker: "Toolbox", title: "What I work with" })}
      <ul class="toolbox reveal">
        ${toolbox.map((tool) => `<li>${escapeHtml(tool)}</li>`).join("")}
      </ul>
    </section>

    <section class="home-section container">
      ${renderCta()}
    </section>
  `;

  setImageWithFallback(document.getElementById("about-avatar"), profileImage, fallbackProfileImage);
};

// ==================== TRAVEL MAP (MapLibre + OpenFreeMap) ====================
// Vektör harita: her ekran çözünürlüğünde keskin görünür. OpenFreeMap anahtar istemez.
const MAPLIBRE_BASE = "https://cdn.jsdelivr.net/npm/maplibre-gl@5.24.0/dist/";
const mapStyleUrl = () =>
  `https://tiles.openfreemap.org/styles/${getTheme() === "light" ? "liberty" : "fiord"}`;

// Hikâye verisindeki koordinatlar [enlem, boylam]; MapLibre [boylam, enlem] ister
const toLngLat = ([lat, lng]) => [lng, lat];

const loadMapLibre = (() => {
  let promise;
  return () => {
    if (promise) return promise;
    promise = new Promise((resolve, reject) => {
      const stylesheet = document.createElement("link");
      stylesheet.rel = "stylesheet";
      stylesheet.href = `${MAPLIBRE_BASE}maplibre-gl.css`;
      document.head.appendChild(stylesheet);

      const script = document.createElement("script");
      script.src = `${MAPLIBRE_BASE}maplibre-gl.js`;
      script.onload = () => resolve(window.maplibregl);
      script.onerror = () => {
        promise = null;
        reject(new Error("MapLibre could not be loaded"));
      };
      document.head.appendChild(script);
    });
    return promise;
  };
})();

const renderMapPopup = (story) => `
  <div class="map-popup">
    <img src="${story.homeImage}" alt="" />
    <div>
      <strong>${escapeHtml(story.title)}</strong>
      <span>${escapeHtml(story.info[0].value)}</span>
      <a href="#${story.slug}">Read story →</a>
    </div>
  </div>
`;

const mountTravelMap = () => {
  const element = document.getElementById("travel-map");
  if (!element) return;

  loadMapLibre()
    .then((maplibregl) => {
      if (!element.isConnected) return;

      const stories = Object.values(state.destinations);
      const bounds = new maplibregl.LngLatBounds();
      stories.forEach((story) => bounds.extend(toLngLat(story.coords)));

      const map = new maplibregl.Map({
        container: element,
        style: mapStyleUrl(),
        bounds,
        fitBoundsOptions: { padding: 90 },
        pitch: 35,
        // Sayfayı kaydırırken harita takılmasın: Ctrl + tekerlek / iki parmakla yakınlaştırma
        cooperativeGestures: true,
        attributionControl: { compact: true },
      });
      map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-left");

      // Harita stilinde eksik olan küçük POI ikonları için boş görsel ver (konsol uyarısı olmasın)
      map.on("styleimagemissing", ({ id }) => {
        if (!map.hasImage(id)) map.addImage(id, { width: 1, height: 1, data: new Uint8Array(4) });
      });

      // Kaynak bilgisi kapalı başlasın; "i" düğmesiyle açılır
      map.once("load", () => {
        element.querySelector(".maplibregl-ctrl-attrib")?.classList.remove("maplibregl-compact-show");
      });

      const markers = {};
      stories.forEach((story) => {
        const pin = document.createElement("div");
        pin.className = "map-pin";
        pin.innerHTML = "<span></span>";
        pin.setAttribute("aria-label", story.title);

        markers[story.slug] = new maplibregl.Marker({ element: pin })
          .setLngLat(toLngLat(story.coords))
          .setPopup(
            new maplibregl.Popup({ offset: 18, closeButton: false, maxWidth: "280px" }).setHTML(
              renderMapPopup(story),
            ),
          )
          .addTo(map);
      });

      const setMapTheme = () => map.setStyle(mapStyleUrl());
      window.addEventListener("themechange", setMapTheme);

      state.map = { map, markers };
      addCleanup(() => {
        window.removeEventListener("themechange", setMapTheme);
        map.remove();
        state.map = null;
      });
    })
    .catch(() => {
      if (!element.isConnected) return;
      element.classList.add("is-error");
      element.innerHTML = "<p>The map could not be loaded. Check your connection and refresh.</p>";
    });
};

const focusMapStop = (slug) => {
  const story = state.destinations[slug];
  const marker = state.map?.markers[slug];
  if (!story || !marker) return;

  Object.values(state.map.markers).forEach((other) => {
    if (other !== marker && other.getPopup().isOpen()) other.togglePopup();
  });

  state.map.map.flyTo({
    center: toLngLat(story.coords),
    zoom: 15.5,
    pitch: 55,
    bearing: -18,
    duration: prefersReducedMotion ? 0 : 2200,
    essential: true,
  });
  if (!marker.getPopup().isOpen()) marker.togglePopup();
};

const renderTravels = () => {
  const stories = Object.values(state.destinations);

  main.innerHTML = `
    <section class="container page-section" id="travels">
      <header class="page-header">
        <p class="kicker">Story archive</p>
        <h1 class="page-title">Istanbul in <span class="gradient-text">different lights</span></h1>
        <p>Travel writing, photos, and a deeper dive into the city's stories.</p>
      </header>

      <div class="map-card reveal">
        <div class="map-card__map" id="travel-map" role="region" aria-label="Map of visited places"></div>
        <div class="map-card__list">
          <p class="kicker">On the map</p>
          ${stories
            .map(
              (story, index) => `
                <button class="map-stop" type="button" data-map-stop="${story.slug}">
                  <span class="map-stop__index">${pad(index + 1)}</span>
                  <span>
                    <strong>${escapeHtml(story.title)}</strong>
                    <small>${escapeHtml(story.info[0].value)}</small>
                  </span>
                </button>
              `,
            )
            .join("")}
        </div>
      </div>

      <div class="destination-grid">
        ${stories.map(renderDestinationCard).join("") || '<p class="empty">No stories found.</p>'}
      </div>
    </section>
  `;

  mountTravelMap();
};

const renderProjects = () => {
  main.innerHTML = `
    <section class="container page-section" id="projects">
      <header class="page-header">
        <p class="kicker">My work</p>
        <h1 class="page-title">Projects & <span class="gradient-text">experiments</span></h1>
        <p>A selection of projects I've built combining software development with creative storytelling.</p>
        <p class="source-note" data-projects-source ${state.repos?.length ? "" : "hidden"}>
          ${icons.github} Synced live from GitHub
        </p>
      </header>
      <div class="projects-grid" data-projects-grid>
        ${getProjects().map(renderProjectCard).join("")}
      </div>
    </section>
  `;

  mountProjects();
};

const renderGalleryItems = () =>
  filterGallery(state.galleryFilter)
    .map(
      (image, index) => `
        <button
          class="masonry-item reveal"
          type="button"
          data-gallery="main:${state.galleryFilter}"
          data-index="${index}"
          aria-label="${escapeHtml(image.caption)}"
        >
          <img src="${image.src}" alt="${escapeHtml(image.alt)}" loading="lazy" decoding="async" />
          <span class="masonry-item__overlay">
            <span class="masonry-item__place">${escapeHtml(image.place)}</span>
            <span class="masonry-item__caption">${escapeHtml(image.caption)}</span>
            <span class="masonry-item__zoom">${icons.zoom}</span>
          </span>
        </button>
      `,
    )
    .join("");

const renderGallery = () => {
  const filters = [
    { key: "all", label: "All", count: galleryImages.length },
    ...Object.entries(galleryPlaces).map(([key, place]) => ({
      key,
      label: place.label,
      count: place.count,
    })),
  ];

  main.innerHTML = `
    <section class="container page-section" id="gallery">
      <header class="page-header">
        <p class="kicker">Photo collection</p>
        <h1 class="page-title">Istanbul through <span class="gradient-text">my lens</span></h1>
        <p>${galleryImages.length} frames from palace courtyards to miniature worlds. Tap any photo to open it.</p>
      </header>

      <div class="filter-bar" role="group" aria-label="Filter photos">
        ${filters
          .map(
            (filter) => `
              <button class="filter-chip" type="button" data-filter="${filter.key}"
                aria-pressed="${filter.key === state.galleryFilter}">
                ${escapeHtml(filter.label)} <span>${filter.count}</span>
              </button>
            `,
          )
          .join("")}
      </div>

      <div class="masonry" data-gallery-grid>
        ${renderGalleryItems()}
      </div>
    </section>
  `;
};

const setGalleryFilter = (filter) => {
  state.galleryFilter = filter;
  main.querySelectorAll("[data-filter]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.filter === filter));
  });
  const grid = main.querySelector("[data-gallery-grid]");
  if (grid) grid.innerHTML = renderGalleryItems();
  initScrollReveal();
};

const renderContact = () => {
  main.innerHTML = `
    <section class="container page-section" id="contact">
      <header class="page-header">
        <p class="kicker">Get in touch</p>
        <h1 class="page-title">Let's <span class="gradient-text">connect</span></h1>
        <p>Have a question or want to collaborate? I'd love to hear from you.</p>
      </header>

      <div class="contact-layout">
        <aside class="contact-card reveal">
          <h2>Other ways to reach me</h2>
          <a class="contact-method" href="mailto:${CONTACT_EMAIL}">
            <span class="contact-method__icon">${icons.mail}</span>
            <span><small>Email</small>${CONTACT_EMAIL}</span>
          </a>
          <a class="contact-method" href="${LINKEDIN_URL}" target="_blank" rel="noopener noreferrer">
            <span class="contact-method__icon">${icons.linkedin}</span>
            <span><small>LinkedIn</small>berat-tanlasi</span>
          </a>
          <a class="contact-method" href="${GITHUB_URL}" target="_blank" rel="noopener noreferrer">
            <span class="contact-method__icon">${icons.github}</span>
            <span><small>GitHub</small>${escapeHtml(GITHUB_USERNAME)}</span>
          </a>
          <a class="contact-method" href="${X_URL}" target="_blank" rel="noopener noreferrer">
            <span class="contact-method__icon">${icons.x}</span>
            <span><small>X (Twitter)</small>@Soren_49</span>
          </a>
          <a class="contact-method" href="${PINTEREST_URL}" target="_blank" rel="noopener noreferrer">
            <span class="contact-method__icon">${icons.pinterest}</span>
            <span><small>Pinterest</small>b3rad_</span>
          </a>
          <div class="contact-method contact-method--static">
            <span class="contact-method__icon">${icons.pin}</span>
            <span><small>Location</small>Istanbul, Türkiye</span>
          </div>
        </aside>

        <form class="contact-form reveal" id="contact-form">
          <div class="form-row">
            <div class="form-group">
              <label for="name">Name</label>
              <input type="text" id="name" name="name" autocomplete="name" placeholder="Your name" required />
            </div>
            <div class="form-group">
              <label for="email">Email</label>
              <input type="email" id="email" name="email" autocomplete="email" placeholder="you@example.com" required />
            </div>
          </div>
          <div class="form-group">
            <label for="message">Message</label>
            <textarea id="message" name="message" placeholder="Tell me about your idea, question or favourite route..." required></textarea>
          </div>
          <button type="submit" class="button">Send Message ${icons.arrowRight}</button>
          <p class="form-status" id="form-status" role="status"></p>
        </form>
      </div>
    </section>
  `;

  // Form verileriyle ziyaretçinin e-posta uygulamasını hazır bir mesajla açar
  const contactForm = document.getElementById("contact-form");
  const formStatus = document.getElementById("form-status");
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(contactForm);
    const name = data.get("name").trim();
    const subject = encodeURIComponent(`Website message from ${name}`);
    const body = encodeURIComponent(`${data.get("message").trim()}\n\n— ${name} (${data.get("email").trim()})`);
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    formStatus.textContent = "Your email app should open with the message ready to send. Thank you!";
    contactForm.reset();
  });
};

// Hikâyedeki bölüm görselleri + "Captured Frames" galerisi tek bir lightbox dizisi oluşturur
const getStoryImages = (story) => [
  ...story.sections.filter((section) => section.image).map((section) => section.image),
  ...story.gallery,
];

const renderStoryImage = (storySlug, image, index) => `
  <figure class="story-figure">
    <button class="story-figure__button" type="button" data-gallery="${storySlug}" data-index="${index}"
      aria-label="${escapeHtml(image.alt)}">
      <img src="${image.src}" alt="${escapeHtml(image.alt)}" loading="lazy" decoding="async" />
    </button>
    <figcaption class="story-figure__caption">${escapeHtml(image.caption)}</figcaption>
  </figure>
`;

const renderStory = (story) => {
  const nextStory = state.destinations[story.next];
  const sectionImageCount = story.sections.filter((section) => section.image).length;
  let sectionImageIndex = 0;

  main.innerHTML = `
    <section class="story-page container" id="${story.slug}">
      <a class="back-link" href="#travels">${icons.arrowLeft} All stories</a>

      <header class="story-hero">
        <img class="story-hero__image" src="${story.heroImage}" alt="${escapeHtml(story.heroAlt)}"
          fetchpriority="high" decoding="async" />
        <div class="story-hero__scrim"></div>
        <div class="story-hero__content">
          <p class="kicker">${escapeHtml(story.category)}</p>
          <h1 class="story-title">${escapeHtml(story.title)}</h1>
          <p class="story-deck">${escapeHtml(story.deck)}</p>
          <div class="story-meta">
            <span>${icons.calendar}${escapeHtml(story.published)}</span>
            <span>${icons.clock}${escapeHtml(story.readTime)}</span>
            <span>${icons.user}${escapeHtml(story.author)}</span>
          </div>
        </div>
      </header>

      <div class="story-layout">
        <article class="story-content">
          <div class="story-intro">
            ${renderParagraphs(story.intro)}
          </div>

          <ul class="story-facts">
            ${renderFacts(story.facts)}
          </ul>

          ${story.sections
            .map(
              (section) => `
                <section class="story-section reveal">
                  ${section.kicker ? `<span class="story-section__num">${escapeHtml(section.kicker)}</span>` : ""}
                  <h2>${escapeHtml(section.title)}</h2>
                  ${section.subhead ? `<h3>${escapeHtml(section.subhead)}</h3>` : ""}
                  ${renderParagraphs(section.paragraphs)}
                  ${section.image ? renderStoryImage(story.slug, section.image, sectionImageIndex++) : ""}
                </section>
              `,
            )
            .join("")}

          <blockquote class="quote reveal">
            <p>${escapeHtml(story.quote)}</p>
          </blockquote>

          <section class="story-gallery reveal">
            <h2>Captured Frames</h2>
            <p>
              These frames were selected for those who prefer remembering scenes
              one by one rather than quickly consuming the journey.
            </p>
            <div class="story-gallery__grid">
              ${story.gallery
                .map(
                  (image, index) => `
                    <button class="story-gallery__item" type="button" data-gallery="${story.slug}"
                      data-index="${sectionImageCount + index}" aria-label="${escapeHtml(image.alt)}">
                      <img src="${image.src}" alt="${escapeHtml(image.alt)}" loading="lazy" decoding="async" />
                    </button>
                  `,
                )
                .join("")}
            </div>
          </section>

          <section class="next-story reveal">
            <img class="next-story__image" src="${nextStory.homeImage}" alt="" loading="lazy" decoding="async" />
            <div class="next-story__body">
              <p class="kicker">Next stop</p>
              <h3>${escapeHtml(nextStory.title)}</h3>
              <p>${escapeHtml(story.nextDescription)}</p>
              <div class="next-story__actions">
                <a class="button" href="#${nextStory.slug}">${escapeHtml(story.nextLabel)} ${icons.arrowRight}</a>
                <a class="button button--ghost" href="#travels">Back to Travels</a>
              </div>
            </div>
          </section>
        </article>

        <aside class="sidebar" aria-label="Quick notes">
          <section class="sidebar-card">
            <h3>Quick Notes</h3>
            <dl class="info-list">
              ${story.info
                .map(
                  (item) => `
                    <div>
                      <dt>${escapeHtml(item.label)}</dt>
                      <dd>${escapeHtml(item.value)}</dd>
                    </div>
                  `,
                )
                .join("")}
            </dl>
          </section>

          <section class="sidebar-card">
            <p class="kicker">Up next</p>
            <h3>${escapeHtml(nextStory.title)}</h3>
            <p>${escapeHtml(story.preview)}</p>
            <a class="text-link" href="#${nextStory.slug}">${escapeHtml(story.nextLabel)} ${icons.arrowRight}</a>
          </section>
        </aside>
      </div>
    </section>
  `;
};

// ==================== BLOG ====================
// Yazılar blog.js dosyasında (window.blogPosts) tutulur. Okuma süresi
// yazının kelime sayısından otomatik hesaplanır.
const blogPosts = (window.blogPosts || []).map((post) => ({
  ...post,
  readMinutes: Math.max(
    1,
    Math.round(post.content.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length / 200),
  ),
}));

const getPost = (slug) => blogPosts.find((post) => post.slug === slug);

// Yazı kapağı: n8n tarzı birbirine bağlı düğümlerden oluşan küçük bir çizim
let blogCoverCount = 0;
const renderBlogCover = (post) => {
  blogCoverCount += 1;
  const id = `blog-cover-${blogCoverCount}`;
  const [first, second, third, fourth, fifth] = post.coverNodes || ["Trigger", "HTTP", "IF", "Action", "Log"];
  const nodes = [
    { x: 30, y: 154, label: first, color: "#4ea8ff" },
    { x: 200, y: 80, label: second, color: "#8b5cf6" },
    { x: 370, y: 154, label: third, color: "#fbbf24" },
    { x: 540, y: 80, label: fourth, color: "#35d07f" },
    { x: 540, y: 228, label: fifth, color: "#ff5b9e" },
  ];
  const edges = [
    "M140 180 C 170 180 170 106 200 106",
    "M310 106 C 340 106 340 180 370 180",
    "M480 180 C 510 180 510 106 540 106",
    "M480 180 C 510 180 510 254 540 254",
  ];

  return `
    <svg class="blog-cover" viewBox="0 0 680 360" role="img" aria-label="${escapeHtml(post.title)}">
      <defs>
        <linearGradient id="${id}-edge" x1="0" x2="1">
          <stop offset="0" stop-color="#4ea8ff" />
          <stop offset="0.5" stop-color="#8b5cf6" />
          <stop offset="1" stop-color="#ff5b9e" />
        </linearGradient>
        <radialGradient id="${id}-glow" cx="0.5" cy="0.45" r="0.6">
          <stop offset="0" stop-color="#7c6cff" stop-opacity="0.35" />
          <stop offset="1" stop-color="#7c6cff" stop-opacity="0" />
        </radialGradient>
        <pattern id="${id}-dots" width="22" height="22" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.2" class="blog-cover__dot" />
        </pattern>
      </defs>
      <rect class="blog-cover__bg" width="680" height="360" />
      <rect width="680" height="360" fill="url(#${id}-dots)" />
      <rect width="680" height="360" fill="url(#${id}-glow)" />
      ${edges.map((d) => `<path class="blog-cover__edge" d="${d}" stroke="url(#${id}-edge)" />`).join("")}
      ${nodes
        .map(
          (node) => `
            <g class="blog-cover__node">
              <rect x="${node.x}" y="${node.y}" width="110" height="52" rx="14" />
              <circle cx="${node.x + 20}" cy="${node.y + 26}" r="6" fill="${node.color}" />
              <text x="${node.x + 34}" y="${node.y + 31}">${escapeHtml(node.label)}</text>
            </g>
          `,
        )
        .join("")}
    </svg>
  `;
};

const renderPostTags = (post) => `
  <div class="post-tags">
    ${post.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}
  </div>
`;

const renderPostCard = (post) => `
  <article class="post-card spot reveal" lang="${post.lang}">
    <a class="post-card__media" href="#blog/${post.slug}" tabindex="-1" aria-hidden="true">
      ${renderBlogCover(post)}
    </a>
    <div class="post-card__body">
      ${renderPostTags(post)}
      <h3 class="post-card__title"><a href="#blog/${post.slug}">${escapeHtml(post.title)}</a></h3>
      <p class="post-card__excerpt">${escapeHtml(post.deck)}</p>
      <div class="post-card__meta">
        <span>${icons.calendar}${escapeHtml(post.dateLabel)}</span>
        <span>${icons.clock}${post.readMinutes} dk okuma</span>
      </div>
      <a class="text-link" href="#blog/${post.slug}">Yazıyı oku ${icons.arrowRight}</a>
    </div>
  </article>
`;

const renderBlog = () => {
  main.innerHTML = `
    <section class="container page-section" id="blog">
      <header class="page-header">
        <p class="kicker">Blog</p>
        <h1 class="page-title">Notes on code &amp; <span class="gradient-text">automation</span></h1>
        <p>Long-form writing about software, automation and the tools I learn along the way.</p>
      </header>
      <div class="post-list">
        ${blogPosts.map(renderPostCard).join("") || '<p class="empty">No posts yet.</p>'}
      </div>
    </section>
  `;
};

// İçindekiler: yazıdaki h2 başlıklarından otomatik oluşur, okunan bölüm vurgulanır
const mountPostToc = () => {
  const headings = [...main.querySelectorAll(".post-body h2")];
  headings.forEach((heading, index) => {
    heading.id = `bolum-${index + 1}`;
  });

  const items = headings
    .map(
      (heading, index) => `
        <li>
          <button type="button" data-toc-target="${heading.id}">
            <span>${pad(index + 1)}</span>${escapeHtml(heading.textContent)}
          </button>
        </li>
      `,
    )
    .join("");
  main.querySelectorAll("[data-toc-list]").forEach((list) => {
    list.innerHTML = items;
  });

  if (!headings.length) return;

  // Ekranın üst kısmını geçmiş son başlık "okunan bölüm" sayılır; sayfanın
  // sonuna gelindiyse son bölüm seçilir (hızlı kaydırmada da doğru çalışır)
  let activeId = null;
  let ticking = false;
  const updateActive = () => {
    ticking = false;
    let current = headings[0].id;
    for (const heading of headings) {
      if (heading.getBoundingClientRect().top <= 160) current = heading.id;
      else break;
    }
    const atBottom =
      window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
    if (atBottom) current = headings[headings.length - 1].id;
    if (current === activeId) return;
    activeId = current;
    main.querySelectorAll("[data-toc-target]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.tocTarget === current);
    });
  };
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(updateActive);
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  addCleanup(() => window.removeEventListener("scroll", onScroll));
  updateActive();
};

const renderPost = (post) => {
  main.innerHTML = `
    <section class="post-page container" lang="${post.lang}">
      <a class="back-link" href="#blog">${icons.arrowLeft} Tüm yazılar</a>

      <header class="post-hero">
        <div class="post-hero__text">
          ${renderPostTags(post)}
          <h1 class="post-title">${escapeHtml(post.title)}</h1>
          <p class="post-deck">${escapeHtml(post.deck)}</p>
          <div class="post-meta">
            <span class="post-meta__author"><img src="${profileImage}" alt="" />Berat Tanlasi</span>
            <span>${icons.calendar}${escapeHtml(post.dateLabel)}</span>
            <span>${icons.clock}${post.readMinutes} dk okuma</span>
          </div>
        </div>
        <div class="post-hero__art">${renderBlogCover(post)}</div>
      </header>

      <div class="post-layout">
        <article class="post-body">
          <details class="post-toc-mobile">
            <summary>İçindekiler</summary>
            <ol class="toc-list" data-toc-list></ol>
          </details>

          ${post.content}

          <footer class="post-end">
            <div class="author-card">
              <img src="${profileImage}" alt="Berat Tanlasi" />
              <div>
                <p class="kicker">Yazar</p>
                <strong>Berat Tanlasi</strong>
                <p>Yazılım geliştiriyor, İstanbul'u geziyor ve öğrendiklerini yazıya döküyor.</p>
              </div>
            </div>
            <div class="post-end__actions">
              <a class="button button--ghost" href="#blog">${icons.arrowLeft} Tüm yazılar</a>
              <button class="button" type="button" data-scroll-top>Başa dön ↑</button>
            </div>
          </footer>
        </article>

        <aside class="post-toc" aria-label="İçindekiler">
          <p class="kicker">İçindekiler</p>
          <ol class="toc-list" data-toc-list></ol>
        </aside>
      </div>
    </section>
  `;

  mountPostToc();
};

// ==================== LIGHTBOX ====================
const resolveGallery = (key) => {
  if (key.startsWith("main")) return filterGallery(key.split(":")[1] || "all");
  const story = state.destinations[key];
  return story ? getStoryImages(story) : null;
};

const closeLightbox = () => {
  lightbox.hidden = true;
  lightbox.setAttribute("aria-hidden", "true");
  lightboxImage.removeAttribute("src");
  lightboxImage.alt = "";
  lightboxCaption.textContent = "";
  lightboxCounter.textContent = "";
  document.body.classList.remove("is-modal-open");

  if (lastFocusedElement) {
    lastFocusedElement.focus();
    lastFocusedElement = null;
  }
};

const showLightboxItem = () => {
  const image = activeGallery[activeGalleryIndex];
  if (!image) return;

  lightboxImage.src = image.src;
  lightboxImage.alt = image.alt;
  lightboxCaption.textContent = image.caption;
  lightboxCounter.textContent = `${activeGalleryIndex + 1} / ${activeGallery.length}`;
};

const openLightbox = (galleryKey, index, trigger) => {
  const gallery = resolveGallery(galleryKey);
  if (!gallery?.length) return;

  activeGallery = gallery;
  activeGalleryIndex = index;
  lastFocusedElement = trigger;
  showLightboxItem();
  lightbox.hidden = false;
  lightbox.setAttribute("aria-hidden", "false");
  document.body.classList.add("is-modal-open");
  lightboxPrimaryClose.focus();
};

const stepLightbox = (direction) => {
  if (!activeGallery.length) return;

  activeGalleryIndex =
    (activeGalleryIndex + direction + activeGallery.length) %
    activeGallery.length;
  showLightboxItem();
};

main.addEventListener("click", (event) => {
  const filterButton = event.target.closest("[data-filter]");
  if (filterButton) {
    setGalleryFilter(filterButton.dataset.filter);
    return;
  }

  const tocButton = event.target.closest("[data-toc-target]");
  if (tocButton) {
    document.getElementById(tocButton.dataset.tocTarget)?.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });
    tocButton.closest("details")?.removeAttribute("open");
    return;
  }

  if (event.target.closest("[data-scroll-top]")) {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
    return;
  }

  const mapStop = event.target.closest("[data-map-stop]");
  if (mapStop) {
    focusMapStop(mapStop.dataset.mapStop);
    return;
  }

  const galleryTrigger = event.target.closest("[data-gallery]");
  if (!galleryTrigger || !main.contains(galleryTrigger)) return;

  const galleryKey = galleryTrigger.dataset.gallery;
  const index = Number(galleryTrigger.dataset.index || 0);
  openLightbox(galleryKey, index, galleryTrigger);
});

lightboxCloseButtons.forEach((button) => {
  button.addEventListener("click", closeLightbox);
});

lightboxPrev.addEventListener("click", () => stepLightbox(-1));
lightboxNext.addEventListener("click", () => stepLightbox(1));

document.addEventListener("keydown", (event) => {
  if (lightbox.hidden) return;

  if (event.key === "Escape") closeLightbox();
  if (event.key === "ArrowLeft") stepLightbox(-1);
  if (event.key === "ArrowRight") stepLightbox(1);

  // Odak lightbox içinde kalsın
  if (event.key === "Tab") {
    const focusable = [...lightboxPanel.querySelectorAll("button")];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
});

// Dokunmatik ekranlarda sağa/sola kaydırarak fotoğraf değiştirme
let touchStartX = null;
lightboxPanel.addEventListener(
  "touchstart",
  (event) => {
    touchStartX = event.touches[0].clientX;
  },
  { passive: true },
);
lightboxPanel.addEventListener("touchend", (event) => {
  if (touchStartX === null) return;
  const deltaX = event.changedTouches[0].clientX - touchStartX;
  if (Math.abs(deltaX) > 50) stepLightbox(deltaX < 0 ? 1 : -1);
  touchStartX = null;
});

// ==================== SCROLL REVEAL ====================
// Section'lar viewport'a girdiğinde bir kez animasyonla belirir; her küçük
// scroll hareketinde tekrar tetiklenmemesi için görünür olan eleman gözlemden çıkarılır.
const revealObserver =
  "IntersectionObserver" in window
    ? new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
      )
    : null;

const initScrollReveal = () => {
  const revealTargets = main.querySelectorAll(".reveal:not(.is-visible)");

  if (!revealObserver) {
    revealTargets.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  revealTargets.forEach((el) => revealObserver.observe(el));
};

// ==================== MAIN RENDER FUNCTION ====================
const pageRenderers = {
  home: renderHome,
  about: renderAbout,
  travels: renderTravels,
  projects: renderProjects,
  gallery: renderGallery,
  blog: renderBlog,
  contact: renderContact,
};

const render = () => {
  const route = getRoute();
  if (!lightbox.hidden) {
    lastFocusedElement = null;
    closeLightbox();
  }
  runCleanups();
  revealObserver?.disconnect();
  updateTitle(route);
  updateActiveNav(route);

  if (pageRenderers[route]) {
    pageRenderers[route]();
  } else if (route.startsWith("blog/")) {
    renderPost(getPost(route.slice(5)));
  } else {
    renderStory(state.destinations[route]);
  }

  // Sayfa geçiş animasyonunu her rotada yeniden başlat
  main.classList.remove("is-entering");
  void main.offsetWidth;
  main.classList.add("is-entering");

  initScrollReveal();
  window.scrollTo({ top: 0, behavior: "instant" });
  window.dispatchEvent(new Event("routechange"));
};

window.addEventListener("hashchange", render);

// ==================== DESTINATIONS DATA ====================
const destinationsData = {
  topkapi: {
    slug: "topkapi",
    title: "Topkapi Palace",
    category: "Istanbul / History Route",
    coords: [41.0115, 28.9834],
    deck: "Steps slowing down among courtyards, sweeping views opening up to the Bosphorus, and a silent grandeur hidden within the palace.",
    published: "June 11, 2026",
    readTime: "8 min read",
    author: "Berat Tanlasi",
    heroImage: topkapiImage("1.jpg"),
    heroAlt:
      "A wide panoramic view looking out to the Bosphorus from the outer courtyard of Topkapi Palace",
    homeImage: topkapiImage("2.jpg"),
    homeAlt: "A view of the pool and trees in the courtyard of Topkapi Palace",
    cardCopy:
      "Topkapi is one of those places in Istanbul where the pace naturally drops. As you wander through its gates, courtyards, and garden borders, history doesn't shout; it quietly accompanies you.",
    cardMeta: ["Sultanahmet", "3-4 hours", "Quiet and dignified"],
    preview:
      "In Miniaturk, the very same city transforms into a lighter, more playful language.",
    next: "miniaturk",
    nextLabel: "Proceed to Miniaturk",
    nextDescription:
      "In the next article, you will explore Istanbul and Turkey on a smaller scale, through a more playful lens.",
    info: [
      { label: "Location", value: "Sultanahmet, Fatih" },
      { label: "Pace", value: "Slow and detailed" },
      { label: "Duration", value: "3-4 hours" },
      { label: "Transport", value: "Tram + short walk" },
      { label: "Best time", value: "First half of the morning" },
      { label: "Note", value: "Leave time for the view" },
    ],
    facts: [
      { label: "Location", value: "Historical Peninsula" },
      { label: "Focus", value: "Courtyards, landscapes, details" },
      { label: "Visit rhythm", value: "Deliberate, not rushed" },
      { label: "Photography", value: "Shadows and stone textures work best" },
    ],
    intro: [
      "As you approach Topkapi Palace, the city suddenly shifts into another rhythm. The crowds of Sultanahmet remain outside the gate; inside, a more measured, dignified Istanbul begins. Here, stone walls are not just structural boundaries, but look like silent archives of centuries-old decisions and daily ceremonies.",
      'In this article, we take Topkapi off the standard "must-see" list and turn it into an intentional walk. We will linger in the courtyards, gaze at the landscape for long stretches rather than short glimpses, and try to understand why people slow down in front of an ornate detail.',
    ],
    quote:
      "When exploring Topkapi, what you hear most is not the sound of history, but the act of slowing down itself.",
    sections: [
      {
        kicker: "01",
        title: "Through the Imperial Gate",
        subhead: "Voices fade in the first courtyard",
        paragraphs: [
          "The moment you step inside, the outer pace shuts behind you. The first courtyard immediately makes you feel that the palace is more than just a gate; width, shade, and walking distance work together here. After a while, you start paying attention to your surroundings rather than looking up, because the space positions you instead of rushing you.",
          "For me, one of the most beautiful aspects of Topkapi is this very first threshold. It is clear without even looking at a map: this palace is the footprint of a lived-in order. Moving from one gate to another, you are not just traveling; the sound, the crowd, and the perspective shift as well.",
        ],
        image: {
          src: topkapiImage("3.jpg"),
          alt: "A pool, stone path, and trees in the courtyard of Topkapi Palace",
          caption:
            "The strongest feeling in the first courtyard is openness and tranquility.",
        },
      },
    ],
    gallery: [
      {
        src: topkapiImage("4.jpg"),
        alt: "Istanbul and Bosphorus view from the outer courtyard of Topkapi Palace",
        caption:
          "Topkapi's widest frames emerge along the edges opening to the city.",
      },
      {
        src: topkapiImage("5.jpg"),
        alt: "Topkapi Palace wall, garden, and water view",
        caption: "Stone, green, and water; Topkapi's serene trio.",
      },
      {
        src: topkapiImage("6.jpg"),
        alt: "An ornate ceiling and wall detail inside Topkapi Palace",
        caption: "Details are the longest-lasting memories of the palace.",
      },
    ],
  },
  miniaturk: {
    slug: "miniaturk",
    title: "Miniaturk",
    category: "Istanbul / Discovery Route",
    coords: [41.0603, 28.9493],
    deck: "An open-air route that feels like another country within the city; miniature in scale, yet fully capturing the grand essence.",
    published: "June 11, 2026",
    readTime: "7 min read",
    author: "Berat Tanlasi",
    heroImage: miniaturkImage("1.jpg"),
    heroAlt: "Open-air area, models, and Istanbul skyline at Miniaturk",
    homeImage: miniaturkImage("2.jpg"),
    homeAlt: "A detailed mosque model at Miniaturk",
    cardCopy:
      "Miniaturk maintains the sense of fun while scaling down a vast geography. It is one of those rare places that feels as organized as a museum yet as lively as a playground as you walk through.",
    cardMeta: ["Sutluce", "2-3 hours", "Family & photo friendly"],
    preview:
      "In Topkapi, the same city speaks with a heavier, more monumental voice.",
    next: "topkapi",
    nextLabel: "Return to Topkapi",
    nextDescription:
      "In the next article, you can shift the rhythm of your walk by returning to the city's most dignified historical stop.",
    info: [
      { label: "Location", value: "Sutluce, Golden Horn coast" },
      { label: "Pace", value: "Light and fluid" },
      { label: "Duration", value: "2-3 hours" },
      { label: "Transport", value: "Public transit + short connection" },
      { label: "Best time", value: "Before noon or sunset" },
      { label: "Note", value: "A wide angle works great for photography" },
    ],
    facts: [
      { label: "Location", value: "Golden Horn coast, Sutluce" },
      { label: "Focus", value: "Models, city memory" },
      { label: "Visit rhythm", value: "Fast-paced yet rich" },
      { label: "Photography", value: "Wide angle and soft light" },
    ],
    intro: [
      'Miniaturk is a cleverly designed route for those wanting to see a lot of things in Istanbul in a short time. But this is not just an area of "small models"; it is a well-ordered open-air narrative that brings together different eras and regions of the country into a single walk.',
      "Upon entering the park, attention shifts first to the wide open spaces, then to the small-scale structures. I like this inverse flow; because when wandering a vast geography within a compact space, the patience of your gaze shifts too. Standing before a model feels less like looking at the original building and more like viewing a memory system that describes it.",
    ],
    quote:
      "Wandering through Miniaturk feels less like shrinking a map and more like expanding your curiosity.",
    sections: [
      {
        kicker: "01",
        title: "Scale shifts at the entrance",
        subhead: "A large park, small structures, and panoramic views",
        paragraphs: [
          'Stepping into Miniaturk, the first thing that catches your eye is the openness of the space. Despite the objects being small, the park never feels cramped; on the contrary, it offers a relaxed pace to visitors thanks to its wide walkways and open vistas. This elevates the tour from a simple "look and pass" experience to a calm journey of discovery.',
          "At first glance, it feels like all models will look similar, but after a few minutes, you notice that each carries its own scale, texture, and narrative intent. At that moment, Miniaturk's true power shines through: walking the history of a thousands-of-kilometers-wide geography in just a few steps.",
        ],
        image: {
          src: miniaturkImage("3.jpg"),
          alt: "A large structural model and the surrounding green area at Miniaturk",
          caption:
            "The first thing that stands out at Miniaturk is the breathing room provided by the park's spaciousness.",
        },
      },
    ],
    gallery: [
      {
        src: miniaturkImage("4.jpg"),
        alt: "Wide park area and models viewed from above at Miniaturk",
        caption:
          "The park's most powerful framing appears when looking from a high angle.",
      },
      {
        src: miniaturkImage("5.jpg"),
        alt: "A detailed architectural model at Miniaturk",
        caption:
          "In close-ups, even though the scale shrinks, the architectural impact grows.",
      },
      {
        src: miniaturkImage("6.jpg"),
        alt: "A structural model with a wide perspective at Miniaturk",
        caption:
          "A wide perspective is the angle that reveals the park's arrangement most clearly.",
      },
    ],
  },
};

// ==================== INITIALIZATION ====================
state.destinations = destinationsData;
render();

// ============================================================
// ARKA PLAN: CANLI NOKTA DALGASI (canvas)
// Eski arka plan görselindeki parçacık dalgasının keskin, hareketli hali.
// ============================================================
(() => {
  const canvas = document.getElementById("bg-wave");
  const context = canvas?.getContext("2d");
  if (!context) return;

  const isSmallScreen = window.matchMedia("(max-width: 700px)").matches;
  const columns = isSmallScreen ? 56 : 96;
  const rows = isSmallScreen ? 34 : 48;
  const spreadX = 4.2;
  const nearZ = 0.7;
  const farZ = 5.5;
  const cameraHeight = 0.62;

  let width = 0;
  let height = 0;
  let dpr = 1;
  let frameId = null;
  let pointerX = 0;
  let cameraX = 0;

  // Sütun başına renk: soldan sağa mavi → mor → pembe (açık temada daha koyu tonlar)
  const buildColumnColors = () => {
    const lightness = getTheme() === "light" ? 50 : 70;
    return Array.from({ length: columns }, (_, column) => {
      const hue = 205 + (column / (columns - 1)) * 120;
      return `hsl(${hue}, 90%, ${lightness}%)`;
    });
  };
  let columnColors = buildColumnColors();

  // Her renk için bir kez yuvarlak, kenarı yumuşak bir nokta çiz; her karede
  // bu küçük görseller kopyalanır (binlerce daireyi tek tek çizmekten çok daha hızlı)
  const SPRITE_SIZE = 32;
  const buildDotSprites = () =>
    columnColors.map((color) => {
      const sprite = document.createElement("canvas");
      sprite.width = SPRITE_SIZE;
      sprite.height = SPRITE_SIZE;
      const spriteContext = sprite.getContext("2d");
      const radius = SPRITE_SIZE / 2;
      const gradient = spriteContext.createRadialGradient(radius, radius, 0, radius, radius, radius);
      gradient.addColorStop(0, color);
      gradient.addColorStop(0.4, color);
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      spriteContext.fillStyle = gradient;
      spriteContext.fillRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);
      return sprite;
    });
  let dotSprites = buildDotSprites();

  // Arka plandaki renkli ışık: fareyi gecikmeli takip eder, dokunmatik
  // cihazlarda kendi kendine yavaşça süzülür
  const glow = document.getElementById("bg-glow");
  let glowTargetX = 0.7;
  let glowTargetY = 0.18;
  let glowX = glowTargetX;
  let glowY = glowTargetY;

  const updateGlow = (t) => {
    if (!glow) return;
    if (!supportsFineHover) {
      glowTargetX = 0.5 + Math.sin(t * 0.35) * 0.3;
      glowTargetY = 0.3 + Math.cos(t * 0.27) * 0.15;
    }
    const nextX = glowX + (glowTargetX - glowX) * 0.06;
    const nextY = glowY + (glowTargetY - glowY) * 0.06;
    if (Math.abs(nextX - glowX) + Math.abs(nextY - glowY) < 0.0002) return;
    glowX = nextX;
    glowY = nextY;
    glow.style.setProperty("--glow-x", `${(glowX * 100).toFixed(2)}%`);
    glow.style.setProperty("--glow-y", `${(glowY * 100).toFixed(2)}%`);
  };

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const draw = (time) => {
    const t = time * 0.00045;
    const focal = width * 0.55;
    const horizon = height * 0.48;

    cameraX += (pointerX - cameraX) * 0.04;
    updateGlow(t);
    context.clearRect(0, 0, width, height);

    for (let column = 0; column < columns; column += 1) {
      const x = (column / (columns - 1) - 0.5) * 2 * spreadX;
      const sprite = dotSprites[column];

      for (let row = 0; row < rows; row += 1) {
        const z = farZ - (row / (rows - 1)) * (farZ - nearZ);
        const y =
          0.14 * Math.sin(x * 1.3 + t * 1.6) +
          0.11 * Math.cos(z * 1.4 - t * 1.2) +
          0.05 * Math.sin((x + z) * 2.2 + t * 2.1);

        const screenX = width / 2 + ((x - cameraX) / z) * focal;
        const screenY = horizon + ((cameraHeight - y) / z) * focal;
        if (screenX < -4 || screenX > width + 4 || screenY > height + 4) continue;

        const depth = 1 - (z - nearZ) / (farZ - nearZ);
        const crest = 0.45 + (y + 0.3) * 1.1;
        context.globalAlpha = Math.max(0, Math.min(1, Math.pow(depth, 1.6) * crest * 1.35));
        // Görselin dış yarısı yumuşak geçiş olduğu için çizim boyutu noktanın ~2 katı
        const size = Math.max(1.1, 3 / z) * 2;
        context.drawImage(sprite, screenX - size / 2, screenY - size / 2, size, size);
      }
    }
    context.globalAlpha = 1;
  };

  const loop = (time) => {
    draw(time);
    frameId = requestAnimationFrame(loop);
  };

  const start = () => {
    if (prefersReducedMotion) {
      draw(0);
      return;
    }
    if (frameId === null) frameId = requestAnimationFrame(loop);
  };

  const stop = () => {
    if (frameId !== null) cancelAnimationFrame(frameId);
    frameId = null;
  };

  resize();
  start();

  window.addEventListener("resize", () => {
    resize();
    if (prefersReducedMotion) draw(0);
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });

  window.addEventListener("themechange", () => {
    columnColors = buildColumnColors();
    dotSprites = buildDotSprites();
    if (prefersReducedMotion) draw(0);
  });

  if (supportsFineHover && !prefersReducedMotion) {
    window.addEventListener(
      "pointermove",
      (event) => {
        pointerX = (event.clientX / window.innerWidth - 0.5) * 0.6;
        glowTargetX = event.clientX / window.innerWidth;
        glowTargetY = event.clientY / window.innerHeight;
      },
      { passive: true },
    );
  }
})();

// ============================================================
// SAĞ ALT SOHBET / MESAJ WIDGET'I
// ============================================================
(() => {
  const widget = document.getElementById("chat-widget");
  const closeBtn = document.getElementById("chat-close");
  const openBtn = document.getElementById("chat-open");
  const footer = document.getElementById("footer");
  const form = document.getElementById("chat-form");
  const messageField = document.getElementById("chat-message");
  const avatar = document.getElementById("chat-avatar");

  setImageWithFallback(avatar, profileImage, fallbackProfileImage);

  const updateChatFooterPosition = () => {
    if (!widget || !footer) return;

    const footerTop = footer.getBoundingClientRect().top;
    widget.classList.toggle(
      "is-footer-visible",
      footerTop < window.innerHeight - 12,
    );
  };

  window.addEventListener("scroll", updateChatFooterPosition, {
    passive: true,
  });
  window.addEventListener("resize", updateChatFooterPosition);
  window.addEventListener("routechange", updateChatFooterPosition);
  updateChatFooterPosition();

  closeBtn?.addEventListener("click", () => {
    widget?.classList.add("is-collapsed");
    openBtn?.focus();
  });

  openBtn?.addEventListener("click", () => {
    widget?.classList.remove("is-collapsed");
    messageField?.focus();
  });

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    const message = messageField.value.trim();
    if (!message) return;

    const subject = encodeURIComponent("Website message from a visitor");
    const body = encodeURIComponent(message);
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;

    messageField.value = "";
  });
})();

// ============================================================
// AŞAĞI KAYDIRMA İPUCU + OKUMA İLERLEME ÇUBUĞU
// ============================================================
(() => {
  const cue = document.getElementById("scroll-cue");
  const progress = document.getElementById("read-progress");

  cue?.addEventListener("click", () => {
    window.scrollBy({ top: window.innerHeight * 0.8, behavior: "smooth" });
  });

  const update = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const isHome = getRoute() === "home";

    if (cue) {
      const showCue = isHome && window.scrollY < 40 && scrollable > 200;
      cue.classList.toggle("is-hidden", !showCue);
    }

    // Metinlerin okunabilirliği için arka plan dalgası sadece ana sayfanın tepesinde tam parlak
    const baseOpacity = isHome ? 0.95 : 0.4;
    const fade = Math.min(window.scrollY / 900, 1);
    document.documentElement.style.setProperty(
      "--wave-opacity",
      (baseOpacity - (baseOpacity - 0.22) * fade).toFixed(3),
    );

    if (progress) {
      const ratio = scrollable > 0 ? Math.min(window.scrollY / scrollable, 1) : 0;
      progress.style.transform = `scaleX(${ratio})`;
    }
  };

  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  window.addEventListener("routechange", () => requestAnimationFrame(update));
  update();
})();

// ============================================================
// NAVBAR SCROLL DAVRANIŞI
// ============================================================
(() => {
  const header = document.querySelector(".site-header");
  if (!header) return;

  let ticking = false;

  const updateHeaderState = () => {
    header.classList.toggle("site-header--scrolled", window.scrollY > 24);
    ticking = false;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(updateHeaderState);
    },
    { passive: true },
  );

  updateHeaderState();
})();

// ============================================================
// KART EFEKTLERİ — fareyi takip eden ışık (spotlight) + 3D tilt.
// Sadece fare/ince işaretçili, reduced-motion istemeyen masaüstü tarayıcılarda çalışır.
// ============================================================
if (!prefersReducedMotion && supportsFineHover) {
  const tiltSelector = ".destination-card, .project-card";
  const maxTiltDeg = 5;

  const resetTilt = (card) => {
    card.style.setProperty("--tilt-x", "0deg");
    card.style.setProperty("--tilt-y", "0deg");
  };

  main.addEventListener("pointermove", (event) => {
    if (event.pointerType !== "mouse") return;

    const spotCard = event.target.closest(".spot");
    if (!spotCard) return;

    const rect = spotCard.getBoundingClientRect();
    spotCard.style.setProperty("--mx", `${event.clientX - rect.left}px`);
    spotCard.style.setProperty("--my", `${event.clientY - rect.top}px`);

    if (spotCard.matches(tiltSelector)) {
      const relativeX = (event.clientX - rect.left) / rect.width - 0.5;
      const relativeY = (event.clientY - rect.top) / rect.height - 0.5;
      spotCard.style.setProperty("--tilt-y", `${(relativeX * maxTiltDeg * 2).toFixed(2)}deg`);
      spotCard.style.setProperty("--tilt-x", `${(relativeY * maxTiltDeg * -2).toFixed(2)}deg`);
    }
  });

  main.addEventListener(
    "pointerout",
    (event) => {
      const card = event.target.closest(tiltSelector);
      if (!card) return;
      if (card.contains(event.relatedTarget)) return;
      resetTilt(card);
    },
    true,
  );
}
