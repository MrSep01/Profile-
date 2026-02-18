document.documentElement.classList.add("js");

const revealElements = document.querySelectorAll(".reveal");

const showAllReveal = () => {
  revealElements.forEach((element) => element.classList.add("show"));
};

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("show");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  revealElements.forEach((element) => revealObserver.observe(element));
} else {
  showAllReveal();
}

const menuLinks = document.querySelectorAll('.menu a[href^="#"]');
const observedSections = [...menuLinks]
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

if ("IntersectionObserver" in window && observedSections.length) {
  const navObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const sectionId = entry.target.id;
        menuLinks.forEach((link) => {
          const isMatch = link.getAttribute("href") === `#${sectionId}`;
          link.classList.toggle("active", isMatch);
        });
      });
    },
    {
      rootMargin: "-35% 0px -55% 0px",
      threshold: 0
    }
  );

  observedSections.forEach((section) => navObserver.observe(section));
}

const contactForm = document.querySelector("[data-contact-form]");

if (contactForm) {
  const submitButton = contactForm.querySelector("button[type='submit']");
  const statusMessage = contactForm.querySelector("[data-form-status]");

  const setFormStatus = (message, state) => {
    if (!statusMessage) return;
    statusMessage.textContent = message;
    statusMessage.setAttribute("data-state", state);
  };

  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!submitButton) return;

    const action = (contactForm.getAttribute("action") || "").trim();
    if (!action || action.includes("your-form-id")) {
      setFormStatus(
        "Form is not configured yet. Replace `your-form-id` with your Formspree form ID.",
        "error"
      );
      return;
    }

    const originalButtonText = submitButton.textContent;
    submitButton.textContent = "Sending...";
    submitButton.disabled = true;
    setFormStatus("Sending your message...", "pending");

    try {
      const response = await fetch(action, {
        method: "POST",
        body: new FormData(contactForm),
        headers: {
          Accept: "application/json"
        }
      });

      if (response.ok) {
        setFormStatus("Message sent successfully. I will get back to you soon.", "success");
        contactForm.reset();
      } else {
        let errorMessage = "Unable to send your message right now. Please try again.";
        try {
          const payload = await response.json();
          if (payload?.errors?.length) {
            errorMessage = payload.errors.map((error) => error.message).join(" ");
          }
        } catch {
          // Keep default message if response has no JSON body.
        }
        setFormStatus(errorMessage, "error");
      }
    } catch {
      setFormStatus("Network error. Please check your connection and try again.", "error");
    } finally {
      submitButton.textContent = originalButtonText;
      submitButton.disabled = false;
    }
  });
}

const sliders = document.querySelectorAll("[data-slider]");

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const getSliderIndex = (track, cards) => {
  if (!cards.length) return 0;
  let closestIndex = 0;
  let closestDistance = Number.POSITIVE_INFINITY;

  cards.forEach((card, index) => {
    const distance = Math.abs(track.scrollLeft - card.offsetLeft);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = index;
    }
  });

  return closestIndex;
};

const setupSlider = (slider) => {
  const track = slider.querySelector("[data-slider-track]");
  const prev = slider.querySelector("[data-slider-prev]");
  const next = slider.querySelector("[data-slider-next]");
  const status = slider.querySelector("[data-slider-status]");
  const dots = [...slider.querySelectorAll("[data-slider-dot]")];
  const cards = [...slider.querySelectorAll(".hunt-card")];

  if (!track || !cards.length) return;

  const updateState = () => {
    const index = getSliderIndex(track, cards);

    if (status) {
      status.textContent = `Station ${index + 1} of ${cards.length}`;
    }

    if (prev) prev.disabled = index <= 0;
    if (next) next.disabled = index >= cards.length - 1;

    dots.forEach((dot, dotIndex) => {
      const isActive = dotIndex === index;
      dot.classList.toggle("active", isActive);
      dot.setAttribute("aria-current", isActive ? "true" : "false");
    });
  };

  const scrollToIndex = (rawIndex) => {
    const index = clamp(rawIndex, 0, cards.length - 1);
    const target = cards[index];
    if (!target) return;

    track.scrollTo({
      left: target.offsetLeft,
      behavior: "smooth"
    });
  };

  if (prev) {
    prev.addEventListener("click", () => {
      const index = getSliderIndex(track, cards);
      scrollToIndex(index - 1);
    });
  }

  if (next) {
    next.addEventListener("click", () => {
      const index = getSliderIndex(track, cards);
      scrollToIndex(index + 1);
    });
  }

  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      const index = Number(dot.getAttribute("data-slider-dot"));
      if (!Number.isNaN(index)) scrollToIndex(index);
    });
  });

  track.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const index = getSliderIndex(track, cards);
    scrollToIndex(index + (event.key === "ArrowRight" ? 1 : -1));
  });

  let scrollTick;
  track.addEventListener("scroll", () => {
    updateState();
    window.clearTimeout(scrollTick);
    scrollTick = window.setTimeout(updateState, 80);
  });

  window.addEventListener("resize", updateState);
  updateState();
};

sliders.forEach(setupSlider);

const intascMatrix = document.querySelector("[data-intasc-matrix]");

if (intascMatrix) {
  const matrixTiles = [...intascMatrix.querySelectorAll("[data-intasc-target]")];
  const matrixStatus = intascMatrix.querySelector("[data-intasc-status]");
  const matrixCards = [...document.querySelectorAll("[data-intasc-card]")];

  const setMatrixState = (target, label) => {
    matrixTiles.forEach((tile) => {
      tile.classList.toggle("active", tile.getAttribute("data-intasc-target") === target);
    });

    matrixCards.forEach((card) => {
      const group = card.getAttribute("data-intasc-group");
      const isMatch = target === "all" || group === target;
      card.classList.toggle("matrix-match", isMatch);
      card.classList.toggle("matrix-dim", !isMatch);
    });

    if (matrixStatus) {
      matrixStatus.textContent =
        target === "all"
          ? "Showing all standards and all mapped videos."
          : `Highlighted evidence for ${label}.`;
    }
  };

  matrixTiles.forEach((tile) => {
    tile.addEventListener("click", () => {
      const target = tile.getAttribute("data-intasc-target") || "all";
      setMatrixState(target, tile.textContent?.trim() || "selected standard");
    });
  });

  setMatrixState("all", "All Standards");
}

const scavengerGame = document.querySelector("[data-scavenger-game]");

if (scavengerGame) {
  const storageKey = "teaching-scavenger-progress-v1";
  const checks = [...document.querySelectorAll("[data-station-check]")];
  const progressText = scavengerGame.querySelector("[data-progress-text]");
  const progressFill = scavengerGame.querySelector("[data-progress-fill]");
  const progressBadge = scavengerGame.querySelector("[data-progress-badge]");
  const progressReset = scavengerGame.querySelector("[data-progress-reset]");

  const getBadgeLabel = (completed, total) => {
    if (completed === total) return "Badge: Complete";
    if (completed >= Math.ceil(total * 0.75)) return "Badge: Pro";
    if (completed >= Math.ceil(total * 0.5)) return "Badge: Momentum";
    if (completed >= Math.ceil(total * 0.25)) return "Badge: Active";
    return "Badge: Start";
  };

  const persistProgress = () => {
    try {
      const values = checks.map((check) => check.checked);
      window.localStorage.setItem(storageKey, JSON.stringify(values));
    } catch (error) {
      // Ignore storage failures silently (private mode, restricted contexts).
    }
  };

  const updateProgressUi = () => {
    const total = checks.length;
    const completed = checks.filter((check) => check.checked).length;
    const percentage = total ? (completed / total) * 100 : 0;

    if (progressText) {
      progressText.textContent = `${completed} / ${total} stations completed`;
    }

    if (progressFill) {
      progressFill.style.width = `${percentage}%`;
    }

    if (progressBadge) {
      progressBadge.textContent = getBadgeLabel(completed, total);
    }
  };

  const restoreProgress = () => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;

      checks.forEach((check, index) => {
        check.checked = Boolean(parsed[index]);
      });
    } catch (error) {
      // Ignore storage failures silently.
    }
  };

  checks.forEach((check) => {
    check.addEventListener("change", () => {
      persistProgress();
      updateProgressUi();
    });
  });

  if (progressReset) {
    progressReset.addEventListener("click", () => {
      checks.forEach((check) => {
        check.checked = false;
      });
      persistProgress();
      updateProgressUi();
    });
  }

  restoreProgress();
  updateProgressUi();
}

const getPageFilename = () => {
  const path = (window.location.pathname || "/").replace(/\/+$/, "");
  const filename = path.split("/").pop();
  return filename || "index.html";
};

const shouldEnableEngagement = () => {
  const filename = getPageFilename();
  if (
    filename === "index.html" ||
    filename === "blog.html" ||
    filename === "portfolio.html" ||
    filename === "teaching-activities.html" ||
    filename === "teaching-journey-scavenger-hunt.html"
  ) {
    return false;
  }

  const isBlogCategory = filename.startsWith("blog-category-");
  const isBlogPost = filename.startsWith("blog-") && !isBlogCategory;
  const isScavengerDetail = filename.startsWith("scavenger-");
  const isVideoDetail = filename.startsWith("intasc-video-");
  const isPortfolioDetail = filename.startsWith("portfolio-");

  return isBlogPost || isScavengerDetail || isVideoDetail || isPortfolioDetail;
};

const engagementRoot = document.querySelector("main");

if (
  engagementRoot &&
  shouldEnableEngagement() &&
  !engagementRoot.querySelector("[data-engagement='true']")
) {
  const pageSlug = getPageFilename();
  const isBlogPostPage = pageSlug.startsWith("blog-") && !pageSlug.startsWith("blog-category-");
  const isPortfolioContentPage =
    pageSlug.startsWith("scavenger-") ||
    pageSlug.startsWith("intasc-video-") ||
    pageSlug.startsWith("portfolio-");
  const pageUrl = window.location.href.split("#")[0];
  const pageTitle = document.title || "Sepehr Massoumi Alamouti";
  const storageKey = `teaching-engagement-v1:${pageSlug}`;
  const likedKey = `teaching-liked-v1:${pageSlug}`;
  const sortKey = `teaching-comment-sort-v1:${pageSlug}`;
  const visitorIdKey = "teaching-visitor-id-v1";
  const commentRateKey = `teaching-comment-rate-v1:${pageSlug}`;
  const storageFallback = { likes: 0, comments: [] };
  const commentMinLength = 3;
  const commentMaxLength = 1200;
  const commentRateWindowMs = 10 * 60 * 1000;
  const commentRateMax = 5;
  const supabaseConfig = window.SUPABASE_CONFIG || {};
  const supabaseUrl = String(supabaseConfig.url || "").trim().replace(/\/+$/, "");
  const supabaseAnonKey = String(supabaseConfig.anonKey || "").trim();
  const edgeFunctionName = String(supabaseConfig.edgeFunctionName || "engagement").trim();
  const turnstileSiteKey = String(supabaseConfig.turnstileSiteKey || "").trim();
  const hasSupabase =
    Boolean(supabaseUrl) &&
    Boolean(supabaseAnonKey) &&
    !supabaseUrl.includes("YOUR-PROJECT") &&
    !supabaseAnonKey.includes("YOUR-ANON-KEY");
  const edgeFunctionUrl = hasSupabase && edgeFunctionName
    ? `${supabaseUrl}/functions/v1/${edgeFunctionName}`
    : "";

  let writeMode = "local";
  let turnstileWidgetId = null;
  let turnstileToken = "";

  document.body.classList.add("detail-page");
  if (isBlogPostPage) document.body.classList.add("detail-page-blog");
  if (isPortfolioContentPage) document.body.classList.add("detail-page-portfolio");

  const detailStack = document.createElement("div");
  detailStack.className = "detail-content-stack";
  const detailPrimary = document.createElement("div");
  detailPrimary.className = "detail-primary";
  const detailRail = document.createElement("aside");
  detailRail.className = "detail-rail";
  detailRail.setAttribute("aria-label", "Page navigation");
  while (engagementRoot.firstChild) {
    detailPrimary.appendChild(engagementRoot.firstChild);
  }
  detailStack.append(detailPrimary, detailRail);
  engagementRoot.appendChild(detailStack);
  const contentHost = detailPrimary;

  const createShareSection = (position) => {
    const section = document.createElement("section");
    section.className = `reveal share-panel share-panel-${position}`;
    section.innerHTML = `
      <div class="share-head">
        <p class="share-kicker">Share</p>
      </div>
      <div class="share-actions share-actions-icons">
        <button type="button" class="share-icon-btn" data-share="linkedin" title="LinkedIn" aria-label="Share on LinkedIn">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.98 3.5C4.98 4.88 3.86 6 2.49 6S0 4.88 0 3.5 1.12 1 2.49 1s2.49 1.12 2.49 2.5zM.5 8h4V23h-4V8zm7 0h3.8v2.05h.05C11.88 8.98 13.3 8 15.4 8 19.5 8 20 10.7 20 14.2V23h-4v-7.7c0-1.84-.03-4.2-2.56-4.2-2.57 0-2.96 2.01-2.96 4.07V23h-4V8z"/></svg>
        </button>
        <button type="button" class="share-icon-btn" data-share="x" title="X" aria-label="Share on X">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.24 2H21l-6.6 7.54L22.2 22h-6.1l-4.78-6.28L5.8 22H3l7.08-8.1L2 2h6.26l4.32 5.71L18.24 2zm-.98 18h1.55L7.42 3.9H5.76L17.26 20z"/></svg>
        </button>
        <button type="button" class="share-icon-btn" data-share="facebook" title="Facebook" aria-label="Share on Facebook">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 8H16V5h-2.5C10.46 5 9 6.79 9 9.5V12H7v3h2v7h3v-7h3l1-3h-4v-2.5c0-.82.18-1.5 1.5-1.5z"/></svg>
        </button>
        <button type="button" class="share-icon-btn" data-share="whatsapp" title="WhatsApp" aria-label="Share on WhatsApp">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.52 3.49A11.84 11.84 0 0 0 12.07 0C5.48 0 .11 5.37.11 11.97c0 2.1.55 4.16 1.6 5.99L0 24l6.2-1.63a11.95 11.95 0 0 0 5.87 1.5h.01c6.59 0 11.96-5.37 11.96-11.97 0-3.2-1.25-6.2-3.52-8.41zM12.08 21.8h-.01a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-3.68.97.98-3.58-.23-.37a9.92 9.92 0 0 1-1.53-5.26c0-5.48 4.46-9.94 9.95-9.94a9.86 9.86 0 0 1 7.03 2.9 9.84 9.84 0 0 1 2.9 7.03c0 5.48-4.46 9.94-9.94 9.94zm5.45-7.42c-.3-.15-1.78-.88-2.06-.98-.28-.1-.48-.15-.69.15-.2.3-.79.98-.96 1.18-.18.2-.35.23-.65.08-.3-.15-1.24-.46-2.37-1.48-.88-.78-1.48-1.74-1.65-2.04-.18-.3-.02-.46.13-.61.13-.13.3-.35.45-.53.15-.18.2-.3.3-.5.1-.2.05-.38-.03-.53-.08-.15-.69-1.65-.94-2.26-.25-.6-.5-.52-.69-.53h-.59c-.2 0-.53.08-.8.38-.28.3-1.05 1.03-1.05 2.5s1.08 2.88 1.23 3.08c.15.2 2.12 3.24 5.13 4.54.72.31 1.29.5 1.73.64.73.23 1.39.2 1.91.12.58-.09 1.78-.73 2.03-1.43.25-.71.25-1.31.18-1.43-.08-.12-.28-.2-.58-.35z"/></svg>
        </button>
        <button type="button" class="share-icon-btn" data-share="email" title="Email" aria-label="Share by Email">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 5h20v14H2V5zm2 2v.2l8 5.3 8-5.3V7l-8 5.3L4 7z"/></svg>
        </button>
        <button type="button" class="share-icon-btn" data-share="copy" title="Copy Link" aria-label="Copy page link">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.9 12a5 5 0 0 1 5-5h3v2h-3a3 3 0 1 0 0 6h3v2h-3a5 5 0 0 1-5-5zm6.1 1h4v-2h-4v2zm5.1-6h-3v2h3a3 3 0 1 1 0 6h-3v2h3a5 5 0 1 0 0-10z"/></svg>
        </button>
      </div>
      <p class="share-feedback" data-share-feedback aria-live="polite"></p>
    `;
    return section;
  };

  const shareSection = createShareSection("top");
  const firstPanel = contentHost.querySelector(".panel");
  if (firstPanel) {
    firstPanel.prepend(shareSection);
  } else {
    contentHost.appendChild(shareSection);
  }

  const buildShareLink = (platform) => {
    const url = encodeURIComponent(pageUrl);
    const text = encodeURIComponent(pageTitle);

    switch (platform) {
      case "linkedin":
        return `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
      case "x":
        return `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
      case "facebook":
        return `https://www.facebook.com/sharer/sharer.php?u=${url}`;
      case "whatsapp":
        return `https://api.whatsapp.com/send?text=${text}%20${url}`;
      case "email":
        return `mailto:?subject=${text}&body=${url}`;
      default:
        return "";
    }
  };

  const setShareFeedback = (section, message) => {
    const feedback = section.querySelector("[data-share-feedback]");
    if (!feedback) return;
    feedback.textContent = message;
    if (!message) return;
    window.setTimeout(() => {
      if (feedback.textContent === message) feedback.textContent = "";
    }, 2200);
  };

  const attachShareHandlers = (section) => {
    const buttons = section.querySelectorAll("[data-share]");
    buttons.forEach((button) => {
      button.addEventListener("click", async () => {
        const platform = button.getAttribute("data-share");
        if (!platform) return;

        if (platform === "copy") {
          try {
            await navigator.clipboard.writeText(pageUrl);
            setShareFeedback(section, "Link copied.");
          } catch {
            setShareFeedback(section, "Could not copy link.");
          }
          return;
        }

        const shareLink = buildShareLink(platform);
        if (!shareLink) return;

        if (platform === "email") {
          window.location.href = shareLink;
          setShareFeedback(section, "Opening email.");
          return;
        }

        window.open(shareLink, "_blank", "noopener,noreferrer");
        setShareFeedback(section, `Opening ${platform}.`);
      });
    });
  };

  attachShareHandlers(shareSection);

  const estimateReadMinutes = (node) => {
    const text = String(node?.textContent || "")
      .replace(/\s+/g, " ")
      .trim();
    if (!text) return 1;
    const words = text.split(" ").filter(Boolean).length;
    return Math.max(1, Math.round(words / 220));
  };

  const formatUpdatedLabel = () => {
    const parsed = new Date(document.lastModified);
    if (Number.isNaN(parsed.getTime())) return "";
    return parsed.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const createDetailMeta = () => {
    if (!firstPanel) return null;

    const readSource = isBlogPostPage
      ? contentHost.querySelector(".blog-post")
      : firstPanel;
    const readMinutes = estimateReadMinutes(readSource || firstPanel);
    const updatedLabel = formatUpdatedLabel();

    const meta = document.createElement("div");
    meta.className = "detail-meta";
    meta.innerHTML = `
      <span class="detail-meta-item">${readMinutes} min read</span>
      ${updatedLabel ? `<span class="detail-meta-item">Updated ${updatedLabel}</span>` : ""}
      <button type="button" class="detail-meta-link" data-jump-comments>Comments</button>
    `;

    const jumpButton = meta.querySelector("[data-jump-comments]");
    if (jumpButton) {
      jumpButton.addEventListener("click", () => {
        const target = contentHost.querySelector("[data-engagement='true']");
        if (!target) return;
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }

    if (shareSection.nextSibling) {
      firstPanel.insertBefore(meta, shareSection.nextSibling);
    } else {
      firstPanel.appendChild(meta);
    }

    return meta;
  };

  const buildTableOfContents = () => {
    if (!firstPanel) return;

    const selector = isBlogPostPage
      ? ".blog-post h2, .blog-post h3"
      : ".panel h2, .panel h3";

    const headings = Array.from(contentHost.querySelectorAll(selector)).filter((heading) => {
      if (!(heading instanceof HTMLElement)) return false;
      if (!heading.textContent || !heading.textContent.trim()) return false;
      if (heading.closest(".article-nav")) return false;
      if (heading.closest(".share-panel")) return false;
      return true;
    });

    if (headings.length < 3) return;

    const usedIds = new Set(
      Array.from(document.querySelectorAll("[id]"))
        .map((el) => el.id)
        .filter(Boolean)
    );

    const toIdBase = (text, index) => {
      const base = text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      return base || `${pageSlug}-section-${index + 1}`;
    };

    const tocItems = headings.map((heading, index) => {
      let id = heading.id || "";
      if (!id) {
        const base = toIdBase(heading.textContent || "", index);
        id = base;
        let suffix = 2;
        while (usedIds.has(id)) {
          id = `${base}-${suffix}`;
          suffix += 1;
        }
        heading.id = id;
      }
      usedIds.add(id);
      return {
        id,
        level: heading.tagName.toLowerCase(),
        label: (heading.textContent || "").trim()
      };
    });

    const toc = document.createElement("nav");
    toc.className = "reveal toc-panel";
    toc.setAttribute("aria-label", "On this page");
    toc.innerHTML = `
      <p class="toc-title">On this page</p>
      <ol class="toc-list">
        ${tocItems
          .map(
            (item) => `
              <li class="toc-item ${item.level === "h3" ? "toc-item-h3" : ""}">
                <a href="#${item.id}">${item.label}</a>
              </li>
            `
          )
          .join("")}
      </ol>
    `;

    if (isBlogPostPage && detailRail) {
      detailRail.appendChild(toc);
      return;
    }

    if (shareSection.nextSibling) {
      firstPanel.insertBefore(toc, shareSection.nextSibling);
    } else {
      firstPanel.appendChild(toc);
    }
  };

  createDetailMeta();
  buildTableOfContents();

  const sanitizeState = (rawState) => {
    const safeState = { ...storageFallback };
    if (!rawState || typeof rawState !== "object") return safeState;

    safeState.likes =
      Number.isFinite(rawState.likes) && rawState.likes >= 0 ? Math.floor(rawState.likes) : 0;

    if (Array.isArray(rawState.comments)) {
      safeState.comments = rawState.comments
        .filter((entry) => entry && typeof entry.text === "string")
        .map((entry) => ({
          id: String(entry.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
          text: entry.text.trim(),
          createdAt:
            typeof entry.createdAt === "string" && !Number.isNaN(Date.parse(entry.createdAt))
              ? entry.createdAt
              : new Date().toISOString()
        }))
        .filter((entry) => entry.text.length > 0);
    }

    return safeState;
  };

  const loadLocalState = () => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (!saved) return { ...storageFallback };
      return sanitizeState(JSON.parse(saved));
    } catch {
      return { ...storageFallback };
    }
  };

  const saveLocalState = (state) => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      // Ignore storage failures (private mode, restricted contexts).
    }
  };

  const loadLocalLiked = () => {
    try {
      return window.localStorage.getItem(likedKey) === "1";
    } catch {
      return false;
    }
  };

  const saveLocalLiked = (liked) => {
    try {
      window.localStorage.setItem(likedKey, liked ? "1" : "0");
    } catch {
      // Ignore storage failures.
    }
  };

  const loadSortMode = () => {
    try {
      const saved = window.localStorage.getItem(sortKey);
      return saved === "oldest" ? "oldest" : "newest";
    } catch {
      return "newest";
    }
  };

  const saveSortMode = (value) => {
    try {
      window.localStorage.setItem(sortKey, value);
    } catch {
      // Ignore storage failures.
    }
  };

  const loadRateLog = () => {
    try {
      const raw = window.localStorage.getItem(commentRateKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value) && value > 0);
    } catch {
      return [];
    }
  };

  const saveRateLog = (timestamps) => {
    try {
      window.localStorage.setItem(commentRateKey, JSON.stringify(timestamps));
    } catch {
      // Ignore storage failures.
    }
  };

  const getOrCreateVisitorId = () => {
    try {
      const existing = window.localStorage.getItem(visitorIdKey);
      if (existing) return existing;
      const created = `v_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      window.localStorage.setItem(visitorIdKey, created);
      return created;
    } catch {
      return `v_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    }
  };

  const engagementSection = document.createElement("section");
  engagementSection.className = "panel reveal engagement-panel";
  engagementSection.id = "comments";
  engagementSection.setAttribute("data-engagement", "true");
  engagementSection.innerHTML = `
    <h2>Reflections & Comments</h2>
    <div class="engagement-controls">
      <button type="button" class="btn btn-secondary like-button" data-like-button>Like this page</button>
      <p class="like-count" data-like-count>0 likes</p>
    </div>
    <form class="comment-form" data-comment-form>
      <label for="comment-input">Comment</label>
      <textarea id="comment-input" class="comment-input" rows="4" maxlength="${commentMaxLength}" placeholder="Add your reflection or note"></textarea>
      <input type="text" class="hp-field" tabindex="-1" autocomplete="off" data-comment-honeypot aria-hidden="true" />
      <div class="turnstile-slot" data-turnstile-slot></div>
      <div class="comment-form-meta">
        <p class="comment-counter" data-comment-counter>0 / ${commentMaxLength}</p>
        <button type="submit" class="btn btn-primary comment-submit">Post Comment</button>
      </div>
    </form>
    <p class="engagement-note" data-engagement-note></p>
    <div class="comment-thread">
      <div class="comment-thread-head">
        <h3>Comments</h3>
        <label class="comment-sort-label" for="comment-sort">Sort</label>
        <select id="comment-sort" class="comment-sort" data-comment-sort>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
        </select>
      </div>
      <p class="comment-status" data-comment-status aria-live="polite"></p>
      <ul class="comment-list" data-comment-list></ul>
      <p class="comment-empty" data-comment-empty>No comments yet.</p>
    </div>
  `;

  contentHost.appendChild(engagementSection);

  const likeButton = engagementSection.querySelector("[data-like-button]");
  const likeCount = engagementSection.querySelector("[data-like-count]");
  const commentForm = engagementSection.querySelector("[data-comment-form]");
  const commentInput = engagementSection.querySelector("#comment-input");
  const commentHoneypot = engagementSection.querySelector("[data-comment-honeypot]");
  const turnstileSlot = engagementSection.querySelector("[data-turnstile-slot]");
  const commentList = engagementSection.querySelector("[data-comment-list]");
  const commentEmpty = engagementSection.querySelector("[data-comment-empty]");
  const commentCounter = engagementSection.querySelector("[data-comment-counter]");
  const commentSort = engagementSection.querySelector("[data-comment-sort]");
  const commentStatus = engagementSection.querySelector("[data-comment-status]");
  const engagementNote = engagementSection.querySelector("[data-engagement-note]");

  let state = loadLocalState();
  let liked = loadLocalLiked();
  let sortMode = loadSortMode();
  const visitorId = getOrCreateVisitorId();

  if (commentSort) commentSort.value = sortMode;

  const formatLikeText = (likes) => `${likes} like${likes === 1 ? "" : "s"}`;

  const renderLikes = () => {
    if (!likeButton || !likeCount) return;
    likeCount.textContent = formatLikeText(state.likes);
    likeButton.classList.toggle("is-liked", liked);
    likeButton.textContent = liked ? "Liked" : "Like this page";
    likeButton.setAttribute("aria-pressed", liked ? "true" : "false");
  };

  const renderComments = () => {
    if (!commentList || !commentEmpty) return;
    commentList.innerHTML = "";

    const sortedComments = [...state.comments].sort((a, b) => {
      const dateA = Date.parse(a.createdAt);
      const dateB = Date.parse(b.createdAt);
      const safeA = Number.isNaN(dateA) ? 0 : dateA;
      const safeB = Number.isNaN(dateB) ? 0 : dateB;
      return sortMode === "oldest" ? safeA - safeB : safeB - safeA;
    });

    if (!sortedComments.length) {
      commentEmpty.hidden = false;
      return;
    }

    commentEmpty.hidden = true;

    sortedComments.forEach((entry) => {
      const item = document.createElement("li");
      item.className = "comment-item";

      const message = document.createElement("p");
      message.className = "comment-text";
      message.textContent = entry.text;

      const meta = document.createElement("p");
      meta.className = "comment-meta";
      const timestamp = new Date(entry.createdAt);
      meta.textContent = Number.isNaN(timestamp.getTime())
        ? "Visitor · Saved locally"
        : `Visitor · ${timestamp.toLocaleString([], {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          })}`;

      item.append(message, meta);

      if (writeMode === "edge" && entry.id) {
        const actions = document.createElement("div");
        actions.className = "comment-actions";

        const reportButton = document.createElement("button");
        reportButton.type = "button";
        reportButton.className = "comment-report";
        reportButton.setAttribute("data-comment-report", entry.id);
        reportButton.textContent = "Report";

        actions.appendChild(reportButton);
        item.appendChild(actions);
      }

      commentList.appendChild(item);
    });
  };

  const updateCounter = () => {
    if (!commentCounter || !commentInput) return;
    const length = commentInput.value.trim().length;
    commentCounter.textContent = `${length} / ${commentMaxLength}`;
    commentCounter.classList.toggle("near-limit", length >= commentMaxLength - 80);
  };

  const setCommentStatus = (message, stateLabel = "info") => {
    if (!commentStatus) return;
    commentStatus.textContent = message;
    commentStatus.setAttribute("data-state", stateLabel);
  };

  const updateUi = () => {
    renderLikes();
    renderComments();
    updateCounter();
  };

  const setEngagementNote = (message) => {
    if (!engagementNote) return;
    engagementNote.textContent = message;
  };

  const supabaseRequest = async (path, options = {}) => {
    const headers = {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
      ...(options.headers || {})
    };

    if (options.body && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    return fetch(`${supabaseUrl}${path}`, {
      method: options.method || "GET",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    });
  };

  const edgeRequest = async (action, payload = {}) => {
    if (!edgeFunctionUrl) throw new Error("Edge function URL is not configured.");

    const response = await fetch(edgeFunctionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`
      },
      body: JSON.stringify({ action, pageSlug, visitorId, ...payload })
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok || body?.ok === false) {
      const message = typeof body?.error === "string" ? body.error : "Edge request failed.";
      throw new Error(message);
    }

    return body;
  };

  const parseCountFromRange = (contentRange) => {
    if (!contentRange) return 0;
    const [, totalRaw] = contentRange.split("/");
    const total = Number(totalRaw);
    return Number.isFinite(total) && total >= 0 ? total : 0;
  };

  const fetchRemoteLikesCount = async () => {
    const response = await supabaseRequest(
      `/rest/v1/page_likes?page_slug=eq.${encodeURIComponent(pageSlug)}&select=id`,
      {
        method: "HEAD",
        headers: { Prefer: "count=exact" }
      }
    );

    if (!response.ok) throw new Error("Unable to load likes count.");
    return parseCountFromRange(response.headers.get("content-range"));
  };

  const fetchRemoteLikedState = async () => {
    const response = await supabaseRequest(
      `/rest/v1/page_likes?page_slug=eq.${encodeURIComponent(
        pageSlug
      )}&visitor_id=eq.${encodeURIComponent(visitorId)}&select=id&limit=1`
    );
    if (!response.ok) throw new Error("Unable to load your like status.");
    const data = await response.json();
    return Array.isArray(data) && data.length > 0;
  };

  const fetchRemoteComments = async () => {
    const response = await supabaseRequest(
      `/rest/v1/page_comments?page_slug=eq.${encodeURIComponent(
        pageSlug
      )}&select=id,comment_text,created_at&order=created_at.asc`
    );
    if (!response.ok) throw new Error("Unable to load comments.");
    const data = await response.json();
    if (!Array.isArray(data)) return [];

    return data
      .filter((entry) => typeof entry.comment_text === "string")
      .map((entry) => ({
        id: String(entry.id),
        text: entry.comment_text.trim(),
        createdAt:
          typeof entry.created_at === "string" && !Number.isNaN(Date.parse(entry.created_at))
            ? entry.created_at
            : new Date().toISOString()
      }))
      .filter((entry) => entry.text.length > 0);
  };

  const insertRemoteLike = async () => {
    const response = await supabaseRequest("/rest/v1/page_likes", {
      method: "POST",
      headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
      body: [{ page_slug: pageSlug, visitor_id: visitorId }]
    });
    if (!response.ok) throw new Error("Unable to like this page.");
  };

  const deleteRemoteLike = async () => {
    const response = await supabaseRequest(
      `/rest/v1/page_likes?page_slug=eq.${encodeURIComponent(
        pageSlug
      )}&visitor_id=eq.${encodeURIComponent(visitorId)}`,
      {
        method: "DELETE",
        headers: { Prefer: "return=minimal" }
      }
    );
    if (!response.ok) throw new Error("Unable to remove your like.");
  };

  const insertRemoteComment = async (text) => {
    const response = await supabaseRequest("/rest/v1/page_comments", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: [{ page_slug: pageSlug, comment_text: text }]
    });

    if (!response.ok) throw new Error("Unable to post comment.");
    const data = await response.json();
    const first = Array.isArray(data) ? data[0] : null;
    if (!first || typeof first.comment_text !== "string") {
      return {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        text,
        createdAt: new Date().toISOString()
      };
    }

    return {
      id: String(first.id),
      text: first.comment_text.trim(),
      createdAt:
        typeof first.created_at === "string" && !Number.isNaN(Date.parse(first.created_at))
          ? first.created_at
          : new Date().toISOString()
    };
  };

  const validateCommentRate = () => {
    const now = Date.now();
    const activeLog = loadRateLog().filter((stamp) => now - stamp <= commentRateWindowMs);

    if (activeLog.length >= commentRateMax) {
      setCommentStatus(
        "You are posting too quickly. Please wait a few minutes and try again.",
        "error"
      );
      return false;
    }

    return true;
  };

  const recordCommentRate = () => {
    const now = Date.now();
    const activeLog = loadRateLog().filter((stamp) => now - stamp <= commentRateWindowMs);
    activeLog.push(now);
    saveRateLog(activeLog);
  };

  const validateCommentText = () => {
    if (!commentInput) return "";

    if (commentHoneypot?.value.trim()) {
      setCommentStatus("Unable to post comment right now.", "error");
      return "";
    }

    const text = commentInput.value.trim();
    if (text.length < commentMinLength) {
      setCommentStatus(`Comment should be at least ${commentMinLength} characters.`, "error");
      return "";
    }
    if (text.length > commentMaxLength) {
      setCommentStatus(`Comment should be ${commentMaxLength} characters or less.`, "error");
      return "";
    }

    if (writeMode === "edge" && turnstileSiteKey && !turnstileToken) {
      setCommentStatus("Complete the verification challenge first.", "error");
      return "";
    }

    return text;
  };

  const resetTurnstile = () => {
    if (turnstileWidgetId !== null && window.turnstile?.reset) {
      window.turnstile.reset(turnstileWidgetId);
      turnstileToken = "";
    }
  };

  const setButtonsDisabled = (disabled) => {
    if (likeButton) likeButton.disabled = disabled;
    if (commentForm) {
      const submit = commentForm.querySelector(".comment-submit");
      if (submit) submit.disabled = disabled;
    }
  };

  const loadTurnstileScript = async () => {
    if (!turnstileSiteKey) return false;
    if (window.turnstile) return true;

    return new Promise((resolve) => {
      const existing = document.querySelector("script[data-turnstile-script]");
      if (existing) {
        existing.addEventListener("load", () => resolve(Boolean(window.turnstile)), {
          once: true
        });
        existing.addEventListener("error", () => resolve(false), { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.setAttribute("data-turnstile-script", "true");
      script.addEventListener("load", () => resolve(Boolean(window.turnstile)), { once: true });
      script.addEventListener("error", () => resolve(false), { once: true });
      document.head.appendChild(script);
    });
  };

  const mountTurnstile = async () => {
    if (!turnstileSlot || !turnstileSiteKey || turnstileWidgetId !== null) return;

    const loaded = await loadTurnstileScript();
    if (!loaded || !window.turnstile?.render) {
      setCommentStatus("Bot protection is unavailable. Please try again later.", "error");
      return;
    }

    turnstileWidgetId = window.turnstile.render(turnstileSlot, {
      sitekey: turnstileSiteKey,
      theme: "light",
      callback: (token) => {
        turnstileToken = token;
        if (commentStatus?.getAttribute("data-state") === "error") {
          setCommentStatus("", "info");
        }
      },
      "expired-callback": () => {
        turnstileToken = "";
      },
      "error-callback": () => {
        turnstileToken = "";
      }
    });
  };

  const setWriteMode = (mode) => {
    writeMode = mode;
    renderComments();
  };

  const setupLocalMode = () => {
    setWriteMode("local");
    setEngagementNote("Local mode: configure Supabase to sync likes and comments across visitors.");
    setCommentStatus("Comments are saved on this device.", "info");
    updateUi();
  };

  const setupSupabaseMode = async () => {
    setEngagementNote("Loading live discussion...");
    setCommentStatus("Loading comments...", "pending");
    setButtonsDisabled(true);

    try {
      const [likesCount, likedState, comments] = await Promise.all([
        fetchRemoteLikesCount(),
        fetchRemoteLikedState(),
        fetchRemoteComments()
      ]);

      state.likes = likesCount;
      state.comments = comments;
      liked = likedState;
      saveLocalLiked(liked);
      updateUi();
    } catch {
      setupLocalMode();
      setButtonsDisabled(false);
      return;
    }

    if (edgeFunctionUrl) {
      try {
        await edgeRequest("health");
        setWriteMode("edge");
        setEngagementNote("Secure live mode: anti-spam and moderation are active.");
        setCommentStatus("", "info");
        await mountTurnstile();
      } catch {
        setWriteMode("rest");
        setEngagementNote("Live mode: deploy the engagement Edge Function for stronger anti-spam protection.");
        setCommentStatus("", "info");
      }
    } else {
      setWriteMode("rest");
      setEngagementNote("Live mode: likes and comments are synced with Supabase.");
      setCommentStatus("", "info");
    }

    setButtonsDisabled(false);
  };

  if (likeButton) {
    likeButton.addEventListener("click", async () => {
      const nextLiked = !liked;
      likeButton.disabled = true;

      try {
        if (writeMode === "local") {
          liked = nextLiked;
          state.likes = liked ? state.likes + 1 : Math.max(0, state.likes - 1);
          saveLocalLiked(liked);
          saveLocalState(state);
          renderLikes();
          setCommentStatus("", "info");
        } else if (writeMode === "edge") {
          const response = await edgeRequest("toggleLike", { like: nextLiked });
          liked = Boolean(response.liked);
          state.likes = Number.isFinite(Number(response.likes)) ? Number(response.likes) : state.likes;
          saveLocalLiked(liked);
          renderLikes();
          setCommentStatus("", "info");
        } else {
          if (nextLiked) {
            await insertRemoteLike();
          } else {
            await deleteRemoteLike();
          }
          liked = nextLiked;
          saveLocalLiked(liked);
          state.likes = await fetchRemoteLikesCount();
          renderLikes();
          setCommentStatus("", "info");
        }
      } catch {
        setEngagementNote("Could not update like right now. Please try again.");
        setCommentStatus("Could not update like right now.", "error");
      } finally {
        likeButton.disabled = false;
      }
    });
  }

  if (commentForm && commentInput) {
    commentForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!validateCommentRate()) return;

      const text = validateCommentText();
      if (!text) return;

      const submit = commentForm.querySelector(".comment-submit");
      if (submit) submit.disabled = true;
      setCommentStatus("Posting comment...", "pending");

      try {
        let comment;

        if (writeMode === "local") {
          comment = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            text,
            createdAt: new Date().toISOString()
          };
          state.comments = [...state.comments, comment];
          saveLocalState(state);
        } else if (writeMode === "edge") {
          const response = await edgeRequest("postComment", {
            commentText: text,
            honeypot: commentHoneypot?.value || "",
            turnstileToken
          });

          comment = response.comment
            ? {
                id: String(response.comment.id),
                text: String(response.comment.text || "").trim(),
                createdAt: String(response.comment.createdAt || new Date().toISOString())
              }
            : null;

          if (comment && comment.text) {
            state.comments = [...state.comments, comment];
          }

          resetTurnstile();
        } else {
          comment = await insertRemoteComment(text);
          state.comments = [...state.comments, comment];
        }

        recordCommentRate();
        commentInput.value = "";
        if (commentHoneypot) commentHoneypot.value = "";
        updateCounter();
        renderComments();
        setCommentStatus("Comment posted.", "success");
      } catch {
        setCommentStatus("Could not post comment right now. Please try again.", "error");
      } finally {
        if (submit) submit.disabled = false;
      }
    });
  }

  if (commentList) {
    commentList.addEventListener("click", async (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;

      const button = target.closest("[data-comment-report]");
      if (!(button instanceof HTMLButtonElement)) return;

      if (writeMode !== "edge") {
        setCommentStatus("Report is available in secure mode only.", "info");
        return;
      }

      const commentId = button.getAttribute("data-comment-report");
      if (!commentId) return;

      button.disabled = true;

      try {
        await edgeRequest("reportComment", {
          commentId,
          reason: "community-flag"
        });
        setCommentStatus("Comment reported. Thank you.", "success");
      } catch {
        setCommentStatus("Could not report this comment right now.", "error");
      } finally {
        button.disabled = false;
      }
    });
  }

  if (commentSort) {
    commentSort.addEventListener("change", () => {
      sortMode = commentSort.value === "oldest" ? "oldest" : "newest";
      saveSortMode(sortMode);
      renderComments();
    });
  }

  if (commentInput) {
    commentInput.addEventListener("input", () => {
      updateCounter();
      if (commentStatus?.getAttribute("data-state") === "error") {
        setCommentStatus("", "info");
      }
    });
  }

  if (hasSupabase) {
    setupSupabaseMode();
  } else {
    setupLocalMode();
  }
}
