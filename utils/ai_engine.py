def generate_ai_decision(lane_data):

    highest_lane = max(
        lane_data,
        key=lane_data.get
    )

    highest_count = lane_data[highest_lane]

    recommendation = (
        f"{highest_lane} has the highest "
        f"traffic density with "
        f"{highest_count} vehicles. "
        f"AI increased green signal duration "
        f"to optimize traffic flow."
    )

    return {
        "active_lane": highest_lane,
        "vehicle_count": highest_count,
        "recommendation": recommendation
    }