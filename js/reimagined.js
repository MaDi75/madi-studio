const state = {
  settings: null,
  questions: [],
  answers: [],
  index: 0,
  score: 0,
  startedAt: 0,
  timer: null,
  countdownTimer: null,
  advanceTimer: null,
  busy: false,
  aborted: false,
  roundId: 0,
  sound: localStorage.getItem('madi-sound') !== 'off',
  language: localStorage.getItem('madi-language') || 'ru'
};

const $ = (selector) => document.querySelector(selector);
const views = {
  setup: $('#setupView'),
  countdown: $('#countdownView'),
  practice: $('#practiceView'),
  result: $('#resultView')
};
const ranges = {
  very_easy: [1, 10],
  easy: [11, 50],
  medium: [51, 100],
  hard: [101, 1000],
  very_hard: [1001, 10000]
};
const symbols = { addition: '+', subtraction: '-', multiplication: 'x', division: '/' };
const labels = {
  en: {
    eyebrow: 'A small daily practice',
    titleLead: 'Make numbers',
    titleEm: 'feel natural.',
    intro: 'Short, focused rounds for building arithmetic confidence. Choose a lane and start where you are.',
    sessions: 'sessions',
    best: 'best score',
    accuracy: 'accuracy',
    build: 'Build your round',
    about: 'about 2 min',
    name: 'Your name',
    namePlaceholder: 'What should we call you?',
    mode: 'Answer mode',
    operation: 'Practice lane',
    practice: 'Practice',
    match: 'Match answers',
    quiz: 'Quiz',
    addition: 'Addition',
    subtraction: 'Subtraction',
    multiplication: 'Multiply',
    division: 'Divide',
    level: 'Level',
    questions: 'Questions',
    negative: 'Subtract a point for wrong answers',
    start: 'Start a round',
    hint: 'Press Enter to submit each answer.',
    ready: 'Get ready',
    clear: 'Clear desk. Clear mind.',
    focused: 'Focused round',
    solve: 'Solve this',
    check: 'Check',
    score: 'Score',
    time: 'Time',
    end: 'End round',
    complete: 'Round complete',
    nice: 'Nice work,',
    points: 'points',
    message: 'A little practice goes a long way.',
    accuracyLabel: 'Accuracy',
    correct: 'Correct',
    again: 'Play again',
    setup: 'Change setup',
    correctFeedback: 'Correct. Keep the rhythm.',
    wrongFeedback: 'Not quite. The answer was',
    soundOn: 'Sound on',
    soundOff: 'Sound off',
    streakDays: 'day streak',
    friend: 'friend',
    footerLeft: 'MADI STUDIO / OPEN PRACTICE',
    footerRight: 'Built for calm progress.',
    matchHint: 'Tap the result that matches the example.',
    quizHint: 'Choose one of the four options.'
  },
  ru: {
    eyebrow: 'Небольшая ежедневная практика',
    titleLead: 'Пусть числа',
    titleEm: 'станут привычными.',
    intro: 'Короткие сосредоточенные раунды для уверенности в арифметике. Выбери направление и начни с удобного уровня.',
    sessions: 'раундов',
    best: 'лучший результат',
    accuracy: 'точность',
    build: 'Собери свой раунд',
    about: 'около 2 минут',
    name: 'Твоё имя',
    namePlaceholder: 'Как к тебе обращаться?',
    mode: 'Формат ответа',
    operation: 'Направление',
    practice: 'Практика',
    match: 'Соедини ответы',
    quiz: 'Викторина',
    addition: 'Сложение',
    subtraction: 'Вычитание',
    multiplication: 'Умножение',
    division: 'Деление',
    level: 'Уровень',
    questions: 'Вопросов',
    negative: 'Вычитать балл за ошибку',
    start: 'Начать раунд',
    hint: 'Нажми Enter, чтобы ответить.',
    ready: 'Приготовься',
    clear: 'Освободи стол. Освободи мысли.',
    focused: 'Сосредоточенный раунд',
    solve: 'Реши пример',
    check: 'Проверить',
    score: 'Баллы',
    time: 'Время',
    end: 'Завершить',
    complete: 'Раунд завершён',
    nice: 'Отличная работа,',
    points: 'баллов',
    message: 'Небольшая практика ведёт к большому прогрессу.',
    accuracyLabel: 'Точность',
    correct: 'Верно',
    again: 'Ещё раунд',
    setup: 'Изменить настройки',
    correctFeedback: 'Верно. Продолжай в том же ритме.',
    wrongFeedback: 'Почти. Правильный ответ:',
    soundOn: 'Звук вкл',
    soundOff: 'Звук выкл',
    streakDays: 'дней подряд',
    friend: 'друг',
    footerLeft: 'MADI STUDIO / ОТКРЫТАЯ ПРАКТИКА',
    footerRight: 'Сделано для спокойного прогресса.',
    matchHint: 'Нажми результат, который подходит к примеру.',
    quizHint: 'Выбери один из четырёх вариантов.'
  }
};

const audio = {
  click: new Audio('assets/audio/click.mp3'),
  start: new Audio('assets/audio/start.mp3'),
  finish: new Audio('assets/audio/final_question.mp3'),
  bg: new Audio('assets/audio/cute-music.mp3')
};
audio.bg.loop = true;
audio.bg.volume = 0.18;
audio.start.volume = 0.45;
audio.finish.volume = 0.45;
audio.click.volume = 0.5;

function text(key) {
  return labels[state.language][key];
}

function playSound(name) {
  if (!state.sound || !audio[name]) return;
  const node = audio[name];
  node.currentTime = 0;
  node.play().catch(() => {});
}

function syncBackgroundMusic() {
  if (state.sound && !views.setup.hidden) {
    audio.bg.play().catch(() => {});
  } else if (!state.sound) {
    audio.bg.pause();
  }
}

function switchView(name) {
  Object.entries(views).forEach(([key, view]) => {
    view.hidden = key !== name;
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (name === 'setup') syncBackgroundMusic();
  else audio.bg.pause();
}

function randomInt(min, max) {
  const low = Math.min(min, max);
  const high = Math.max(min, max);
  return Math.floor(Math.random() * (high - low + 1)) + low;
}

function formatTime(seconds) {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function historyList() {
  return JSON.parse(localStorage.getItem('madi-history') || '[]');
}

function recommendedCount() {
  return Math.min(6 + historyList().length, 12);
}

function dayStreak(history) {
  if (!history.length) return 0;
  const uniqueDays = [...new Set(history.map((item) => {
    const date = new Date(item.date);
    return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  }))].sort((a, b) => b - a);

  const today = new Date();
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const dayMs = 24 * 60 * 60 * 1000;
  let expected = todayUtc;
  if (uniqueDays[0] === todayUtc - dayMs) expected = todayUtc - dayMs;
  if (uniqueDays[0] !== expected) return 0;

  let streak = 0;
  for (const day of uniqueDays) {
    if (day === expected) {
      streak += 1;
      expected -= dayMs;
    } else if (day < expected) {
      break;
    }
  }
  return streak;
}

function applyLanguage() {
  const t = labels[state.language];
  document.documentElement.lang = state.language;
  document.body.classList.toggle('language-ru', state.language === 'ru');
  $('#languageToggle').textContent = state.language === 'ru' ? 'EN' : 'RU';
  $('#introEyebrow').textContent = t.eyebrow;
  $('#titleLead').textContent = t.titleLead;
  $('#titleEm').textContent = t.titleEm;
  $('#introText').textContent = t.intro;
  $('#sessionsLabel').textContent = t.sessions;
  $('#bestScoreLabel').textContent = t.best;
  $('#accuracyLabel').textContent = t.accuracy;
  $('#buildTitle').textContent = t.build;
  $('#panelNote').textContent = t.about;
  $('#nameLabel').textContent = t.name;
  $('#playerName').placeholder = t.namePlaceholder;
  $('#modeLegend').textContent = t.mode;
  $('#operationLegend').textContent = t.operation;
  $('#modePractice').textContent = t.practice;
  $('#modeMatch').textContent = t.match;
  $('#modeQuiz').textContent = t.quiz;
  $('#additionLabel').textContent = t.addition;
  $('#subtractionLabel').textContent = t.subtraction;
  $('#multiplicationLabel').textContent = t.multiplication;
  $('#divisionLabel').textContent = t.division;
  $('#levelLabel').textContent = t.level;
  $('#questionsLabel').textContent = t.questions;
  $('#negativeLabel').textContent = t.negative;
  $('#startLabel').textContent = t.start;
  $('#formHint').innerHTML = `${t.hint.replace('Enter', '<kbd>Enter</kbd>')}`;
  $('#countdownEyebrow').textContent = t.ready;
  $('#countdownText').textContent = t.clear;
  $('#practiceTitle').textContent = t.focused;
  $('#problemLabel').textContent = t.solve;
  $('#checkLabel').textContent = t.check;
  $('#scoreLabel').textContent = t.score;
  $('#timeLabel').textContent = t.time;
  $('#liveAccuracyLabel').textContent = t.accuracyLabel;
  $('#quitRound').textContent = t.end;
  $('#resultEyebrow').textContent = t.complete;
  $('#resultNice').textContent = `${t.nice} `;
  $('#pointsLabel').textContent = t.points;
  $('#resultMessage').textContent = t.message;
  $('#resultAccuracyLabel').textContent = t.accuracyLabel;
  $('#resultTimeLabel').textContent = t.time;
  $('#resultCorrectLabel').textContent = t.correct;
  $('#againLabel').textContent = t.again;
  $('#newRound').textContent = t.setup;
  $('#soundToggle').textContent = state.sound ? t.soundOn : t.soundOff;
  $('#soundToggle').setAttribute('aria-label', state.sound ? t.soundOn : t.soundOff);
  $('#footerLeft').textContent = t.footerLeft;
  $('#footerRight').textContent = t.footerRight;
  const levels = state.language === 'ru'
    ? ['Разминка', 'Спокойный', 'Сосредоточенный', 'На вырост', 'Вызов']
    : ['Warm up', 'Steady', 'Focused', 'Stretch', 'Challenge'];
  [...$('#difficulty').options].forEach((option, index) => {
    option.textContent = levels[index];
  });
  const streak = dayStreak(historyList());
  $('#streakLabel').textContent = `${streak} ${t.streakDays}`;
}

function makeQuestion(operation, difficulty) {
  const [min, max] = ranges[difficulty];
  let a = randomInt(min, max);
  let b = randomInt(min, max);

  if (operation === 'subtraction' && b > a) [a, b] = [b, a];

  if (operation === 'division') {
    const maxDivisor = Math.max(2, Math.min(max, Math.floor(max / 2) || 2));
    b = randomInt(2, maxDivisor);
    const maxQuotient = Math.max(1, Math.floor(max / b));
    const minQuotient = Math.max(1, Math.floor(min / b) || 1);
    a = b * randomInt(minQuotient, maxQuotient);
  }

  const answer = operation === 'addition'
    ? a + b
    : operation === 'subtraction'
      ? a - b
      : operation === 'multiplication'
        ? a * b
        : a / b;

  return { a, b, operation, answer, text: `${a} ${symbols[operation]} ${b}` };
}

function createQuestions() {
  state.questions = [];
  let attempts = 0;
  const target = state.settings.count;
  while (state.questions.length < target && attempts < 800) {
    attempts += 1;
    const question = makeQuestion(state.settings.operation, state.settings.difficulty);
    if (!state.questions.some((item) => item.text === question.text)) {
      state.questions.push(question);
    }
  }
  while (state.questions.length < target) {
    state.questions.push(makeQuestion(state.settings.operation, state.settings.difficulty));
  }
}

function optionsFor(question) {
  const options = new Set([question.answer]);
  let guard = 0;
  while (options.size < 4 && guard < 40) {
    guard += 1;
    const spread = Math.max(3, Math.round(Math.abs(question.answer) * 0.2) || 3);
    options.add(Math.max(0, question.answer + randomInt(-spread, spread)));
  }
  let filler = 1;
  while (options.size < 4) {
    options.add(question.answer + filler);
    filler += 1;
  }
  return [...options].sort(() => Math.random() - 0.5);
}

function clearTimers() {
  clearInterval(state.timer);
  clearInterval(state.countdownTimer);
  clearTimeout(state.advanceTimer);
  state.timer = null;
  state.countdownTimer = null;
  state.advanceTimer = null;
}

function abortRound() {
  state.aborted = true;
  state.busy = false;
  state.roundId += 1;
  clearTimers();
  audio.bg.pause();
}

function startTimer() {
  state.startedAt = Date.now();
  $('#timer').textContent = '00:00';
  state.timer = setInterval(() => {
    $('#timer').textContent = formatTime(Math.floor((Date.now() - state.startedAt) / 1000));
  }, 1000);
}

function beginRound() {
  if (state.aborted) return;
  createQuestions();
  state.answers = [];
  state.index = 0;
  state.score = 0;
  state.busy = false;
  $('#feedback').textContent = '';
  $('#feedback').className = 'feedback';
  $('#practiceView').dataset.mode = state.settings.mode;
  switchView('practice');
  startTimer();
  renderQuestion();
}

function startCountdown() {
  abortRound();
  state.aborted = false;
  const roundId = state.roundId;
  switchView('countdown');
  playSound('start');
  let count = 3;
  $('#countdownNumber').textContent = count;
  state.countdownTimer = setInterval(() => {
    if (state.aborted || roundId !== state.roundId) {
      clearInterval(state.countdownTimer);
      return;
    }
    count -= 1;
    if (count === 0) {
      clearInterval(state.countdownTimer);
      state.countdownTimer = null;
      beginRound();
    } else {
      $('#countdownNumber').textContent = count;
    }
  }, 700);
}

function renderQuestion() {
  const question = state.questions[state.index];
  $('#operationTitle').textContent = text(question.operation);
  $('#problemText').textContent = question.text;
  $('#questionProgress').textContent = `${state.index + 1} / ${state.questions.length}`;
  $('#progressBar').style.width = `${((state.index + 1) / state.questions.length) * 100}%`;
  $('#liveScore').textContent = state.score;
  $('#liveAccuracy').textContent = state.answers.length
    ? `${Math.round(state.answers.filter((answer) => answer.correct).length / state.answers.length * 100)}%`
    : '--';

  const mode = state.settings.mode;
  const options = $('#answerOptions');
  options.innerHTML = '';
  options.className = `answer-options mode-${mode}`;

  if (mode === 'quiz' || mode === 'match') {
    const letters = ['A', 'B', 'C', 'D'];
    optionsFor(question).forEach((option, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = mode === 'quiz' ? 'quiz-option' : 'match-option';
      if (mode === 'quiz') {
        button.innerHTML = `<span class="option-letter">${letters[index]}</span><span class="option-value">${option}</span>`;
      } else {
        button.innerHTML = `<span class="option-value">${option}</span>`;
      }
      button.addEventListener('click', () => submitAnswer(option));
      options.appendChild(button);
    });
    $('#problemLabel').textContent = mode === 'match' ? text('matchHint') : text('quizHint');
  } else {
    $('#problemLabel').textContent = text('solve');
  }

  $('#answerInput').value = '';
  $('#answerInput').disabled = false;
  $('#submitAnswer').disabled = false;
  state.busy = false;
  if (mode === 'practice') $('#answerInput').focus();
}

function submitAnswer(selectedValue = null) {
  if (state.busy || state.aborted) return;
  const question = state.questions[state.index];
  if (!question) return;

  const raw = selectedValue === null ? $('#answerInput').value.trim() : String(selectedValue);
  if (raw === '') return;
  const value = Number(raw);
  if (!Number.isFinite(value)) return;

  state.busy = true;
  $('#answerInput').disabled = true;
  $('#submitAnswer').disabled = true;
  $('#answerOptions').querySelectorAll('button').forEach((button) => {
    button.disabled = true;
  });

  const correct = value === question.answer;
  state.answers.push({ question, value, correct });
  state.score += correct ? 1 : state.settings.negative ? -1 : 0;
  $('#feedback').textContent = correct ? text('correctFeedback') : `${text('wrongFeedback')} ${question.answer}.`;
  $('#feedback').className = `feedback ${correct ? 'good' : 'bad'}`;
  $('#liveScore').textContent = state.score;
  playSound('click');

  const roundId = state.roundId;
  state.advanceTimer = setTimeout(() => {
    if (state.aborted || roundId !== state.roundId) return;
    state.index += 1;
    if (state.index >= state.questions.length) finishRound();
    else renderQuestion();
  }, 550);
}

function finishRound() {
  if (state.aborted) return;
  clearTimers();
  playSound('finish');
  const elapsed = Math.floor((Date.now() - state.startedAt) / 1000);
  const correct = state.answers.filter((answer) => answer.correct).length;
  const accuracy = Math.round(correct / state.questions.length * 100);
  const history = historyList();
  history.push({ score: state.score, accuracy, date: Date.now() });
  localStorage.setItem('madi-history', JSON.stringify(history.slice(-30)));
  $('#resultName').textContent = state.settings.name || text('friend');
  $('#resultScore').textContent = state.score;
  $('#resultAccuracy').textContent = `${accuracy}%`;
  $('#resultTime').textContent = formatTime(elapsed);
  $('#resultCorrect').textContent = `${correct} / ${state.questions.length}`;
  $('#reviewList').innerHTML = state.answers.map(({ question, value, correct: isCorrect }) => (
    `<div class="review-item ${isCorrect ? 'correct' : 'wrong'}"><span>${question.text}</span><strong>${value}</strong></div>`
  )).join('');
  updateStats();
  applyLanguage();
  switchView('result');
  state.busy = false;
}

function updateStats() {
  const history = historyList();
  $('#sessionCount').textContent = history.length;
  $('#bestScore').textContent = history.length ? Math.max(...history.map((item) => item.score)) : '--';
  $('#accuracyStat').textContent = history.length
    ? `${Math.round(history.reduce((sum, item) => sum + item.accuracy, 0) / history.length)}%`
    : '--';
  const recommended = String(recommendedCount());
  if ([...$('#questionCount').options].some((option) => option.value === recommended)) {
    $('#questionCount').value = recommended;
  }
}

function saveSettings() {
  state.settings = {
    name: $('#playerName').value.trim(),
    mode: $('input[name="mode"]:checked').value,
    operation: $('input[name="operation"]:checked').value,
    difficulty: $('#difficulty').value,
    count: Number($('#questionCount').value),
    negative: $('#negativeMarking').checked
  };
  localStorage.setItem('madi-settings', JSON.stringify(state.settings));
}

function restoreSettings() {
  const saved = JSON.parse(localStorage.getItem('madi-settings') || 'null');
  if (saved) {
    $('#playerName').value = saved.name || '';
    $('#difficulty').value = saved.difficulty || 'medium';
    $('#questionCount').value = String(saved.count || recommendedCount());
    $('#negativeMarking').checked = Boolean(saved.negative);
    const mode = $(`input[name="mode"][value="${saved.mode || 'practice'}"]`);
    const operation = $(`input[name="operation"][value="${saved.operation || 'addition'}"]`);
    if (mode) mode.checked = true;
    if (operation) operation.checked = true;
  } else {
    $('#questionCount').value = String(recommendedCount());
  }
}

function goToSetup() {
  abortRound();
  switchView('setup');
}

$('#setupForm').addEventListener('submit', (event) => {
  event.preventDefault();
  saveSettings();
  startCountdown();
});
$('#submitAnswer').addEventListener('click', () => submitAnswer());
$('#answerInput').addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    submitAnswer();
  }
});
$('#sameRound').addEventListener('click', () => {
  abortRound();
  startCountdown();
});
$('#newRound').addEventListener('click', goToSetup);
$('#quitRound').addEventListener('click', goToSetup);
$('#languageToggle').addEventListener('click', () => {
  state.language = state.language === 'ru' ? 'en' : 'ru';
  localStorage.setItem('madi-language', state.language);
  applyLanguage();
});
$('#soundToggle').addEventListener('click', () => {
  state.sound = !state.sound;
  localStorage.setItem('madi-sound', state.sound ? 'on' : 'off');
  applyLanguage();
  if (state.sound) playSound('click');
  syncBackgroundMusic();
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {});
  });
}

restoreSettings();
updateStats();
applyLanguage();
syncBackgroundMusic();
