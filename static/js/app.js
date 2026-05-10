// ── SmartFlow AI — Frontend Controller ──

// DOM References
const vehicleCountEl = document.getElementById("vehicle-count");
const congestionLevelEl = document.getElementById("congestion-level");
const activeSignalEl = document.getElementById("active-signal");
const signalTimerEl = document.getElementById("signal-timer");
const predictionEl = document.getElementById("prediction");
const trafficAlertEl = document.getElementById("traffic-alert");
const aiMessageEl = document.getElementById("ai-message");
const emergencyBanner = document.getElementById("emergency-banner");
const emergencyBannerTx = document.getElementById("emergency-banner-text");
const junctionStateTag = document.getElementById("junction-state-tag");
const emergencyBtn = document.getElementById("emergency-btn");
const emergencyLaneSel = document.getElementById("emergency-lane");
const activityLogEl = document.getElementById("activity-log");
const activityCountEl = document.getElementById("activity-count");
const ambulanceEl = document.getElementById("ambulance");
const efficiencyDisplay = document.getElementById("efficiency-display");
const waitDisplay = document.getElementById("wait-display");
const cycleCountEl = document.getElementById("cycle-count");

// Lane elements
const lanes = {
    "North Lane": {
        count:    document.getElementById("north-count"),
        bar:      document.getElementById("north-bar"),
        status:   document.getElementById("north-status"),
        badge:    document.getElementById("badge-north"),
        trend:    document.getElementById("north-trend"),
        forecast: document.getElementById("north-forecast"),
        lights: {
            red:    document.getElementById("light-north-red"),
            yellow: document.getElementById("light-north-yellow"),
            green:  document.getElementById("light-north-green"),
        }
    },
    "East Lane": {
        count:    document.getElementById("east-count"),
        bar:      document.getElementById("east-bar"),
        status:   document.getElementById("east-status"),
        badge:    document.getElementById("badge-east"),
        trend:    document.getElementById("east-trend"),
        forecast: document.getElementById("east-forecast"),
        lights: {
            red:    document.getElementById("light-east-red"),
            yellow: document.getElementById("light-east-yellow"),
            green:  document.getElementById("light-east-green"),
        }
    },
    "South Lane": {
        count:    document.getElementById("south-count"),
        bar:      document.getElementById("south-bar"),
        status:   document.getElementById("south-status"),
        badge:    document.getElementById("badge-south"),
        trend:    document.getElementById("south-trend"),
        forecast: document.getElementById("south-forecast"),
        lights: {
            red:    document.getElementById("light-south-red"),
            yellow: document.getElementById("light-south-yellow"),
            green:  document.getElementById("light-south-green"),
        }
    },
    "West Lane": {
        count:    document.getElementById("west-count"),
        bar:      document.getElementById("west-bar"),
        status:   document.getElementById("west-status"),
        badge:    document.getElementById("badge-west"),
        trend:    document.getElementById("west-trend"),
        forecast: document.getElementById("west-forecast"),
        lights: {
            red:    document.getElementById("light-west-red"),
            yellow: document.getElementById("light-west-yellow"),
            green:  document.getElementById("light-west-green"),
        }
    }
};

// Chart Setup
const ctx = document.getElementById("trafficChart");
const chartLabels = [];
const chartData = [];

const trafficChart = new Chart(ctx, {
    type: "line",
    data: {
        labels: chartLabels,
        datasets: [{
            label: "Vehicles",
            data: chartData,
            borderColor: "#00d4ff",
            backgroundColor: "rgba(0, 212, 255, 0.08)",
            borderWidth: 2,
            pointRadius: 3,
            pointBackgroundColor: "#00d4ff",
            fill: true,
            tension: 0.4
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false }
        },
        scales: {
            x: {
                grid: { color: "rgba(255,255,255,0.04)" },
                ticks: { color: "#3d5270", font: { family: "JetBrains Mono", size: 10 }, maxRotation: 0 }
            },
            y: {
                grid: { color: "rgba(255,255,255,0.04)" },
                ticks: { color: "#3d5270", font: { family: "JetBrains Mono", size: 10 } },
                min: 0,
                max: 220
            }
        }
    }
});

// Activity log state
let logCount = 0;

function addLog(message, type = "info") {
    logCount++;
    activityCountEl.textContent = `${logCount} event${logCount !== 1 ? "s" : ""}`;

    const entry = document.createElement("div");
    entry.classList.add("log-entry");
    if (type === "emergency") entry.classList.add("emergency");
    if (type === "warning") entry.classList.add("warning");

    const now = new Date().toLocaleTimeString("en-IN", { hour12: false });

    entry.innerHTML = `
        <span class="log-time">${now}</span>
        <span>${message}</span>
    `;

    activityLogEl.prepend(entry);

    if (activityLogEl.children.length > 8) {
        activityLogEl.removeChild(activityLogEl.lastChild);
    }
}

// Update chart
function updateChart(vehicleCount) {
    const now = new Date().toLocaleTimeString("en-IN", { hour12: false, hour: "2-digit", minute: "2-digit" });
    chartLabels.push(now);
    chartData.push(vehicleCount);

    if (chartLabels.length > 10) {
        chartLabels.shift();
        chartData.shift();
    }

    trafficChart.update("none");
}

// Set signal lights for a lane
function setSignalLights(laneName, color) {
    const el = lanes[laneName];
    if (!el) return;

    const { red, yellow, green } = el.lights;
    red.classList.remove("active");
    yellow.classList.remove("active");
    green.classList.remove("active");

    if (color === "green") green.classList.add("active");
    if (color === "yellow") yellow.classList.add("active");
    if (color === "red") red.classList.add("active");
}

// Update all 4 signal lights based on active signal
function updateSignals(activeSignal, emergency) {
    const allLanes = ["North Lane", "East Lane", "South Lane", "West Lane"];

    if (emergency) {
        allLanes.forEach(lane => {
            const isActive = activeSignal.includes(lane.split(" ")[0]);
            setSignalLights(lane, isActive ? "green" : "red");
        });
        return;
    }

    allLanes.forEach(lane => {
        setSignalLights(lane, lane === activeSignal ? "green" : "red");
    });
}

// Trend arrow + label per severity
const TREND_DISPLAY = {
    spike:  { arrow: "↑↑", label: "Spike" },
    rising: { arrow: "↑",  label: "Rising" },
    stable: { arrow: "→",  label: "Stable" },
    easing: { arrow: "↓",  label: "Easing" },
};

// Update lane density bar, badge, trend arrow, and forecast text
function updateLane(laneName, count, status, predictionInfo) {
    const el = lanes[laneName];
    if (!el) return;

    el.count.textContent  = count;
    el.bar.style.width    = `${Math.min(count, 80) / 80 * 100}%`;
    el.badge.textContent  = count;

    const statusMap = { critical: "Critical density", moderate: "Moderate load", clear: "Clear" };
    el.status.textContent = statusMap[status] || "";
    el.badge.classList.toggle("critical", status === "critical");

    // Prediction-driven trend display
    if (predictionInfo && el.trend && el.forecast) {
        const { severity, change, adjusted_score } = predictionInfo;
        const display = TREND_DISPLAY[severity] || TREND_DISPLAY.stable;

        // Arrow + severity
        el.trend.textContent  = display.arrow;
        el.trend.className    = `lane-trend ${severity}`;

        // Forecast line: "+12 · score 74" or "−5 · score 38"
        const sign = change >= 0 ? "+" : "";
        el.forecast.textContent = `${sign}${change} predicted · score ${adjusted_score}`;
        el.forecast.className   = `lane-forecast ${severity}`;
    }
}

// Trigger ambulance animation
function triggerAmbulance(laneName) {
    ambulanceEl.classList.remove("active");
    void ambulanceEl.offsetWidth; // reflow
    ambulanceEl.classList.add("active");

    setTimeout(() => {
        ambulanceEl.classList.remove("active");
    }, 4000);
}

function setCongestion(level) {
    const el = document.getElementById("congestion-level");
    const normalized = level.toLowerCase();

    el.className = `congestion-badge ${normalized}`;
    el.textContent = level.toUpperCase();
}

// ── EMERGENCY HANDLER ──
let emergencyActive = false;

emergencyBtn.addEventListener("click", async () => {
    const lane = emergencyLaneSel.value;

    try {
        const res = await fetch(`/api/emergency/${encodeURIComponent(lane)}`, { method: "POST" });
        const data = await res.json();

        emergencyActive = data.emergency_mode;

        if (emergencyActive) {
            emergencyBanner.classList.add("active");
            emergencyBannerTx.textContent = `EMERGENCY VEHICLE — ${lane.toUpperCase()} GREEN CORRIDOR ACTIVE`;
            emergencyBtn.classList.add("active");
            emergencyBtn.textContent = "🚨 Cancel Emergency Mode";
            junctionStateTag.textContent = "EMERGENCY MODE";
            junctionStateTag.classList.add("emergency");

            triggerAmbulance(lane);
            addLog(`Emergency vehicle detected in ${lane}. Green corridor activated.`, "emergency");
        } else {
            emergencyBanner.classList.remove("active");
            emergencyBtn.classList.remove("active");
            emergencyBtn.innerHTML = '<span class="btn-icon">🚨</span> Trigger Emergency Priority';
            junctionStateTag.textContent = "ADAPTIVE MODE";
            junctionStateTag.classList.remove("emergency");

            addLog("Emergency mode deactivated. Resuming adaptive control.", "info");
        }

        aiMessageEl.textContent = data.message;

    } catch (err) {
        addLog("Error communicating with server.", "warning");
    }
});

// ── MAIN TRAFFIC POLLING ──
async function fetchTrafficData() {
    try {
        const res = await fetch("/api/traffic-data");
        const data = await res.json();

        // Top metrics
        vehicleCountEl.textContent = data.vehicle_count;
        cycleCountEl.textContent = `#${data.cycle_count}`;
        efficiencyDisplay.textContent = `${data.traffic_efficiency}%`;
        waitDisplay.textContent = `${data.wait_time}s`;
        signalTimerEl.textContent = `${data.green_time}s`;

        // Congestion badge
        setCongestion(data.congestion);

        // Active signal
        activeSignalEl.textContent = data.active_signal;

        // Prediction + alert
        predictionEl.textContent = data.prediction;
        trafficAlertEl.textContent = data.traffic_alert;

        // Style alert card
        const alertCard = document.getElementById("alert-card");
        alertCard.classList.toggle("critical", data.congestion === "High");

        // AI message (only update if not in emergency)
        if (!emergencyActive) {
            aiMessageEl.textContent = data.ai_message;
        }

        // Lane data — now includes prediction info
        const laneMap = {
            "North Lane": { count: data.north_lane, status: data.congestion_breakdown?.["North Lane"] || "clear", pred: data.lane_predictions?.["North Lane"] },
            "East Lane":  { count: data.east_lane,  status: data.congestion_breakdown?.["East Lane"]  || "clear", pred: data.lane_predictions?.["East Lane"]  },
            "South Lane": { count: data.south_lane, status: data.congestion_breakdown?.["South Lane"] || "clear", pred: data.lane_predictions?.["South Lane"] },
            "West Lane":  { count: data.west_lane,  status: data.congestion_breakdown?.["West Lane"]  || "clear", pred: data.lane_predictions?.["West Lane"]  }
        };

        Object.entries(laneMap).forEach(([name, info]) => {
            updateLane(name, info.count, info.status, info.pred);
        });

        // Hotspot warning card
        const hotspotCard = document.getElementById("hotspot-card");
        const hotspotMsg  = document.getElementById("hotspot-message");
        const hotspots    = data.upcoming_hotspots || [];

        if (hotspots.length > 0) {
            const lane   = hotspots[0];
            const change = data.lane_predictions?.[lane]?.change || "?";
            hotspotMsg.textContent  = `${lane} is currently light but forecast to surge by +${change} vehicles next cycle. AI has flagged it for pre-emptive monitoring.`;
            hotspotCard.style.display = "block";
        } else {
            hotspotCard.style.display = "none";
        }

        // Signals
        updateSignals(data.active_signal, data.emergency_mode);

        // Chart
        updateChart(data.vehicle_count);

        // Log significant events
        if (data.congestion === "High") {
            addLog(`High congestion — ${data.active_signal} priority activated. Green: ${data.green_time}s`, "warning");
        }
        if ((data.upcoming_hotspots || []).length > 0) {
            const hs = data.upcoming_hotspots[0];
            const ch = data.lane_predictions?.[hs]?.change;
            addLog(`Pre-alert: ${hs} predicted to spike by +${ch} vehicles — monitoring.`, "warning");
        }

    } catch (err) {
        addLog("Connection error — retrying…", "warning");
    }
}

// Boot
addLog("SmartFlow AI system initialized. Adaptive signal control active.");
fetchTrafficData();
setInterval(fetchTrafficData, 4000);