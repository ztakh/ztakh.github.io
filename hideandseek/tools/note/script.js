let gameData = {};

let gameState = {
    get currentDifficulty() {
        return selectedSize || 'M';
    },
    answeredQuestions: {}
};

const categoriesContainer = document.getElementById('categories-container');
const modalQuestionText = document.getElementById('modalQuestionText');
const modalQuestionType = document.getElementById('modalQuestionType');
const modalFooter = document.querySelector('#modal-question .footer')
const answerList = document.getElementById('answerList');
const addAnswerForm = document.getElementById('addAnswerForm');

let currentQuestion = null;

async function loadGameData() {
    try {
        const response = await fetch('gameData.json');
        if (!response.ok) {
            throw new Error('Failed to load game data');
        }
        gameData = await response.json();
        initGame();
    } catch (error) {
        showSnackbar("未知的錯誤，請重試");
        throw new Error(error.message);
        gameData = {};
    }
}

function initGame() {
    loadGameState();
    renderCategories();
    setupEventListeners();
    showSnackbar('成功加載並還原資料');
}

function loadGameState() {
    const savedState = localStorage.getItem('hideAndSeekGameState');
    if (savedState) {
        const parsedState = JSON.parse(savedState);
        gameState.answeredQuestions = parsedState.answeredQuestions || {};
    }
}

function saveGameState() {
    localStorage.setItem('hideAndSeekGameState', JSON.stringify({
        answeredQuestions: gameState.answeredQuestions
    }));
}

function renderCategories() {
    categoriesContainer.innerHTML = '';

    gameData.categories.forEach((category, categoryIndex) => {
        const categoryElement = document.createElement('div');
        categoryElement.classList.add("category", category.limit);

        const categoryHeader = document.createElement('div');
        categoryHeader.className = 'category-header';

        const categoryTitle = document.createElement('h3');
        categoryTitle.className = 'category-title';
        categoryTitle.textContent = category.name;
        categoryHeader.appendChild(categoryTitle);
        categoryElement.appendChild(categoryHeader);

        const questionsGrid = document.createElement('div');
        questionsGrid.className = 'questions-grid';

        category.questions.forEach((question, questionIndex) => {
            const questionCard = document.createElement('div');
            questionCard.className = 'question-card';

            if (category.forML != null) {
                if (questionIndex >= category.forL) {
                    questionCard.classList.add("forL");
                } else if (questionIndex >= category.forML) {
                    questionCard.classList.add("forML");
                }
            }

            const questionKey = `${categoryIndex}-${questionIndex}`;
            const answers = gameState.answeredQuestions[questionKey] || [];

            if (answers.length > 0) {
                questionCard.classList.add('answered');
            }

            const questionString = typeof question === 'string' ? question : question.text;
            if (questionString.split("").includes("；")) {
                const questionSplitted = question.split("；");
                questionCard.textContent = questionSplitted[0];
            } else {
                questionCard.textContent = questionString;
            }

            questionCard.addEventListener('click', () => {
                openQuestionModal(categoryIndex, questionIndex);
            });

            questionsGrid.appendChild(questionCard);
        });

        categoryElement.appendChild(questionsGrid);
        categoriesContainer.appendChild(categoryElement);
    });
}

function openQuestionModal(categoryIndex, questionIndex) {
    currentQuestion = { categoryIndex, questionIndex };
    const category = gameData.categories[categoryIndex];
    const question = category.questions[questionIndex];

    const questionString = typeof question === 'string' ? question : question.text;
    if (questionString.split("").includes("；")) {
        const questionSplitted = question.split("；");
        modalQuestionText.textContent = questionSplitted[1];
    } else {
        modalQuestionText.textContent = questionString;
    }

    if (typeof question !== 'string' && question.type) {
        modalQuestionType.textContent = `Type: ${question.type}`;
        modalQuestionType.style.display = 'block';
    } else {
        modalQuestionType.style.display = 'none';
    }

    const questionKey = `${categoryIndex}-${questionIndex}`;
    const answers = gameState.answeredQuestions[questionKey] || [];

    answerList.innerHTML = '';
    answers.forEach((answer, answerIndex) => {
        const answerItem = document.createElement('div');
        answerItem.className = 'answer-item';

        const answerText = document.createElement('span');
        answerText.textContent = answer;

        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-answer';
        deleteButton.textContent = '✕';
        deleteButton.addEventListener('click', () => deleteAnswer(answerIndex));

        answerItem.appendChild(answerText);
        answerItem.appendChild(deleteButton);
        answerList.appendChild(answerItem);
    });

    addAnswerForm.innerHTML = '';

    const textInput = document.createElement('input');
    textInput.type = 'text';
    textInput.placeholder = '請輸入說明（選填）';
    textInput.id = 'newAnswer';
    textInput.autofocus = true;
    textInput.addEventListener('input', function () {
        this.classList.toggle('used', this.value.trim().length > 0);
    });
    addAnswerForm.appendChild(textInput);

    const answerOptions = category.answerType;

    if (answerOptions) {
        const binaryContainer = document.createElement('div');
        binaryContainer.className = 'binary-options';

        answerOptions.forEach(option => {
            const optionElement = document.createElement('div');
            optionElement.className = 'binary-option';
            optionElement.innerHTML = "<span class=\"material-symbols-rounded\">check</span>" + option;
            optionElement.addEventListener('click', function () {
                binaryContainer.querySelectorAll('.binary-option').forEach(el => {
                    el.classList.remove('selected');
                });
                this.classList.add('selected');
            });
            binaryContainer.appendChild(optionElement);
        });

        addAnswerForm.appendChild(binaryContainer);
    }

    const addButton = document.createElement('div');
    addButton.id = 'addAnswer';
    addButton.textContent = '＋ 添加';
    addButton.classList.add('saveBtn');
    addButton.addEventListener('click', addAnswer);
    addAnswerForm.appendChild(addButton);

    openModal('question');

    setTimeout(() => {
        textInput.focus();
    }, 200);
}

function addAnswer() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    const category = gameData.categories[currentQuestion.categoryIndex];
    let answerText = '';

    const textInput = document.getElementById('newAnswer');
    answerText = textInput.value.trim();

    const answerOptions = category.answerType;

    if (answerOptions) {
        const selectedOption = addAnswerForm.querySelector('.binary-option.selected');
        if (!selectedOption) {
            showSnackbar('請選擇項目');
            return;
        }

        if (answerText) {
            answerText += " → ";
        }
        answerText += selectedOption.textContent.replace('check', '').trim();
    }

    answerText += `（${hours}:${minutes}）`;

    const questionKey = `${currentQuestion.categoryIndex}-${currentQuestion.questionIndex}`;
    if (!gameState.answeredQuestions[questionKey]) {
        gameState.answeredQuestions[questionKey] = [];
    }

    gameState.answeredQuestions[questionKey].push(answerText);

    if (answerOptions) {
        addAnswerForm.querySelectorAll('.binary-option').forEach(el => {
            el.classList.remove('selected');
        });
    } else {
        const textInput = document.getElementById('newAnswer');
        textInput.value = '';
    }

    saveGameState();
    renderCategories();
    openQuestionModal(currentQuestion.categoryIndex, currentQuestion.questionIndex);
    showSnackbar('成功添加');
}

function deleteAnswer(answerIndex) {
    const questionKey = `${currentQuestion.categoryIndex}-${currentQuestion.questionIndex}`;
    gameState.answeredQuestions[questionKey].splice(answerIndex, 1);

    if (gameState.answeredQuestions[questionKey].length === 0) {
        delete gameState.answeredQuestions[questionKey];
    }

    saveGameState();
    renderCategories();
    openQuestionModal(currentQuestion.categoryIndex, currentQuestion.questionIndex);
    showSnackbar('成功刪除');
}

function restartGame() {
    if (confirm("筆記將被清空，確定重置？")) {
        categoriesContainer.classList.add("fadeOut");
        gameState.answeredQuestions = {};
        saveGameState();

        setTimeout(() => {
            renderCategories();
            showSnackbar("成功重置");
            categoriesContainer.classList.remove("fadeOut");
        }, 500);
    }
}

function setupEventListeners() {
    const restartGameButton = document.createElement('a');
    restartGameButton.id = 'restart-btn';
    restartGameButton.draggable = false;
    restartGameButton.innerHTML = '<span class="material-symbols-rounded">refresh</span> <span>重置</span>';
    document.querySelector('.article-actions').appendChild(restartGameButton);
    restartGameButton.addEventListener('click', restartGame);
}

document.addEventListener('DOMContentLoaded', loadGameData);