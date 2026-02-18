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
  if (filename === "index.html") return false;

  return (
    filename.startsWith("blog") ||
    filename.includes("scavenger") ||
    filename.startsWith("portfolio") ||
    filename.startsWith("intasc-video") ||
    filename.startsWith("teaching-activities")
  );
};

const engagementRoot = document.querySelector("main");

if (engagementRoot && shouldEnableEngagement()) {
  const pageSlug = getPageFilename();
  const pageUrl = window.location.href.split("#")[0];
  const pageTitle = document.title || "Sepehr Massoumi Alamouti";
  const storageKey = `teaching-engagement-v1:${pageSlug}`;
  const likedKey = `teaching-liked-v1:${pageSlug}`;
  const sortKey = `teaching-comment-sort-v1:${pageSlug}`;
  const visitorIdKey = "teaching-visitor-id-v1";
  const storageFallback = { likes: 0, comments: [] };
  const commentMinLength = 3;
  const commentMaxLength = 1200;
  const supabaseConfig = window.SUPABASE_CONFIG || {};
  const supabaseUrl = String(supabaseConfig.url || "").trim().replace(/\/+$/, "");
  const supabaseAnonKey = String(supabaseConfig.anonKey || "").trim();
  const hasSupabase =
    Boolean(supabaseUrl) &&
    Boolean(supabaseAnonKey) &&
    !supabaseUrl.includes("YOUR-PROJECT") &&
    !supabaseAnonKey.includes("YOUR-ANON-KEY");

  const createShareSection = (position) => {
    const section = document.createElement("section");
    section.className = `panel reveal share-panel share-panel-${position}`;
    section.innerHTML = `
      <div class="share-head">
        <h2>Share This Page</h2>
        <p>Share this page with your network.</p>
      </div>
      <div class="share-actions">
        <button type="button" class="btn btn-secondary share-btn" data-share="linkedin">LinkedIn</button>
        <button type="button" class="btn btn-secondary share-btn" data-share="x">X</button>
        <button type="button" class="btn btn-secondary share-btn" data-share="facebook">Facebook</button>
        <button type="button" class="btn btn-secondary share-btn" data-share="whatsapp">WhatsApp</button>
        <button type="button" class="btn btn-secondary share-btn" data-share="email">Email</button>
        <button type="button" class="btn btn-secondary share-btn" data-share="copy">Copy Link</button>
      </div>
      <p class="share-feedback" data-share-feedback aria-live="polite"></p>
    `;
    return section;
  };

  const topShareSection = createShareSection("top");
  const bottomShareSection = createShareSection("bottom");

  const firstPanel = engagementRoot.querySelector("section.panel");
  if (firstPanel) {
    engagementRoot.insertBefore(topShareSection, firstPanel);
  } else {
    engagementRoot.appendChild(topShareSection);
  }
  engagementRoot.appendChild(bottomShareSection);

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

  attachShareHandlers(topShareSection);
  attachShareHandlers(bottomShareSection);

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

  engagementRoot.appendChild(engagementSection);

  const likeButton = engagementSection.querySelector("[data-like-button]");
  const likeCount = engagementSection.querySelector("[data-like-count]");
  const commentForm = engagementSection.querySelector("[data-comment-form]");
  const commentInput = engagementSection.querySelector("#comment-input");
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

    const response = await fetch(`${supabaseUrl}${path}`, {
      method: options.method || "GET",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    return response;
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

  const validateCommentText = () => {
    if (!commentInput) return "";
    const text = commentInput.value.trim();
    if (text.length < commentMinLength) {
      setCommentStatus(`Comment should be at least ${commentMinLength} characters.`, "error");
      return "";
    }
    if (text.length > commentMaxLength) {
      setCommentStatus(`Comment should be ${commentMaxLength} characters or less.`, "error");
      return "";
    }
    return text;
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

  const setButtonsDisabled = (disabled) => {
    if (likeButton) likeButton.disabled = disabled;
    if (commentForm) {
      const submit = commentForm.querySelector(".comment-submit");
      if (submit) submit.disabled = disabled;
    }
  };

  const setupLocalMode = () => {
    setEngagementNote("Local mode: configure Supabase to sync likes and comments across visitors.");
    setCommentStatus("Comments are saved on this device.", "info");
    updateUi();

    if (likeButton) {
      likeButton.addEventListener("click", () => {
        liked = !liked;
        state.likes = liked ? state.likes + 1 : Math.max(0, state.likes - 1);
        saveLocalLiked(liked);
        saveLocalState(state);
        renderLikes();
      });
    }

    if (commentForm && commentInput) {
      commentForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const text = validateCommentText();
        if (!text) return;

        const submit = commentForm.querySelector(".comment-submit");
        if (submit) submit.disabled = true;
        setCommentStatus("Posting comment...", "pending");

        state.comments = [
          ...state.comments,
          {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            text,
            createdAt: new Date().toISOString()
          }
        ];

        saveLocalState(state);
        commentInput.value = "";
        updateCounter();
        renderComments();
        setCommentStatus("Comment posted.", "success");
        if (submit) submit.disabled = false;
      });
    }
  };

  const setupSupabaseMode = async () => {
    setEngagementNote("Live mode: likes and comments are synced with Supabase.");
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
      setCommentStatus("", "info");
    } catch {
      setEngagementNote("Supabase unavailable right now. Using local mode for this browser.");
      setCommentStatus("Live comments are unavailable right now.", "error");
      setupLocalMode();
      setButtonsDisabled(false);
      return;
    }

    setButtonsDisabled(false);

    if (likeButton) {
      likeButton.addEventListener("click", async () => {
        const nextLiked = !liked;
        likeButton.disabled = true;

        try {
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
        const text = validateCommentText();
        if (!text) return;

        const submit = commentForm.querySelector(".comment-submit");
        if (submit) submit.disabled = true;
        setCommentStatus("Posting comment...", "pending");

        try {
          const comment = await insertRemoteComment(text);
          state.comments = [...state.comments, comment];
          commentInput.value = "";
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
  };

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
