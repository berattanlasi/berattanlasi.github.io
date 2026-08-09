// Global state
const state = {
  destinations: {},
};

// Sample projects data
const projects = [
  {
    id: "portfolio",
    title: "Portfolio Website",
    description:
      "A modern portfolio website built with HTML, CSS, and vanilla JavaScript. Features smooth animations, a permanent dark theme, and responsive design.",
    links: [
      { label: "GitHub", url: "https://github.com/Patogon49" },
      { label: "Live", url: "#" },
    ],
  },
  {
    id: "travel-app",
    title: "Istanbul Travel App",
    description:
      "A travel guide application for exploring Istanbul. Built with vanilla JavaScript, featuring interactive maps and curated travel stories.",
    links: [
      { label: "GitHub", url: "https://github.com/Patogon49" },
      { label: "Live", url: "#" },
    ],
  },
];

const assetPath = (path) => encodeURI(path);
// DÜZELTME: Bu iki fonksiyon eskiden "fotoğraflar/topkapı sarayı/" ve
// "fotoğraflar/miniatürk/" klasörlerini arıyordu. Proje klasör yapında
// gerçek klasör isimleri "images/topkapi" ve "images/miniaturk" olduğu
// için tüm görseller kırık görünüyordu. Doğru yollar aşağıda:
const topkapiImage = (fileName) => assetPath(`images/topkapi/${fileName}`);
const miniaturkImage = (fileName) => assetPath(`images/miniaturk/${fileName}`);

// DÜZELTME 2: Dosyalar artık UUID isimli değil, VS Code gezgininde görüldüğü
// gibi "1.jpg", "2.jpg" ... şeklinde numaralı. topkapi klasöründe 16 dosya var
// (1.jpg - 16.jpg). miniaturk klasörü ekran görüntüsünde kapalı olduğu için
// içeriği görülemedi; aynı numaralı düzeni koruyup eski dosya sayısı olan 36
// ile devam ettim (1.jpg - 36.jpg). Gerçek sayı farklıysa bu listeye
// satır ekleyip çıkarman yeterli.
const topkapiGalleryFiles = [
  "1.jpg",
  "2.jpg",
  "3.jpg",
  "4.jpg",
  "5.jpg",
  "6.jpg",
  "7.jpg",
  "8.jpg",
  "9.jpg",
  "10.jpg",
  "11.jpg",
  "12.jpg",
  "13.jpg",
  "14.jpg",
  "15.jpg",
  "16.jpg",
];

const miniaturkGalleryFiles = [
  "1.jpg",
  "2.jpg",
  "3.jpg",
  "4.jpg",
  "5.jpg",
  "6.jpg",
  "7.jpg",
  "8.jpg",
  "9.jpg",
  "10.jpg",
  "11.jpg",
  "12.jpg",
  "13.jpg",
  "14.jpg",
  "15.jpg",
  "16.jpg",
  "17.jpg",
  "18.jpg",
  "19.jpg",
  "20.jpg",
  "21.jpg",
  "22.jpg",
  "23.jpg",
  "24.jpg",
  "25.jpg",
  "26.jpg",
  "27.jpg",
  "28.jpg",
  "29.jpg",
  "30.jpg",
  "31.jpg",
  "32.jpg",
  "33.jpg",
  "34.jpg",
  "35.jpg",
  "36.jpg",
];

const createGalleryImage = ({ place, fileName, index, imagePath }) => ({
  src: imagePath(fileName),
  place,
  alt: `${place} fotoğrafı ${index + 1}`,
  caption: `${place} - Fotoğraf ${index + 1}`,
});

const galleryImages = [
  ...topkapiGalleryFiles.map((fileName, index) =>
    createGalleryImage({
      place: "Topkapı Sarayı",
      fileName,
      index,
      imagePath: topkapiImage,
    }),
  ),
  ...miniaturkGalleryFiles.map((fileName, index) =>
    createGalleryImage({
      place: "Miniatürk",
      fileName,
      index,
      imagePath: miniaturkImage,
    }),
  ),
];

// DOM Elements
const main = document.getElementById("app");
const lightbox = document.querySelector(".lightbox");
const lightboxImage = lightbox.querySelector(".lightbox__image");
const lightboxCaption = lightbox.querySelector(".lightbox__caption");
const lightboxPrimaryClose = lightbox.querySelector(".lightbox__close");
const lightboxCloseButtons = lightbox.querySelectorAll("[data-lightbox-close]");
const lightboxPrev = lightbox.querySelector("[data-lightbox-prev]");
const lightboxNext = lightbox.querySelector("[data-lightbox-next]");
const navLinks = document.querySelectorAll("[data-nav]");
// DÜZELTME: Profil/avatar dosyası artık "images/profilresmi.jpeg" adıyla
// images/ klasörünün kökünde duruyor.
const profileImage = assetPath("images/profilresmi.jpeg");
const fallbackProfileImage = topkapiImage("1.jpg");
const brandAvatar = document.getElementById("brand-avatar");

let activeGallery = [];
let activeGalleryIndex = 0;
let lastFocusedElement = null;

const setImageWithFallback = (image, src, fallback) => {
  if (!image) return;

  image.src = src;
  image.onerror = () => {
    image.onerror = null;
    image.src = fallback;
  };
};

setImageWithFallback(brandAvatar, profileImage, fallbackProfileImage);

// ==================== ROUTING ====================
const getRoute = () => {
  const hash = window.location.hash.replace(/^#/, "").toLowerCase();
  if (!hash) return "home";
  if (
    ["home", "about", "travels", "projects", "gallery", "contact"].includes(
      hash,
    )
  )
    return hash;
  if (state.destinations[hash]) return hash;
  return "home";
};

const updateActiveNav = (route) => {
  navLinks.forEach((link) => {
    const isActive = link.dataset.nav === route;
    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
};

const updateTitle = (route) => {
  const titles = {
    home: "Berat Tanlasi | Software Developer & Travel Writer",
    about: "About Me | Yolda Iki",
    travels: "Travel Stories | Yolda Iki",
    projects: "Projects | Berat Tanlasi",
    gallery: "Gallery | Berat Tanlasi",
    contact: "Contact | Berat Tanlasi",
  };
  document.title =
    titles[route] || `${state.destinations[route]?.title} | Yolda Iki`;
};

// ==================== UTILITY FUNCTIONS ====================
const escapeHtml = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const renderParagraphs = (paragraphs) =>
  paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("");

const renderCardMeta = (items) =>
  items.map((item) => `<span>${escapeHtml(item)}</span>`).join("");

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

// ==================== IMAGE RENDERING ====================
const renderStoryImage = (storySlug, image, index) => `
  <figure class="story-figure">
    <button
      class="story-figure__button"
      type="button"
      data-gallery="${storySlug}"
      data-index="${index}"
      aria-label="${escapeHtml(image.alt)}"
    >
      <img src="${image.src}" alt="${escapeHtml(image.alt)}" loading="lazy" decoding="async" />
    </button>
    <figcaption class="story-figure__caption">${escapeHtml(image.caption)}</figcaption>
  </figure>
`;

const renderGalleryItem = (storySlug, image, index) => `
  <button
    class="story-gallery__item"
    type="button"
    data-gallery="${storySlug}"
    data-index="${index}"
    aria-label="${escapeHtml(image.alt)}"
  >
    <img src="${image.src}" alt="${escapeHtml(image.alt)}" loading="lazy" decoding="async" />
  </button>
`;

// Simple inline icon glyphs for the social row (no external icon font needed)
const socialIcons = {
  github:
    '<svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.09 3.29 9.4 7.86 10.93.57.1.78-.25.78-.55 0-.27-.01-1.16-.02-2.1-3.2.7-3.87-1.36-3.87-1.36-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.64 1.59.24 2.76.12 3.05.74.8 1.18 1.83 1.18 3.09 0 4.42-2.7 5.4-5.26 5.68.41.36.78 1.08.78 2.17 0 1.57-.01 2.83-.01 3.22 0 .3.2.66.79.55A10.52 10.52 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z"/></svg>',
  facebook:
    '<svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor"><path d="M13.5 21.5v-8.2h2.75l.41-3.2h-3.16V8.05c0-.93.26-1.56 1.59-1.56h1.7V3.62c-.29-.04-1.3-.12-2.46-.12-2.44 0-4.11 1.49-4.11 4.22v2.36H7.46v3.2h2.76v8.2h3.28Z"/></svg>',
  twitter:
    '<svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor"><path d="M22.9 5.9c-.68.3-1.4.5-2.16.6a3.8 3.8 0 0 0 1.66-2.1 7.6 7.6 0 0 1-2.4.92 3.77 3.77 0 0 0-6.43 3.44A10.7 10.7 0 0 1 5.9 4.65a3.77 3.77 0 0 0 1.17 5.03c-.62-.02-1.2-.19-1.7-.47v.05a3.77 3.77 0 0 0 3.02 3.7 3.8 3.8 0 0 1-1.7.07 3.77 3.77 0 0 0 3.52 2.62A7.57 7.57 0 0 1 4.5 17.2a10.68 10.68 0 0 0 5.79 1.7c6.95 0 10.75-5.76 10.75-10.75l-.01-.49a7.7 7.7 0 0 0 1.87-1.94Z"/></svg>',
  instagram:
    '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none"/></svg>',
  linkedin:
    '<svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5.001 2.5 2.5 0 0 1 0-5ZM.5 21.5h8.9V8.9H.5v12.6ZM8.9 8.9h8.53v1.72h.12c.6-1.06 2.05-2.18 4.22-2.18 4.51 0 5.34 2.86 5.34 6.6v6.46h-4.83v-5.73c0-1.37-.02-3.13-1.94-3.13-1.95 0-2.25 1.48-2.25 3.02v5.84H8.9V8.9Z"/></svg>',
  pinterest:
    '<svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor"><path d="M12 .8C5.8.8 2.6 5.1 2.6 8.7c0 2.18 .82 4.12 2.6 4.84.29.12.55 0 .64-.32.06-.22.2-.79.26-1.02.09-.32.05-.43-.18-.71-.5-.6-.82-1.36-.82-2.45 0-3.15 2.36-5.97 6.14-5.97 3.35 0 5.19 2.05 5.19 4.78 0 3.6-1.59 6.64-3.96 6.64-1.3 0-2.28-1.08-1.96-2.4.37-1.58 1.1-3.29 1.1-4.43 0-1.02-.55-1.87-1.68-1.87-1.33 0-2.4 1.38-2.4 3.22 0 1.18.4 1.97.4 1.97s-1.35 5.73-1.6 6.74c-.47 2-.05 4.44-.03 4.69.02.15.21.19.29.07.12-.16 1.65-2.05 2.17-3.94.15-.53.84-3.31.84-3.31.42.8 1.63 1.5 2.92 1.5 3.84 0 6.44-3.5 6.44-8.19C21.4 4.53 17.85.8 12 .8Z"/></svg>',
};

// ==================== PAGE RENDERING ====================
const renderHome = () => {
  main.innerHTML = `
    <section class="home-page" id="home">
      <h1 class="home-title">Berat Tanlasi</h1>

      <div class="social-row" aria-label="Social links">
        <a href="https://github.com/Patogon49" target="_blank" rel="noopener noreferrer" class="social-icon" title="GitHub">${socialIcons.github}</a>
        <a href="#" class="social-icon" title="Facebook">${socialIcons.facebook}</a>
        <a href="#" class="social-icon" title="Twitter">${socialIcons.twitter}</a>
        <a href="#" class="social-icon" title="Instagram">${socialIcons.instagram}</a>
        <a href="https://www.linkedin.com/in/berat-tanlasi" target="_blank" rel="noopener noreferrer" class="social-icon" title="LinkedIn">${socialIcons.linkedin}</a>
        <a href="#" class="social-icon" title="Pinterest">${socialIcons.pinterest}</a>
      </div>

      <div class="home-actions">
        <a class="button" href="#travels">Explore Travel Stories</a>
        <a class="button button--ghost" href="#about">About Me</a>
      </div>
    </section>
  `;
};

const renderAbout = () => {
  main.innerHTML = `
    <section class="about-page" id="about">
      <div class="about-content">
        <h1>Where Software & Travel<br>Meet</h1>
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
      </div>
      <div class="home-image">
        <img src="${fallbackProfileImage}" alt="Istanbul travel photo" loading="eager" decoding="async" />
      </div>
    </section>
  `;
};

const renderTravels = () => {
  const cards = Object.values(state.destinations)
    .map(
      (story) => `
        <article class="destination-card">
          <a class="destination-card__media" href="#${story.slug}" aria-label="Open the ${escapeHtml(
            story.title,
          )} article">
            <img src="${story.homeImage}" alt="${escapeHtml(story.homeAlt)}" loading="lazy" decoding="async" />
          </a>
          <div class="destination-card__body">
            <p class="card-eyebrow">${escapeHtml(story.category)}</p>
            <h2 class="card-title">${escapeHtml(story.title)}</h2>
            <p class="card-copy">${escapeHtml(story.cardCopy)}</p>
            <div class="card-meta">${renderCardMeta(story.cardMeta)}</div>
            <div class="card-actions">
              <a class="button" href="#${story.slug}">Read Story</a>
            </div>
          </div>
        </article>
      `,
    )
    .join("");

  main.innerHTML = `
    <section class="travels-page" id="travels">
      <div class="travels-header">
        <p class="home-kicker">Story Archive</p>
        <h1>Istanbul in Different Lights</h1>
        <p>Travel writing, photos, and a deeper dive into the city's stories</p>
      </div>

      <div class="destination-grid">
        ${cards || '<p style="grid-column: 1 / -1; text-align: center; color: var(--text-secondary);">No stories found.</p>'}
      </div>
    </section>
  `;
};

const renderProjects = () => {
  const projectCards = projects
    .map(
      (project) => `
        <div class="project-card">
          <h3>${escapeHtml(project.title)}</h3>
          <p>${escapeHtml(project.description)}</p>
          <div class="project-links">
            ${project.links.map((link) => `<a href="${link.url}" target="_blank" rel="noopener noreferrer">${escapeHtml(link.label)}</a>`).join("")}
          </div>
        </div>
      `,
    )
    .join("");

  main.innerHTML = `
    <section class="projects-page" id="projects">
      <div class="projects-header">
        <p class="home-kicker">My Work</p>
        <h1>Projects & Experiments</h1>
        <p>A selection of projects I've built combining software development with creative storytelling</p>
      </div>
      <div class="projects-grid">
        ${projectCards}
      </div>
    </section>
  `;
};

const renderGallery = () => {
  const galleryItems = galleryImages
    .map(
      (image, index) => `
        <button
          class="gallery-item"
          type="button"
          data-gallery="main"
          data-index="${index}"
          aria-label="${escapeHtml(`${image.caption} (${image.place})`)}"
        >
          <span class="gallery-item__media">
            <img src="${image.src}" alt="${escapeHtml(image.alt)}" loading="lazy" decoding="async" />
          </span>
          <span class="gallery-item__meta">
            <span class="gallery-item__place">${escapeHtml(image.place)}</span>
            <span class="gallery-item__caption">${escapeHtml(image.caption)}</span>
          </span>
        </button>
      `,
    )
    .join("");

  main.innerHTML = `
    <section class="gallery-page" id="gallery">
      <div class="gallery-header">
        <p class="home-kicker">Photo Collection</p>
        <h1>Istanbul Through My Lens</h1>
      </div>
      <div class="gallery-grid">
        ${galleryItems}
      </div>
    </section>
  `;
};

const renderContact = () => {
  main.innerHTML = `
    <section class="contact-page" id="contact">
      <div class="contact-header">
        <p class="home-kicker">Get in Touch</p>
        <h1>Let's Connect</h1>
        <p>Have a question or want to collaborate? I'd love to hear from you.</p>
      </div>

      <form class="contact-form" id="contact-form">
        <div class="form-group">
          <label for="name">Name</label>
          <input type="text" id="name" name="name" required />
        </div>

        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" name="email" required />
        </div>

        <div class="form-group">
          <label for="message">Message</label>
          <textarea id="message" name="message" required></textarea>
        </div>

        <button type="submit" class="button">Send Message</button>
      </form>

      <div class="contact-links">
        <h3>Other ways to reach me</h3>
        <div class="contact-methods">
          <div class="contact-method">
            <span>📧</span>
            <a href="mailto:tanlasiberat1@gmail.com">tanlasiberat1@gmail.com</a>
          </div>
          <div class="contact-method">
            <span>💼</span>
            <a href="https://www.linkedin.com/in/berat-tanlasi" target="_blank" rel="noopener noreferrer">LinkedIn</a>
          </div>
          <div class="contact-method">
            <span>🐙</span>
            <a href="https://github.com/Patogon49" target="_blank" rel="noopener noreferrer">GitHub</a>
          </div>
        </div>
      </div>
    </section>
  `;

  // Form submission (simple client-side handling)
  const contactForm = document.getElementById("contact-form");
  contactForm.addEventListener("submit", (e) => {
    e.preventDefault();
    alert("Thank you for your message! I will get back to you soon.");
    contactForm.reset();
  });
};

const renderStory = (story) => {
  const nextStory = state.destinations[story.next];

  main.innerHTML = `
    <section class="story-page" id="${story.slug}">
      <header class="story-hero">
        <img class="story-hero__image" src="${story.heroImage}" alt="${escapeHtml(
          story.heroAlt,
        )}" fetchpriority="high" decoding="async" />
        <div class="story-hero__scrim"></div>
        <div class="story-hero__content">
          <p class="home-kicker">${escapeHtml(story.category)}</p>
          <h1 class="story-title">${escapeHtml(story.title)}</h1>
          <p class="story-deck">${escapeHtml(story.deck)}</p>
        </div>
      </header>

      <div class="story-wrap">
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
                (section, index) => `
                  <section class="story-section">
                    <h2>${escapeHtml(section.title)}</h2>
                    ${section.subhead ? `<h3>${escapeHtml(section.subhead)}</h3>` : ""}
                    ${renderParagraphs(section.paragraphs)}
                    ${section.image ? renderStoryImage(story.slug, section.image, index) : ""}
                  </section>
                `,
              )
              .join("")}

            <blockquote class="quote">
              <p>${escapeHtml(story.quote)}</p>
            </blockquote>

            <section class="story-gallery">
              <h2>Captured Frames</h2>
              <p>
                These frames were selected for those who prefer remembering scenes 
                one by one rather than quickly consuming the journey.
              </p>
              <div class="story-gallery__grid">
                ${story.gallery.map((image, index) => renderGalleryItem(story.slug, image, index)).join("")}
              </div>
            </section>

            <section class="next-story">
              <p class="home-kicker">Next Stop</p>
              <h3>${escapeHtml(nextStory.title)}</h3>
              <p>${escapeHtml(story.nextDescription)}</p>
              <div class="next-story__actions">
                <a class="button" href="#${nextStory.slug}">${escapeHtml(story.nextLabel)}</a>
                <a class="button button--ghost" href="#travels">Back to Travels</a>
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
              <h3>${escapeHtml(nextStory.title)}</h3>
              <p>${escapeHtml(story.preview)}</p>
              <div class="next-story__actions">
                <a class="button" href="#${nextStory.slug}">${escapeHtml(story.nextLabel)}</a>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </section>
  `;
};

// ==================== LIGHTBOX ====================
const closeLightbox = () => {
  lightbox.hidden = true;
  lightbox.setAttribute("aria-hidden", "true");
  lightboxImage.removeAttribute("src");
  lightboxImage.alt = "";
  lightboxCaption.textContent = "";
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
};

const openLightbox = (gallerySlug, index, trigger) => {
  let gallery;

  if (gallerySlug === "main") {
    gallery = galleryImages;
  } else {
    const story = state.destinations[gallerySlug];
    if (!story) return;
    gallery = story.gallery;
  }

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
  const galleryTrigger = event.target.closest("[data-gallery]");
  if (!galleryTrigger || !main.contains(galleryTrigger)) return;

  const gallerySlug = galleryTrigger.dataset.gallery;
  const index = Number(galleryTrigger.dataset.index || 0);
  openLightbox(gallerySlug, index, galleryTrigger);
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
});

// ==================== MAIN RENDER FUNCTION ====================
const render = () => {
  const route = getRoute();
  updateTitle(route);
  updateActiveNav(route);

  if (route === "home") {
    renderHome();
  } else if (route === "about") {
    renderAbout();
  } else if (route === "travels") {
    renderTravels();
  } else if (route === "projects") {
    renderProjects();
  } else if (route === "gallery") {
    renderGallery();
  } else if (route === "contact") {
    renderContact();
  } else {
    renderStory(state.destinations[route]);
  }

  window.scrollTo(0, 0);
};

window.addEventListener("hashchange", render);

// ==================== DESTINATIONS DATA ====================
const destinationsData = {
  topkapi: {
    slug: "topkapi",
    title: "Topkapi Palace",
    category: "Istanbul / History Route",
    deck: "Steps slowing down among courtyards, sweeping views opening up to the Bosphorus, and a silent grandeur hidden within the palace.",
    published: "June 11, 2026",
    readTime: "8 min read",
    author: "Yolda Iki Editor",
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
    nextTitle: "Miniaturk",
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
    deck: "An open-air route that feels like another country within the city; miniature in scale, yet fully capturing the grand essence.",
    published: "June 11, 2026",
    readTime: "7 min read",
    author: "Yolda Iki Editor",
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
    nextTitle: "Topkapi Palace",
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
// Initialize the app
state.destinations = destinationsData;
render();

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
    window.location.href = `mailto:tanlasiberat1@gmail.com?subject=${subject}&body=${body}`;

    messageField.value = "";
  });
})();

// ============================================================
// AŞAĞI KAYDIRMA İPUCU (scroll cue)
// ============================================================
(() => {
  const cue = document.getElementById("scroll-cue");
  cue?.addEventListener("click", () => {
    window.scrollBy({ top: window.innerHeight * 0.8, behavior: "smooth" });
  });

  const toggleCueVisibility = () => {
    if (!cue) return;
    cue.style.opacity = window.scrollY > 40 ? "0" : "1";
    cue.style.pointerEvents = window.scrollY > 40 ? "none" : "auto";
  };
  window.addEventListener("scroll", toggleCueVisibility, { passive: true });
  toggleCueVisibility();
})();
