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
const trafficAlert = document.getElementById("traffic-alert");
const ambulance = document.getElementById("ambulance");
const emergencyLane = document.getElementById("emergency-lane");

const emergencyBtn = document.getElementById("emergency-btn");

function addLog(message) {

    const logContainer =
        document.getElementById("activity-log");

    const logEntry =
        document.createElement("div");

    logEntry.classList.add("log-entry");

    const now = new Date();

    const time =
        now.toLocaleTimeString();

    logEntry.innerText =
        `[${time}] ${message}`;

    logContainer.prepend(logEntry);

    if (logContainer.children.length > 8) {

        logContainer.removeChild(
            logContainer.lastChild
        );
    }
}

emergencyBtn.addEventListener("click", async () => {

    const selectedLane = emergencyLane.value;
    const response = await fetch("/api/emergency");
    const data = await response.json();

    emergencyStatus.textContent = data.emergency_mode
        ? "Ambulance Detected"
        : "No Emergency";

    aiMessage.textContent = data.message;

    activeSignal.textContent = data.emergency_mode
        ? `${selectedLane} Priority Active`
        : "Adaptive Traffic Mode";

    if (data.emergency_mode) {

        ambulance.classList.remove("active-ambulance");

        void ambulance.offsetWidth;
        ambulance.classList.add("active-ambulance");

        addLog(
            `Emergency vehicle detected in ${selectedLane}.`
        );

    } else {

        ambulance.classList.remove("active-ambulance");
    }
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
    trafficAlert.textContent = data.traffic_alert;
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