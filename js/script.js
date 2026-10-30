const themeToggle = document.getElementById("theme-toggle");
const savedTheme = localStorage.getItem("theme");

function setTheme(isDark) {
  document.body.classList.toggle("dark-mode", isDark);
  themeToggle.textContent = isDark ? "☀" : "☾";
  themeToggle.setAttribute("aria-label", isDark ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối");
  themeToggle.setAttribute("aria-pressed", String(isDark));
}

setTheme(savedTheme === "dark");

themeToggle.addEventListener("click", function () {
  const isDark = !document.body.classList.contains("dark-mode");
  setTheme(isDark);
  localStorage.setItem("theme", isDark ? "dark" : "light");
});

const backToTop = document.createElement("button");
backToTop.type = "button";
backToTop.className = "back-to-top";
backToTop.textContent = "↑";
backToTop.setAttribute("aria-label", "Về đầu trang");
document.body.appendChild(backToTop);

const progressBar = document.getElementById("reading-progress-bar");
const header = document.querySelector(".site-header");
const sections = Array.from(document.querySelectorAll("main section[id]"));
const navLinks = Array.from(document.querySelectorAll(".menu a"));
let scrollUpdatePending = false;

function updateScrollState() {
  const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0;
  progressBar.style.transform = `scaleX(${Math.min(progress, 1)})`;
  backToTop.classList.toggle("show", window.scrollY > 400);

  let activeSection = sections[0];
  sections.forEach(function (section) {
    if (section.getBoundingClientRect().top <= header.offsetHeight + 80) {
      activeSection = section;
    }
  });

  navLinks.forEach(function (link) {
    const isCurrent = link.hash === `#${activeSection.id}`;
    if (isCurrent) {
      link.setAttribute("aria-current", "location");
    } else {
      link.removeAttribute("aria-current");
    }
  });

  scrollUpdatePending = false;
}

window.addEventListener("scroll", function () {
  if (!scrollUpdatePending) {
    window.requestAnimationFrame(updateScrollState);
    scrollUpdatePending = true;
  }
}, { passive: true });
window.addEventListener("resize", updateScrollState);
updateScrollState();

backToTop.addEventListener("click", function () {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({
    top: 0,
    behavior: reducedMotion ? "auto" : "smooth"
  });
});

const filterButtons = Array.from(document.querySelectorAll(".filter-button"));
const projectCards = Array.from(document.querySelectorAll(".projects .card"));
const projectCount = document.getElementById("project-count");

filterButtons.forEach(function (button) {
  button.addEventListener("click", function () {
    const filter = button.dataset.filter;
    let visibleProjects = 0;

    filterButtons.forEach(function (filterButton) {
      const isActive = filterButton === button;
      filterButton.classList.toggle("is-active", isActive);
      filterButton.setAttribute("aria-pressed", String(isActive));
    });

    projectCards.forEach(function (card) {
      const isVisible = filter === "all" || card.dataset.category === filter;
      card.hidden = !isVisible;
      visibleProjects += Number(isVisible);
    });

    projectCount.textContent = `${visibleProjects} dự án`;
  });
});

const gradeForm = document.getElementById("grade-form");
const weightStatus = document.getElementById("weight-status");
const gradeResult = document.getElementById("grade-result");
const gradeMessage = document.getElementById("grade-message");

function updateWeightStatus() {
  const formData = new FormData(gradeForm);
  const totalWeight = [1, 2, 3].reduce(function (total, index) {
    return total + Number(formData.get(`weight${index}`) || 0);
  }, 0);

  weightStatus.textContent = `Tổng trọng số: ${totalWeight}%`;
  weightStatus.classList.toggle("is-error", totalWeight !== 100);
  return totalWeight;
}

gradeForm.addEventListener("input", updateWeightStatus);
updateWeightStatus();

gradeForm.addEventListener("submit", function (event) {
  event.preventDefault();

  if (!gradeForm.reportValidity()) {
    return;
  }

  if (updateWeightStatus() !== 100) {
    weightStatus.textContent += " — cần bằng 100% để tính.";
    return;
  }

  const formData = new FormData(gradeForm);
  const average = [1, 2, 3].reduce(function (total, index) {
    return total + Number(formData.get(`score${index}`)) * Number(formData.get(`weight${index}`)) / 100;
  }, 0);

  gradeResult.value = average.toFixed(2);
  gradeMessage.textContent = "Kết quả được tính theo điểm và trọng số bạn nhập.";
});

const timerDisplay = document.getElementById("timer-display");
const timerModeLabel = document.getElementById("timer-mode-label");
const timerStatus = document.getElementById("timer-status");
const timerToggle = document.getElementById("timer-toggle");
const timerReset = document.getElementById("timer-reset");
const timerProgress = document.getElementById("timer-ring-progress");
const focusTool = document.querySelector(".focus-tool");
const timerTabs = Array.from(document.querySelectorAll(".timer-tab"));
const timerCircumference = 2 * Math.PI * 96;
let timerMode = "focus";
let timerDuration = 25 * 60;
let timerRemaining = timerDuration;
let timerDeadline = 0;
let timerInterval = null;
const pageTitle = document.title;

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function renderTimer() {
  timerDisplay.value = formatTime(timerRemaining);
  const progress = 1 - timerRemaining / timerDuration;
  timerProgress.style.strokeDashoffset = String(timerCircumference * progress);
}

function stopTimer() {
  window.clearInterval(timerInterval);
  timerInterval = null;
  timerToggle.textContent = "Bắt đầu";
  document.title = pageTitle;
}

function tickTimer() {
  timerRemaining = Math.max(0, Math.ceil((timerDeadline - Date.now()) / 1000));
  renderTimer();

  if (timerRemaining === 0) {
    stopTimer();
    timerStatus.textContent = timerMode === "focus"
      ? "Hoàn thành phiên tập trung! Hãy nghỉ ngắn trước khi bắt đầu phiên mới."
      : "Hết giờ nghỉ — bạn đã sẵn sàng quay lại học.";
  }
}

function resetTimer() {
  stopTimer();
  timerRemaining = timerDuration;
  renderTimer();
  timerStatus.textContent = timerMode === "focus"
    ? "Một phiên tập trung là 25 phút."
    : "Một phiên nghỉ ngắn là 5 phút.";
}

timerTabs.forEach(function (tab) {
  tab.addEventListener("click", function () {
    timerTabs.forEach(function (timerTab) {
      const isActive = timerTab === tab;
      timerTab.classList.toggle("is-active", isActive);
      timerTab.setAttribute("aria-pressed", String(isActive));
    });

    timerMode = tab.dataset.mode;
    timerDuration = Number(tab.dataset.minutes) * 60;
    timerModeLabel.textContent = timerMode === "focus" ? "Sẵn sàng tập trung" : "Thời gian nghỉ";
    focusTool.classList.toggle("is-break", timerMode === "break");
    resetTimer();
  });
});

timerToggle.addEventListener("click", function () {
  if (timerInterval !== null) {
    timerRemaining = Math.max(0, Math.ceil((timerDeadline - Date.now()) / 1000));
    renderTimer();
    stopTimer();
    timerStatus.textContent = "Đã tạm dừng. Tiếp tục khi bạn sẵn sàng.";
    return;
  }

  if (timerRemaining === 0) {
    resetTimer();
  }

  timerDeadline = Date.now() + timerRemaining * 1000;
  timerToggle.textContent = "Tạm dừng";
  timerStatus.textContent = timerMode === "focus" ? "Đang trong phiên tập trung." : "Đang nghỉ ngắn.";
  document.title = `${formatTime(timerRemaining)} · ${pageTitle}`;
  tickTimer();
  timerInterval = window.setInterval(tickTimer, 250);
});

timerReset.addEventListener("click", resetTimer);
renderTimer();

const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");
const taskList = document.getElementById("task-list");
const taskSummary = document.getElementById("task-summary");
const taskStatus = document.getElementById("task-status");
const taskProgressLabel = document.getElementById("task-progress-label");
const taskProgressTrack = document.querySelector(".task-progress-track");
const taskProgressBar = document.getElementById("task-progress-bar");
const clearCompletedButton = document.getElementById("clear-completed");
const taskFilterButtons = Array.from(document.querySelectorAll(".task-filter"));
const taskStorageKey = "kien-study-tasks";
let tasks = [];
let taskFilter = "all";

try {
  const savedTasks = localStorage.getItem(taskStorageKey);
  if (savedTasks) {
    const parsedTasks = JSON.parse(savedTasks);
    if (!Array.isArray(parsedTasks) || parsedTasks.some(function (task) {
      return typeof task.id !== "string"
        || typeof task.text !== "string"
        || typeof task.completed !== "boolean";
    })) {
      throw new TypeError("Invalid saved task list");
    }
    tasks = parsedTasks;
  }
} catch {
  taskStatus.textContent = "Không đọc được danh sách đã lưu; bạn có thể tạo danh sách mới.";
}

function saveTasks() {
  try {
    localStorage.setItem(taskStorageKey, JSON.stringify(tasks));
    return true;
  } catch {
    taskStatus.textContent = "Không thể lưu danh sách trong trình duyệt này.";
    return false;
  }
}

function renderTasks() {
  taskList.replaceChildren();

  const visibleTasks = tasks.filter(function (task) {
    return taskFilter === "all"
      || (taskFilter === "active" && !task.completed)
      || (taskFilter === "completed" && task.completed);
  });

  if (visibleTasks.length === 0) {
    const emptyState = document.createElement("li");
    emptyState.className = "task-empty";
    emptyState.textContent = tasks.length === 0
      ? "Chưa có việc nào — hãy thêm việc đầu tiên của bạn."
      : "Không có việc nào trong mục này.";
    taskList.appendChild(emptyState);
  }

  visibleTasks.forEach(function (task) {
    const item = document.createElement("li");
    item.className = "task-item";
    item.classList.toggle("is-complete", task.completed);

    const checkbox = document.createElement("input");
    checkbox.className = "task-checkbox";
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;
    checkbox.setAttribute("aria-label", `Đánh dấu "${task.text}" là ${task.completed ? "chưa hoàn thành" : "hoàn thành"}`);
    checkbox.addEventListener("change", function () {
      task.completed = checkbox.checked;
      saveTasks();
      renderTasks();
    });

    const text = document.createElement("span");
    text.className = "task-text";
    text.textContent = task.text;

    const deleteButton = document.createElement("button");
    deleteButton.className = "task-delete";
    deleteButton.type = "button";
    deleteButton.textContent = "×";
    deleteButton.setAttribute("aria-label", `Xóa việc: ${task.text}`);
    deleteButton.addEventListener("click", function () {
      tasks = tasks.filter(function (entry) {
        return entry.id !== task.id;
      });
      saveTasks();
      taskStatus.textContent = "Đã xóa công việc.";
      renderTasks();
    });

    item.append(checkbox, text, deleteButton);
    taskList.appendChild(item);
  });

  const completedCount = tasks.filter(function (task) {
    return task.completed;
  }).length;
  const remainingCount = tasks.length - completedCount;
  const progress = tasks.length === 0 ? 0 : Math.round(completedCount / tasks.length * 100);

  taskSummary.textContent = `${remainingCount} việc cần làm · ${completedCount} hoàn thành`;
  taskProgressLabel.textContent = `Tiến độ ${progress}%`;
  taskProgressBar.style.width = `${progress}%`;
  taskProgressTrack.setAttribute("aria-valuenow", String(progress));
  clearCompletedButton.disabled = completedCount === 0;
}

taskForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const text = taskInput.value.trim();
  if (!text || !taskForm.reportValidity()) {
    return;
  }

  if (tasks.length >= 50) {
    taskStatus.textContent = "Danh sách đã đạt giới hạn 50 việc.";
    return;
  }

  tasks.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    text: text,
    completed: false
  });

  taskFilter = "all";
  taskFilterButtons.forEach(function (button) {
    const isActive = button.dataset.taskFilter === taskFilter;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  saveTasks();
  taskStatus.textContent = "Đã thêm công việc.";
  taskForm.reset();
  taskInput.focus();
  renderTasks();
});

taskFilterButtons.forEach(function (button) {
  button.addEventListener("click", function () {
    taskFilter = button.dataset.taskFilter;
    taskFilterButtons.forEach(function (filterButton) {
      const isActive = filterButton === button;
      filterButton.classList.toggle("is-active", isActive);
      filterButton.setAttribute("aria-pressed", String(isActive));
    });
    renderTasks();
  });
});

clearCompletedButton.addEventListener("click", function () {
  const previousCount = tasks.length;
  tasks = tasks.filter(function (task) {
    return !task.completed;
  });
  if (tasks.length !== previousCount) {
    saveTasks();
    taskStatus.textContent = "Đã xóa các công việc hoàn thành.";
    renderTasks();
  }
});

renderTasks();

const quizQuestions = [
  {
    question: "Trong C++, chỉ số phần tử đầu tiên của một mảng thường là bao nhiêu?",
    options: ["0", "1", "-1", "Tùy kích thước mảng"],
    answer: 0,
    explanation: "Mảng trong C++ dùng chỉ số bắt đầu từ 0."
  },
  {
    question: "Từ khóa nào thường dùng để khai báo một giá trị nguyên trong C++?",
    options: ["string", "int", "bool", "char"],
    answer: 1,
    explanation: "int là kiểu dữ liệu số nguyên cơ bản."
  },
  {
    question: "Vòng lặp nào phù hợp khi biết trước số lần lặp?",
    options: ["if", "switch", "for", "return"],
    answer: 2,
    explanation: "for thường được dùng khi có số lần lặp xác định."
  },
  {
    question: "Toán tử == trong C++ dùng để làm gì?",
    options: ["Gán giá trị", "So sánh bằng", "Cộng hai số", "Kết thúc chương trình"],
    answer: 1,
    explanation: "== so sánh hai giá trị; dấu = đơn mới dùng để gán."
  },
  {
    question: "Một hàm có kiểu trả về void thường có ý nghĩa gì?",
    options: ["Trả về số nguyên", "Không trả về giá trị", "Chỉ chạy một lần", "Nhận mọi kiểu dữ liệu"],
    answer: 1,
    explanation: "void cho biết hàm không trả về một giá trị."
  }
];
const quizStepLabel = document.getElementById("quiz-step-label");
const quizScoreLabel = document.getElementById("quiz-score-label");
const quizProgressTrack = document.querySelector(".quiz-progress-track");
const quizProgressBar = document.getElementById("quiz-progress-bar");
const quizQuestion = document.getElementById("quiz-question");
const quizOptions = document.getElementById("quiz-options");
const quizFeedback = document.getElementById("quiz-feedback");
const quizNextButton = document.getElementById("quiz-next");
const quizRestartButton = document.getElementById("quiz-restart");
let quizIndex = 0;
let quizScore = 0;
let quizAnswered = false;

function renderQuizQuestion() {
  const currentQuestion = quizQuestions[quizIndex];
  quizAnswered = false;
  quizStepLabel.textContent = `Câu ${quizIndex + 1}/${quizQuestions.length}`;
  quizScoreLabel.textContent = `Điểm: ${quizScore}`;
  quizProgressTrack.setAttribute("aria-valuenow", String(quizIndex + 1));
  quizProgressBar.style.width = `${(quizIndex + 1) / quizQuestions.length * 100}%`;
  quizQuestion.textContent = currentQuestion.question;
  quizFeedback.textContent = "Chọn một đáp án để xem kết quả.";
  quizFeedback.classList.remove("is-correct", "is-wrong");
  quizOptions.replaceChildren();

  currentQuestion.options.forEach(function (option, optionIndex) {
    const button = document.createElement("button");
    button.className = "quiz-option";
    button.type = "button";
    button.textContent = option;
    button.addEventListener("click", function () {
      if (quizAnswered) {
        return;
      }

      quizAnswered = true;
      const isCorrect = optionIndex === currentQuestion.answer;
      if (isCorrect) {
        quizScore += 1;
      }

      Array.from(quizOptions.children).forEach(function (answerButton, answerIndex) {
        answerButton.disabled = true;
        if (answerIndex === currentQuestion.answer) {
          answerButton.classList.add("is-correct");
        } else if (answerIndex === optionIndex) {
          answerButton.classList.add("is-wrong");
        }
      });

      quizFeedback.textContent = `${isCorrect ? "Chính xác!" : "Chưa đúng."} ${currentQuestion.explanation}`;
      quizFeedback.classList.add(isCorrect ? "is-correct" : "is-wrong");
      quizScoreLabel.textContent = `Điểm: ${quizScore}`;
      quizNextButton.disabled = false;
    });
    quizOptions.appendChild(button);
  });

  quizNextButton.hidden = false;
  quizNextButton.disabled = true;
  quizRestartButton.hidden = true;
}

function renderQuizResult() {
  quizStepLabel.textContent = "Hoàn thành";
  quizScoreLabel.textContent = `Điểm: ${quizScore}/${quizQuestions.length}`;
  quizProgressTrack.setAttribute("aria-valuenow", String(quizQuestions.length));
  quizProgressBar.style.width = "100%";
  quizQuestion.textContent = "Bạn đã hoàn thành thử thách!";

  const result = document.createElement("div");
  result.className = "quiz-result";
  const score = document.createElement("strong");
  score.textContent = `${quizScore}/${quizQuestions.length} câu đúng`;
  const message = document.createElement("p");
  message.textContent = quizScore === quizQuestions.length
    ? "Tuyệt vời! Bạn đã nắm chắc các khái niệm cơ bản trong bộ câu hỏi này."
    : "Xem lại phần giải thích ở mỗi câu và thử lại để ghi nhớ tốt hơn.";
  result.append(score, message);
  quizOptions.replaceChildren(result);
  quizFeedback.textContent = "Bộ câu hỏi chỉ giúp ôn tập một số kiến thức nhập môn.";
  quizFeedback.classList.remove("is-correct", "is-wrong");
  quizNextButton.hidden = true;
  quizRestartButton.hidden = false;
}

quizNextButton.addEventListener("click", function () {
  if (!quizAnswered) {
    return;
  }

  quizIndex += 1;
  if (quizIndex < quizQuestions.length) {
    renderQuizQuestion();
  } else {
    renderQuizResult();
  }
});

quizRestartButton.addEventListener("click", function () {
  quizIndex = 0;
  quizScore = 0;
  renderQuizQuestion();
});

renderQuizQuestion();

const copyEmailButton = document.querySelector(".copy-email");
const copyStatus = document.getElementById("copy-status");

copyEmailButton.addEventListener("click", async function () {
  const email = copyEmailButton.dataset.email;

  if (!navigator.clipboard || !navigator.clipboard.writeText) {
    copyStatus.textContent = `Trình duyệt không hỗ trợ sao chép. Email: ${email}`;
    return;
  }

  try {
    await navigator.clipboard.writeText(email);
    copyStatus.textContent = "Đã sao chép email vào bộ nhớ tạm.";
  } catch {
    copyStatus.textContent = `Không thể sao chép tự động. Email của mình: ${email}`;
  }
});

const contactForm = document.getElementById("contact-form");
const contactMessage = document.getElementById("contact-message");
const messageCount = document.getElementById("message-count");
const formStatus = document.getElementById("form-status");

contactMessage.addEventListener("input", function () {
  messageCount.textContent = String(contactMessage.value.length);
});

contactForm.addEventListener("submit", function (event) {
  event.preventDefault();

  if (!contactForm.reportValidity()) {
    return;
  }

  const formData = new FormData(contactForm);
  const name = String(formData.get("name")).trim();
  const email = String(formData.get("email")).trim();
  const subject = String(formData.get("subject"));
  const message = String(formData.get("message")).trim();
  const body = [
    `Xin chào Kiên,`,
    ``,
    message,
    ``,
    `— ${name}`,
    `Email: ${email}`
  ].join("\n");
  const mailto = `mailto:trungkiendz2211@gmail.com?subject=${encodeURIComponent(`[Portfolio] ${subject}`)}&body=${encodeURIComponent(body)}`;

  formStatus.textContent = "Đang mở ứng dụng email để bạn gửi lời nhắn.";
  formStatus.classList.remove("is-error");
  formStatus.classList.add("is-success");
  window.location.href = mailto;
});

const revealElements = document.querySelectorAll(
  ".section-heading, .skills li, .card, .lab-card, .timeline-item, .table-responsive, .contact-panel"
);
const reducedMotionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");

if ("IntersectionObserver" in window && !reducedMotionPreference.matches) {
  document.body.classList.add("reveal-ready");

  const revealObserver = new IntersectionObserver(function (entries, observer) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  revealElements.forEach(function (element) {
    element.classList.add("reveal");
    revealObserver.observe(element);
  });
}
