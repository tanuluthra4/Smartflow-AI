def generate_ai_decision(lane_data, prediction_data):
    adjusted_scores = {}

    for lane in lane_data:
        predicted_increase = max(prediction_data[lane]["change"], 0)
        adjusted_scores[lane] = lane_data[lane] + predicted_increase

    best_lane = max(adjusted_scores, key=adjusted_scores.get)
    score = adjusted_scores[best_lane]
    prediction_change = prediction_data[best_lane]["change"]

    if prediction_change > 10:
        urgency = "Critical"
        prediction_text = f"traffic is surging by {prediction_change} vehicles"
    elif prediction_change > 0:
        urgency = "Moderate"
        prediction_text = f"traffic is expected to increase by {prediction_change} vehicles"
    else:
        urgency = "Stable"
        prediction_text = "traffic flow is expected to stabilize"

    green_time = 20 + (lane_data[best_lane] // 2)
    green_time = min(green_time, 60)

    recommendation = (
        f"{best_lane} selected — {prediction_text}. "
        f"AI optimization score: {score}. "
        f"Recommended green time: {green_time}s."
    )

    congestion_breakdown = {}
    for lane, count in lane_data.items():
        if count > 65:
            status = "critical"
        elif count > 40:
            status = "moderate"
        else:
            status = "clear"
        congestion_breakdown[lane] = status

    return {
        "active_lane": best_lane,
        "recommendation": recommendation,
        "score": score,
        "urgency": urgency,
        "green_time": green_time,
        "congestion_breakdown": congestion_breakdown
    }


def generate_prediction_text(lane_data):
    """Generate a human-readable prediction based on overall traffic state."""
    total = sum(lane_data.values())
    busiest = max(lane_data, key=lane_data.get)
    busiest_count = lane_data[busiest]

    if total > 200:
        return f"High congestion likely to persist. {busiest} showing critical density ({busiest_count} vehicles). Consider activating alternate routes."
    elif total > 140:
        return f"Moderate congestion building. {busiest} leads with {busiest_count} vehicles. AI adjusting signal cycles proactively."
    else:
        return f"Traffic conditions manageable. {busiest} has highest load at {busiest_count} vehicles. System operating efficiently."