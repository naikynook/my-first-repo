// Firebase Poll App - Tutorial JavaScript
// This script demonstrates how to integrate Firebase Realtime Database with a simple web app
// It shows real-time data synchronization across multiple users

document.addEventListener('DOMContentLoaded', function() {

  // ========================================
  // STEP 1: FIREBASE CONFIGURATION
  // ========================================
  // The config object lives in firebase-config.js so it can be swapped without touching
  // this file. Firebase web configs are public by design; access is controlled by the
  // Realtime Database rules and by API key referrer restrictions.

  const firebaseConfig = window.FIREBASE_CONFIG;

  const yesButton = document.getElementById('vote-yes');
  const noButton = document.getElementById('vote-no');
  const yesCount = document.getElementById('yes-count');
  const noCount = document.getElementById('no-count');
  const totalVotes = document.getElementById('total-votes');
  const connectionStatus = document.getElementById('connection-status');

  if (!yesButton || !noButton || !yesCount || !noCount || !totalVotes) {
    return;
  }

  if (typeof firebase === 'undefined' || !firebaseConfig) {
    if (connectionStatus) {
      connectionStatus.innerHTML = '<p style="color: #f44336;">Firebase could not be loaded.</p>';
    }
    return;
  }

  // Initialize Firebase - this connects your app to Firebase services
  firebase.initializeApp(firebaseConfig);

  // Get a reference to the Firebase Realtime Database
  const database = firebase.database();

  // ========================================
  // STEP 2: SET UP REAL-TIME DATABASE LISTENERS
  // ========================================
  // Firebase Realtime Database automatically updates the app when data changes.
  // .on('value') listens for any change to our poll data.

  database.ref('poll/yes').on('value', function(snapshot) {
    const count = snapshot.val() || 0;
    yesCount.textContent = count;
    updateTotalVotes();
  });

  database.ref('poll/no').on('value', function(snapshot) {
    const count = snapshot.val() || 0;
    noCount.textContent = count;
    updateTotalVotes();
  });

  // ========================================
  // STEP 3: SET UP BUTTON EVENT LISTENERS
  // ========================================
  // A transaction increments safely even when several people vote at the same moment.

  function castVote(choice, label) {
    database.ref('poll/' + choice)
      .transaction(function(current) {
        return (current || 0) + 1;
      })
      .then(function() {
        showVoteConfirmation(label);
      })
      .catch(function(error) {
        console.error('Error recording vote:', error);
        showError('Failed to record vote. Please try again.');
      });
  }

  yesButton.addEventListener('click', function() {
    castVote('yes', 'Yes');
  });

  noButton.addEventListener('click', function() {
    castVote('no', 'No');
  });

  // ========================================
  // STEP 4: HELPER FUNCTIONS
  // ========================================

  function updateTotalVotes() {
    const yesVotes = parseInt(yesCount.textContent, 10) || 0;
    const noVotes = parseInt(noCount.textContent, 10) || 0;
    totalVotes.textContent = yesVotes + noVotes;
  }

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

  function showVoteConfirmation(vote) {
    showToast('Thank you for voting "' + vote + '"!', '#4CAF50');
  }

  function showError(message) {
    showToast(message, '#f44336');
  }

  // ========================================
  // STEP 5: CONNECTION STATUS MONITORING
  // ========================================

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
