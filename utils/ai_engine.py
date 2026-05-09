import random

def generate_ai_recommendation(congestion):
    
    recommendations = [
        f"Increase green signal duration for {congestion}.",
        f"Heavy traffic detected near {congestion}.",
        f"Optimize lane switching for {congestion}.",
        f"Emergency priority activated for {congestion}.",
        f"Traffic expected to rise near {congestion}."
    ]

    return random.choice(recommendations)