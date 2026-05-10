// ── SmartFlow AI — Frontend Controller ──

// DOM References
const vehicleCountEl    = document.getElementById("vehicle-count");
const congestionLevelEl = document.getElementById("congestion-level");
const activeSignalEl    = document.getElementById("active-signal");
const signalTimerEl     = document.getElementById("signal-timer");
const predictionEl      = document.getElementById("prediction");
const trafficAlertEl    = document.getElementById("traffic-alert");
const aiMessageEl       = document.getElementById("ai-message");
const emergencyBanner   = document.getElementById("emergency-banner");
const emergencyBannerTx = document.getElementById("emergency-banner-text");
const junctionStateTag  = document.getElementById("junction-state-tag");
const emergencyBtn      = document.getElementById("emergency-btn");
const emergencyLaneSel  = document.getElementById("emergency-lane");
const activityLogEl     = document.getElementById("activity-log");
const activityCountEl   = document.getElementById("activity-count");
const ambulanceEl       = document.getElementById("ambulance");
const efficiencyDisplay = document.getElementById("efficiency-display");
const waitDisplay       = document.getElementById("wait-display");
const cycleCountEl      = document.getElementById("cycle-count");

// Cycle state
let isSwitching       = false;
let currentActiveLane = null;
let signalTimer       = null;       // setTimeout handle for end-of-cycle fetch
let countdownInterval = null;       // setInterval handle for the visual bar

// Emergency state (module-scoped so it persists across polls)
let emergencyActive    = false;
let lastEmergencyState = false;
let lastEmergencyLane  = null;
let ambulanceTimeout   = null;      // so we can cancel mid-animation

// Lane elements
const lanes = {
    "North Lane": {
        count:    document.getElementById("north-count"),
        bar:      document.getElementById("north-bar"),
        status:   document.getElementById("north-status"),
        badge:    document.getElementById("badge-north"),
        trend:    document.getElementById("north-trend"),
        forecast: document.getElementById("north-forecast"),
        item:     document.querySelector(".lane-item:nth-child(1)"),
        car:      document.getElementById("car-north"),
        lights: {
            red:    document.getElementById("light-north-red"),
            yellow: document.getElementById("light-north-yellow"),
            green:  document.getElementById("light-north-green"),
        },
    },
    "East Lane": {
        count:    document.getElementById("east-count"),
        bar:      document.getElementById("east-bar"),
        status:   document.getElementById("east-status"),
        badge:    document.getElementById("badge-east"),
        trend:    document.getElementById("east-trend"),
        forecast: document.getElementById("east-forecast"),
        item:     document.querySelector(".lane-item:nth-child(2)"),
        car:      document.getElementById("car-east"),
        lights: {
            red:    document.getElementById("light-east-red"),
            yellow: document.getElementById("light-east-yellow"),
            green:  document.getElementById("light-east-green"),
        },
    },
    "South Lane": {
        count:    document.getElementById("south-count"),
        bar:      document.getElementById("south-bar"),
        status:   document.getElementById("south-status"),
        badge:    document.getElementById("badge-south"),
        trend:    document.getElementById("south-trend"),
        forecast: document.getElementById("south-forecast"),
        item:     document.querySelector(".lane-item:nth-child(3)"),
        car:      document.getElementById("car-south"),
        lights: {
            red:    document.getElementById("light-south-red"),
            yellow: document.getElementById("light-south-yellow"),
            green:  document.getElementById("light-south-green"),
        },
    },
    "West Lane": {
        count:    document.getElementById("west-count"),
        bar:      document.getElementById("west-bar"),
        status:   document.getElementById("west-status"),
        badge:    document.getElementById("badge-west"),
        trend:    document.getElementById("west-trend"),
        forecast: document.getElementById("west-forecast"),
        item:     document.querySelector(".lane-item:nth-child(4)"),
        car:      document.getElementById("car-west"),
        lights: {
            red:    document.getElementById("light-west-red"),
            yellow: document.getElementById("light-west-yellow"),
            green:  document.getElementById("light-west-green"),
        },
    },
};

// ── Chart ──
const ctx         = document.getElementById("trafficChart");
const chartLabels = [];
const chartData   = [];

const trafficChart = new Chart(ctx, {
    type: "line",
    data: {
        labels:   chartLabels,
        datasets: [{
            label:               "Vehicles",
            data:                chartData,
            borderColor:         "#f5a623",
            backgroundColor:     "rgba(245,166,35,0.07)",
            borderWidth:         2,
            pointRadius:         3,
            pointBackgroundColor: "#f5a623",
            fill:                true,
            tension:             0.4,
        }],
    },
    options: {
        responsive:          true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            x: { grid: { color: "rgba(255,255,255,0.04)" }, ticks: { color: "#3d5270", font: { size: 10 }, maxRotation: 0 } },
            y: { grid: { color: "rgba(255,255,255,0.04)" }, ticks: { color: "#3d5270", font: { size: 10 } }, min: 0, max: 220 },
        },
    },
});

// ── Activity log ──
let logCount = 0;

function addLog(message, type = "info") {
    logCount++;
    activityCountEl.textContent = `${logCount} event${logCount !== 1 ? "s" : ""}`;
    const entry = document.createElement("div");
    entry.classList.add("log-entry");
    if (type === "emergency") entry.classList.add("emergency");
    if (type === "warning")   entry.classList.add("warning");
    const now = new Date().toLocaleTimeString("en-IN", { hour12: false });
    entry.innerHTML = `<span class="log-time">${now}</span><span>${message}</span>`;
    activityLogEl.prepend(entry);
    if (activityLogEl.children.length > 8) activityLogEl.removeChild(activityLogEl.lastChild);
}

function updateChart(vehicleCount) {
    const now = new Date().toLocaleTimeString("en-IN", { hour12: false, hour: "2-digit", minute: "2-digit" });
    chartLabels.push(now);
    chartData.push(vehicleCount);
    if (chartLabels.length > 10) { chartLabels.shift(); chartData.shift(); }
    trafficChart.update("none");
}

// ── Signal lights ──
function setSignalLights(laneName, color) {
    const el = lanes[laneName];
    if (!el) return;
    const { red, yellow, green } = el.lights;
    red.classList.remove("active");
    yellow.classList.remove("active");
    green.classList.remove("active");
    if (color === "green")  green.classList.add("active");
    if (color === "yellow") yellow.classList.add("active");
    if (color === "red")    red.classList.add("active");
}

function updateSignals(activeSignal, isEmergency) {
    const allLanes = Object.keys(lanes);
    if (isEmergency) {
        allLanes.forEach(lane => {
            const isActive = activeSignal.includes(lane.split(" ")[0]);
            setSignalLights(lane, isActive ? "green" : "red");
        });
    } else {
        allLanes.forEach(lane => setSignalLights(lane, lane === activeSignal ? "green" : "red"));
    }
}

function updateCarVisibility(activeSignal, isEmergency) {
    const allLanes = Object.keys(lanes);
    let greenLane  = activeSignal;

    if (isEmergency) {
        // Strip suffix like " (Emergency Corridor Active)"
        greenLane = activeSignal.replace(" (Emergency Corridor Active)", "").trim();
    }

    allLanes.forEach(lane => {
        const car = lanes[lane]?.car;
        if (!car) return;
        const isGreen = lane === greenLane;
        car.style.animationPlayState = isGreen ? "running" : "paused";
        car.style.opacity            = isGreen ? "1"       : "0.15";
    });
}

function triggerAmbulance(laneName) {
    // Clear any in-flight animation
    if (ambulanceTimeout) { clearTimeout(ambulanceTimeout); ambulanceTimeout = null; }

    const amb = ambulanceEl;
    amb.className = "ambulance"; // strip all direction classes + active
    void amb.offsetWidth;        // force reflow so animation restarts

    // Position and animate based on direction
    // North → vehicle enters from top, drives down
    // South → enters from bottom, drives up
    // East  → enters from right, drives left
    // West  → enters from left, drives right
    switch (laneName) {
        case "North Lane":
            amb.classList.add("active", "dir-north");
            break;
        case "South Lane":
            amb.classList.add("active", "dir-south");
            break;
        case "East Lane":
            amb.classList.add("active", "dir-east");
            break;
        case "West Lane":
            amb.classList.add("active", "dir-west");
            break;
        default:
            amb.classList.add("active", "dir-north");
    }

    ambulanceTimeout = setTimeout(() => {
        amb.className = "ambulance";
        ambulanceTimeout = null;
    }, 4000);
}

// ── Countdown bar ──
function startCountdown(seconds) {
    stopCountdown();
    const fill = document.getElementById("signal-bar-fill");
    if (!fill) return;

    let remaining         = seconds;
    fill.style.transition = "none";
    fill.style.width      = "100%";

    countdownInterval = setInterval(() => {
        remaining--;
        if (remaining <= 0) {
            stopCountdown();
            fill.style.width          = "0%";
            signalTimerEl.textContent = "0s";
            return;
        }
        fill.style.transition     = "width 1s linear";
        fill.style.width          = `${(remaining / seconds) * 100}%`;
        signalTimerEl.textContent = `${remaining}s`;
    }, 1000);
}

function stopCountdown() {
    if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null; }
}

function interruptAndRestart(data) {
    // Kill in-flight countdown and cycle timer
    stopCountdown();
    if (signalTimer) { clearTimeout(signalTimer); signalTimer = null; }
    isSwitching = false;

    // Now kick off a fresh cycle with the new data
    handleSignalTiming(data);
}

// ── Congestion badge ──
function setCongestion(level) {
    const el     = document.getElementById("congestion-level");
    el.className = `congestion-badge ${level.toLowerCase()}`;
    el.textContent = level.toUpperCase();
}

// ── Lane bars ──
const TREND_DISPLAY = {
    spike:  { arrow: "↑↑" }, rising: { arrow: "↑" },
    stable: { arrow: "→"  }, easing: { arrow: "↓" },
};

function updateLane(laneName, count, status, predictionInfo, isActive) {
    const el = lanes[laneName];
    if (!el) return;
    el.count.textContent  = count;
    el.bar.style.width    = `${Math.min(count, 80) / 80 * 100}%`;
    el.badge.textContent  = count;
    const statusMap       = { critical: "Critical density", moderate: "Moderate load", clear: "Clear" };
    el.status.textContent = statusMap[status] || "";
    el.badge.classList.toggle("critical", status === "critical");
    if (el.item) el.item.classList.toggle("active-lane", !!isActive);

    if (predictionInfo && el.trend && el.forecast) {
        const { severity, change, adjusted_score } = predictionInfo;
        const display         = TREND_DISPLAY[severity] || TREND_DISPLAY.stable;
        el.trend.textContent  = display.arrow;
        el.trend.className    = `lane-trend ${severity}`;
        const sign            = change >= 0 ? "+" : "";
        el.forecast.textContent = `${sign}${change} predicted · score ${adjusted_score}`;
        el.forecast.className   = `lane-forecast ${severity}`;
    }
}

// ── EMERGENCY HANDLER ──
emergencyBtn.addEventListener("click", async () => {
    const lane = emergencyLaneSel.value;
    try {
        let url;
        if (!emergencyActive) {
            url = `/api/emergency/${encodeURIComponent(lane)}`;
        } else {
            url = `/api/emergency/stop`;
        }

        const res  = await fetch(url, { method: "POST" });
        const data = await res.json();

        emergencyActive = data.emergency_mode;

        if (emergencyActive) {
            emergencyBanner.classList.add("active");
            emergencyBannerTx.textContent = `EMERGENCY ACTIVE — ${data.active_lane}`;
            emergencyBtn.innerHTML        = "🚨 Cancel Emergency Mode";
            emergencyBtn.classList.add("active");
            junctionStateTag.textContent  = "EMERGENCY MODE";
            junctionStateTag.classList.add("emergency");

            triggerAmbulance(data.active_lane);
            addLog(`Emergency activated for ${data.active_lane}`, "emergency");

            // Fetch fresh data so emergency_mode=true is reflected immediately
            const freshRes  = await fetch("/api/traffic-data");
            const freshData = await freshRes.json();
            interruptAndRestart(freshData);

        } else {
            if (ambulanceTimeout) { clearTimeout(ambulanceTimeout); ambulanceTimeout = null; }
            ambulanceEl.className = "ambulance";

            emergencyBanner.classList.remove("active");
            emergencyBtn.innerHTML = `<span class="btn-icon">🚨</span> Trigger Emergency Priority`;
            emergencyBtn.classList.remove("active");
            junctionStateTag.textContent  = "ADAPTIVE MODE";
            junctionStateTag.classList.remove("emergency");
            addLog("Emergency stopped — returning to adaptive control", "info");

            // Interrupt emergency cycle and immediately fetch fresh adaptive data
            const freshRes  = await fetch("/api/traffic-data");
            const freshData = await freshRes.json();
            interruptAndRestart(freshData);
        }

        if (data.message) aiMessageEl.textContent = data.message;
    } catch (err) {
        addLog("Emergency request failed", "warning");
    }
});

// ── MAIN TRAFFIC POLLING ──
async function fetchTrafficData() {
    try {
        const res  = await fetch("/api/traffic-data");
        const data = await res.json();

        // Emergency duplicate-log guard
        if (data.emergency_mode) {
            if (!lastEmergencyState || lastEmergencyLane !== data.active_signal) {
                addLog(`Emergency active → ${data.active_signal}`, "emergency");
                lastEmergencyState = true;
                lastEmergencyLane  = data.active_signal;
            }
        } else {
            lastEmergencyState = false;
            lastEmergencyLane  = null;
        }

        // Top metrics
        vehicleCountEl.textContent    = data.vehicle_count;
        cycleCountEl.textContent      = `#${data.cycle_count}`;
        efficiencyDisplay.textContent = `${data.traffic_efficiency}%`;
        waitDisplay.textContent       = `${data.wait_time}s`;
        signalTimerEl.textContent     = `${data.green_time}s`;

        setCongestion(data.congestion);
        activeSignalEl.textContent = data.active_signal;
        predictionEl.textContent   = data.prediction;
        trafficAlertEl.textContent = data.traffic_alert;

        document.getElementById("alert-card").classList.toggle("critical", data.congestion === "High");

        if (!emergencyActive) aiMessageEl.textContent = data.ai_message;

        // Lane updates
        const activeLane = data.active_signal.replace(" (Emergency Corridor Active)", "").trim();
        const laneMap = {
            "North Lane": { count: data.north_lane, status: data.congestion_breakdown?.["North Lane"] || "clear", pred: data.lane_predictions?.["North Lane"] },
            "East Lane":  { count: data.east_lane,  status: data.congestion_breakdown?.["East Lane"]  || "clear", pred: data.lane_predictions?.["East Lane"]  },
            "South Lane": { count: data.south_lane, status: data.congestion_breakdown?.["South Lane"] || "clear", pred: data.lane_predictions?.["South Lane"] },
            "West Lane":  { count: data.west_lane,  status: data.congestion_breakdown?.["West Lane"]  || "clear", pred: data.lane_predictions?.["West Lane"]  },
        };
        Object.entries(laneMap).forEach(([name, info]) => {
            updateLane(name, info.count, info.status, info.pred, name === activeLane);
        });

        // Hotspot card
        const hotspotCard = document.getElementById("hotspot-card");
        const hotspotMsg  = document.getElementById("hotspot-message");
        const hotspots    = data.upcoming_hotspots || [];
        if (hotspots.length > 0) {
            const hl              = hotspots[0];
            const change          = data.lane_predictions?.[hl]?.change || "?";
            hotspotMsg.textContent    = `${hl} is currently light but forecast to surge by +${change} vehicles next cycle. AI flagged for pre-emptive monitoring.`;
            hotspotCard.style.display = "block";
        } else {
            hotspotCard.style.display = "none";
        }

        updateChart(data.vehicle_count);

        if (data.congestion === "High")
            addLog(`High congestion — ${data.active_signal} priority activated. Green: ${data.green_time}s`, "warning");
        if (hotspots.length > 0) {
            const hs = hotspots[0];
            const ch = data.lane_predictions?.[hs]?.change;
            addLog(`Pre-alert: ${hs} predicted to spike by +${ch} vehicles.`, "warning");
        }

        handleSignalTiming(data);

    } catch (err) {
        isSwitching = false;  // unblock on network error
        addLog("Connection error — retrying…", "warning");
    }
}

function handleSignalTiming(data) {
    const newActive = data.active_signal;
    const greenTime = data.green_time;

    if (isSwitching) return;
    isSwitching = true;

    currentActiveLane = newActive;
    updateSignals(newActive, data.emergency_mode);

    updateCarVisibility(newActive, data.emergency_mode);

    activeSignalEl.textContent = newActive;
    setCongestion(data.congestion);
    addLog(`Signal → ${newActive} (${greenTime}s)`, "info");
    startCountdown(greenTime);

    if (signalTimer) clearTimeout(signalTimer);

    signalTimer = setTimeout(async () => {
        isSwitching = false;
        await fetchTrafficData();
    }, greenTime * 1000);
}

// Boot
addLog("SmartFlow AI system initialized. Adaptive signal control active.");
fetchTrafficData();