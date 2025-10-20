import requests
import json

# ThingSpeak Channel Info
TEMP_URL = "https://api.thingspeak.com/channels/270748/fields/1.json?results=1"
HUMID_URL = "https://api.thingspeak.com/channels/270748/fields/2.json?results=1"
PRESSURE_URL = "https://api.thingspeak.com/channels/270748/fields/3.json?results=1"
DEW_URL  = "https://api.thingspeak.com/channels/270748/fields/4.json?results=1"

def fetch_latest_value(url):
    """Fetch the latest field value from ThingSpeak."""
    response = requests.get(url)
    data = response.json()
    feeds = data.get("feeds", [])
    if not feeds:
        return None
    value = feeds[-1].get(list(feeds[-1].keys())[-1])  # get last field value
    return float(value) if value is not None else None

def get_weather_status():
    """Calculate dew point difference and return telescope status."""
    temp = fetch_latest_value(TEMP_URL)
    humidity = fetch_latest_value(HUMID_URL)
    pressure = fetch_latest_value(PRESSURE_URL)
    dew = fetch_latest_value(DEW_URL)
    
    if temp is None or dew is None:
        return {"error": "Missing temperature or dew point data"}
    
    diff = temp - dew
    if diff >= 10:
        status = "GREEN"
        message = "Safe: Temperature and dew point are far apart."
    elif diff >= 5:
        status = "YELLOW"
        message = "Warning: Temperature and dew point are getting close."
    else:
        status = "RED"
        message = "Alert: Imaging unsafe — telescope should be parked."
    
    return {
        "temperature": temp,
        "dew_point": dew,
        "humidity": humidity,
        "pressure": pressure,
        "difference": diff,
        "status": status,
        "message": message
    }

if __name__ == "__main__":
    result = get_weather_status()
    print(json.dumps(result, indent=2))
