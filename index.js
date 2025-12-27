const supabaseUrl = 'https://ndtryeokzkzzfkqwxmeo.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kdHJ5ZW9remt6emZrcXd4bWVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2NTQ5NDQsImV4cCI6MjA4MjIzMDk0NH0.ipjL2Iz4cj6yMkZPHpLYbEfBwfkyFpCWP2uRzmt5Uwg'
const db = supabase.createClient(supabaseUrl, supabaseKey)

const testInfo = document.getElementById("test_info")
const mainContent = document.getElementById("main_content")
const topScore = document.getElementById("personal_best_score")
const wordsPerMin = document.getElementById("words_per_min")
const accuracy = document.getElementById("accuracy")
const time = document.getElementById("time")
const startBtn = document.getElementById("start_test_btn")
const testText = document.getElementById("test_text")
const modal = document.getElementById("modal")
const retakeTestBtns = document.querySelectorAll(".retake_test_btn")
const difficultyRadios = document.querySelectorAll('input[name="difficulty_level"]')
const timeModeRadios = document.querySelectorAll('input[name="time_setting_value"]')
const resultModal = document.getElementById("result_modal")
const modalWpm = document.getElementById("modal_words_per_min")
const modalAcc = document.getElementById("modal_accuracy")
const modalChars = document.getElementById("char_stat")
const resultTitle = resultModal.querySelector("h1")
const resultIcon = resultModal.querySelector(".completed_icon")
const goAgainText = resultModal.querySelector(".retake_test_btn p")
const difficultySelect = document.getElementById("difficulty_settings_select")
const timeModeSelectDropdown = document.getElementById("time_mode_select")
const mobileInput = document.getElementById("mobile_input")
const leaderboardModal = document.getElementById('leaderboard-modal');
const openBtn = document.getElementById('leaderboard-btn');
const closeBtn = document.getElementById('close-leaderboard');

let selectedDifficulty = "easy"
let selectedTimeMode = "timed"
let timeLeft = 60
let secondsPassed = 0
let timerInterval = null
let isTestRunning = false
let charIndex = 0
let mistakes = 0
let allPassages = []
let currentWPM = 0;
let currentACC = 0;

updateLeaderboardUI()

async function uploadResult(wpm, accuracy) {
    const nameInput = document.getElementById('username-input');
    const finalName = nameInput.value.trim() || "Guest";

    nameInput.value = ''

    const { data, error } = await db
        .from('leaderboard')
        .insert([
            { 
                username: finalName, 
                wpm: wpm, 
                accuracy: accuracy, 
                difficulty: selectedDifficulty, 
                mode: selectedTimeMode 
            }
        ]);

    if (error) {
        console.error("Upload failed:", error.message);
    } else {
        console.log("Score saved for:", finalName);
        updateLeaderboardUI(); 
    }
}

async function loadPassageData() {
    try {
        const res = await fetch('./data.json')
        allPassages = await res.json()
    } catch (error) {
        console.error("Error loading data:", error)
    }
}
loadPassageData()

function syncInputs(name, value) {
    if (name === "difficulty") {
        selectedDifficulty = value
        difficultySelect.value = value
        difficultyRadios.forEach(r => r.checked = (r.value === value))
    } else {
        selectedTimeMode = value
        timeModeSelectDropdown.value = value
        timeModeRadios.forEach(r => r.checked = (r.value === value))
        time.innerText = value === "timed" ? "60" : "0"
    }
}

async function getTopScores() {
    const { data, error } = await db
        .from('leaderboard')
        .select('username, wpm, accuracy, difficulty')
        .order('wpm', { ascending: false })
        .limit(10)

    if (error) {
        console.error("Fetch error:", error.message)
    } else {
        console.log("Top Scores:", data)
    }
}

async function updateLeaderboardUI() {
    const { data: scores, error } = await db
        .from('leaderboard')
        .select('username, wpm, accuracy, mode')
        .order('wpm', { ascending: false })
        .limit(10);

    if (error) {
        console.error("Could not load leaderboard:", error.message);
        return;
    }

    const tableBody = document.getElementById('leaderboard-body');
    tableBody.innerHTML = "";

    scores.forEach((score, index) => {
        let rankDisplay;
        if (index === 0) rankDisplay = "🥇";
        else if (index === 1) rankDisplay = "🥈";
        else if (index === 2) rankDisplay = "🥉";
        else rankDisplay = `#${index + 1}`;

        const row = `
            <tr>
                <td>${rankDisplay}</td>
                <td class="player-name">${score.username}</td>
                <td class="stat-wpm">${score.wpm}</td>
                <td class="stat-acc">${score.accuracy}%</td>
            </tr>
        `;
        tableBody.innerHTML += row;
    });
}
difficultyRadios.forEach(r => r.addEventListener('change', e => syncInputs("difficulty", e.target.value)))
difficultySelect.addEventListener("change", e => syncInputs("difficulty", e.target.value))
timeModeRadios.forEach(r => r.addEventListener("change", e => syncInputs("mode", e.target.value)))
timeModeSelectDropdown.addEventListener("change", e => syncInputs("mode", e.target.value))

function handleTypingLogic(typedChar) {
    if (!isTestRunning) return
    const spans = testText.querySelectorAll("span")
    if (charIndex >= spans.length) return

    if (charIndex === 0 && !timerInterval) startTimer()

    const targetChar = spans[charIndex].innerText
    if (typedChar === targetChar) {
        spans[charIndex].classList.add("correct")
    } else {
        spans[charIndex].classList.add("incorrect")
        mistakes++
    }

    spans[charIndex].classList.remove("cursor")
    charIndex++

    if (charIndex < spans.length) {
        spans[charIndex].classList.add("cursor")
    } else {
        endTest("complete")
    }
}

function handleBackspace() {
    const spans = testText.querySelectorAll("span")
    if (charIndex > 0) {
        spans[charIndex]?.classList.remove("cursor")
        charIndex--
        if (spans[charIndex].classList.contains("incorrect")) mistakes--
        spans[charIndex].classList.remove("correct", "incorrect")
        spans[charIndex].classList.add("cursor")
    }
}

window.addEventListener("keydown", (e) => {
    if (!isTestRunning) return
    if (e.key === "Backspace") {
        handleBackspace()
    } else {
        mobileInput.focus()
    }
})

mobileInput.addEventListener("input", (e) => {
    if (e.inputType === "deleteContentBackward") {
        handleBackspace()
    } else if (e.data) {
        handleTypingLogic(e.data)
    }
    mobileInput.value = "" 
})

document.addEventListener("click", () => {
    if (isTestRunning) mobileInput.focus()
})

startBtn.addEventListener('click', (e) => {
    e.stopPropagation()
    initTest()
})

modal.addEventListener('click', () => {
    initTest()
})

function initTest() {
    if (allPassages.length === 0) return
    modal.style.display = "none"
    mobileInput.focus()
    charIndex = 0
    mistakes = 0
    wordsPerMin.innerText = "0"
    accuracy.innerText = "100%"
    isTestRunning = true
    renderPassage()
}

function startTimer() {
    if (timerInterval) return
    if (selectedTimeMode === "timed") {
        timeLeft = 60
        timerInterval = setInterval(() => {
            if (timeLeft > 0) {
                timeLeft--
                time.innerText = timeLeft
            } else {
                endTest()
            }
        }, 1000)
    } else {
        secondsPassed = 0
        timerInterval = setInterval(() => {
            secondsPassed++
            time.innerText = secondsPassed
        }, 1000)
    }
}

function endTest() {
    clearInterval(timerInterval)
    timerInterval = null
    isTestRunning = false
    resultModal.style.display = 'flex'
    testInfo.style.display = 'none'
    mainContent.style.display = "none"
    calculateResults()
}

function calculateResults() {
    let secs = (selectedTimeMode === "timed") ? (60 - timeLeft) : secondsPassed
    if (secs <= 0) secs = 1
    let wpm = Math.round((charIndex / 5) / (secs / 60))
    let acc = charIndex > 0 ? Math.round(((charIndex - mistakes) / charIndex) * 100) : 0

    modalWpm.innerText = wpm
    modalAcc.innerText = acc + "%"
    modalChars.innerHTML = `<span class="correct_text">${charIndex - mistakes}</span>/<span class="mistaken">${mistakes}</span>`
    currentWPM = Math.round((charIndex / 5) / (secs / 60));
    currentACC = charIndex > 0 ? Math.round(((charIndex - mistakes) / charIndex) * 100) : 0;


    let pbData = JSON.parse(localStorage.getItem("pbData")) || { wpm: 0, acc: 0 }

    if (pbData.wpm === 0) {
        resultTitle.innerText = "Baseline Established!"
    } else if (wpm > pbData.wpm) {
        resultTitle.innerText = "High Score Smashed!"
        if (goAgainText) goAgainText.innerText = "Beat This Score"
        resultIcon.src = "./assets/images/icon-personal-best.svg"
        resultIcon.src = "./assets/images/pattern-confetti.svg" 
        resultModal.classList.add("is-pb")
    } else {
        resultTitle.innerText = "Test Complete!"
        if (goAgainText) goAgainText.innerText = "Go Again"
        resultIcon.src = "./assets/images/icon-completed.svg"
    }

    if (wpm > pbData.wpm) {
        localStorage.setItem("pbData", JSON.stringify({ wpm, acc }))
        topScore.innerText = `${wpm} WPM (${acc}% Acc)`
    }
}

openBtn.addEventListener('click', () => {
    leaderboardModal.style.display = 'flex';
    updateLeaderboardUI();
});

closeBtn.addEventListener('click', () => {
    leaderboardModal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === leaderboardModal) {
        leaderboardModal.style.display = 'none';
    }
});

retakeTestBtns.forEach(btn => {
    btn.addEventListener("click", async () => {
        await uploadResult(currentWPM, currentACC);

        clearInterval(timerInterval);
        timerInterval = null;
        isTestRunning = false;
        resultModal.style.display = "none";
        testInfo.style.display = "flex";
        mainContent.style.display = "block";
        modal.style.display = "flex";
        time.innerText = selectedTimeMode === "timed" ? "60" : "0";
        testText.innerHTML = "";
        
        document.getElementById('username-input').value = "";
    });
});

function renderPassage() {
    const filtered = allPassages[selectedDifficulty]
    const text = filtered[Math.floor(Math.random() * filtered.length)].text
    testText.innerHTML = ""
    text.split("").forEach((char, i) => {
        const span = document.createElement("span")
        span.innerText = char
        if (i === 0) span.classList.add("cursor")
        testText.appendChild(span)
    })
}

async function initializeApp() {
    await loadPassageData();
    updateLeaderboardUI();
    
    const savedPB = JSON.parse(localStorage.getItem("pbData"));
    topScore.innerText = savedPB ? `${savedPB.wpm} WPM (${savedPB.acc}% Acc)` : "0 WPM (0% Acc)";
}

initializeApp();