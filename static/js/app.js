const vehicleCount = document.getElementById("vehicle-count");
const congestionLevel = document.getElementById("congestion-level");
const activeSignal = document.getElementById("active-signal");
const aiMessage = document.getElementById("ai-message");
const emergencyStatus = document.getElementById("emergency-status");
const predictionText = document.getElementById("prediction");
const northCount = document.getElementById("north-count");
const eastCount = document.getElementById("east-count");
const southCount = document.getElementById("south-count");
const westCount = document.getElementById("west-count");
const activityLog = document.getElementById("activity-log");
const ctx = document.getElementById("trafficChart");
const signalTimer = document.getElementById("signal-timer");
const waitTime = document.getElementById("wait-time");
const trafficEfficiency = document.getElementById("traffic-efficiency");

const emergencyBtn = document.getElementById("emergency-btn");

function addLog(message) {

    const logItem = document.createElement("li");

    const currentTime = new Date().toLocaleTimeString();

    logItem.textContent = `[${currentTime}] ${message}`;

    activityLog.prepend(logItem);

    if (activityLog.children.length > 6) {
        activityLog.removeChild(activityLog.lastChild);
    }
}

emergencyBtn.addEventListener("click", async () => {

    const response = await fetch("/api/emergency");

    const data = await response.json();

    emergencyStatus.textContent = data.emergency_mode
        ? "Ambulance Detected"
        : "No Emergency";

    aiMessage.textContent = data.message;

    activeSignal.textContent = data.emergency_mode
        ? "Emergency Route Active"
        : "Adaptive Traffic Mode";
});

async function fetchTrafficData() {

    const response = await fetch("/api/traffic-data");
    const data = await response.json();

    vehicleCount.textContent = data.vehicle_count;

    congestionLevel.textContent = data.congestion;
    congestionLevel.className = "";

    if (data.congestion === "Low") {
        congestionLevel.classList.add("low");

    } else if (data.congestion === "Medium") {
        congestionLevel.classList.add("medium");

    } else {
        congestionLevel.classList.add("high");
    }

    activeSignal.textContent = data.active_signal;
    aiMessage.textContent = data.ai_message;
    signalTimer.textContent = `Green Signal Time: ${data.green_time}s`;
    addLog(data.ai_message);
    predictionText.textContent = data.prediction;
    northCount.textContent = data.north_lane;
    eastCount.textContent = data.east_lane;
    southCount.textContent = data.south_lane;
    westCount.textContent = data.west_lane;
    waitTime.textContent = `${data.wait_time} sec`;
    trafficEfficiency.textContent = `${data.traffic_efficiency}%`;
}

setInterval(fetchTrafficData, 4000);

fetchTrafficData();

emergencyBtn.addEventListener("click", () => {

    emergencyStatus.textContent = "Ambulance Detected";

    aiMessage.textContent =
        "Emergency vehicle detected. AI activated green corridor priority.";

    activeSignal.textContent = "Emergency Route Active";
});

const trafficChart = new Chart(ctx, {
    type: "line",

    data: {
        labels: ["1 PM", "2 PM", "3 PM", "4 PM", "5 PM"],

        datasets: [{
            label: "Vehicle Density",

            data: [65, 90, 120, 80, 140]
        }]
    },

    options: {
        responsive: true
    }
});