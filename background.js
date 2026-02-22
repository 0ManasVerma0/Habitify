let sessionActive = false;
let allowedUrl = '';
let sessionEndTime = null;
let habitSettings = {};

console.log("background script started")

//this starts right after extension is installed
chrome.runtime.onInstalled.addListener(()=>{
    console.log("Succesfully Installed");

    //initialize storage
    chrome.storage.local.set({
        sessionActive: false,
        currentStreak: 0,
        completedDays: [],
        habitSettings: {}
    })
    console.log("Default storage initialized")
})

//func for starting a session
function startSession(){
    console.log("starting session now")
    sessionActive = true;
    allowedUrl = habitSettings.websiteUrl || '';
    sessionEndTime = Date.now() + (habitSettings.duration * 60 * 100);

    //saving in storage
    chrome.storage.local.set({sessionActive: true});
    console.log("session started")
    console.log("allowed website: ", allowedUrl)
    console.log("session ends at: ", new Date(sessionEndTime).toLocaleTimeString());

    //creating alarm when session should end
    chrome.alarms.create('sessionEnd', {
        when: sessionEndTime
    })

    //block other websites
    blockNonAllowedTabs();
}

//func for stopping a session
function stopSession(){
    console.log("stopping this session")
    sessionActive = false;
    allowedUrl = '';
    sessionEndTime = null;
    chrome.storage.local.set({sessionActive: false}) //update in local storage
    //clear the alarm
    chrome.alarms.clear('sessionEnd');
    console.log("session is stopped")
}

//func for completing a session
function completeSession(){
    console.log("session completed successfully");
    const today = new Date().toDateString();
    //calculate current streak data
    chrome.storage.local.get(['completedDays', 'currentStreak'], (date) =>{
        let completedDays = data.completedDays || [];
        let currentStreak = data.currentStreak || 0;

        console.log("Completed streak is: ", completedDays)
        console.log("Current streak is: ", currentStreak)

        //check if today's session is done
        if(!completedDays.includes(today)){
            completedDays.push(today);

            //calculate streak
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1)
            const yesterdayStr = yesterday.toDateString();

            //if yesterday is completed or first day 
            if(completedDays.includes(yesterdayStr) || streak === 0){
                streak++;
                console.log("streak increased to: " ,streak)
            }
            else{
                //streak broken
                streak = 1;
                console.log("streak broken, set to 1")
            }

            //save updated data
            chrome.storage.local.set({
                completedDays : completedDays,
                currentStreak: streak
            })
            console.log("Progress saved")
        }
        else{
            console.log("already completed today")
        }
    })

    //stop session
    stopSession();
}

//listening to the alarms
chrome.alarms.onAlarm.addListener((alarm) =>{
    console.log("alarm triggerd: ", alarm.name);

    if(alarm.name === 'dailyHabitStart'){
        console.log("daily habit time started")
        startSession();
    }
    else if(alarm.name === 'sessionEnd'){
        console.log("Session ended")
        completeSession();
    }
})

//func for starting habit schedule
function startHabitSchedule(settings){
    console.log("starting habit schedule");
    habitSettings = settings; //saves settings globally
    chrome.storage.local.set({habitSettings: settings}); //saves it to storage locally using chrome storage api

    //calculating next session start 
    const now = new Date();
    const [hours, minutes] = settings.startTime.split(':');

    let nextSession = new Date();
    nextSession.setHours(parseInt(hours), parseInt(minutes), 0, 0)

    console.log("Time now: ", now.toLocaleTimeString());
    console.log("Time for next Session: ", nextSession.toLocaleTimeString());

    //if time is passed schedule it for next dat
    if(nextSession <= now){
        console.log("time passed for today, scheduling it to tomorrow");
        nextSession.setDate(nextSession.getDate() + 1)
    }
    console.log("Next session is scheduled on: ", nextSession.toLocaleDateString());

    //creating a daily alarm using chrome alarm api
    chrome.alarms.create('dailyHabitStart', {
        when: nextSession.getTime(), //in milliseconds
        periodInMinutes: 1440 //24hrs
    })
    console.log("Alarm created")

    const timeDiff = Math.abs(nextSession - now)
    if(timeDiff < 60000){//less than 1 min
        console.log("starting session now");
        startSession();
    }

}

//listen msg from popup window
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("msg recieved: ", request.action)

    if(request.action === 'getStatus'){
        //popup asks if a session is active
        sendResponse({
            active: sessionActive,
            allowedUrl: allowedUrl,
            endTime: sessionEndTime,
            settings: habitSettings
        })
    }
    else if(request.action === 'startSchedule'){
        //popup asks to start a habit schedule
        startHabitSchedule(request.settings);
        sendResponse({success: true});
    }
    else if(request.action === 'stopSession'){
        //popup asks to stop the session
        stopSession();
        sendResponse({success: true});
    }

    return true;
})