const topScore = document.getElementById("personal_best_score")
const wordsPerMin = document.getElementById("words_per_min")
const accuracy = document.getElementById("accuracy")
const time = document.getElementById("time")
const startBtn = document.getElementById("start_test_btn")
const testContent = document.getElementById("test_content")
const modal = document.getElementById("modal")
const textHolder = document.getElementById("text_holder")
const testText = document.getElementById("test_text")
const retakeTestBtn = document.getElementById("retake_test_btn")
const difficultyRadios = document.querySelectorAll('input[name="difficulty_level"]')
const timeModeSelect = document.querySelectorAll('input[name="time_setting_value"]')
const cursor = document.querySelector('.custom-cursor');


let selectedDifficulty = document.querySelector('input[name="difficulty_level"]:checked').value;
let selectedTimeMode = document.querySelector('input[name="time_setting_value"]:checked').value;

let timeLeft = 60;
let secondsPassed = 0;
let timerInterval = null;
let isTestRunning = false;

let charIndex = 0;
let mistakes = 0;

let allPassages = []

window.addEventListener('mousemove', (e) => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
});

window.addEventListener('mousedown', () => cursor.classList.add('clicking'));
window.addEventListener('mouseup', () => cursor.classList.remove('clicking'));

const interactables = [modal, retakeTestBtn, ...difficultyRadios, ...timeModeSelect];

interactables.forEach(el => {
    if(!el) return;
    el.addEventListener('mouseenter', () => cursor.classList.add('hovering'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('hovering'));
});

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
        e.stopPropagation();
    });
})

timeModeSelect.forEach(radio => {
    radio.addEventListener("change", (e) => {
        selectedTimeMode = e.target.value
    })

    radio.addEventListener('click', (e) => {
        e.stopPropagation();
    });
})

startBtn.addEventListener('click', function() {
    if (allPassages.length === 0 && Object.keys(allPassages).length === 0) {
        console.log("Still loading data... please wait.");
        return;
    }

    modal.style.display = "none"

    charIndex = 0;
    mistakes = 0;

    isTestRunning = true;
   
    renderPassage()
})

modal.addEventListener('click', function() {
    if (allPassages.length === 0) {
        console.log("Still loading data...");
        return;
    }

    modal.style.display = "none";

    charIndex = 0;
    mistakes = 0;
    wordsPerMin.innerText = "0";
    accuracy.innerText = "0%";

    selectedTimeMode = document.querySelector('input[name="time_setting_value"]:checked').value;
    time.innerText = selectedTimeMode === "timed" ? "60" : "0";

    isTestRunning = true;
    renderPassage();
});

function startTimer() {
    if (timerInterval) return;
    isTestRunning = true

    if (selectedTimeMode === "timed") {
        timeLeft = 60
        time.innerText = timeLeft

        timerInterval = setInterval(() => {
            if(timeLeft > 0) {
                timeLeft--;
                time.innerText = timeLeft
            } else {
                endTest()
            }
        }, 1000)   
    }
    else if (selectedTimeMode === "passage") {
        secondsPassed = 0;
        time.innerText = "0";

        timerInterval = setInterval(() => {
            secondsPassed++;
            time.innerText = secondsPassed;
        }, 1000);
    }
}

function endTest(reason) {
    clearInterval(timerInterval)
    timerInterval = null
    isTestRunning = false
    
    if (reason === "complete") {
        alert("Congrats! You finished the passage!")
    } else {
        alert("Time is up!")
    }

    calculateResults()
}

window.addEventListener("keydown", (e) => {
    if (!isTestRunning) return;

    const functionalKeys = ["Shift", "Control", "Alt", "Meta", "CapsLock", "Tab", "Escape"];
    if (functionalKeys.includes(e.key)) return;

    const characters = testText.querySelectorAll("span");
    const typedChar = e.key;
    const targetChar = characters[charIndex].innerText;

    if (charIndex === 0 && !timerInterval) { 
        startTimer();
    }

    if (typedChar === "Backspace") {
        if (charIndex > 0) {
            characters[charIndex].classList.remove("cursor");
            charIndex--;
            
            if (characters[charIndex].classList.contains("incorrect")) {
                mistakes--; 
            }

            characters[charIndex].classList.remove("correct", "incorrect", "cursor");
            characters[charIndex].classList.add("cursor");
        }
        return;
    }

    if (typedChar === targetChar) {
        characters[charIndex].classList.add("correct");
    } else {
        characters[charIndex].classList.add("incorrect");
        mistakes++;
    }

    characters[charIndex].classList.remove("cursor");
    charIndex++;

    if (charIndex < characters.length) {
        characters[charIndex].classList.add("cursor");
    } else {
        endTest("complete"); 
    }
});

function calculateResults() {
    let timeSpentSeconds = (selectedTimeMode === "timed") ? (60 - timeLeft) : secondsPassed
    if (timeSpentSeconds <=0 ) timeSpentSeconds = 1

    let timeSpentMinutes = timeSpentSeconds / 60

    let wpm = Math.round((charIndex / 5) / timeSpentMinutes)
    let acc = charIndex > 0 ? Math.round(((charIndex - mistakes) / charIndex) *100) : 0

    wordsPerMin.innerText = wpm
    accuracy.innerHTML = acc + "%"

    let pbData = JSON.parse(localStorage.getItem("pbData")) || { wpm: 0, acc: 0 };

    if (wpm > pbData.wpm) {
        pbData = { wpm: wpm, acc: acc };
        localStorage.setItem("pbData", JSON.stringify(pbData));
        
        // 3. Update the UI
        topScore.innerText = `${pbData.wpm} WPM (${pbData.acc}% Acc)`;
    }
}

retakeTestBtn.addEventListener("click", () => {
    clearInterval(timerInterval);
    timerInterval = null;
    isTestRunning = false;
    
    charIndex = 0;
    mistakes = 0;
    timeLeft = 60;
    secondsPassed = 0;
    
    time.innerText = selectedTimeMode === "timed" ? "60s" : "0s";
    wordsPerMin.innerText = "0";
    accuracy.innerText = "0%";
    
    modal.style.display = "flex"; 
    testText.innerHTML = "";
});

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

    charIndex = 0;
    mistakes = 0;

    testText.innerHTML = "";
    text.split("").forEach((char, index) => {
        const span = document.createElement("span");
        span.innerText = char;
        if (index === 0) span.classList.add("cursor");
        testText.appendChild(span);
    });
}

const savedPB = JSON.parse(localStorage.getItem("pbData"));
if (savedPB) {
    topScore.innerText = `${savedPB.wpm} WPM (${savedPB.acc}% Acc)`;
} else {
    topScore.innerText = "0 WPM (0% Acc)";
}