const redSignal = document.querySelector(".red");
const yellowSignal = document.querySelector(".yellow");
const greenSignal = document.querySelector(".green");

const activeSignalText = document.getElementById("active-signal");
const emergencyStatus = document.getElementById("emergency-status");
const aiMessage = document.getElementById("ai-message");

const emergencyBtn = document.getElementById("emergency-btn");

let currentLane = "North Lane";

function resetSignals() {
    redSignal.classList.remove("active");
    yellowSignal.classList.remove("active");
    greenSignal.classList.remove("active");
}

function switchSignal() {

    resetSignals();

    if (currentLane === "North Lane") {
        greenSignal.classList.add("active");

        activeSignalText.textContent = "North Lane";
        aiMessage.textContent =
            "AI increased green signal duration for North Lane due to higher congestion.";

        currentLane = "East Lane";

    } else {

        yellowSignal.classList.add("active");

        activeSignalText.textContent = "East Lane";
        aiMessage.textContent =
            "Traffic flow balanced for East Lane.";

        currentLane = "North Lane";
    }
}

setInterval(switchSignal, 4000);

emergencyBtn.addEventListener("click", () => {

    resetSignals();

    greenSignal.classList.add("active");

    emergencyStatus.textContent = "Ambulance Detected";

    activeSignalText.textContent = "Emergency Corridor Active";

    aiMessage.textContent =
        "Emergency vehicle detected. AI activated priority green corridor.";

});