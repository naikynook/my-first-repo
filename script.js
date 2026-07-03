document.addEventListener("DOMContentLoaded", () => {
  const archive = document.querySelector(".project-archive");
  const projectItems = document.querySelectorAll(".project-item");
  const filterButtons = document.querySelectorAll("[data-filter]");
  const viewButtons = document.querySelectorAll("[data-view]");

  function setActiveButton(buttons, activeButton) {
    buttons.forEach((button) => {
      const isActive = button === activeButton;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
  }

  function filterProjects(category) {
    projectItems.forEach((project) => {
      const matchesCategory = category === "all" || project.dataset.category === category;
      project.classList.toggle("is-hidden", !matchesCategory);
    });
  }

  function setArchiveView(view) {
    archive.classList.toggle("list-view", view === "list");
    archive.classList.toggle("gallery-view", view === "gallery");
  }

  filterButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.classList.contains("is-active")));

    button.addEventListener("click", () => {
      setActiveButton(filterButtons, button);
      filterProjects(button.dataset.filter);
    });
  });

  viewButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.classList.contains("is-active")));

    button.addEventListener("click", () => {
      setActiveButton(viewButtons, button);
      setArchiveView(button.dataset.view);
    });
  });
});
