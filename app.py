from flask import Flask, render_template, jsonify
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from database.db import create_table, insert_log, get_recent_logs, get_hourly_stats
from utils.ai_engine import generate_ai_decision, generate_prediction_text
import random

import math
from datetime import datetime

def get_realistic_lane_count(base, hour, noise=8):
    # Rush hours at 8-9am and 5-6pm
    rush = math.exp(-0.5 * ((hour - 8.5) / 1.2)**2) + math.exp(-0.5 * ((hour - 17.5) / 1.2)**2)
    count = int(base * (0.4 + 0.6 * rush) + random.randint(-noise, noise))
    return max(5, min(80, count))

app = Flask(__name__)
create_table()

# Global state
emergency_mode = False
emergency_lane_active = "North Lane"
cycle_count = 0


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/api/traffic-data")
def traffic_data():
    global cycle_count
    cycle_count += 1

    hour = datetime.now().hour
    north_lane = get_realistic_lane_count(60, hour)  # busier by default
    east_lane  = get_realistic_lane_count(45, hour)
    south_lane = get_realistic_lane_count(50, hour)
    west_lane  = get_realistic_lane_count(40, hour)

    vehicle_count = north_lane + east_lane + south_lane + west_lane

    lane_data = {
        "North Lane": north_lane,
        "East Lane":  east_lane,
        "South Lane": south_lane,
        "West Lane":  west_lane
    }

    max_density   = max(lane_data.values())
    total_density = sum(lane_data.values())

    if max_density > 70:
        congestion    = "High"
        traffic_alert = "Critical congestion detected. AI recommends immediate traffic diversion."
    elif max_density > 45:
        congestion    = "Medium"
        traffic_alert = "Heavy traffic building up at junction."
    else:
        congestion    = "Low"
        traffic_alert = "Traffic conditions are stable."

    # Prediction data per lane
    prediction_data = {}
    for lane in lane_data:
        change = random.randint(-10, 20)
        prediction_data[lane] = {
            "change": change,
            "trend":  "increase" if change >= 0 else "decrease"
        }

    decision = generate_ai_decision(lane_data, prediction_data)

    if emergency_mode:
        active_signal = f"{emergency_lane_active} (Emergency)"
        ai_message    = (
            f"EMERGENCY: Green corridor active for {emergency_lane_active}. "
            f"All other lanes holding. Priority clearance in progress."
        )
        green_time = 60
    else:
        active_signal = decision["active_lane"]
        ai_message    = decision["recommendation"]
        green_time    = decision["green_time"]

    wait_time          = max(5, 60 - (green_time // 2))
    traffic_efficiency = min(98, 50 + (green_time // 2))

    # generate_prediction_text now uses lane_predictions too
    prediction_text = generate_prediction_text(lane_data, decision["lane_predictions"])

    # Weighted signal timing for all lanes
    signal_times = {}
    total = sum(lane_data.values()) or 1
    for lane, count in lane_data.items():
        signal_times[lane] = max(10, int((count / total) * 120))

    insert_log(
        vehicle_count, congestion, active_signal,
        north_lane, east_lane, south_lane, west_lane, green_time
    )

    return jsonify({
        "vehicle_count":        vehicle_count,
        "congestion":           congestion,
        "active_signal":        active_signal,
        "prediction":           prediction_text,
        "north_lane":           north_lane,
        "east_lane":            east_lane,
        "south_lane":           south_lane,
        "west_lane":            west_lane,
        "ai_message":           ai_message,
        "green_time":           green_time,
        "wait_time":            wait_time,
        "traffic_efficiency":   traffic_efficiency,
        "traffic_alert":        traffic_alert,
        "signal_times":         signal_times,
        "congestion_breakdown": decision["congestion_breakdown"],
        "lane_predictions":     decision["lane_predictions"],   # ← now included
        "upcoming_hotspots":    decision["upcoming_hotspots"],  # ← now included
        "urgency":              decision["urgency"],             # ← now included
        "emergency_mode":       emergency_mode,
        "cycle_count":          cycle_count,
        "total_density":        total_density
    })


@app.route("/api/emergency/<lane>", methods=["POST"])
def emergency(lane):
    global emergency_mode, emergency_lane_active

    valid_lanes = ["North Lane", "East Lane", "South Lane", "West Lane"]
    if lane not in valid_lanes:
        return jsonify({"error": "Invalid lane"}), 400

    emergency_mode = not emergency_mode
    if emergency_mode:
        emergency_lane_active = lane

    return jsonify({
        "emergency_mode": emergency_mode,
        "active_lane":    emergency_lane_active if emergency_mode else None,
        "message": (
            f"Emergency vehicle detected in {lane}. Green corridor activated."
            if emergency_mode
            else "Emergency mode deactivated. Resuming adaptive signal control."
        )
    })


@app.route("/api/history")
def history():
    return jsonify(get_recent_logs(20))


@app.route("/api/chart-data")
def chart_data():
    return jsonify(get_hourly_stats())


if __name__ == "__main__":
    app.run(debug=True)