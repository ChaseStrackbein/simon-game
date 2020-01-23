(function () {
  // Cache DOM elements
  const playBtn = document.getElementById('play')
  const scoreEl = document.getElementById('score')
  const highScoreWrapper = document.getElementById('high-score-display')
  const highScoreEl = document.getElementById('high-score')
  const volumeControl = document.getElementById('volume-control')
  const buttons = [
    {
      el: document.getElementById('green'),
      note: document.getElementById('green-note')
    },
    {
      el: document.getElementById('red'),
      note: document.getElementById('red-note')
    },
    {
      el: document.getElementById('yellow'),
      note: document.getElementById('yellow-note')
    },
    {
      el: document.getElementById('blue'),
      note: document.getElementById('blue-note')
    }
  ]

  // Define game state variables
  let isPlaying = false
  let isMuted = false
  let sequence = []
  let playerTurn = 0
  let playerTimeout = null

  // DOM init
  playBtn.addEventListener('click', newGame)
  buttons.forEach(btn => {
    btn.el.addEventListener('mousedown', () => onPlayerPress(btn))
    btn.el.disabled = true
  })
  volumeControl.addEventListener('click', toggleMute)
  loadHighScore()
  loadMuteSetting()

  /// Game state functions

  /**
   * Start a new game session
   */
  function newGame () {
    // DOM cleanup
    playBtn.disabled = true
    buttons.forEach(btn => btn.el.classList.remove('flash'))
    scoreEl.classList.remove('flash')
    scoreEl.innerText = 0

    // Reset game state
    isPlaying = true
    sequence = []
    playerTurn = 0
    playerTimeout = null

    simonTurn()
  }

  /**
   * Ends the current game session
   */
  function gameOver () {
    // DOM effects
    scoreEl.classList.add('flash')
    sequence[playerTurn].el.classList.add('flash')
    buttons.forEach(btn => btn.el.disabled = true)
    playBtn.disabled = false

    // Check for high score
    let score = parseInt(scoreEl.innerText)
    let highscore = parseInt(highScoreEl.innerText)
    if (score > highscore) {
      saveHighScore(score)
    }

    // Set game state
    isPlaying = false
  }

  /// Game action functions

  /**
   * Simon takes a turn
   */
  async function simonTurn () {
    await wait(50)
    buttons.forEach(btn => btn.el.disabled = true)
    playerTurn = 0

    // Buffer before turn begins
    await wait(scaleNumber(950, 250, 20))

    // Repeat previous sequence
    for (let i = 0; i < sequence.length; i++) {
      await simonPress(sequence[i])
      await wait(scaleNumber(500, 50, 10))
    }

    // Add another random button to the sequence
    let randomBtn = buttons[Math.floor(Math.random() * buttons.length)]
    sequence.push(randomBtn)
    await simonPress(randomBtn)

    buttons.forEach(btn => btn.el.disabled = false)
  }

  /**
   * Simon presses a button
   * @param {object} btn button to press
   */
  async function simonPress (btn) {
    btn.el.classList.add('active')
    playNote(btn.note)
    await wait(btn.note.duration * 500)
    btn.el.classList.remove('active')
  }

  /**
   * Called when the player presses a button
   * @param {object} btn button that has been pressed
   */
  function onPlayerPress (btn) {
    if (!isPlaying) return

    playNote(btn.note)
    if (playerTimeout) clearTimeout(playerTimeout)
    if (btn.el.id !== sequence[playerTurn].el.id) {
      gameOver()
      return
    }

    playerTurn++
    if (playerTurn < sequence.length) {
      playerTimeout = setTimeout(gameOver, scaleNumber(5000, 2000, 10))
      return
    }

    scoreEl.innerText = sequence.length
    if (sequence.length >= 1000) {
      gameOver()
      return
    }
    
    simonTurn()
  }

  /// Utility functions

  /**
   * Wait a duration
   * @param {number} ms time to wait in milliseconds
   * @returns {Promise} promise that is resolved after given duration
   */
  async function wait (ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Plays a note
   * @param {HTMLMediaElement} note note to play
   */
  function playNote (note) {
    if (isMuted) return

    if (note.paused) note.play()
    else note.currentTime = 0
  }

  /**
   * Scale a number based on the current round
   * @param {number} initialValue value to scale from
   * @param {number} finalValue value to scale to
   * @param {number} roundsToFinalValue number of rounds to reach finalValue
   * @returns {number} scaled value
   */
  function scaleNumber (initialValue, finalValue, roundsToFinalValue) {
    let finalDifference = initialValue - finalValue
    let divisor = Math.min(sequence.length - 1, roundsToFinalValue - 1)
    let dividend = roundsToFinalValue - 1
    let scale = divisor / dividend
    return initialValue - (finalDifference * scale)
  }

  /**
   * Toggle game mute
   */
  function toggleMute () {
    isMuted = !isMuted
    volumeControl.classList.toggle('fa-volume')
    volumeControl.classList.toggle('fa-volume-mute')
    if (isMuted) {
      buttons.forEach(btn => btn.note.pause())
      localStorage.setItem('volume', 'mute')
    } else {
      localStorage.removeItem('volume')
    }
  }
  
  /**
   * Loads the user's volume preference from local storage
   */
  function loadMuteSetting () {
    const volume = localStorage.getItem('volume')
    if (volume === 'mute') {
      isMuted = true
      volumeControl.classList.remove('fa-volume')
      volumeControl.classList.add('fa-volume-mute')
    }
  }

  /**
   * Save the user's high score to local storage
   * @param {number} score score to save
   */
  function saveHighScore (score) {
    localStorage.setItem('highscore', score)
    showHighScore(score)
  }

  /**
   * Load the user's high score from local storage
   */
  function loadHighScore () {
    let highScore = localStorage.getItem('highscore')
    if (highScore) {
      showHighScore(highScore)
    }
  }

  /**
   * Update display with the given high score
   * @param {number} score high score to update the display with
   */
  function showHighScore (score) {
    highScoreEl.innerText = score
    highScoreWrapper.classList.remove('hidden')
  }
  
})()