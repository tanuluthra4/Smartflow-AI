from datetime import datetime

# GLOBAL STATE (FAIRNESS MEMORY)
wait_counter = {}

def clamp(x, min_v, max_v):
    return max(min_v, min(max_v, x))

def generate_ai_decision(lane_data, prediction_data, history):

    global wait_counter

    adjusted_scores = {}

    # 1. INIT + SAFETY BOUNDS
    for lane in lane_data:
        lane_data[lane] = clamp(lane_data[lane], 0, 100)
        wait_counter.setdefault(lane, 0)

    # 2. HISTORY TREND (LANE-AGNOSTIC SIMPLIFIED BUT STABLE)
    lane_hist = list(reversed([r["vehicle_count"] for r in history]))[:10] if history else []
    trend_value = 0

    if len(lane_hist) >= 10:
        trend_value = (sum(lane_hist[:5]) - sum(lane_hist[5:])) / 5  # normalized trend

    # 3. SCORE COMPUTATION (DECOMPOSED)
    for lane in lane_data:

        density_score = lane_data[lane] * 1.0

        pred_score = max(0, prediction_data[lane]["change"]) * 2.0
        pred_score = clamp(pred_score, 0, 100)

        trend_score = clamp(50 + trend_value * 0.3, 0, 100)

        fairness_score = clamp(wait_counter[lane] * 5, 0, 30)

        adjusted_scores[lane] = (
            density_score * 0.5 +
            pred_score * 0.3 +
            trend_score * 0.2 +
            fairness_score * 0.4
        )

    # 4. SELECT BEST LANE
    best_lane = max(adjusted_scores, key=adjusted_scores.get)

    # 5. UPDATE FAIRNESS STATE
    for lane in lane_data:
        if lane == best_lane:
            wait_counter[lane] = 0
        else:
            wait_counter[lane] = min(wait_counter[lane] + 1, 10)

    # 6. FINAL NORMALIZED SCORE (0–100)
    total_score = sum(adjusted_scores.values()) or 1
    score = round((adjusted_scores[best_lane] / total_score) * 100, 2)

    # 7. URGENCY LOGIC
    prediction_change = prediction_data[best_lane]["change"]

    if prediction_change > 10:
        urgency = "Critical"
        trend_text = f"surging by +{prediction_change} vehicles"
    elif prediction_change > 0:
        urgency = "Moderate"
        trend_text = f"rising by +{prediction_change} vehicles"
    else:
        urgency = "Stable"
        trend_text = f"easing by {abs(prediction_change)} vehicles"

    # 8. GREEN TIME (STABLE BOUND)
    green_time = clamp(20 + int(score / 2), 10, 60)

    # 9. HOTSPOTS
    upcoming_hotspots = [
        lane for lane, data in prediction_data.items()
        if lane_data[lane] < 45 and data["change"] > 12 and lane != best_lane
    ]

    # 10. TIME CONTEXT
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

    # 11. RECOMMENDATION
    recommendation = (
        f"During {time_context}, {best_lane} is prioritized with "
        f"{lane_data[best_lane]} vehicles ({trend_text}). "
        f"Allocating {green_time}s green signal — {urgency.lower()} urgency."
    )

    if upcoming_hotspots:
        hotspot = upcoming_hotspots[0]
        recommendation += (
            f" Pre-alert: {hotspot} may spike by +{prediction_data[hotspot]['change']} vehicles."
        )

    # 12. CONGESTION STATUS
    congestion_breakdown = {
        lane: (
            "critical" if count > 65 else
            "moderate" if count > 40 else
            "clear"
        )
        for lane, count in lane_data.items()
    }

    # 13. LANE PREDICTIONS
    lane_predictions = {}

    for lane, data in prediction_data.items():
        change = data["change"]

        severity = (
            "spike" if change > 10 else
            "rising" if change > 0 else
            "stable" if change == 0 else
            "easing"
        )

        lane_predictions[lane] = {
            "change": change,
            "trend": data["trend"],
            "severity": severity,
            "adjusted_score": round(adjusted_scores[lane], 2)
        }

    # 14. RETURN OUTPUT
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