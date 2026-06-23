(function () {
  "use strict";

  var DATA = window.QUIZ_DATA || [];
  var SET_SIZE = 25;
  var SET_SECONDS = 8 * 60; // 8 minutes per set
  var LETTERS = ["A", "B", "C", "D", "E"];

  // ---- inline SVG icons (no emojis) ----
  var ICON = {
    check: '<svg viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L19 7" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    cross: '<svg viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
    warn:  '<svg viewBox="0 0 24 24" fill="none"><path d="M12 4l9 16H3L12 4z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M12 10v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="12" cy="17.2" r="1.1" fill="currentColor"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.8"/><path d="M12 7.5V12l3 2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    go:    '<svg viewBox="0 0 24 24" fill="none"><path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };
  // small road-sign glyphs to decorate set cards
  var SET_SIGNS = [
    '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="13" fill="#fff" stroke="#e23b2e" stroke-width="3.4"/><rect x="9" y="14" width="14" height="4" rx="2" fill="#e23b2e"/></svg>',
    '<svg viewBox="0 0 32 32"><path d="M16 3l11 19a2 2 0 0 1-1.7 3H6.7A2 2 0 0 1 5 22L16 3z" fill="#fff" stroke="#f47a1f" stroke-width="3"/><rect x="14.3" y="11" width="3.4" height="8" rx="1.7" fill="#2a211c"/><circle cx="16" cy="22" r="1.7" fill="#2a211c"/></svg>',
    '<svg viewBox="0 0 32 32"><path d="M16 3l13 6v6c0 7-5 12-13 14C8 27 3 22 3 15V9l13-6z" fill="#fff" stroke="#e23b2e" stroke-width="3"/><path d="M11 16l3.4 3.4L21 12" stroke="#1f9d62" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="13" fill="#fbbf24" stroke="#e69b14" stroke-width="2.4"/><path d="M16 9v7l5 3" stroke="#2a211c" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    '<svg viewBox="0 0 32 32"><rect x="8" y="3" width="16" height="26" rx="5" fill="#2a211c"/><circle cx="16" cy="9.5" r="3.6" fill="#e23b2e"/><circle cx="16" cy="16" r="3.6" fill="#fbbf24"/><circle cx="16" cy="22.5" r="3.6" fill="#1f9d62"/></svg>'
  ];

  // group questions into sets of 25
  var SETS = [];
  for (var i = 0; i < DATA.length; i += SET_SIZE) {
    SETS.push(DATA.slice(i, i + SET_SIZE));
  }

  // ---- runtime state ----
  var state = {
    setIndex: 0,
    questions: [],
    answers: {},      // questionId -> selected option index
    remaining: SET_SECONDS,
    timerId: null,
    finished: false
  };

  // ---- element refs ----
  var $ = function (id) { return document.getElementById(id); };
  var views = { home: $("homeView"), quiz: $("quizView"), result: $("resultView") };

  // image-dependent question detector (for "diagram unavailable" note)
  function needsImage(q) {
    var t = q.question.toLowerCase();
    if (q.image) return true;
    return /\bwhich cars?\b/.test(t) ||
           /\bthis sign\b/.test(t) ||
           /\bthe sign (warns|indicates|means)\b/.test(t) ||
           /\bat this sign\b/.test(t) ||
           /\bapproaching this sign\b/.test(t) ||
           /\bthis road sign\b/.test(t) ||
           /\bthis traffic light\b/.test(t) ||
           /\bseeing this sign\b/.test(t) ||
           /\bmeaning of this sign\b/.test(t);
  }

  function showView(name) {
    Object.keys(views).forEach(function (k) { views[k].hidden = (k !== name); });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ===================== HOME =====================
  function buildHome() {
    var grid = $("setGrid");
    grid.innerHTML = "";
    SETS.forEach(function (qs, idx) {
      var imgCount = qs.filter(function (q) { return q.image; }).length;
      var card = document.createElement("button");
      card.className = "set-card";
      card.innerHTML =
        '<div class="set-top">' +
          '<span class="set-no-badge">' + (idx + 1) + '</span>' +
          '<span class="set-sign" aria-hidden="true">' + SET_SIGNS[idx % SET_SIGNS.length] + '</span>' +
        '</div>' +
        '<div class="set-title">Practice Test ' + (idx + 1) + '</div>' +
        '<div class="set-meta">' + qs.length + ' questions · 8 min' +
        (imgCount ? ' · ' + imgCount + ' diagrams' : '') + '</div>' +
        '<span class="go">Start ' + ICON.go + '</span>';
      card.addEventListener("click", function () { startSet(idx); });
      grid.appendChild(card);
    });
  }

  // ===================== QUIZ =====================
  function startSet(idx) {
    state.setIndex = idx;
    state.questions = SETS[idx];
    state.answers = {};
    state.remaining = SET_SECONDS;
    state.finished = false;

    $("quizTitle").textContent = "Set " + (idx + 1);
    $("totalCount").textContent = state.questions.length;
    $("answeredCount").textContent = "0";
    $("progressFill").style.width = "0%";

    renderQuestions();
    setNav(true);
    showView("quiz");
    startTimer();
  }

  function renderQuestions() {
    var list = $("questionList");
    list.innerHTML = "";
    state.questions.forEach(function (q, qi) {
      var card = document.createElement("article");
      card.className = "q-card";
      card.id = "q-" + q.id;

      var figure = "";
      if (q.image) {
        figure = '<div class="q-figure"><img src="' + q.image + '" alt="Question diagram" loading="lazy"></div>';
      } else if (needsImage(q)) {
        figure = '<div class="no-img">' + ICON.warn + ' Diagram not available — answer from the wording.</div>';
      }

      var opts = q.options.map(function (o, oi) {
        return '<li class="opt" data-q="' + q.id + '" data-o="' + oi + '">' +
                 '<span class="mark">' + ICON.check + '</span>' +
                 '<span class="letter">' + LETTERS[oi] + '</span>' +
                 '<span class="otext">' + escapeHtml(o.text) + '</span>' +
               '</li>';
      }).join("");

      card.innerHTML =
        '<div class="q-top">' +
          '<div class="q-num">' + (qi + 1) + '</div>' +
          '<div class="q-body">' +
            '<p class="q-text">' + escapeHtml(q.question) + '</p>' +
            figure +
            '<ul class="options">' + opts + '</ul>' +
          '</div>' +
        '</div>';
      list.appendChild(card);
    });

    list.querySelectorAll(".opt").forEach(function (el) {
      el.addEventListener("click", function () {
        if (state.finished) return;
        var qid = el.getAttribute("data-q");
        var oi = parseInt(el.getAttribute("data-o"), 10);
        selectOption(qid, oi, el);
      });
    });
  }

  function selectOption(qid, oi, el) {
    state.answers[qid] = oi;
    var siblings = el.parentNode.querySelectorAll(".opt");
    siblings.forEach(function (s) { s.classList.remove("selected"); });
    el.classList.add("selected");
    updateProgress();
  }

  function updateProgress() {
    var n = Object.keys(state.answers).length;
    var total = state.questions.length;
    $("answeredCount").textContent = n;
    $("progressFill").style.width = (n / total * 100) + "%";
  }

  // ===================== TIMER =====================
  function startTimer() {
    renderTimer();
    state.timerId = setInterval(function () {
      state.remaining--;
      renderTimer();
      if (state.remaining <= 0) {
        clearInterval(state.timerId);
        finishQuiz(true);
      }
    }, 1000);
  }

  function renderTimer() {
    var m = Math.floor(state.remaining / 60);
    var s = state.remaining % 60;
    var txt = pad(m) + ":" + pad(s);
    $("timerText").textContent = txt;
    var pill = $("timerPill");
    pill.classList.toggle("warn", state.remaining <= 120 && state.remaining > 30);
    pill.classList.toggle("danger", state.remaining <= 30);
  }

  function stopTimer() {
    if (state.timerId) { clearInterval(state.timerId); state.timerId = null; }
  }

  // ===================== FINISH / SCORE =====================
  function finishQuiz(byTimeout) {
    if (state.finished) return;
    state.finished = true;
    stopTimer();

    var correct = 0;
    state.questions.forEach(function (q) {
      var sel = state.answers[q.id];
      if (sel != null && q.options[sel] && q.options[sel].correct) correct++;
    });
    var total = state.questions.length;
    var pct = Math.round(correct / total * 100);

    // ring
    var circ = 2 * Math.PI * 52;
    $("ringFg").style.strokeDashoffset = circ * (1 - correct / total);
    $("ringFg").style.stroke = pct >= 76 ? "#1ea672" : pct >= 50 ? "#2f7bff" : "#e0473b";
    $("scorePct").textContent = pct + "%";
    $("scoreFrac").textContent = correct + " / " + total;

    var passed = pct >= 76; // common VID pass mark ~25/33; here flagged at 76%
    $("resultHeadline").textContent = passed ? "Great work — that's a pass!" : "Keep practising";
    $("resultMsg").textContent = passed
      ? "You answered " + correct + " of " + total + " correctly. Review anything you missed below."
      : "You scored " + correct + " of " + total + ". Review the answers and try again.";

    var used = SET_SECONDS - Math.max(0, state.remaining);
    $("timeUsedMsg").innerHTML = ICON.clock + "<span>" + (byTimeout
      ? "Time expired — the quiz was stopped automatically."
      : "Completed in " + pad(Math.floor(used / 60)) + ":" + pad(used % 60) + " of 08:00.") + "</span>";

    buildReview();
    $("reviewList").hidden = true;
    setNav(true);
    showView("result");
  }

  function buildReview() {
    var wrap = $("reviewList");
    wrap.innerHTML = '<h3 class="review-head">Answer review — Set ' + (state.setIndex + 1) + '</h3>';
    state.questions.forEach(function (q, qi) {
      var sel = state.answers[q.id];
      var correctIdx = q.options.findIndex(function (o) { return o.correct; });
      var status = sel == null ? "skipped" : (sel === correctIdx ? "correct" : "wrong");

      var fig = q.image ? '<div class="r-img"><img src="' + q.image + '" alt="diagram" loading="lazy"></div>' : "";

      var opts = q.options.map(function (o, oi) {
        var cls = "r-opt", ic = "";
        if (oi === correctIdx) { cls += " is-correct"; ic = ICON.check; }
        if (oi === sel && oi !== correctIdx) { cls += " is-yours-wrong"; ic = ICON.cross; }
        var you = (oi === sel) ? ' <em style="opacity:.7">(your answer)</em>' : "";
        return '<li class="' + cls + '"><span class="ic">' + ic + '</span>' +
               '<span>' + LETTERS[oi] + '. ' + escapeHtml(o.text) + you + '</span></li>';
      }).join("");

      var tag = '<span class="r-tag ' + status + '">' +
        (status === "correct" ? "Correct" : status === "wrong" ? "Incorrect" : "Skipped") + '</span>';

      var card = document.createElement("div");
      card.className = "r-card " + status;
      card.innerHTML =
        '<p class="r-q"><span class="rn">' + (qi + 1) + '.</span>' +
        '<span>' + escapeHtml(q.question) + tag + '</span></p>' +
        fig +
        '<ul class="r-opts">' + opts + '</ul>';
      wrap.appendChild(card);
    });
  }

  // ===================== NAV / CHROME =====================
  function setNav(inQuiz) {
    $("setPill").hidden = !inQuiz;
    $("timerPill").hidden = !(inQuiz && !state.finished);
    $("quitBtn").hidden = !(inQuiz && !state.finished);
    $("homeBtn").hidden = !inQuiz;
    $("setPillNum").textContent = state.setIndex + 1;
  }

  function goHome() {
    stopTimer();
    state.finished = true;
    setNav(false);
    buildHome();
    showView("home");
  }

  // ===================== HELPERS =====================
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // ===================== WIRING =====================
  var startFirst = $("startFirstBtn");
  if (startFirst) startFirst.addEventListener("click", function () { startSet(0); });
  $("submitBtn").addEventListener("click", function () {
    var n = Object.keys(state.answers).length, total = state.questions.length;
    if (n < total && !confirm("You've answered " + n + " of " + total + ". Submit anyway?")) return;
    finishQuiz(false);
  });
  $("reviewBtn").addEventListener("click", function () {
    var rl = $("reviewList");
    rl.hidden = !rl.hidden;
    $("reviewBtn").textContent = rl.hidden ? "Review Answers" : "Hide Review";
    if (!rl.hidden) rl.scrollIntoView({ behavior: "smooth" });
  });
  $("retryBtn").addEventListener("click", function () { startSet(state.setIndex); });
  $("backHomeBtn").addEventListener("click", goHome);
  $("homeBtn").addEventListener("click", goHome);
  $("brandHome").addEventListener("click", goHome);
  $("quitBtn").addEventListener("click", function () {
    if (confirm("Quit this set? Your progress will be lost.")) goHome();
  });

  // ===================== INIT =====================
  buildHome();
  setNav(false);
  showView("home");
})();
