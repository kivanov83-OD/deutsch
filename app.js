const state = {
  source: [],
  filtered: [],
  currentIndex: 0,
  score: 0,
  answeredIds: new Set(),
  selectedCategory: 'all'
};

const els = {
  categorySelect: document.getElementById('categorySelect'),
  shuffleBtn: document.getElementById('shuffleBtn'),
  resetBtn: document.getElementById('resetBtn'),
  prevBtn: document.getElementById('prevBtn'),
  nextBtn: document.getElementById('nextBtn'),
  progressBar: document.getElementById('progressBar'),
  questionTitle: document.getElementById('questionTitle'),
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

function setStatus(type, text) {
  els.statusBadge.className = 'status-badge';
  if (type === 'correct') {
    els.statusBadge.classList.add('status-correct');
  } else if (type === 'wrong') {
    els.statusBadge.classList.add('status-wrong');
  } else {
    els.statusBadge.classList.add('status-neutral');
  }
  els.statusBadge.textContent = text;
}

function renderInfoEmpty() {
  els.infoPanel.className = 'info-panel empty';
  els.infoPanel.innerHTML = `
    <div class="info-placeholder">
      <div class="info-icon">ℹ</div>
      <p>Выберите вариант ответа, и здесь появится пояснение.</p>
    </div>
  `;
  setStatus('neutral', 'Ожидание');
}

function renderInfo(answer, question) {
  els.infoPanel.className = 'info-panel';
  els.infoPanel.innerHTML = `
    <div class="info-block">
      <p class="info-label">Выбранный вариант</p>
      <p class="info-value"><strong>${escapeHtml(answer.text)}</strong></p>
    </div>
    <div class="info-block">
      <p class="info-label">Пояснение</p>
      <p class="info-value">${escapeHtml(answer.info)}</p>
    </div>
    <div class="info-block">
      <p class="info-label">Подсказка / заметка</p>
      <p class="info-value">${escapeHtml(answer.note || question.hint || 'Дополнительной заметки нет.')}</p>
    </div>
    <div class="info-block">
      <p class="info-label">Правильный ответ</p>
      <p class="info-value">${escapeHtml(question.answers.find(a => a.correct)?.text || 'Не указан')}</p>
    </div>
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
  els.questionTag.textContent = question?.tag || 'Общий';
  const progress = state.filtered.length ? ((state.currentIndex + 1) / state.filtered.length) * 100 : 0;
  els.progressBar.style.width = `${progress}%`;
}

function updateNavButtons() {
  els.prevBtn.disabled = state.currentIndex <= 0;
  els.nextBtn.disabled = state.currentIndex >= state.filtered.length - 1;
}

function paintAnswers(selectedIndex = null) {
  const buttons = [...els.answersList.querySelectorAll('.answer-btn')];
  const question = state.filtered[state.currentIndex];

  buttons.forEach((button, index) => {
    const answer = question.answers[index];
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
  renderInfo(answer, question);
  paintAnswers(answerIndex);

  if (answer.correct && !state.answeredIds.has(question.id)) {
    state.score += 1;
    state.answeredIds.add(question.id);
    els.scoreValue.textContent = state.score;
  }
}

function renderQuestion() {
  const question = state.filtered[state.currentIndex];

  if (!question) {
    els.questionTitle.textContent = 'Вопросы не найдены';
    els.questionDescription.textContent = 'Попробуй выбрать другую тему или проверь файл questions.json.';
    els.answersList.innerHTML = '';
    renderInfoEmpty();
    updateHeader(null);
    updateNavButtons();
    return;
  }

  els.questionTitle.textContent = question.question;
  els.questionDescription.textContent = question.description || 'Выбери один вариант ответа.';
  els.answersList.innerHTML = '';

  question.answers.forEach((answer, index) => {
    const node = els.template.content.firstElementChild.cloneNode(true);
    node.querySelector('.answer-letter').textContent = String.fromCharCode(65 + index);
    node.querySelector('.answer-text').textContent = answer.text;
    node.querySelector('.answer-caption').textContent = answer.caption || 'Нажми, чтобы увидеть пояснение';
    node.addEventListener('click', () => handleAnswerClick(answer, index));
    els.answersList.appendChild(node);
  });

  renderInfoEmpty();
  updateHeader(question);
  updateNavButtons();
}

function populateCategories(questions) {
  const categories = [...new Set(questions.map(q => q.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ru'));
  els.categorySelect.innerHTML = '<option value="all">Все темы</option>' + categories
    .map(category => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`)
    .join('');
}

function applyFilter() {
  state.filtered = state.selectedCategory === 'all'
    ? [...state.source]
    : state.source.filter(q => q.category === state.selectedCategory);

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
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = await response.json();
    state.source = Array.isArray(payload.questions) ? payload.questions : payload;
    state.filtered = [...state.source];

    populateCategories(state.source);
    attachEvents();
    renderQuestion();
  } catch (error) {
    console.error(error);
    els.questionTitle.textContent = 'Не удалось загрузить вопросы';
    els.questionDescription.textContent = 'Открой сайт через GitHub Pages, локальный сервер или проверь questions.json.';
    els.answersList.innerHTML = '';
    els.infoPanel.className = 'info-panel';
    els.infoPanel.innerHTML = `
      <div class="info-block">
        <p class="info-label">Ошибка</p>
        <p class="info-value">${escapeHtml(error.message)}</p>
      </div>
      <div class="info-block">
        <p class="info-label">Что проверить</p>
        <p class="info-value">Файл <strong>questions.json</strong> должен лежать рядом с <strong>index.html</strong>.</p>
      </div>
    `;
    setStatus('wrong', 'Ошибка загрузки');
  }
}

init();
