let allQuestions = [];
let questions = [];
let currentIndex = 0;
let correctCount = 0;
const answered = new Map();

const categoryFilter = document.getElementById('categoryFilter');
const scoreText = document.getElementById('scoreText');
const questionNumber = document.getElementById('questionNumber');
const questionText = document.getElementById('questionText');
const questionTranslation = document.getElementById('questionTranslation');
const answersEl = document.getElementById('answers');
const infoPhrase = document.getElementById('infoPhrase');
const infoTranslation = document.getElementById('infoTranslation');
const infoExample = document.getElementById('infoExample');
const infoExampleRu = document.getElementById('infoExampleRu');
const infoEtymology = document.getElementById('infoEtymology');
const infoUsage = document.getElementById('infoUsage');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const shuffleBtn = document.getElementById('shuffleBtn');

function shuffleArray(items) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function loadQuestions() {
  const response = await fetch('questions.json');
  allQuestions = await response.json();
  buildCategories();
  applyCategory();
}

function buildCategories() {
  const categories = ['Все темы', ...new Set(allQuestions.map(q => q.category))];
  categoryFilter.innerHTML = categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
}

function applyCategory() {
  const selected = categoryFilter.value || 'Все темы';
  questions = selected === 'Все темы'
    ? [...allQuestions]
    : allQuestions.filter(q => q.category === selected);

  currentIndex = 0;
  correctCount = 0;
  answered.clear();
  updateScore();
  renderQuestion();
}

function updateScore() {
  scoreText.textContent = `${correctCount} / ${questions.length}`;
}

function fillInfo(q) {
  infoPhrase.textContent = q.info.phrase;
  infoTranslation.textContent = q.info.translation;
  infoExample.textContent = q.info.example;
  infoExampleRu.textContent = q.info.example_ru;
  infoEtymology.textContent = q.info.etymology;
  infoUsage.textContent = q.info.usage;
}

function renderQuestion() {
  if (!questions.length) {
    questionNumber.textContent = 'Нет вопросов';
    questionText.textContent = 'Здесь пока пусто';
    questionTranslation.textContent = '';
    answersEl.innerHTML = '';
    infoPhrase.textContent = 'Нет данных';
    infoTranslation.textContent = 'Добавь вопросы в questions.json';
    infoExample.textContent = '—';
    infoExampleRu.textContent = '—';
    infoEtymology.textContent = '—';
    infoUsage.textContent = '—';
    return;
  }

  const q = questions[currentIndex];
  questionNumber.textContent = `Вопрос ${currentIndex + 1} из ${questions.length}`;
  questionText.textContent = q.question.de;
  questionTranslation.textContent = q.question.ru;
  fillInfo(q);

  const savedAnswer = answered.get(currentIndex);
  const renderedAnswers = q.shuffledAnswers || q.answers;
  answersEl.innerHTML = '';

  renderedAnswers.forEach(answer => {
    const btn = document.createElement('button');
    btn.className = 'answer-btn';
    btn.textContent = answer.text;

    if (savedAnswer) {
      if (answer.correct) btn.classList.add('correct');
      if (savedAnswer.text === answer.text && !savedAnswer.correct) btn.classList.add('wrong');
      btn.disabled = true;
    }

    btn.addEventListener('click', () => selectAnswer(answer, q));
    answersEl.appendChild(btn);
  });
}

function selectAnswer(answer, q) {
  if (answered.has(currentIndex)) return;

  answered.set(currentIndex, answer);
  if (answer.correct) correctCount += 1;
  updateScore();
  fillInfo(q);
  renderQuestion();
}

function shuffleCurrentAnswers() {
  if (!questions.length) return;
  const q = questions[currentIndex];
  q.shuffledAnswers = shuffleArray(q.answers);
  renderQuestion();
}

prevBtn.addEventListener('click', () => {
  if (!questions.length) return;
  currentIndex = (currentIndex - 1 + questions.length) % questions.length;
  renderQuestion();
});

nextBtn.addEventListener('click', () => {
  if (!questions.length) return;
  currentIndex = (currentIndex + 1) % questions.length;
  renderQuestion();
});

shuffleBtn.addEventListener('click', shuffleCurrentAnswers);
categoryFilter.addEventListener('change', applyCategory);

loadQuestions();
