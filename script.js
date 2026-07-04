document.addEventListener("DOMContentLoaded", () => {
  const stage = document.querySelector(".project-stage");
  const cards = document.querySelectorAll(".project-card");
  const viewButtons = document.querySelectorAll("[data-view]");
  const filterButtons = document.querySelectorAll("[data-filter]");
  const aboutButton = document.querySelector("[data-about]");
  const appsButton = document.querySelector("[data-apps]");
  const aboutPanel = document.querySelector(".about-panel");
  const appsPanel = document.querySelector(".apps-panel");
  const listPreview = document.querySelector(".list-preview");
  const resetMark = document.querySelector(".reset-mark");

  function setActive(buttons, activeButton) {
    buttons.forEach((button) => {
      const isActive = button === activeButton;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
  }

  function setView(view, activeButton) {
    stage.classList.toggle("gallery-view", view === "gallery");
    stage.classList.toggle("list-view", view === "list");
    document.body.classList.toggle("is-list-view", view === "list");
    setActive(viewButtons, activeButton);

    if (view === "list") {
      selectFirstVisibleCard();
    } else {
      cards.forEach((card) => card.classList.remove("is-selected"));
      resetListPreview();
    }
  }

  function setFilter(filter, activeButton) {
    stage.dataset.filter = filter;

    cards.forEach((card) => {
      const categories = card.dataset.category.split(" ");
      const isVisible = filter === "all" || categories.includes(filter);
      card.classList.toggle("is-hidden", !isVisible);
    });

    setActive(filterButtons, activeButton);
    aboutPanel.classList.remove("is-open");

    if (stage.classList.contains("list-view")) {
      selectFirstVisibleCard();
    }
  }

  function selectCard(selectedCard) {
    cards.forEach((card) => {
      card.classList.toggle("is-selected", card === selectedCard);
    });

    updateListPreview(selectedCard);
  }

  function selectFirstVisibleCard() {
    const firstVisibleCard = Array.from(cards).find((card) => {
      return !card.classList.contains("is-hidden");
    });

    if (firstVisibleCard) {
      selectCard(firstVisibleCard);
    } else {
      resetListPreview();
    }
  }

  function updateListPreview(selectedCard) {
    const selectedImage = selectedCard.querySelector(".project-image");
    const imageClasses = Array.from(selectedImage.classList).filter((className) => {
      return className !== "project-image";
    });
    const isProfessional = selectedCard.dataset.category.split(" ").includes("professional");

    listPreview.className = ["list-preview", ...imageClasses, isProfessional ? "is-professional" : ""]
      .filter(Boolean)
      .join(" ");
  }

  function resetListPreview() {
    listPreview.className = "list-preview";
  }

  viewButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.classList.contains("is-active")));
    button.addEventListener("click", () => setView(button.dataset.view, button));
  });

  filterButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.classList.contains("is-active")));
    button.addEventListener("click", () => setFilter(button.dataset.filter, button));
  });

  cards.forEach((card) => {
    const link = card.querySelector("a");

    link.addEventListener("click", (event) => {
      if (!stage.classList.contains("list-view")) {
        return;
      }

      event.preventDefault();
      selectCard(card);
    });
  });

  aboutButton.addEventListener("click", () => {
    aboutPanel.classList.toggle("is-open");
    appsPanel.classList.remove("is-open");
  });

  appsButton.addEventListener("click", () => {
    appsPanel.classList.toggle("is-open");
    aboutPanel.classList.remove("is-open");
  });

  resetMark.addEventListener("click", () => {
    setView("gallery", document.querySelector('[data-view="gallery"]'));
    setFilter("all", document.querySelector('[data-filter="all"]'));
    aboutPanel.classList.remove("is-open");
    appsPanel.classList.remove("is-open");
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});

