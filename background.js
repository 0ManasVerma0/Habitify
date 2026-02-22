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