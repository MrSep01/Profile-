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
  const storageKey = `teaching-engagement-v1:${pageSlug}`;
  const likedKey = `teaching-liked-v1:${pageSlug}`;
  const visitorIdKey = "teaching-visitor-id-v1";
  const storageFallback = { likes: 0, comments: [] };
  const supabaseConfig = window.SUPABASE_CONFIG || {};
  const supabaseUrl = String(supabaseConfig.url || "").trim().replace(/\/+$/, "");
  const supabaseAnonKey = String(supabaseConfig.anonKey || "").trim();
  const hasSupabase =
    Boolean(supabaseUrl) &&
    Boolean(supabaseAnonKey) &&
    !supabaseUrl.includes("YOUR-PROJECT") &&
    !supabaseAnonKey.includes("YOUR-ANON-KEY");

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
      <textarea id="comment-input" class="comment-input" rows="4" placeholder="Add your reflection or note"></textarea>
      <button type="submit" class="btn btn-primary comment-submit">Post Comment</button>
    </form>
    <p class="engagement-note" data-engagement-note></p>
    <div class="comment-thread">
      <h3>Comments</h3>
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
  const engagementNote = engagementSection.querySelector("[data-engagement-note]");

  let state = loadLocalState();
  let liked = loadLocalLiked();
  const visitorId = getOrCreateVisitorId();

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

    if (!state.comments.length) {
      commentEmpty.hidden = false;
      return;
    }

    commentEmpty.hidden = true;

    state.comments.forEach((entry) => {
      const item = document.createElement("li");
      item.className = "comment-item";

      const message = document.createElement("p");
      message.className = "comment-text";
      message.textContent = entry.text;

      const meta = document.createElement("p");
      meta.className = "comment-meta";
      const timestamp = new Date(entry.createdAt);
      meta.textContent = Number.isNaN(timestamp.getTime())
        ? "Saved locally"
        : timestamp.toLocaleString();

      item.append(message, meta);
      commentList.appendChild(item);
    });
  };

  const updateUi = () => {
    renderLikes();
    renderComments();
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
        const text = commentInput.value.trim();
        if (!text) return;

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
        renderComments();
      });
    }
  };

  const setupSupabaseMode = async () => {
    setEngagementNote("Live mode: likes and comments are synced with Supabase.");
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
    } catch (error) {
      setEngagementNote("Supabase unavailable right now. Using local mode for this browser.");
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
        } catch {
          setEngagementNote("Could not update like right now. Please try again.");
        } finally {
          likeButton.disabled = false;
        }
      });
    }

    if (commentForm && commentInput) {
      commentForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const text = commentInput.value.trim();
        if (!text) return;

        const submit = commentForm.querySelector(".comment-submit");
        if (submit) submit.disabled = true;

        try {
          const comment = await insertRemoteComment(text);
          state.comments = [...state.comments, comment];
          commentInput.value = "";
          renderComments();
        } catch {
          setEngagementNote("Could not post comment right now. Please try again.");
        } finally {
          if (submit) submit.disabled = false;
        }
      });
    }
  };

  if (hasSupabase) {
    setupSupabaseMode();
  } else {
    setupLocalMode();
  }
}
