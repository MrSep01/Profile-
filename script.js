const revealElements = document.querySelectorAll(".reveal");

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

const menuLinks = document.querySelectorAll('.menu a[href^="#"]');
const observedSections = [...menuLinks]
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

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

const contactForm = document.querySelector("form");

if (contactForm) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const button = contactForm.querySelector("button");
    if (!button) return;

    const originalButtonText = button.textContent;
    button.textContent = "Message Sent";
    button.disabled = true;

    setTimeout(() => {
      button.textContent = originalButtonText;
      button.disabled = false;
      contactForm.reset();
    }, 1800);
  });
}
