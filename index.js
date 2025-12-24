const testInfo = document.getElementById("test_info")
const mainContent = document.getElementById("main_content")
const topScore = document.getElementById("personal_best_score")
const wordsPerMin = document.getElementById("words_per_min")
const accuracy = document.getElementById("accuracy")
const time = document.getElementById("time")
const startBtn = document.getElementById("start_test_btn")
const testContent = document.getElementById("test_content")
const modal = document.getElementById("modal")
const textHolder = document.getElementById("text_holder")
const testText = document.getElementById("test_text")
const retakeTestBtns = document.querySelectorAll(".retake_test_btn")
const difficultyRadios = document.querySelectorAll('input[name="difficulty_level"]')
const timeModeSelect = document.querySelectorAll('input[name="time_setting_value"]')
const resultModal = document.getElementById("result_modal")
const goAgainBtn = document.getElementById("goagain_btn")
const modalWpm = document.getElementById("modal_words_per_min")
const modalAcc = document.getElementById("modal_accuracy")
const modalChars = document.getElementById("char_stat")
const resultTitle = resultModal.querySelector("h1")
const resultDesc = resultModal.querySelector("p")
const resultIcon = resultModal.querySelector(".completed_icon")
const goAgainText = resultModal.querySelector(".retake_test_btn p")
const difficultySelect = document.getElementById("difficulty_settings_select")
const timeModeSelectDropdown = document.getElementById("time_mode_select")
const mobileInput = document.getElementById("mobile_input")

let selectedDifficulty = "easy"
let selectedTimeMode = "timed"

let timeLeft = 60
let secondsPassed = 0
let timerInterval = null
let isTestRunning = false

let charIndex = 0
let mistakes = 0

let allPassages = []

async function loadPassageData() {
    try {
        const res = await fetch('./data.json')
        const data = await res.json()
        allPassages = data
        console.log("Data loaded successfully!")
    } catch (error) {
        console.error("Could not load the JSON file:", error)
    }
}

loadPassageData()

difficultyRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
        selectedDifficulty = e.target.value
    })

    radio.addEventListener('click', (e) => {
        e.stopPropagation()
    })
})

timeModeSelect.forEach(radio => {
    radio.addEventListener("change", (e) => {
        selectedTimeMode = e.target.value
    })

    radio.addEventListener('click', (e) => {
        e.stopPropagation()
    })
})

difficultySelect.addEventListener("change", (e) => {
    selectedDifficulty = e.target.value
})

timeModeSelectDropdown.addEventListener("change", (e) => {
    selectedTimeMode = e.target.value
    time.innerText = selectedTimeMode === "timed" ? "60" : "0"
})

startBtn.addEventListener('click', function() {
    if (allPassages.length === 0 && Object.keys(allPassages).length === 0) {
        console.log("Still loading data... please wait.")
        return
    }

    modal.style.display = "none"

    charIndex = 0
    mistakes = 0

    isTestRunning = true
   
    renderPassage()
})

modal.addEventListener('click', function() {
    if (allPassages.length === 0) {
        console.log("Still loading data...")
        return
    }

    modal.style.display = "none" 
    mobileInput.focus() 

    charIndex = 0
    mistakes = 0
    wordsPerMin.innerText = "0"
    accuracy.innerText = "0%"

    selectedTimeMode = document.querySelector('input[name="time_setting_value"]:checked').value
    time.innerText = selectedTimeMode === "timed" ? "60" : "0"

    isTestRunning = true
    renderPassage()
})

function startTimer() {
    if (timerInterval) return
    isTestRunning = true

    if (selectedTimeMode === "timed") {
        timeLeft = 60
        time.innerText = timeLeft

        timerInterval = setInterval(() => {
            if(timeLeft > 0) {
                timeLeft--
                time.innerText = timeLeft
            } else {
                endTest()
            }
        }, 1000)   
    }
    else if (selectedTimeMode === "passage") {
        secondsPassed = 0
        time.innerText = "0"

        timerInterval = setInterval(() => {
            secondsPassed++
            time.innerText = secondsPassed
        }, 1000)
    }
}

function endTest(reason) {
    clearInterval(timerInterval)
    timerInterval = null
    isTestRunning = false
    
    if (reason === "complete") {
        resultModal.style.display = 'flex'
        testInfo.style.display = 'none'
        mainContent.style.display = "none"
    } else {
        alert("Time is up!")
        resultModal.style.display = 'flex'
        testInfo.style.display = 'none'
        mainContent.style.display = "none"
    }

    calculateResults()
}

window.addEventListener("keydown", (e) => {
    if (!isTestRunning) return

    const functionalKeys = ["Shift", "Control", "Alt", "Meta", "CapsLock", "Tab", "Escape"]
    if (functionalKeys.includes(e.key)) return

    const characters = testText.querySelectorAll("span")
    const typedChar = e.key
    const targetChar = characters[charIndex].innerText

    if (charIndex === 0 && !timerInterval) { 
        startTimer()
    }

    if (typedChar === "Backspace") {
        if (charIndex > 0) {
            characters[charIndex].classList.remove("cursor")
            charIndex--
            
            if (characters[charIndex].classList.contains("incorrect")) {
                mistakes-- 
            }

            characters[charIndex].classList.remove("correct", "incorrect", "cursor")
            characters[charIndex].classList.add("cursor")
        }
        return
    }

    if (typedChar === targetChar) {
        characters[charIndex].classList.add("correct")
    } else {
        characters[charIndex].classList.add("incorrect")
        mistakes++
    }

    characters[charIndex].classList.remove("cursor")
    charIndex++

    if (charIndex < characters.length) {
        characters[charIndex].classList.add("cursor")
    } else {
        endTest("complete") 
    }
})

function handleCharInput(char) {
    if (!isTestRunning || charIndex >= testText.querySelectorAll("span").length) return

    const characters = testText.querySelectorAll("span")
    const targetChar = characters[charIndex].innerText

    if (char === targetChar) {
        characters[charIndex].classList.add("correct")
    } else {
        characters[charIndex].classList.add("incorrect")
        mistakes++
    }

    characters[charIndex].classList.remove("cursor")
    charIndex++

    if (charIndex < characters.length) {
        characters[charIndex].classList.add("cursor")
    } else {
        endTest("complete")
    }
}

mobileInput.addEventListener("input", (e) => {
    const char = e.data
    
    if (!char) return; 

    if (charIndex === 0 && !timerInterval) {
        startTimer();
    }

    handleCharInput(char);
    mobileInput.value = "";
});

function calculateResults() {
    let timeSpentSeconds = (selectedTimeMode === "timed") ? (60 - timeLeft) : secondsPassed
    if (timeSpentSeconds <= 0) timeSpentSeconds = 1

    let wpm = Math.round((charIndex / 5) / (timeSpentSeconds / 60))
    let acc = charIndex > 0 ? Math.round(((charIndex - mistakes) / charIndex) * 100) : 0

    modalWpm.innerText = wpm
    modalAcc.innerText = acc + "%"
    modalChars.innerHTML = `<span class="correct_text">${charIndex - mistakes}</span>/<span class="mistaken">${mistakes}</span>`

    let pbData = JSON.parse(localStorage.getItem("pbData")) || { wpm: 0, acc: 0 }

    if (pbData.wpm === 0) {
        resultTitle.innerText = "Baseline Established!"
        resultDesc.innerText = "You've set the bar. Now the real challenge begins—time to beat it."
        resultIcon.src = "./assets/images/icon-completed.svg"
    } else if (wpm > pbData.wpm) {
        resultTitle.innerText = "High Score Smashed!"
        resultDesc.innerText = "You're getting faster. That was incredible typing."
        if (goAgainText) goAgainText.innerText = "Beat This Score"
        resultIcon.src = "./assets/images/icon-personal-best.svg"
        resultIcon.src = "./assets/images/pattern-confetti.svg"
        resultModal.classList.add("is-pb")
    } else {
        resultTitle.innerText = "Test Complete!"
        resultDesc.innerText = "Solid run. Keep pushing to beat your high score."
        if (goAgainText) goAgainText.innerText = "Go Again"
        resultIcon.src = "./assets/images/icon-completed.svg"
    }

    if (wpm > pbData.wpm) {
        pbData = { wpm: wpm, acc: acc }
        localStorage.setItem("pbData", JSON.stringify(pbData))
        topScore.innerText = `${pbData.wpm} WPM (${pbData.acc}% Acc)`
    }
}

retakeTestBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        clearInterval(timerInterval)
        timerInterval = null
        isTestRunning = false
        charIndex = 0
        mistakes = 0
        timeLeft = 60
        secondsPassed = 0

        resultModal.style.display = "none"
        testInfo.style.display = "flex"
        mainContent.style.display = "block"
        modal.style.display = "flex"
        
        time.innerText = selectedTimeMode === "timed" ? "0:60" : "0"
        wordsPerMin.innerText = "0"
        accuracy.innerText = "100%"
        testText.innerHTML = ""

        testText.innerHTML = ""
        renderPassage()
    })
})

function renderPassage() {
    const filtered = allPassages[selectedDifficulty]

    const randomIndex = Math.floor(Math.random() * filtered.length)
    const randomObj = filtered[randomIndex]
    const text = randomObj.text

    testText.innerHTML = ""
    text.split("").forEach(char => {
        const span = document.createElement("span")
        span.innerText = char
        testText.appendChild(span)
    })

    charIndex = 0
    mistakes = 0

    testText.innerHTML = ""
    text.split("").forEach((char, index) => {
        const span = document.createElement("span")
        span.innerText = char
        if (index === 0) span.classList.add("cursor")
        testText.appendChild(span)
    })
}

const savedPB = JSON.parse(localStorage.getItem("pbData"))
if (savedPB) {
    topScore.innerText = `${savedPB.wpm} WPM (${savedPB.acc}% Acc)`
} else {
    topScore.innerText = "0 WPM (0% Acc)"
}