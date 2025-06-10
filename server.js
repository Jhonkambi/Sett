<script>
  // Data and state
  let questions = [];
  let filteredQuestions = [];
  let categories = [];
  let timerInterval;
  let timeLeft = 0;
  let currentIndex = 0;
  let correctAnswers = 0;
  let timedOutCount = 0;
  let answeredCount = 0;
  let chosenDifficulty = 'easy';
  let chosenCategory = 'All Categories';
  let chosenNumQueries = 10;

  let userResponses = [];
  let startTime;
  let totalTimeTaken = 0;

  const difficultyTimes = {
    easy: 120,
    medium: 60,
    hard: 30,
    insane: 15,
    peaceful: null
  };

  loadQuestionsFromStorage();
  initCategories();

  function initCategories() {
    const catSet = new Set();
    questions.forEach(q => {
      if(q.category && q.category.trim() !== '') {
        catSet.add(q.category.trim());
      }
    });
    categories = Array.from(catSet).sort();
    if(categories.length === 0) {
      categories.push('Uncategorized');
    }
    populateCategorySelect();
    populateManageCategoryFilter();
  }

  function populateCategorySelect() {
    const select = document.getElementById('categorySelect');
    select.innerHTML = '';
    categories.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat;
      option.textContent = cat;
      select.appendChild(option);
    });
    if(!select.value && categories.length) {
      select.value = categories[0];
    }
    hideNewCategoryInputArea();
  }

  function populateManageCategoryFilter() {
    const filter = document.getElementById('manageCategoryFilter');
    filter.innerHTML = '';
    const optAll = document.createElement('option');
    optAll.value = 'All Categories';
    optAll.textContent = 'All Categories';
    filter.appendChild(optAll);
    categories.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat;
      option.textContent = cat;
      filter.appendChild(option);
    });
    filter.value = 'All Categories';
  }

  // Populate dropdown in categorySelectOverlay
  function populateCategoryOptions() {
    const select = document.getElementById('quizCategorySelect');
    select.innerHTML = '';

    const optAll = document.createElement('option');
    optAll.value = 'All Categories';
    optAll.textContent = 'All Categories';
    select.appendChild(optAll);

    categories.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat;
      option.textContent = cat;
      select.appendChild(option);
    });
    select.value = 'All Categories';
  }

  function filterManageQueries() {
    renderManageQueriesList();
  }

  function showNewCategoryInputArea() {
    document.getElementById('newCategoryInputArea').style.display = 'flex';
    document.getElementById('categorySelect').style.display = 'none';
    document.getElementById('addCategoryBtn').style.display = 'none';
    document.getElementById('newCategoryInput').value = '';
    document.getElementById('newCategoryInput').focus();
  }

  function hideNewCategoryInputArea() {
    document.getElementById('newCategoryInputArea').style.display = 'none';
    document.getElementById('categorySelect').style.display = 'block';
    document.getElementById('addCategoryBtn').style.display = 'inline-block';
  }

  function showQuestionPopup() {
    document.getElementById('popupOverlay').style.display = 'block';
    document.getElementById('questionPopup').style.display = 'block';
    resetAddQueryFields();
    initCategories();
    clearEditMode();
  }

  function closeQuestionPopup() {
    document.getElementById('popupOverlay').style.display = 'none';
    document.getElementById('questionPopup').style.display = 'none';
    clearEditMode();
  }

  function resetAddQueryFields() {
    document.getElementById('newDateTime').value = '';
    document.getElementById('newQuestion').value = '';
    document.getElementById('newDescription').value = '';
    document.getElementById('newSideDescription').value = '';
    document.getElementById('questionType').value = 'open';
    showOptionFields();
    document.getElementById('newAnswerOpen').value = '';
    document.getElementById('newAnswer').value = '';
    hideNewCategoryInputArea();
    let yesNoBoxes = document.getElementsByName('yesnoAdd');
    for (let i = 0; i < yesNoBoxes.length; i++) {
      yesNoBoxes[i].checked = false;
    }
    let opts = document.querySelectorAll('.option-input');
    opts.forEach(input => input.value = '');
  }

  function showOptionFields() {
    const type = document.getElementById('questionType').value;
    document.getElementById('openAnswer').style.display = (type === 'open') ? 'block' : 'none';
    document.getElementById('yesNoAnswer').style.display = (type === 'yesno') ? 'block' : 'none';
    document.getElementById('multipleOptions').style.display = (type === 'multiple') ? 'block' : 'none';
  }

  function addNewCategory() {
    const input = document.getElementById('newCategoryInput');
    const newCat = input.value.trim();
    if(newCat === '') {
      alert('Please enter a category name.');
      input.focus();
      return;
    }
    if (categories.includes(newCat)) {
      alert('Category already exists.');
      input.focus();
      return;
    }
    categories.push(newCat);
    categories.sort();
    populateCategorySelect();
    populateManageCategoryFilter();
    const select = document.getElementById('categorySelect');
    select.value = newCat;
    hideNewCategoryInputArea();
  }

  async function addQuestion() {
    let dt = document.getElementById('newDateTime').value;
    let questionText = document.getElementById('newQuestion').value.trim();
    let description = document.getElementById('newDescription').value.trim();
    let sideDescription = document.getElementById('newSideDescription').value.trim();

    let category;
    if(document.getElementById('newCategoryInputArea').style.display === 'flex') {
      category = document.getElementById('newCategoryInput').value.trim();
      if (!category) {
        alert("Please enter a category name or cancel.");
        return;
      }
    } else {
      let select = document.getElementById('categorySelect');
      category = select.value || 'Uncategorized';
    }

    let type = document.getElementById('questionType').value;

    if (!dt || !questionText) {
      alert("Please enter date/time and query text.");
      return;
    }
    if (!category) {
      alert("Please enter a category or fill it with 'Uncategorized'.");
      return;
    }

    if(!categories.includes(category)) {
      categories.push(category);
      categories.sort();
    }

    let correctAnswer;
    let options = [];

    if (type === 'open') {
      correctAnswer = document.getElementById('newAnswerOpen').value.trim();
      if (!correctAnswer) {
        alert("Please enter the correct answer.");
        return;
      }
    } else if (type === 'yesno') {
      let boxes = document.getElementsByName('yesnoAdd');
      correctAnswer = null;
      for (let i = 0; i < boxes.length; i++) {
        if (boxes[i].checked) {
          correctAnswer = boxes[i].value;
          break;
        }
      }
      if (!correctAnswer) {
        alert("Please select the correct answer (Yes, No, or Void).");
        return;
      }
    } else if (type === 'multiple') {
      const optionInputs = document.querySelectorAll('.option-input');
      options = [];
      optionInputs.forEach(inp => {
        if (inp.value.trim()) {
          options.push(inp.value.trim());
        }
      });
      if (options.length < 2) {
        alert("Please enter at least two options.");
        return;
      }
      correctAnswer = document.getElementById('newAnswer').value.trim();
      if (!correctAnswer) {
        alert("Please enter the correct answer.");
        return;
      }
      if (!options.includes(correctAnswer)) {
        alert("Correct answer must match one of the options.");
        return;
      }
    }

    const questionData = {
      datetime: dt,
      question: questionText,
      description: description,
      sideDescription: sideDescription,
      category: category,
      type: type,
      options: options,
      correctAnswer: correctAnswer
    };

    try {
      const editIndex = getEditIndex();
      let apiUrl = 'http://localhost:3000/api/questions';
      let method = 'POST';
      let questionId = null;

      if (editIndex !== null) {
        if (questions[editIndex] && questions[editIndex]._id) {
          questionId = questions[editIndex]._id;
          apiUrl = `http://localhost:3000/api/questions/${questionId}`;
          method = 'PUT';
        } else {
          console.error("Question ID not found for editIndex:", editIndex);
          alert("Error: Could not find the question to update.");
          return;
        }
      }

      const response = await fetch(apiUrl, {
        method: method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(questionData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Question saved/updated:', result);

      // Reload questions after saving
      await loadQuestionsFromStorage();
      initCategories();

      alert("Query " + (editIndex !== null ? "updated" : "added") + "!");
      closeQuestionPopup();

    } catch (error) {
      console.error('Error saving question:', error);
      alert('Failed to save question to the server.');
    }
  }

  function getEditIndex() {
    const val = document.getElementById('questionPopup').getAttribute('data-edit-index');
    if(val === '' || val === null) return null;
    const parsed = parseInt(val, 10);
    if(isNaN(parsed)) return null;
    return parsed;
  }
  function setEditIndex(index) {
    document.getElementById('questionPopup').setAttribute('data-edit-index', index);
    const btn = document.getElementById('addUpdateQuestionBtn');
    if(index !== null && index !== undefined) {
      btn.textContent = 'Update Query';
      document.getElementById('popupTitle').textContent = 'Edit Settlement Query';
    } else {
      btn.textContent = 'Add Query';
      document.getElementById('popupTitle').textContent = 'Add Settlement Query';
    }
  }
  function clearEditMode() {
    setEditIndex(null);
  }

  async function editQuery(index) {
    const query = questions[index];
    if(!query) return;
    // Populate fields
    document.getElementById('newDateTime').value = query.datetime;
    document.getElementById('newQuestion').value = query.question;
    document.getElementById('newDescription').value = query.description;
    document.getElementById('newSideDescription').value = query.sideDescription;

    // Check if category exists, if not add temporarily
    if(!categories.includes(query.category) && query.category) {
      categories.push(query.category);
      categories.sort();
      populateCategorySelect();
      populateManageCategoryFilter();
    }
    document.getElementById('categorySelect').value = query.category || '';

    document.getElementById('questionType').value = query.type;
    showOptionFields();

    if (query.type === 'open') {
      document.getElementById('newAnswerOpen').value = query.correctAnswer;
    } else if (query.type === 'yesno') {
      const boxes = document.getElementsByName('yesnoAdd');
      boxes.forEach(box => {
        box.checked = (box.value === query.correctAnswer);
      });
    } else if (query.type === 'multiple') {
      const optionInputs = document.querySelectorAll('.option-input');
      optionInputs.forEach((input, idx) => {
        input.value = query.options[idx] || '';
      });
      document.getElementById('newAnswer').value = query.correctAnswer;
    }

    document.getElementById('popupOverlay').style.display = 'block';
    document.getElementById('questionPopup').style.display = 'block';
    setEditIndex(index);
  }

  async function saveQuestionsToStorage() {
    // This function is no longer needed as we are saving directly to the database
    // through the API calls in addQuestion and removeSelectedQueries.
  }

  async function loadQuestionsFromStorage() {
    try {
      const response = await fetch('http://localhost:3000/api/questions');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      questions = await response.json();
    } catch (error) {
      console.error('Error loading questions:', error);
      alert('Failed to load questions from the server.');
      questions = []; // Ensure questions is an array even if loading fails
    }
    renderManageQueriesList(); // Refresh the list after loading
  }

  function showCategorySelector() {
    populateCategoryOptions();
    document.getElementById('categorySelectOverlay').style.display = 'flex';
  }

  function closeCategorySelector() {
    document.getElementById('categorySelectOverlay').style.display = 'none';
  }

  function showDifficultySelector() {
    const select = document.getElementById('quizCategorySelect');
    const selectedCat = select.value;
    if(!selectedCat) {
      alert('Please select a category.');
      return;
    }
    chosenCategory = selectedCat;
    closeCategorySelector();
    document.getElementById('difficultySelectOverlay').style.display = 'flex';
    // Set defaults for difficulty and query count dropdowns when opening
    const diffSelect = document.getElementById('quizDifficultySelect');
    const countSelect = document.getElementById('queryCountSelect');
    diffSelect.value = chosenDifficulty || 'easy';
    countSelect.value = chosenNumQueries || '10';
  }

  function closeDifficultySelector() {
    document.getElementById('difficultySelectOverlay').style.display = 'none';
  }

  function startQuiz() {
    const difficultySelect = document.getElementById('quizDifficultySelect');
    const selectedDiff = difficultySelect.value;
    if(!selectedDiff) {
      alert('Please select a difficulty.');
      return;
    }
    chosenDifficulty = selectedDiff;

    const queryCountSelect = document.getElementById('queryCountSelect');
    const selectedQueryCount = parseInt(queryCountSelect.value, 10);
    if(!selectedQueryCount || selectedQueryCount <= 0) {
      alert('Please select a valid number of queries.');
      return;
    }
    chosenNumQueries = selectedQueryCount;

    closeDifficultySelector();

    if(chosenCategory === 'All Categories') {
      filteredQuestions = questions.slice();
    } else {
      filteredQuestions = questions.filter(q => q.category === chosenCategory);
    }

    if(filteredQuestions.length === 0) {
      alert('No queries available for the selected category.');
      return;
    }

    // Limit questions count
    if (filteredQuestions.length > chosenNumQueries) {
      filteredQuestions = filteredQuestions.slice(0, chosenNumQueries);
    }

    currentIndex = 0;
    correctAnswers = 0;
    timedOutCount = 0;
    answeredCount = 0;
    userResponses = [];
    startTime = new Date();

    document.getElementById('homeScreen').style.display = 'none';
    document.getElementById('summary').style.display = 'none';
    document.getElementById('quizArea').style.display = 'block';

    showNextQuestion();
  }

  function showNextQuestion() {
    clearInterval(timerInterval);
    timeLeft = difficultyTimes[chosenDifficulty];
    if (timeLeft !== null) {
      updateTimerDisplay();
      timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        if(timeLeft <= 0) {
          clearInterval(timerInterval);
          feedback('Time is up!', false);
          timedOutCount++;
          answeredCount++;
          userResponses.push({question: filteredQuestions[currentIndex].question, correctAnswer: filteredQuestions[currentIndex].correctAnswer, userAnswer: null, timedOut: true});
          currentIndex++;
          setTimeout(() => {
            if(currentIndex <
