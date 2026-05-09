from flask import Flask, render_template, jsonify
from database.db import create_table, insert_log
from utils.ai_engine import generate_ai_decision
import random

emergency_mode = False

app = Flask(__name__)
create_table()

@app.route("/")
def home():
    return render_template("index.html")


@app.route("/api/traffic-data")
def traffic_data():

    vehicle_count = random.randint(50, 200)

    congestion_levels = ["Low", "Medium", "High"]
    congestion = random.choice(congestion_levels)

    north_lane = random.randint(10, 80)
    east_lane = random.randint(10, 80)
    south_lane = random.randint(10, 80)
    west_lane = random.randint(10, 80)

    lane_data = {
        "North Lane": north_lane,
        "East Lane": east_lane,
        "South Lane": south_lane,
        "West Lane": west_lane
    }

    max_density = max(
        north_lane,
        east_lane,
        south_lane,
        west_lane
    )

    if max_density > 70:

        traffic_alert = (
            "Critical congestion detected. "
            "AI recommends immediate traffic diversion."
        )

    elif max_density > 50:

            traffic_alert = (
                "Heavy traffic building up at junction."
            )

    else:

        traffic_alert = (
            "Traffic conditions are stable."
        )

    active_signal = max(lane_data, key=lane_data.get)

    highest_density = lane_data[active_signal]
    green_time = 20 + (highest_density // 2)
    wait_time = max(5, 60 - (green_time // 2))
    traffic_efficiency = min(98, 50 + (green_time // 2))

    prediction_data = {}

    for lane in lane_data:
        change = random.randint(-10, 20)

        trend = (
            "increase"
            if change >= 0
            else "decrease"
        )

        prediction_data[lane] = {
            "change": change,
            "trend": trend
        }

    decision = generate_ai_decision(lane_data, prediction_data)

    if trend == "increase":

        prediction_text = (
            f"Traffic expected to increase "
            f"by {change} vehicles."
        )

    else:
        prediction_text = (
            f"Traffic expected to reduce "
            f"by {abs(change)} vehicles."
        )

    if emergency_mode:

        active_signal = "Emergency Route"

        decision = generate_ai_decision(lane_data, prediction_data)

    ai_message = decision["recommendation"]

    response = {
        "vehicle_count": vehicle_count,
        "congestion": congestion,
        "active_signal": active_signal,
        "prediction": prediction_text,
        "north_lane": north_lane,
        "east_lane": east_lane,
        "south_lane": south_lane,
        "west_lane": west_lane,
        "ai_message": ai_message,
        "green_time": green_time,
        "wait_time": wait_time,
        "traffic_efficiency": traffic_efficiency,
        "traffic_alert": traffic_alert
    }

    insert_log(vehicle_count, congestion, active_signal)

    return jsonify(response)

@app.route("/api/emergency")
def emergency():

    global emergency_mode

    emergency_mode = not emergency_mode

    return jsonify({
        "emergency_mode": emergency_mode,
        "message": (
            "Emergency vehicle detected. "
            "Green corridor activated."
            if emergency_mode
            else
            "Emergency mode disabled."
        )
    })

if __name__ == "__main__":
    app.run(debug=True)