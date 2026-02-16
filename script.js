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
    if (completed === total) return "Badge: Master Teacher Explorer";
    if (completed >= Math.ceil(total * 0.75)) return "Badge: Advanced Strategy Guide";
    if (completed >= Math.ceil(total * 0.5)) return "Badge: Inquiry Navigator";
    if (completed >= Math.ceil(total * 0.25)) return "Badge: Active Investigator";
    return "Badge: Starter Chemist";
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
