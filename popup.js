//views
const setupView = document.getElementById("setupView")
const activeView = document.getElementById("activeView")
const completedView = document.getElementById("completeView")
//buttons
const startBtn = document.getElementById("startBtn")
const stopBtn = document.getElementById("stopBtn")
const continueBtn = document.getElementById("continueBtn")
//form inputs (setup view)
const websiteUrl = document.getElementById("websiteUrl")
const startTime = document.getElementById("startTime")
const duration = document.getElementById("duration")
const totalDays = document.getElementById("totalDays")
//Display elements (active view)
const timer = document.getElementById("timer")
const streakNumber = document.getElementById("streakNumber")
const progress = document.getElementById("progressText")
const siteName = document.getElementById("siteName")
const progressFill = document.getElementById("progressFill")

//global variable for session data
let sessionData = {};
let timerInterval = null; // variable to store timer interval

//fucntion for showing setup view
function showSetupView(){
    console.log("showing setup window");
    //clear timer if it's running
    if(timerInterval){
        clearInterval(timerInterval);
        timerInterval = null;
    }
    setupView.classList.remove("hidden")
    activeView.classList.add("hidden")
    completedView.classList.add("hidden")
}

//function for showing active view
function showActiveView(){
    console.log("showing active window");
    activeView.classList.remove("hidden")
    setupView.classList.add("hidden")
    completedView.classList.add("hidden")

    //update display with session data
    if(sessionData.allowedUrl){
        siteName.textContent = sessionData.allowedUrl;
    }

    //start the timer
    startTimer();
}

//function to update timer display
function updateTimer(){
    if(!sessionData.endTime){
        console.log("No session end time available");
        return;
    }

    const now = Date.now();
    const timeRemaining = Math.max(0, sessionData.endTime - now); //remaining time in ms

    //convert ms to mm:ss format
    const minutes = Math.floor(timeRemaining / 60000);
    const seconds = Math.floor((timeRemaining % 60000) / 1000);

    const displayTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    timer.textContent = displayTime;

    //update progress bar
    if(sessionData.settings && sessionData.settings.duration){
        const totalDuration = sessionData.settings.duration * 60 * 1000; //in milliseconds
        const elapsed = totalDuration - timeRemaining;
        const progressPercent = Math.min(100, (elapsed / totalDuration) * 100);
        progressFill.style.width = progressPercent + '%';
        progress.textContent = `${Math.floor(progressPercent)}% complete`;
    }

    //if time is up, stop the timer
    if(timeRemaining <= 0){
        clearInterval(timerInterval);
        console.log("Session time is up!");
    }
}

//function to start the timer interval
function startTimer(){
    //clear any existing interval
    if(timerInterval){
        clearInterval(timerInterval);
    }

    //update immediately
    updateTimer();

    //then update every 1 second
    timerInterval = setInterval(updateTimer, 1000);
}

//fucntion for showing completed window
function showCompletedView(){
    console.log("showing completed window")
    //clear timer if it's running
    if(timerInterval){
        clearInterval(timerInterval);
        timerInterval = null;
    }
    completedView.classList.remove("hidden")
    activeView.classList.add("hidden")
    setupView.classList.add("hidden")
    
    // Clear the completion flag so it doesn't show again
    chrome.storage.local.set({ sessionJustCompleted: false });
}

//function for loading saved settings
function loadSavedSettings(){
    //using chrome storage API for storing the settings locally 
    chrome.storage.local.get(["habitSettings"], (result)=>{
        console.log("Loading saved settings:", result)

        if(result.habitSettings){
            const settings = result.habitSettings;

            if(settings.websiteUrl) websiteUrl.value = settings.websiteUrl;
            if(settings.startTime) startTime.value = settings.startTime;
            if(settings.duration) duration.value = settings.duration;
            if(settings.totalDays) totalDays.value = settings.totalDays;

            console.log("all your settings are loaded")
        }
        else{
            console.log("No saved settings found(first time use)")
        }
    })
}

//function for checkin session status
function checkSessionStatus(){
    // Check if session just completed
    chrome.storage.local.get(['sessionJustCompleted'], (result) => {
        if(result.sessionJustCompleted){
            // Get the session data to display in completedView
            chrome.storage.local.get(['currentStreak', 'completedProgressText'], (data) => {
                if(data.currentStreak !== undefined){
                    document.getElementById('completeStreakNumber').textContent = data.currentStreak;
                }
                if(data.completedProgressText){
                    document.getElementById('completeProgressText').textContent = data.completedProgressText;
                }
                showCompletedView();
            })
            return;
        }
        
        //using chrome storage api for checking the status 
        chrome.runtime.sendMessage({action: 'getStatus'}, (response)=> {
            console.log("session staus: ", response)

            //IF ACTIVE SESSION
            if(response && response.active){
                sessionData = response; //store session data
                showActiveView() //show active view
            }
            else{
                //show setup view
                showSetupView();
            }
        })
    })
}



document.addEventListener('DOMContentLoaded', () => {
    console.log("popup opened")
    loadSavedSettings();
    checkSessionStatus();

    //handling start button
    startBtn.addEventListener('click', ()=>{
        console.log("start button is clicked")

        const settings = {
            websiteUrl : websiteUrl.value.trim(),
            startTime : startTime.value,
            duration : parseInt(duration.value),
            totalDays : parseInt(totalDays.value)
        };

        console.log("settings: ", settings)

        //validate the inputs
        if(!settings.websiteUrl){
            alert("⚠️ Please enter a website URL!")
            return
        }
        if(!settings.startTime){
            alert("⚠️ Please enter a start time!")
            return
        }
        if(settings.duration < 5 || settings.duration > 180){
            alert("⚠️ Duration must be between 5 and 180 minutes!")
            return
        }
        if(settings.totalDays < 0 || settings.totalDays > 365){
            alert("⚠️ Total days must be between 1 and 365!")
            return
        }

        //save settings to chrome storage api
        chrome.storage.local.set({habitSettings: settings}, ()=>{
            console.log("setting saved!")
            //send msg to background script to start the schedule
            chrome.runtime.sendMessage({
                action: 'startSchedule',
                settings: settings
            }, (response) => {
                console.log("schedule started:", response);
                //show success message
                alert(`✅ Habit scheduled!\n\nSession will start at ${settings.startTime} every day for ${settings.totalDays} days.`)

                window.close(); //popup will be closed
            })
        })
    })

    //handling stop button
    stopBtn.addEventListener('click', ()=>{
        console.log("stop button is clicked");
        //confirm 
        if(confirm("⚠️ Stop this session?\n\nProgress will not be saved.")){
            chrome.runtime.sendMessage({action: 'stopSession'}, (response)=>{
                console.log("session is stopped")

                //show completed view
                showCompletedView();
            })
        }
    })

    //handling continue button (back to setup from completed view)
    continueBtn.addEventListener('click', ()=>{
        console.log("continue button clicked")

        //go back to setup window
        showSetupView();
    })
})