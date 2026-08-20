document.querySelectorAll("[data-copy]").forEach((button) => {
  button.addEventListener("click", async () => {
    await navigator.clipboard?.writeText(button.dataset.copy);
    const original = button.textContent;
    button.textContent = "Copied";
    window.setTimeout(() => { button.textContent = original; }, 1200);
  });
});

document.querySelectorAll(".demo-form").forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const status = form.querySelector(".form-status");
    if (status) status.textContent = "Demo submitted. Connect your Google Form to make it live.";
  });
});

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const revealTargets = document.querySelectorAll(".browser, .doc-section, .component, .code-card, .footer");
if (reducedMotion || !("IntersectionObserver" in window)) {
  revealTargets.forEach((element) => element.classList.add("visible"));
} else {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12 });
  revealTargets.forEach((element) => {
    element.classList.add("reveal");
    revealObserver.observe(element);
  });
}

const survey = document.querySelector("#survey-demo");
if (survey) {
  const questions = [
    "What are you trying to learn from your users?",
    "Who will answer this survey?",
    "What do you ask them today?",
    "Where should the answers go?",
    "What should happen after they submit?",
  ];
  let current = 0;
  const stage = document.querySelector("#survey-stage");
  const question = document.querySelector("#survey-question");
  const answer = document.querySelector("#survey-answer");
  const count = document.querySelector("#survey-count");
  const progress = document.querySelector("#survey-progress");
  const next = document.querySelector("#survey-next");
  const status = document.querySelector("#survey-status");

  const advance = () => {
    if (!answer.value.trim()) {
      answer.focus();
      return;
    }
    if (current === questions.length - 1) {
      status.textContent = "Survey complete. Connect your Google Form to save the answers.";
      next.disabled = true;
      next.textContent = "Submitted";
      return;
    }
    stage.classList.remove("in");
    stage.classList.add("out");
    window.setTimeout(() => {
      current += 1;
      question.textContent = questions[current];
      answer.value = "";
      count.textContent = `${String(current + 1).padStart(2, "0")} / ${String(questions.length).padStart(2, "0")}`;
      progress.style.width = `${((current + 1) / questions.length) * 100}%`;
      stage.classList.remove("out");
      stage.classList.add("in");
      answer.focus();
    }, 175);
  };

  survey.addEventListener("submit", (event) => { event.preventDefault(); advance(); });
}
