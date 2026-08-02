// Firebase FRT Survey — five yes/no questions with live counts
// Answers sync through Firebase Realtime Database for everyone on the page.

document.addEventListener('DOMContentLoaded', function() {
  const firebaseConfig = window.FIREBASE_CONFIG;
  const surveyRoot = document.getElementById('frt-survey');
  const connectionStatus = document.getElementById('connection-status');
  const questionBlocks = surveyRoot
    ? surveyRoot.querySelectorAll('.poll-question-block')
    : [];

  if (!surveyRoot || !questionBlocks.length) {
    return;
  }

  if (typeof firebase === 'undefined' || !firebaseConfig) {
    if (connectionStatus) {
      connectionStatus.innerHTML = '<p style="color: #f44336;">Firebase could not be loaded.</p>';
    }
    return;
  }

  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  const database = firebase.database();
  const surveyRef = database.ref('survey/frt');

  const questions = ['q1', 'q2', 'q3', 'q4', 'q5'];

  function updateBlockTotals(block) {
    const yesEl = block.querySelector('[data-count="yes"]');
    const noEl = block.querySelector('[data-count="no"]');
    const totalEl = block.querySelector('[data-count="total"]');
    if (!yesEl || !noEl || !totalEl) {
      return;
    }
    const yesVotes = parseInt(yesEl.textContent, 10) || 0;
    const noVotes = parseInt(noEl.textContent, 10) || 0;
    totalEl.textContent = yesVotes + noVotes;
  }

  // Live listeners for each question's yes/no counts
  questions.forEach(function(questionId) {
    const block = surveyRoot.querySelector('[data-question="' + questionId + '"]');
    if (!block) {
      return;
    }

    surveyRef.child(questionId + '/yes').on('value', function(snapshot) {
      const yesEl = block.querySelector('[data-count="yes"]');
      if (yesEl) {
        yesEl.textContent = snapshot.val() || 0;
      }
      updateBlockTotals(block);
    });

    surveyRef.child(questionId + '/no').on('value', function(snapshot) {
      const noEl = block.querySelector('[data-count="no"]');
      if (noEl) {
        noEl.textContent = snapshot.val() || 0;
      }
      updateBlockTotals(block);
    });
  });

  function castVote(questionId, choice) {
    surveyRef.child(questionId + '/' + choice)
      .transaction(function(current) {
        return (current || 0) + 1;
      })
      .then(function() {
        showToast('Response recorded: ' + choice.toUpperCase(), '#4CAF50');
      })
      .catch(function(error) {
        console.error('Error recording vote:', error);
        showToast('Failed to record vote. Please try again.', '#f44336');
      });
  }

  questionBlocks.forEach(function(block) {
    const questionId = block.getAttribute('data-question');
    block.querySelectorAll('[data-vote]').forEach(function(button) {
      button.addEventListener('click', function() {
        const choice = button.getAttribute('data-vote');
        if (questionId && (choice === 'yes' || choice === 'no')) {
          castVote(questionId, choice);
        }
      });
    });
  });

  function showToast(message, background) {
    const toast = document.createElement('div');
    toast.className = 'poll-toast';
    toast.textContent = message;
    toast.style.background = background;
    document.body.appendChild(toast);

    setTimeout(function() {
      toast.classList.add('is-leaving');
      setTimeout(function() {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }

  if (connectionStatus) {
    database.ref('.info/connected').on('value', function(snapshot) {
      if (snapshot.val()) {
        connectionStatus.innerHTML = '<p style="color: #4CAF50;">Connected to Firebase</p>';
      } else {
        connectionStatus.innerHTML = '<p style="color: #f44336;">Disconnected from Firebase</p>';
      }
    });
  }
});
