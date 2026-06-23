(function () {
  "use strict";

  var DATA = window.QUIZ_DATA || [];
  var SET_SIZE = 25;
  var SET_SECONDS = 8 * 60;
  var PASS_PCT = 76;
  var LETTERS = ["A", "B", "C", "D", "E"];
  var STORE_KEY = "zh_progress_v1";
  var CIRC = 2 * Math.PI * 52; // ring circumference

  var SETS = [];
  for (var i = 0; i < DATA.length; i += SET_SIZE) SETS.push(DATA.slice(i, i + SET_SIZE));

  // ---- icons ----
  var ICON = {
    check: '<svg viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L19 7" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    cross: '<svg viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
    warn:  '<svg viewBox="0 0 24 24" fill="none"><path d="M12 4l9 16H3L12 4z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M12 10v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="12" cy="17.2" r="1.1" fill="currentColor"/></svg>',
    done:  '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" fill="#1f9d62"/><path d="M8 12l2.5 2.5L16 9" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    play:  '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#c9ccd5" stroke-width="1.8"/><path d="M10 8.5l5 3.5-5 3.5V8.5z" fill="#a7a7b1"/></svg>',
    half:  '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#f47a1f" stroke-width="1.8"/><path d="M12 3a9 9 0 0 1 0 18z" fill="#f47a1f" opacity=".25"/></svg>'
  };

  var $ = function (id) { return document.getElementById(id); };
  var views = { home: $("homeView"), quiz: $("quizView"), result: $("resultView") };

  // ---- persistence ----
  function loadProgress() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function saveProgress(p) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(p)); } catch (e) {}
  }
  var progress = loadProgress(); // { idx: {best, attempts, completed} }

  function setRing(circleEl, frac, color) {
    circleEl.style.strokeDashoffset = CIRC * (1 - Math.max(0, Math.min(1, frac)));
    if (color) circleEl.style.stroke = color;
  }
  $("overallFil").style.setProperty("--circ", CIRC);

  function needsImage(q) {
    var t = q.question.toLowerCase();
    if (q.image) return true;
    return /\bwhich cars?\b/.test(t) || /\bthis sign\b/.test(t) ||
           /\bthe sign (warns|indicates|means)\b/.test(t) || /\bat this sign\b/.test(t) ||
           /\bapproaching this sign\b/.test(t) || /\bthis road sign\b/.test(t) ||
           /\bthis traffic light\b/.test(t) || /\bseeing this sign\b/.test(t) ||
           /\bmeaning of this sign\b/.test(t);
  }

  function showView(name) {
    Object.keys(views).forEach(function (k) { views[k].hidden = (k !== name); });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ===================== DASHBOARD =====================
  function nextIncompleteSet() {
    for (var k = 0; k < SETS.length; k++) if (!(progress[k] && progress[k].completed)) return k;
    return 0;
  }

  function buildHome() {
    var completed = 0;
    for (var k = 0; k < SETS.length; k++) if (progress[k] && progress[k].completed) completed++;
    var pct = Math.round(completed / SETS.length * 100);
    var remain = SETS.length - completed;

    $("overallPct").textContent = pct + "%";
    setRing($("overallFil"), completed / SETS.length, "#f47a1f");
    $("setsDone").textContent = completed + " / " + SETS.length + " complete";

    var nxt = nextIncompleteSet();
    if (completed === 0) {
      $("heroTitle").textContent = "Ready for Test";
      $("heroSub").innerHTML = 'Begin your provisional prep. Work through <b>' + SETS.length + '</b> sets of 25 to reach 100% mastery.';
      $("continueLabel").textContent = "Start Studying";
    } else if (completed === SETS.length) {
      $("heroTitle").textContent = "All Sets Cleared";
      $("heroSub").innerHTML = 'You have completed every set. Revisit any module to sharpen your score.';
      $("continueLabel").textContent = "Practice Again";
    } else {
      $("heroTitle").textContent = "Ready for Test";
      $("heroSub").innerHTML = 'Your mastery of the Highway Code is accelerating. Complete <b>' + remain + '</b> more set' + (remain === 1 ? '' : 's') + ' to reach 100%.';
      $("continueLabel").textContent = "Continue Studying";
    }
    $("continueBtn").onclick = function () { startSet(nxt); };

    var grid = $("setGrid");
    grid.innerHTML = "";
    SETS.forEach(function (qs, idx) {
      var p = progress[idx] || null;
      var bestPct = p ? Math.round(p.best / qs.length * 100) : 0;
      var statusIcon = p && p.completed ? ICON.done : (p ? ICON.half : ICON.play);
      var statusTxt = p ? (p.completed ? "Cleared" : "In progress") : "Not started";
      var imgCount = qs.filter(function (q) { return q.image; }).length;

      var card = document.createElement("button");
      card.className = "set-card" + (p && p.completed ? " is-done" : "");
      card.innerHTML =
        '<div class="sc-top">' +
          '<span class="sc-set">Set ' + pad2(idx + 1) + '</span>' +
          '<span class="sc-status" aria-hidden="true">' + statusIcon + '</span>' +
        '</div>' +
        '<div class="sc-module">Module ' + pad2(idx + 1) + '</div>' +
        '<div class="sc-sub">25 questions · 8 min' + (imgCount ? ' · ' + imgCount + ' diagrams' : '') + '</div>' +
        '<div class="sc-track"><div class="sc-fill ' + (p && p.completed ? 'done' : '') + '" style="width:' + bestPct + '%"></div></div>' +
        '<div class="sc-meta"><span>' + statusTxt + '</span>' +
          (p ? '<span class="best">Best ' + p.best + '/' + qs.length + '</span>' : '<span>—</span>') + '</div>';
      card.addEventListener("click", function () { startSet(idx); });
      grid.appendChild(card);
    });
  }

  // ===================== QUIZ (one at a time) =====================
  var state = { setIndex: 0, questions: [], answers: {}, current: 0, remaining: SET_SECONDS, timerId: null, finished: false };

  function startSet(idx) {
    state.setIndex = idx;
    state.questions = SETS[idx];
    state.answers = {};
    state.current = 0;
    state.remaining = SET_SECONDS;
    state.finished = false;

    $("qTotal").textContent = state.questions.length;
    $("setPillNum").textContent = idx + 1;
    buildDots();
    renderCurrent();
    setNav(true);
    showView("quiz");
    startTimer();
  }

  function buildDots() {
    var wrap = $("dots");
    wrap.innerHTML = "";
    state.questions.forEach(function (q, i) {
      var d = document.createElement("span");
      d.className = "dot";
      d.addEventListener("click", function () { state.current = i; renderCurrent(); });
      wrap.appendChild(d);
    });
  }

  function renderCurrent() {
    var q = state.questions[state.current];
    var stage = $("questionStage");

    var figure = "";
    if (q.image) figure = '<div class="q-figure"><img src="' + q.image + '" alt="Question diagram" loading="lazy"></div>';
    else if (needsImage(q)) figure = '<div class="no-img">' + ICON.warn + ' Diagram not available — answer from the wording.</div>';

    var sel = state.answers[q.id];
    var opts = q.options.map(function (o, oi) {
      return '<li class="opt' + (oi === sel ? ' selected' : '') + '" data-o="' + oi + '">' +
               '<span class="letter">' + LETTERS[oi] + '</span>' +
               '<span class="otext">' + escapeHtml(o.text) + '</span>' +
               '<span class="tick">' + ICON.check + '</span>' +
             '</li>';
    }).join("");

    stage.innerHTML =
      '<article class="q-card">' +
        '<span class="q-tag">Highway Code · Set ' + (state.setIndex + 1) + '</span>' +
        '<p class="q-text">' + escapeHtml(q.question) + '</p>' +
        figure +
        '<ul class="options">' + opts + '</ul>' +
      '</article>';

    stage.querySelectorAll(".opt").forEach(function (el) {
      el.addEventListener("click", function () {
        if (state.finished) return;
        state.answers[q.id] = parseInt(el.getAttribute("data-o"), 10);
        stage.querySelectorAll(".opt").forEach(function (s) { s.classList.remove("selected"); });
        el.classList.add("selected");
        refreshChrome();
      });
    });
    refreshChrome();
  }

  function refreshChrome() {
    var cur = state.current, total = state.questions.length;
    $("qCurrent").textContent = cur + 1;
    $("qProgress").style.width = ((cur + 1) / total * 100) + "%";
    $("prevBtn").disabled = cur === 0;
    $("nextLabel").textContent = cur === total - 1 ? "Finish" : "Next";

    var dots = $("dots").children;
    for (var i = 0; i < dots.length; i++) {
      var d = dots[i];
      d.className = "dot" +
        (state.answers[state.questions[i].id] != null ? " answered" : "") +
        (i === cur ? " current" : "");
    }
  }

  $("prevBtn").addEventListener("click", function () {
    if (state.current > 0) { state.current--; renderCurrent(); }
  });
  $("nextBtn").addEventListener("click", function () {
    if (state.current < state.questions.length - 1) { state.current++; renderCurrent(); }
    else attemptFinish();
  });
  $("submitBtn").addEventListener("click", attemptFinish);

  function attemptFinish() {
    var n = Object.keys(state.answers).length, total = state.questions.length;
    if (n < total && !confirm("You've answered " + n + " of " + total + ". Finish and submit now?")) return;
    finishQuiz(false);
  }

  // ===================== TIMER =====================
  function startTimer() {
    renderTimer();
    state.timerId = setInterval(function () {
      state.remaining--;
      renderTimer();
      if (state.remaining <= 0) { clearInterval(state.timerId); finishQuiz(true); }
    }, 1000);
  }
  function renderTimer() {
    var m = Math.floor(state.remaining / 60), s = state.remaining % 60;
    $("timerText").textContent = pad2(m) + ":" + pad2(s);
    var el = $("timerText");
    el.classList.toggle("warn", state.remaining <= 120 && state.remaining > 30);
    el.classList.toggle("danger", state.remaining <= 30);
  }
  function stopTimer() { if (state.timerId) { clearInterval(state.timerId); state.timerId = null; } }

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
    var passed = pct >= PASS_PCT;

    // persist
    var prev = progress[state.setIndex] || { best: 0, attempts: 0 };
    progress[state.setIndex] = {
      best: Math.max(prev.best || 0, correct),
      attempts: (prev.attempts || 0) + 1,
      completed: true
    };
    saveProgress(progress);

    // ring + numbers
    setRing($("scoreFil"), correct / total, passed ? "#1f9d62" : pct >= 50 ? "#f47a1f" : "#e23b2e");
    $("scoreNum").textContent = correct;
    $("scoreOf").textContent = "/" + total;

    var head = $("resultHeadline");
    head.textContent = passed ? "Test Passed" : "Test Incomplete";
    head.className = "display " + (passed ? "pass" : "fail");
    $("resultMsg").textContent = passed
      ? "System analysis complete. You have met the safety threshold for the Zimbabwe Highway Code."
      : (byTimeout
          ? "Time expired. You scored " + correct + " of " + total + " — review the breakdown and retry the set."
          : "You scored " + correct + " of " + total + ". Reach " + PASS_PCT + "% to clear this module.");

    buildBreakdown(correct);
    buildReview();
    $("reviewList").hidden = true;
    $("reviewLabel").textContent = "Review Mistakes";

    // wire next-set
    var nextIdx = (state.setIndex + 1) % SETS.length;
    $("nextSetBtn").onclick = function () { startSet(nextIdx); };

    setNav(true);
    showView("result");
  }

  function buildBreakdown() {
    var wrap = $("breakCells");
    wrap.innerHTML = "";
    state.questions.forEach(function (q) {
      var sel = state.answers[q.id];
      var cls = sel == null ? "" : (q.options[sel] && q.options[sel].correct ? "correct" : "wrong");
      var cell = document.createElement("span");
      cell.className = "cell " + cls;
      cell.title = "Q" + 1; // tooltip set below
      wrap.appendChild(cell);
    });
    var cells = wrap.children;
    state.questions.forEach(function (q, i) {
      var sel = state.answers[q.id];
      cells[i].title = "Q" + (i + 1) + ": " + (sel == null ? "Skipped" : (q.options[sel] && q.options[sel].correct ? "Correct" : "Incorrect"));
    });
  }

  function buildReview() {
    var wrap = $("reviewList");
    wrap.innerHTML = '<h3 class="review-head">Answer Review — Set ' + (state.setIndex + 1) + '</h3>';
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
        '<span>' + escapeHtml(q.question) + tag + '</span></p>' + fig +
        '<ul class="r-opts">' + opts + '</ul>';
      wrap.appendChild(card);
    });
  }

  // ===================== NAV =====================
  function setNav(inQuiz) {
    $("setPill").hidden = !inQuiz;
    $("quitBtn").hidden = !(inQuiz && !state.finished);
    $("homeBtn").hidden = !inQuiz;
  }
  function goHome() {
    stopTimer();
    state.finished = true;
    setNav(false);
    buildHome();
    showView("home");
  }

  // ===================== HELPERS =====================
  function pad2(n) { return (n < 10 ? "0" : "") + n; }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // ===================== WIRING =====================
  $("reviewBtn").addEventListener("click", function () {
    var rl = $("reviewList");
    rl.hidden = !rl.hidden;
    $("reviewLabel").textContent = rl.hidden ? "Review Mistakes" : "Hide Review";
    if (!rl.hidden) rl.scrollIntoView({ behavior: "smooth" });
  });
  $("retryBtn").addEventListener("click", function () { startSet(state.setIndex); });
  $("backHomeBtn").addEventListener("click", goHome);
  $("homeBtn").addEventListener("click", goHome);
  $("brandHome").addEventListener("click", goHome);
  $("quitBtn").addEventListener("click", function () {
    if (confirm("Quit this set? Your progress for this attempt will be lost.")) goHome();
  });

  // ===================== INIT =====================
  buildHome();
  setNav(false);
  showView("home");
})();
