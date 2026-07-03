document.addEventListener("DOMContentLoaded", () => {
  const projects = document.querySelector(".projects");
  const projectCards = document.querySelectorAll(".project-card");
  const viewButtons = document.querySelectorAll("[data-view]");
  const filterButtons = document.querySelectorAll("[data-filter]");
  const aboutButton = document.querySelector("[data-about]");
  const aboutNote = document.querySelector(".about-note");
  const closeMark = document.querySelector(".close-mark");

  function setActive(buttons, activeButton) {
    buttons.forEach((button) => {
      const isActive = button === activeButton;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
  }

  function setView(view, activeButton) {
    projects.classList.toggle("gallery", view === "gallery");
    projects.classList.toggle("list", view === "list");
    setActive(viewButtons, activeButton);
  }

  function setFilter(filter, activeButton) {
    projectCards.forEach((card) => {
      const categories = card.dataset.category.split(" ");
      const shouldShow = filter === "all" || categories.includes(filter);
      card.classList.toggle("is-hidden", !shouldShow);
    });

    setActive(filterButtons, activeButton);
    aboutNote.classList.remove("open");
  }

  viewButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.classList.contains("active")));
    button.addEventListener("click", () => setView(button.dataset.view, button));
  });

  filterButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.classList.contains("active")));
    button.addEventListener("click", () => setFilter(button.dataset.filter, button));
  });

  aboutButton.addEventListener("click", () => {
    aboutNote.classList.toggle("open");
  });

  closeMark.addEventListener("click", () => {
    setView("gallery", document.querySelector('[data-view="gallery"]'));
    setFilter("all", document.querySelector('[data-filter="all"]'));
    aboutNote.classList.remove("open");
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});
