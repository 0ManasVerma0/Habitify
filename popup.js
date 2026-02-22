//views
const setupView = document.getElementById("setupView")
const activeView = document.getElementById("activeView")
const completedView = document.getElementById("completeView")
//buttons
const startBtn = document.getElementById("startBtn")
const stopBtn = document.getElementById("stopBtn")
const viewStatsBtn = document.getElementById("viewStatsBtn")
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

//fucntion for showing setup view
function showSetupView(){
    console.log("showing setup window");
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
        siteName.text = sessionData.allowedUrl;
    }
}

//fucntion for showing completed window
function showCompletedView(){
    console.log("showing completed window")
    completedView.classList.remove("hidden")
    activeView.classList.add("hidden")
    setupView.classList.add("hidden")
}

//function for loading saved settings
function loadSavedSettings(){
    //using chrome storage API for storing the settings locally 
    chrome.storage.local.get(["HabitSettings"], (result)=>{
        console.log("Loading saved settings:", result)

        if(result.HabitSettings){
            const settings = result.HabitSettings;

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
    //using chrome storage api for checking the status 
    chrome.runtime.sendMessage({action: 'getStatus'}, (response)=> {
        console.log("session staus: ", response)

        //IF ACTIVE SESSION
        if(response && response.active){
            showActiveView(response) //show active view
        }
        else{
            //show setup view
            showSetupView();
        }
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
            websiteUrl : websiteUrl.value.trime(),
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
        if(settings.startTime < 0 || settings.startTime > 180){
            alert("⚠️ Duration must be between 5 and 180 minutes!")
            return
        }
        if(settings.duration < 0 || settings.duration > 365){
            alert("⚠️ Duration must be between 5 and 180 minutes!")
            return
        }
        if(settings.totalDays < 0 || settings.totalDays > 365){
            alert("⚠️ Total days must be between 1 and 365!")
            return
        }

        //save settings to chrome storage api
        chrome.storage.local.set({HabitSettings: settings}, ()=>{
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

                //back to setup 
                setupView();
            })
        }
    })

    
})
