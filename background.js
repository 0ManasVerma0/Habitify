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