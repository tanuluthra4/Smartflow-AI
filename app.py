from flask import Flask, render_template, jsonify
import random

emergency_mode = False

app = Flask(__name__)

@app.route("/")
def home():
    return render_template("index.html")


@app.route("/api/traffic-data")
def traffic_data():

    vehicle_count = random.randint(50, 200)

    congestion_levels = ["Low", "Medium", "High"]
    congestion = random.choice(congestion_levels)

    signals = ["North Lane", "East Lane", "South Lane", "West Lane"]

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

    active_signal = max(lane_data, key=lane_data.get)

    highest_density = lane_data[active_signal]

    ai_message = (
        f"AI increased green signal duration for "
        f"{active_signal} due to high traffic density "
        f"({highest_density} vehicles)."
    )

    predictions = [
        "Heavy congestion expected in 10 minutes.",
        "Traffic flow likely to improve shortly.",
        "Peak traffic detected near East Lane.",
        "Moderate congestion predicted ahead.",
        "Emergency route remains clear."
    ]

    prediction = random.choice(predictions)

    if emergency_mode:

        active_signal = "Emergency Route"

        ai_message = (
            "Emergency vehicle detected. "
            "AI activated green corridor priority."
        )

    response = {
        "vehicle_count": vehicle_count,
        "congestion": congestion,
        "active_signal": active_signal,
        "prediction": prediction,
        "north_lane": north_lane,
        "east_lane": east_lane,
        "south_lane": south_lane,
        "west_lane": west_lane,
        "ai_message": ai_message,
    }

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