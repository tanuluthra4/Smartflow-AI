from datetime import datetime

def generate_ai_decision(lane_data, prediction_data, history):
    # Adjusted score = current density + predicted incoming vehicles
    adjusted_scores = {}
    for lane in lane_data:
        predicted_increase = max(prediction_data[lane]["change"], 0)
        adjusted_scores[lane] = lane_data[lane] + predicted_increase

    history_boost = {}
    for lane in lane_data:
        lane_hist = [r["vehicle_count"] for r in history if True]  
        trend = sum(lane_hist[-5:]) - sum(lane_hist[:5]) if len(lane_hist) >= 10 else 0
        history_boost[lane] = trend * 0.3
        adjusted_scores[lane] += history_boost[lane]

    adjusted_scores[lane] += generate_ai_decision.wait_counter[lane] * 0.8

    best_lane = max(adjusted_scores, key=adjusted_scores.get)
    score = adjusted_scores[best_lane]
    prediction_change = prediction_data[best_lane]["change"]

    # Urgency based on the winning lane's predicted change
    if prediction_change > 10:
        urgency = "Critical"
        trend_text = f"surging by +{prediction_change} vehicles"
    elif prediction_change > 0:
        urgency = "Moderate"
        trend_text = f"rising by +{prediction_change} vehicles"
    else:
        urgency = "Stable"
        trend_text = f"easing by {abs(prediction_change)} vehicles"

    # Green time driven by adjusted score (future-aware), not just current count
    green_time = 20 + (adjusted_scores[best_lane] // 2)
    green_time = min(green_time, 60)

    # Detect upcoming hotspots: lanes currently quiet but about to spike
    upcoming_hotspots = [
        lane for lane, data in prediction_data.items()
        if lane_data[lane] < 45 and data["change"] > 12 and lane != best_lane
    ]

    # Time-of-day context
    hour = datetime.now().hour
    if 7 <= hour <= 9:
        time_context = "morning rush hour"
    elif 17 <= hour <= 19:
        time_context = "evening rush hour"
    elif 12 <= hour <= 14:
        time_context = "midday peak"
    elif 22 <= hour or hour <= 5:
        time_context = "low-traffic hours"
    else:
        time_context = "off-peak period"

    recommendation = (
        f"During {time_context}, {best_lane} has highest adjusted load "
        f"({lane_data[best_lane]} current, {trend_text}). "
        f"Allocating {green_time}s green — {urgency.lower()} urgency."
    )

    if upcoming_hotspots:
        hotspot = upcoming_hotspots[0]
        change = prediction_data[hotspot]["change"]
        recommendation += (
            f" Pre-alert: {hotspot} currently light but predicted "
            f"to spike by +{change} — monitor closely."
        )

    # Per-lane congestion status
    congestion_breakdown = {}
    for lane, count in lane_data.items():
        if count > 65:
            status = "critical"
        elif count > 40:
            status = "moderate"
        else:
            status = "clear"
        congestion_breakdown[lane] = status

    # Full per-lane prediction data for the frontend
    lane_predictions = {}
    for lane, data in prediction_data.items():
        change = data["change"]
        if change > 10:
            severity = "spike"
        elif change > 0:
            severity = "rising"
        elif change == 0:
            severity = "stable"
        else:
            severity = "easing"

        lane_predictions[lane] = {
            "change": change,
            "trend": data["trend"],
            "severity": severity,
            "adjusted_score": adjusted_scores[lane]
        }

    if not hasattr(generate_ai_decision, "wait_counter"):
        generate_ai_decision.wait_counter = {}

    for lane in lane_data:
        generate_ai_decision.wait_counter.setdefault(lane, 0)

    for lane in lane_data:
        generate_ai_decision.wait_counter[lane] += 1
        if lane == best_lane:
            generate_ai_decision.wait_counter[lane] = 0
        elif generate_ai_decision.wait_counter[lane] > 3:
            recommendation += (
                f" Note: {lane} has been waiting for "
                f"{generate_ai_decision.wait_counter[lane]} cycles."
            )

    adjusted_scores[lane] += generate_ai_decision.wait_counter[lane] * 0.5

    return {
        "active_lane": best_lane,
        "recommendation": recommendation,
        "score": score,
        "urgency": urgency,
        "green_time": green_time,
        "congestion_breakdown": congestion_breakdown,
        "lane_predictions": lane_predictions,
        "upcoming_hotspots": upcoming_hotspots
    }


def generate_prediction_text(lane_data, lane_predictions):
    """Overall prediction using both current density AND forecast trends."""
    total = sum(lane_data.values())
    busiest_now = max(lane_data, key=lane_data.get)

    # Lane with the most alarming upcoming change
    worst_lane, worst_data = max(
        lane_predictions.items(),
        key=lambda x: x[1]["change"]
    )

    if worst_data["severity"] == "spike" and worst_lane != busiest_now:
        return (
            f"{busiest_now} leads current density, but {worst_lane} predicted "
            f"to spike by +{worst_data['change']} vehicles. "
            f"AI pre-allocating signal time to prevent bottleneck."
        )
    elif total > 200:
        return (
            f"Critical junction load ({total} total vehicles). "
            f"{busiest_now} at peak — extended green cycle active. "
            f"Consider activating alternate routes."
        )
    elif total > 140:
        return (
            f"Moderate congestion across junction ({total} vehicles). "
            f"{busiest_now} leads with {lane_data[busiest_now]}. "
            f"AI adjusting cycles proactively."
        )
    else:
        return (
            f"Junction operating efficiently ({total} vehicles total). "
            f"{busiest_now} has highest load at {lane_data[busiest_now]}. "
            f"No intervention needed."
        )