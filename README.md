# SmartFlow AI — Adaptive Junction Intelligence

> An AI-powered traffic junction optimization system that dynamically allocates signal time, predicts congestion before it forms, and clears corridors for emergency vehicles in real time.

🌐 **Live Demo:** [smartflow-ai-df3t.onrender.com](https://smartflow-ai-df3t.onrender.com)
📁 **Repository:** [github.com/tanuluthra4/Smartflow-AI](https://github.com/tanuluthra4/Smartflow-AI)

---

## The Problem

Traditional traffic signals run on fixed timers — the same 30-second cycle whether 5 vehicles or 80 are waiting. This wastes green time on empty lanes, creates unnecessary congestion on busy ones, and forces emergency vehicles to wait in the same queue as everyone else.

## The Solution

SmartFlow AI replaces fixed timing with a multi-factor scoring engine that evaluates each lane every cycle using four signals: current density, predicted inflow, historical trend, and fairness pressure (how long a lane has been waiting). It allocates green time proportionally and detects upcoming hotspots before they become jams.

---

## How the AI Works

Each signal cycle, the engine computes an **adjusted score** for every lane:

```
score = (current_density × 0.45)
      + (predicted_inflow × 0.25)
      + (historical_trend × 0.15)
      + (fairness_pressure × 0.15)
```

The lane with the highest score gets the green signal, and its green duration is scaled proportionally to the score (10s–60s). A **fairness counter** prevents any lane from being starved — lanes accumulate pressure the longer they wait, which feeds back into the score.

### Peak-Hour Traffic Simulation

Lane counts follow a Gaussian rush-hour curve, peaking at 08:30 and 17:30 to simulate real urban traffic patterns. Each lane has a different base capacity (North: 72 as main arterial, West: 44 as a side street), so the AI consistently makes asymmetric decisions that reflect real-world junction behavior.

### Hotspot Pre-Alert

If a lane is currently light (< 45 vehicles) but predicted to surge by more than 12 in the next cycle, it is flagged as an upcoming hotspot. The dashboard shows a warning card and logs a pre-alert — the AI begins pre-allocating time before congestion is visible.

### Emergency Green Corridor

When an emergency vehicle is triggered for a lane, that lane receives a 60-second green window and all other lanes drop to a 5-second minimum cycle. The server-side state is set via `POST /api/emergency/<lane>` and automatically deactivated after 60 seconds by a client-side timer, restoring adaptive control with `POST /api/emergency/stop`.

---

## Features

| Feature | Description |
|---|---|
| Adaptive signal control | Green time allocated by 4-factor AI scoring, not fixed timers |
| Peak-hour simulation | Gaussian traffic curves for realistic rush-hour density |
| Congestion prediction | Per-lane trend forecasting with severity levels (spike / rising / stable / easing) |
| Hotspot pre-alert | Detects quiet lanes about to surge before they become bottlenecks |
| Emergency corridor | 60s green wave for selected lane, auto-stops after clearance |
| Fairness memory | Prevents lane starvation across signal cycles |
| Live density bars | Animated lane bars with trend arrows (↑↑ ↑ → ↓) and forecast scores |
| Real-time chart | Live vehicle density chart built from actual API data |
| Activity feed | Timestamped log of all signal changes, alerts, and emergency events |
| SQLite logging | Every cycle logged with timestamp, all lane counts, congestion, green time |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JS, Chart.js |
| Backend | Python 3, Flask |
| AI Engine | Custom multi-factor scoring (no external ML library needed) |
| Database | SQLite via Python `sqlite3` |
| Deployment | Render (free tier) |

---

## Project Structure

```
smartflow-ai/
│
├── app.py                  # Flask routes, peak-hour simulation, API endpoints
├── requirements.txt
├── README.md
├── .gitattributes
├── .gitignore
├── Procfile
├── runtime.txt
│
├── utils/
│   └── ai_engine.py        # Scoring engine, hotspot detection, recommendation text
│
├── database/
│   ├── db.py               # SQLite helpers, lane history queries
│   └── traffic.db          # Auto-created on first run
│
├── static/
│   ├── css/style.css       # Dashboard styles, signal animations, ambulance directions
│   └── js/app.js           # Live polling, signal rendering, emergency handler
│
└── templates/
    └── index.html          # 3-panel dashboard layout
```

---

## API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/traffic-data` | GET | Returns full junction state — lane counts, signals, predictions, AI decision |
| `/api/emergency/<lane>` | POST | Activates emergency corridor for the specified lane |
| `/api/emergency/stop` | POST | Deactivates emergency mode, restores adaptive control |
| `/api/history` | GET | Returns last 20 logged traffic cycles from SQLite |
| `/api/chart-data` | GET | Returns last 12 records formatted for the live chart |

---

## Installation

```bash
git clone https://github.com/tanuluthra4/Smartflow-AI
cd Smartflow-AI
pip install -r requirements.txt
python app.py
```

Open `http://localhost:5000` in your browser. The SQLite database is created automatically on first run.

---

## Future Roadmap

- **CCTV integration** — replace simulation with real vehicle counts from camera feeds using YOLO object detection
- **IoT sensor support** — ingest data from road-embedded pressure or IR sensors
- **Multi-junction coordination** — optimize signal timing across a connected grid of junctions
- **ML forecasting** — replace Gaussian simulation with a trained time-series model (LSTM or Prophet)
- **Google Maps routing** — suggest alternate routes when junction load exceeds threshold

---

## Developed By

**Tanu Luthra** — B.Tech Computer Engineering