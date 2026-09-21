const state = {
  data: null,
  currentDepartment: "opd",
};

const elements = {
  line: document.querySelector("#awwabLine"),
  actions: document.querySelector("#quickActions"),
  form: document.querySelector("#questionForm"),
  input: document.querySelector("#questionInput"),
  departmentBadge: document.querySelector("#departmentBadge"),
  boundaryBadge: document.querySelector("#boundaryBadge"),
  music: document.querySelector("#bgMusic"),
  musicToggle: document.querySelector("#musicToggle"),
  video: document.querySelector("#awwabVideo"),
  fallback: document.querySelector("#awwabFallback"),
};

const medicationPattern =
  /\b(medicine|medication|ubat|dos|dose|dosage|side effect|kesan sampingan|missed dose|terlupa|prescription|preskripsi|tablet|capsule|antibiotic|insulin|warfarin|painkiller|paracetamol|ibuprofen)\b/i;

const medicalPattern =
  /\b(diagnose|diagnosis|penyakit|symptom|gejala|sakit dada|chest pain|fever|demam|pregnant|mengandung|asthma|diabetes|hypertension|blood pressure|doctor|doktor)\b/i;

async function boot() {
  try {
    const response = await fetch("./data/departments.json");
    state.data = await response.json();
  } catch (error) {
    state.data = fallbackData();
  }

  elements.video?.addEventListener("error", showFallback);
  elements.video?.querySelector("source")?.addEventListener("error", showFallback);
  elements.fallback?.addEventListener("load", () => {
    if (!elements.video?.currentSrc) showFallback();
  });

  renderDepartment("opd");
  bindEvents();
}

function bindEvents() {
  elements.form.addEventListener("submit", (event) => {
    event.preventDefault();
    const value = elements.input.value.trim();
    if (!value) return;
    respondToQuestion(value);
    elements.input.value = "";
  });

  elements.musicToggle.addEventListener("click", async () => {
    if (elements.music.paused) {
      try {
        await elements.music.play();
        elements.musicToggle.setAttribute("aria-pressed", "true");
        elements.musicToggle.setAttribute("aria-label", "Pause music");
      } catch {
        renderLine("Music will start after the browser allows playback.");
      }
    } else {
      elements.music.pause();
      elements.musicToggle.setAttribute("aria-pressed", "false");
      elements.musicToggle.setAttribute("aria-label", "Play music");
    }
  });
}

function showFallback() {
  elements.video.hidden = true;
  elements.fallback.classList.add("is-visible");
}

function renderDepartment(id) {
  const department = state.data.departments.find((item) => item.id === id) ?? state.data.departments[0];
  state.currentDepartment = department.id;
  elements.departmentBadge.textContent = department.shortName;
  elements.boundaryBadge.textContent = state.data.identity.roleLabel;
  renderLine(department.openingLine);
  renderActions(department.actions);
}

function renderLine(text) {
  elements.line.textContent = text;
}

function renderActions(actions) {
  elements.actions.innerHTML = "";

  actions.forEach((action) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = action.label;
    button.addEventListener("click", () => handleAction(action));
    elements.actions.append(button);
  });
}

function handleAction(action) {
  if (action.type === "line") {
    renderLine(action.response);
    return;
  }

  if (action.type === "department") {
    renderDepartment(action.target);
    return;
  }

  renderLine(state.data.boundaries.serviceFallback);
}

function respondToQuestion(question) {
  if (medicationPattern.test(question)) {
    renderLine(state.data.boundaries.medication);
    return;
  }

  if (medicalPattern.test(question)) {
    renderLine(state.data.boundaries.medical);
    return;
  }

  const department = state.data.departments.find((item) => item.id === state.currentDepartment);
  const lowerQuestion = question.toLowerCase();
  const matchedScope = department.scopes.find((scope) => lowerQuestion.includes(scope.keyword));

  if (matchedScope) {
    renderLine(matchedScope.response);
    return;
  }

  renderLine(state.data.boundaries.serviceFallback);
}

function fallbackData() {
  return {
    identity: {
      roleLabel: "Virtual Intelligence Pharmacist",
    },
    boundaries: {
      medication: "For medication-specific questions, please speak directly with a pharmacist.",
      medical: "For medical conditions or diagnosis, please refer to a doctor.",
      serviceFallback: "I can explain HTAR Pharmacy services and pharmacists' roles. For personal treatment advice, please speak with the healthcare team.",
    },
    departments: [
      {
        id: "opd",
        shortName: "OPD",
        openingLine:
          "Assalamualaikum and welcome. I am VI Awwab. Let me introduce the Outpatient Pharmacy and the pharmacists who keep care moving every day.",
        actions: [],
        scopes: [],
      },
    ],
  };
}

boot();
