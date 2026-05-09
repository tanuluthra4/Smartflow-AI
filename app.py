from flask import Flask, render_template, jsonify
import random

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
    active_signal = random.choice(signals)

    predictions = [
        "Heavy congestion expected in 10 minutes.",
        "Traffic flow likely to improve shortly.",
        "Peak traffic detected near East Lane.",
        "Moderate congestion predicted ahead.",
        "Emergency route remains clear."
    ]

    prediction = random.choice(predictions)

    response = {
        "vehicle_count": vehicle_count,
        "congestion": congestion,
        "active_signal": active_signal,
        "ai_message": f"AI optimized signal timing for {active_signal}.",
        "prediction": prediction
    }

    return jsonify(response)


if __name__ == "__main__":
    app.run(debug=True)