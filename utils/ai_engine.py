def generate_ai_decision(
    lane_data,
    prediction_data
):

    adjusted_scores = {}

    for lane in lane_data:

        adjusted_scores[lane] = (
            lane_data[lane]
            +
            max(prediction_data[lane]["change"], 0)
        )

    best_lane = max(
        adjusted_scores,
        key=adjusted_scores.get
    )

    prediction_change = prediction_data[best_lane]["change"]

    if prediction_change > 0:

        prediction_text = (
            f"traffic is expected to increase "
            f"by {prediction_change} vehicles"
        )

    else:

        prediction_text = (
            "traffic flow is expected "
            "to stabilize"
        )

    recommendation = (

        f"{best_lane} selected because "
        f"current traffic density is highest and "
        f"{prediction_text}. "
        f"AI optimization score: "
        f"{adjusted_scores[best_lane]}."
    )

    return {
        "active_lane": best_lane,
        "recommendation": recommendation,
        "score": adjusted_scores[best_lane]
    }