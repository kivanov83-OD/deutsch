const state = {
  source: [],
  filtered: [],
  currentIndex: 0,
  score: 0,
  answeredIds: new Set(),
  selectedCategory: 'all',
  selectedAnswerIndex: null,
  shuffledAnswers: []
};

const els = {
  categorySelect: document.getElementById('categorySelect'),
  shuffleBtn: document.getElementById('shuffleBtn'),
  resetBtn: document.getElementById('resetBtn'),
  prevBtn: document.getElementById('prevBtn'),
  nextBtn: document.getElementById('nextBtn'),
  progressBar: document.getElementById('progressBar'),
  questionTitle: document.getElementById('questionTitle'),
  questionTranslation: document.getElementById('questionTranslation'),
  questionDescription: document.getElementById('questionDescription'),
  answersList: document.getElementById('answersList'),
  infoPanel: document.getElementById('infoPanel'),
  statusBadge: document.getElementById('statusBadge'),
  currentCategory: document.getElementById('currentCategory'),
  scoreValue: document.getElementById('scoreValue'),
  totalValue: document.getElementById('totalValue'),
  currentIndex: document.getElementById('currentIndex'),
  questionsCount: document.getElementById('questionsCount'),
  difficultyBadge: document.getElementById('difficultyBadge'),
  questionTag: document.getElementById('questionTag'),
  template: document.getElementById('answerTemplate')
};

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function shuffleArray(array) {
  const arr = [...array];

  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
}

function setStatus(type, text) {
  els.statusBadge.className = 'status-badge';
  if (type === 'correct') els.statusBadge.classList.add('status-correct');
  else if (type === 'wrong') els.statusBadge.classList.add('status-wrong');
  else els.statusBadge.classList.add('status-neutral');
  els.statusBadge.textContent = text;
}

function renderInfoEmpty() {
  const question = state.filtered[state.currentIndex];
  els.infoPanel.className = 'info-panel empty';
  els.infoPanel.innerHTML = `
    <div class="info-placeholder rich-placeholder">
      <div class="info-icon">ℹ</div>
      <div>
        <p class="placeholder-title">Выбери вариант ответа</p>
        <p class="placeholder-text">Справа появятся: перевод на русский, пример с переводом, этимология и описание использования.</p>
        ${question ? `<p class="placeholder-phrase">Текущий шаблон: <strong>${escapeHtml(question.question?.de || '')}</strong></p>` : ''}
      </div>
    </div>
  `;
  setStatus('neutral', 'Ожидание');
}

function renderInfo(answer, question) {
  const correctAnswer = question.answers.find((item) => item.correct);
  const info = question.info || {};

  els.infoPanel.className = 'info-panel';
  els.infoPanel.innerHTML = `
    <div class="info-hero ${answer.correct ? 'correct' : 'wrong'}">
      <div>
        <p class="info-label">Устойчивое сочетание</p>
        <h4 class="info-phrase">${escapeHtml(info.phrase || question.question?.de || '')}</h4>
      </div>
      <div class="mini-result">
        <span class="mini-result-label">Твой ответ</span>
        <strong>${escapeHtml(answer.text)}</strong>
      </div>
    </div>

    <div class="info-grid">
      <section class="info-block">
        <p class="info-label">Перевод на русский</p>
        <p class="info-value">${escapeHtml(info.translation || question.question?.ru || '—')}</p>
      </section>

      <section class="info-block">
        <p class="info-label">Правильный ответ</p>
        <p class="info-value"><strong>${escapeHtml(correctAnswer?.text || '—')}</strong></p>
      </section>
    </div>

    <section class="info-block">
      <p class="info-label">Пример</p>
      <p class="info-example">${escapeHtml(info.example || '—')}</p>
      <p class="info-example-ru">${escapeHtml(info.example_ru || '—')}</p>
    </section>

    <section class="info-block">
      <p class="info-label">Этимология</p>
      <p class="info-value">${escapeHtml(info.etymology || '—')}</p>
    </section>

    <section class="info-block">
      <p class="info-label">Описание использования</p>
      <p class="info-value">${escapeHtml(info.usage || '—')}</p>
    </section>
  `;

  setStatus(answer.correct ? 'correct' : 'wrong', answer.correct ? 'Верно' : 'Неверно');
}

function updateHeader(question) {
  els.currentCategory.textContent = question?.category || '—';
  els.scoreValue.textContent = state.score;
  els.totalValue.textContent = state.filtered.length;
  els.currentIndex.textContent = state.filtered.length ? state.currentIndex + 1 : 0;
  els.questionsCount.textContent = state.filtered.length;
  els.difficultyBadge.textContent = question?.difficulty || 'Без уровня';
  els.questionTag.textContent = question?.tag || '—';

  const progress = state.filtered.length
    ? ((state.currentIndex + 1) / state.filtered.length) * 100
    : 0;

  els.progressBar.style.width = `${progress}%`;
}

function updateNavButtons() {
  els.prevBtn.disabled = state.currentIndex <= 0;
  els.nextBtn.disabled = state.currentIndex >= state.filtered.length - 1;
}

function paintAnswers(selectedIndex = null) {
  const buttons = [...els.answersList.querySelectorAll('.answer-btn')];

  buttons.forEach((button, index) => {
    const answer = state.shuffledAnswers[index];
    if (!answer) return;

    button.classList.remove('is-selected', 'is-correct', 'is-wrong');

    if (selectedIndex === index) {
      button.classList.add('is-selected');
      button.classList.add(answer.correct ? 'is-correct' : 'is-wrong');
    }

    if (selectedIndex !== null && answer.correct) {
      button.classList.add('is-correct');
    }
  });
}

function handleAnswerClick(answer, answerIndex) {
  const question = state.filtered[state.currentIndex];
  state.selectedAnswerIndex = answerIndex;

  renderInfo(answer, question);
  paintAnswers(answerIndex);

  if (answer.correct && !state.answeredIds.has(question.id ?? `${state.currentIndex}-${question.question?.de || ''}`)) {
    state.score += 1;
    state.answeredIds.add(question.id ?? `${state.currentIndex}-${question.question?.de || ''}`);
  }

  updateHeader(question);
}

function renderQuestion() {
  const question = state.filtered[state.currentIndex];

  if (!question) {
    els.questionTitle.textContent = 'Вопросы не найдены';
    els.questionTranslation.textContent = '';
    els.questionDescription.textContent = 'Попробуй выбрать другую тему или проверь файл questions.json.';
    els.answersList.innerHTML = '';
    state.shuffledAnswers = [];
    renderInfoEmpty();
    updateHeader(null);
    updateNavButtons();
    return;
  }

  state.selectedAnswerIndex = null;
  state.shuffledAnswers = shuffleArray(question.answers || []);

  els.questionTitle.textContent = question.question?.de || '—';
  els.questionTranslation.textContent = question.question?.ru || '';
  els.questionDescription.textContent = question.description || '';
  els.answersList.innerHTML = '';

  state.shuffledAnswers.forEach((answer, index) => {
    const node = els.template.content.firstElementChild.cloneNode(true);
    node.querySelector('.answer-letter').textContent = String.fromCharCode(65 + index);
    node.querySelector('.answer-text').textContent = answer.text;
    node.querySelector('.answer-caption').textContent = 'Выбери предлог';
    node.addEventListener('click', () => handleAnswerClick(answer, index));
    els.answersList.appendChild(node);
  });

  renderInfoEmpty();
  updateHeader(question);
  updateNavButtons();
}

function populateCategories(questions) {
  const categories = [...new Set(questions.map((q) => q.category).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'ru'));

  els.categorySelect.innerHTML =
    '<option value="all">Все темы</option>' +
    categories
      .map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`)
      .join('');
}

function applyFilter() {
  state.filtered = state.selectedCategory === 'all'
    ? [...state.source]
    : state.source.filter((q) => q.category === state.selectedCategory);

  state.currentIndex = 0;
  renderQuestion();
}

function shuffleCurrent() {
  for (let i = state.filtered.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [state.filtered[i], state.filtered[j]] = [state.filtered[j], state.filtered[i]];
  }

  state.currentIndex = 0;
  renderQuestion();
}

function resetQuiz() {
  state.score = 0;
  state.answeredIds.clear();
  state.currentIndex = 0;
  state.selectedCategory = 'all';
  state.selectedAnswerIndex = null;
  state.shuffledAnswers = [];
  els.categorySelect.value = 'all';
  state.filtered = [...state.source];
  renderQuestion();
}

function attachEvents() {
  els.categorySelect.addEventListener('change', (event) => {
    state.selectedCategory = event.target.value;
    applyFilter();
  });

  els.shuffleBtn.addEventListener('click', shuffleCurrent);
  els.resetBtn.addEventListener('click', resetQuiz);

  els.prevBtn.addEventListener('click', () => {
    if (state.currentIndex > 0) {
      state.currentIndex -= 1;
      renderQuestion();
    }
  });

  els.nextBtn.addEventListener('click', () => {
    if (state.currentIndex < state.filtered.length - 1) {
      state.currentIndex += 1;
      renderQuestion();
    }
  });
}

async function init() {
  try {
    const response = await fetch('questions.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const payload = await response.json();
    state.source = Array.isArray(payload.questions) ? payload.questions : payload;
    state.filtered = [...state.source];

    populateCategories(state.source);
    attachEvents();
    renderQuestion();
  } catch (error) {
    console.error(error);
    els.questionTitle.textContent = 'Не удалось загрузить вопросы';
    els.questionTranslation.textContent = '';
    els.questionDescription.textContent = 'Проверь questions.json или обнови страницу после коммита.';
    els.answersList.innerHTML = '';
    els.infoPanel.className = 'info-panel';
    els.infoPanel.innerHTML = `
      <div class="info-block">
        <p class="info-label">Ошибка</p>
        <p class="info-value">${escapeHtml(error.message)}</p>
      </div>
      <div class="info-block">
        <p class="info-label">Что проверить</p>
        <p class="info-value">Файл <strong>questions.json</strong> должен лежать рядом с <strong>index.html</strong> и быть валидным JSON.</p>
      </div>
    `;
    setStatus('wrong', 'Ошибка загрузки');
  }
}

init();