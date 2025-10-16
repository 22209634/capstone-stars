import requests
import json

# ThingSpeak Channels
HUMIDITY_URL = "https://api.thingspeak.com/channels/270748/fields/2.json?results=1"

def fetch_latest_value(url):
    """Fetch the latest field value from ThingSpeak."""
    response = requests.get(url)
    data = response.json()
    feeds = data.get("feeds", [])
    if not feeds:
        return None
    value = list(feeds[-1].values())[-1]
    return float(value) if value is not None else None

def get_humidity_warning():
    """Check humidity level and return warning info."""
    humidity = fetch_latest_value(HUMIDITY_URL)

    if humidity is None:
        return {"error": "Missing humidity data"}

    if humidity >= 85:
        level = "RED"
        message = "⚠ High humidity detected — telescope equipment at risk!"
    elif humidity >= 70:
        level = "YELLOW"
        message = "⚠ Humidity rising — monitor conditions closely."
    else:
        level = "GREEN"
        message = "✅ Humidity within safe range."

    return {
        "humidity": humidity,
        "status": level,
        "message": message
    }

if __name__ == "__main__":
    result = get_humidity_warning()
    print(json.dumps(result, indent=2))