document.querySelectorAll("[data-copy]").forEach((button) => {
  button.addEventListener("click", async () => {
    await navigator.clipboard?.writeText(button.dataset.copy);
    const original = button.textContent;
    button.textContent = "Copied";
    window.setTimeout(() => { button.textContent = original; }, 1200);
  });
});

document.querySelectorAll("[data-copy-target]").forEach((button) => {
  button.addEventListener("click", async () => {
    const target = document.querySelector(button.dataset.copyTarget);
    if (!target) return;
    await navigator.clipboard?.writeText(target.value ?? target.textContent);
    const original = button.textContent;
    button.textContent = "Copied";
    window.setTimeout(() => { button.textContent = original; }, 1200);
  });
});

const promptTextarea = document.querySelector("#agent-prompt");
const promptFormUrl = document.querySelector("#prompt-form-url");
const promptComponent = document.querySelector("#prompt-component");
const promptLocalFields = document.querySelector("#prompt-local-fields");
if (promptTextarea && promptFormUrl && promptComponent && promptLocalFields) {
  const buildPrompt = () => {
    const formUrl = promptFormUrl.value.trim() || "[PASTE THE PUBLISHED GOOGLE FORM URL]";
    const component = promptComponent.value.trim() || "[FIND THE FORM COMPONENT IN THE CODEBASE]";
    const localFields = promptLocalFields.value.trim() || "[INSPECT THE COMPONENT]";
    promptTextarea.value = `Connect the existing React form in this project to Google Forms with @abdellahi/formfacade.

Google Form URL:
${formUrl}

Form component:
${component}

Expected local fields:
${localFields}

First inspect the existing form component. Run this command: npx @abdellahi/formfacade inspect "${formUrl}" --json. Match the returned fields to the local fields by label and type, then show the mapping before editing. If the form is private, inspection fails, or a match is ambiguous, stop and ask me instead of guessing.

Requirements:
- Keep the existing form UI, state, validation, and styles.
- Install @abdellahi/formfacade if it is missing.
- Use useGoogleForm in a React component. Use submitGoogleForm only if the form is not React.
- Prevent the normal browser form submission and send the current values through FormFacade.
- Disable the submit button while sending and show useful sent and error states.
- Do not embed or display the Google Forms interface.
- Treat a resolved submission as sent but unverified. Do not claim that Google stored the response.
- Run the project's existing checks after the change.`;
  };
  [promptFormUrl, promptComponent, promptLocalFields].forEach((input) => input.addEventListener("input", buildPrompt));
  buildPrompt();
}

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
