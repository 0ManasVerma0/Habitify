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
    
})
