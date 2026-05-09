const vehicleCount = document.getElementById("vehicle-count");
const congestionLevel = document.getElementById("congestion-level");
const activeSignal = document.getElementById("active-signal");
const aiMessage = document.getElementById("ai-message");
const emergencyStatus = document.getElementById("emergency-status");
const predictionText = document.getElementById("prediction");

const emergencyBtn = document.getElementById("emergency-btn");

async function fetchTrafficData() {

    const response = await fetch("/api/traffic-data");
    const data = await response.json();

    vehicleCount.textContent = data.vehicle_count;
    congestionLevel.textContent = data.congestion;
    activeSignal.textContent = data.active_signal;
    aiMessage.textContent = data.ai_message;
    predictionText.textContent = data.prediction;
}

setInterval(fetchTrafficData, 4000);

fetchTrafficData();

emergencyBtn.addEventListener("click", () => {

    emergencyStatus.textContent = "Ambulance Detected";

    aiMessage.textContent =
        "Emergency vehicle detected. AI activated green corridor priority.";

    activeSignal.textContent = "Emergency Route Active";
});

const ctx = document.getElementById("trafficChart");

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