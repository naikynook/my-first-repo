document.addEventListener("DOMContentLoaded", () => {
  const projectIndex = document.querySelector(".project-index");
  const projectLinks = document.querySelectorAll(".project-link");
  const viewButtons = document.querySelectorAll("[data-view]");
  const filterButtons = document.querySelectorAll("[data-filter]");
  const resetButton = document.querySelector(".mark-top");

  function setActiveButton(buttons, value, attribute) {
    buttons.forEach((button) => {
      const isActive = button.dataset[attribute] === value;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
  }

  function setView(view) {
    projectIndex.classList.toggle("list-view", view === "list");
    projectIndex.classList.toggle("gallery-view", view === "gallery");
    setActiveButton(viewButtons, view, "view");
  }

  function setFilter(filter) {
    projectLinks.forEach((project) => {
      const categories = project.dataset.category.split(" ");
      const shouldShow = filter === "all" || categories.includes(filter);
      project.classList.toggle("is-hidden", !shouldShow);
    });

    setActiveButton(filterButtons, filter, "filter");
  }

  viewButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.classList.contains("is-active")));
    button.addEventListener("click", () => setView(button.dataset.view));
  });

  filterButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.classList.contains("is-active")));
    button.addEventListener("click", () => setFilter(button.dataset.filter));
  });

  resetButton.addEventListener("click", () => {
    setView("list");
    setFilter("all");
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});
