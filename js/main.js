(function () {
  // Cache DOM elements
  const bodyEl = document.getElementById('body')
  const playBtn = document.getElementById('play')
  const scoreEl = document.getElementById('score')
  const highScoreWrapper = document.getElementById('high-score-display')
  const highScoreEl = document.getElementById('high-score')
  const repeatBtn = document.getElementById('repeat-btn')
  const repeatTokenEl = repeatBtn.getElementsByClassName('badge')[0]
  const settingsBtn = document.getElementById('settings-btn')
  const muteBtn = document.getElementById('mute-btn')
  const muteIcon = muteBtn.getElementsByTagName('i')[0]
  const darkModeBtn = document.getElementById('dark-mode-btn')
  const darkModeIcon = darkModeBtn.getElementsByTagName('i')[0]
  const dimmerEl = document.getElementById('dimmer')
  const settingsPopupEl = document.getElementById('settings')
  const closeSettingsBtn = document.getElementById('close-settings')
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
    btn.el.addEventListener('click', () => onPlayerPress(btn))
    btn.el.disabled = true
  })
  repeatBtn.addEventListener('click', repeat)
  settingsBtn.addEventListener('click', openSettingsMenu)
  muteBtn.addEventListener('click', toggleMute)
  darkModeBtn.addEventListener('click', toggleDarkMode)
  closeSettingsBtn.addEventListener('click', closeSettingsMenu)
  loadHighScore()
  loadDarkMode()
  loadMuteSetting()
  loadRepeatTokens()

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
  async function gameOver () {
    // DOM effects
    scoreEl.classList.add('flash')
    sequence[playerTurn].el.classList.add('flash')
    buttons.forEach(btn => btn.el.disabled = true)

    // Check for high score
    let score = parseInt(scoreEl.innerText)
    let highscore = parseInt(highScoreEl.innerText)
    if (score > highscore) {
      saveHighScore(score)
    }

    playBtn.disabled = false

    // Set game state
    isPlaying = false
  }

  /// Game action functions

  /**
   * Simon takes a turn
   */
  async function simonTurn () {
    repeatBtn.classList.add('disabled')
    await wait(100)
    buttons.forEach(btn => btn.el.disabled = true)
    playerTurn = 0

    // Buffer before turn begins
    await wait(scaleNumber(950, 250, 20))

    // Repeat previous sequence
    await simonRepeat()

    // Add another random button to the sequence
    let randomBtn = buttons[Math.floor(Math.random() * buttons.length)]
    sequence.push(randomBtn)
    await simonPress(randomBtn)

    buttons.forEach(btn => btn.el.disabled = false)
    repeatBtn.classList.remove('disabled')
  }

  async function simonRepeat () {
    for (let i = 0; i < sequence.length; i++) {
      await simonPress(sequence[i])
      await wait(scaleNumber(500, 50, 10))
    }
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
   * Uses a repeat token to replay Simon's last sequence
   */
  async function repeat () {
    // Catch disabled repeat button
    if (repeatBtn.classList.contains('disabled')) return
    // User is not in-game
    if (!isPlaying) return
    // User has no repeat tokens
    if (!removeRepeatToken()) return

    repeatBtn.classList.add('disabled')
    await simonRepeat()
    repeatBtn.classList.remove('disabled')
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
    muteIcon.classList.toggle('fa-volume')
    muteIcon.classList.toggle('fa-volume-mute')
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
      muteIcon.classList.remove('fa-volume')
      muteIcon.classList.add('fa-volume-mute')
    }
  }

  /**
   * Toggle dark mode
   */
  function toggleDarkMode () {
    darkModeIcon.classList.toggle('fa-sun')
    darkModeIcon.classList.toggle('fa-eclipse-alt')
    bodyEl.classList.toggle('dark')
    if (localStorage.getItem('darkMode')) localStorage.removeItem('darkMode')
    else localStorage.setItem('darkMode', 'on')
  }

  /**
   * Loads the user's dark mode preference from local storage
   */
  function loadDarkMode () {
    const darkMode = localStorage.getItem('darkMode')
    if (darkMode === 'on') {
      darkModeIcon.classList.remove('fa-sun')
      darkModeIcon.classList.add('fa-eclipse-alt')
      bodyEl.classList.add('dark')
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
   * Increment user's repeat tokens by 1
   */
  function addRepeatToken () {
    let repeatTokens = parseInt(localStorage.getItem('repeatTokens')) || 0
    repeatTokens++
    localStorage.setItem('repeatTokens', repeatTokens)
    repeatTokenEl.classList.remove('hidden')
    repeatTokenEl.innerText = repeatTokens
  }

  /**
   * Decrement user's repeat tokens by 1
   * @returns {boolean} true if able to remove a repeat token, else false
   */
  function removeRepeatToken () {
    let repeatTokens = parseInt(localStorage.getItem('repeatTokens')) || 0
    if (repeatTokens === 0) return false
    repeatTokens--
    localStorage.setItem('repeatTokens', repeatTokens)
    if (!repeatTokens) repeatTokenEl.classList.add('hidden')
    repeatTokenEl.innerText = repeatTokens
    return true
  }

  /**
   * Load the user's current repeat tokens
   */
  function loadRepeatTokens () {
    let repeatTokens = parseInt(localStorage.getItem('repeatTokens')) || 0
    if (!repeatTokens) repeatTokenEl.classList.add('hidden')
    else repeatTokenEl.classList.remove('hidden')
    repeatTokenEl.innerText = repeatTokens
  }

  /**
   * Update display with the given high score
   * @param {number} score high score to update the display with
   */
  function showHighScore (score) {
    highScoreEl.innerText = score
    highScoreWrapper.classList.remove('hidden')
  }

  /**
   * Open the settings menu popup
   */
  function openSettingsMenu () {
    dimmerEl.classList.remove('hidden')
    settingsPopupEl.classList.remove('hidden')
    settingsPopupEl.classList.remove('close')
    settingsPopupEl.classList.add('open')
  }

  /**
   * Close the settings menu popup
   */
  async function closeSettingsMenu () {
    dimmerEl.classList.add('hidden')
    settingsPopupEl.classList.remove('open')
    settingsPopupEl.classList.add('close')
    await wait(200)
    settingsPopupEl.classList.add('hidden')
  }
  
})()