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
    textInput.placeholder = '請輸入說明';
    textInput.id = 'newAnswer';
    textInput.autofocus = true;
    textInput.addEventListener('input', function () {
        this.classList.toggle('used', this.value.trim().length > 0);
    });
    addAnswerForm.appendChild(textInput);

    const answerOptions = category.answerType;

    if (answerOptions) {
        textInput.placeholder += '（選填）';

        const binaryContainer = document.createElement('div');
        binaryContainer.className = 'binary-options';

        answerOptions.forEach(option => {
            const optionElement = document.createElement('div');
            optionElement.classList.add('binary-option', 'btn');
            optionElement.innerHTML = "<span class=\"material-symbols-rounded\" aria-hidden=\"true\">check</span>" + option;
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
    addButton.innerHTML = '<span class="material-symbols-rounded" aria-hidden="true">add_notes</span>添加';
    addButton.classList.add('saveBtn', 'btn');
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
    answerText = textInput.value.trim().replaceAll("／", " / ");

    const answerOptions = category.answerType;

    if (answerOptions) {
        const selectedOption = addAnswerForm.querySelector('.binary-option.selected');
        if (!selectedOption) {
            showSnackbar('請選擇項目');
            return;
        }

        if (answerText) {
            answerText += "／";
        }
        answerText += selectedOption.textContent.replace('check', '').trim();
    } else if (answerText.length < 1) {
        showSnackbar('請輸入說明');
        return;
    }

    answerText = hours + ":" + minutes + "／" + answerText;

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

function exportNotes() {
    let exportText = '';

    const allAnswers = [];

    Object.keys(gameState.answeredQuestions).forEach(questionKey => {
        const [categoryIndex, questionIndex] = questionKey.split('-').map(Number);
        const category = gameData.categories[categoryIndex];
        const question = category.questions[questionIndex];
        const answers = gameState.answeredQuestions[questionKey];

        let questionText = typeof question === 'string' ? question : question.text;
        if (questionText.includes("；")) {
            questionText = questionText.split("；")[1];
        }

        answers.forEach(answer => {
            const [timePart, ...contentParts] = answer.split('／');
            const fullContent = contentParts.join('／');

            let mainAnswer = fullContent;
            let binaryOption = '';

            if (category.answerType && Array.isArray(category.answerType)) {
                const contentSegments = fullContent.split('／');
                const lastSegment = contentSegments[contentSegments.length - 1];

                if (category.answerType.includes(lastSegment)) {
                    binaryOption = lastSegment;
                    mainAnswer = contentSegments.slice(0, -1).join('／');

                    if (mainAnswer.length === 0) {
                        mainAnswer = '---';
                    }
                }
            }

            allAnswers.push({
                category: category.name.split("　")[1],
                question: questionText,
                time: timePart,
                answer: mainAnswer,
                binaryOption: binaryOption,
                timestamp: new Date(`1970-01-01T${timePart}:00`) // For sorting
            });
        });
    });

    allAnswers.sort((a, b) => a.timestamp - b.timestamp);

    allAnswers.forEach(item => {
        let line = `${item.time}／${item.category}／${item.question}／${item.answer}`;
        if (item.binaryOption) {
            line += `／${item.binaryOption}`;
        }
        exportText += line + '\n';
    });

    exportText = exportText.trim();

    if (exportText) {
        textarea = document.getElementById('export-content');
        textarea.value = exportText;
        textarea.style.height = 0;

        openModal('export');

        setTimeout(() => {
            textarea.style.height = textarea.scrollHeight + 'px';
        }, 100);
    } else {
        showSnackbar('暫無筆記可匯出');
    }
}

function copyExportToClipboard() {
    const textarea = document.getElementById('export-content');
    if (!textarea) return;

    textarea.select();
    textarea.setSelectionRange(0, 99999); // For mobile devices

    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showSnackbar('成功複製');

            setTimeout(() => {
                copyBtn.innerHTML = originalText;
            }, 2000);
        } else {
            showSnackbar('複製失敗，請手動選擇文字複製');
        }
    } catch (err) {
        navigator.clipboard.writeText(textarea.value).then(() => {
            showSnackbar('成功複製');

            setTimeout(() => {
                copyBtn.innerHTML = originalText;
            }, 2000);
        }).catch(() => {
            showSnackbar('複製失敗，請手動選擇文字複製');
        });
    }
}

function downloadExportedNotes(event) {
    Confirm.confirmAction(event, '確定下載？', () => {
        const now = new Date();

        const year = now.getFullYear() - 1911;
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');

        const blob = new Blob([document.getElementById('export-content').textContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `詰問簿筆記內容-${year}${month}${day}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showSnackbar('成功下載');
    });
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
    document.querySelector('#restart-btn').addEventListener('click', restartGame);
    document.querySelector('#export-btn').addEventListener('click', exportNotes);
    document.querySelector('#copy-btn').addEventListener('click', copyExportToClipboard);
    document.querySelector('#download-btn').addEventListener('click', (event) => downloadExportedNotes(event));
}

document.addEventListener('DOMContentLoaded', loadGameData);