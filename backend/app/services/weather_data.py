import requests
import json
from typing import Dict, List, Any
from datetime import datetime

# ThingSpeak Channel Info
TEMP_URL = "https://api.thingspeak.com/channels/270748/fields/1.json?results=1"
HUMID_URL = "https://api.thingspeak.com/channels/270748/fields/2.json?results=1"
PRESSURE_URL = "https://api.thingspeak.com/channels/270748/fields/3.json?results=1"
DEW_URL  = "https://api.thingspeak.com/channels/270748/fields/4.json?results=1"

# Warning thresholds
HUMIDITY_RED_THRESHOLD = 85  # High risk to equipment
HUMIDITY_YELLOW_THRESHOLD = 70  # Monitor closely
DEW_POINT_SAFE_DIFF = 10  # Safe to observe
DEW_POINT_WARNING_DIFF = 5  # Close to dew point

def fetch_latest_value(url):
    """Fetch the latest field value from ThingSpeak."""
    try:
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        data = response.json()
        feeds = data.get("feeds", [])
        if not feeds:
            return None
        value = feeds[-1].get(list(feeds[-1].keys())[-1])  # get last field value
        return float(value) if value is not None else None
    except Exception as e:
        print(f"Error fetching data from {url}: {e}")
        return None

def get_humidity_status(humidity: float) -> Dict[str, Any]:
    """
    Evaluate humidity level and return status.

    Returns:
        dict: Contains status level (GREEN/YELLOW/RED) and message
    """
    if humidity >= HUMIDITY_RED_THRESHOLD:
        return {
            "level": "RED",
            "severity": "critical",
            "message": "High humidity detected — telescope equipment at risk!",
            "recommendation": "Do not operate telescope. Park immediately if active."
        }
    elif humidity >= HUMIDITY_YELLOW_THRESHOLD:
        return {
            "level": "YELLOW",
            "severity": "warning",
            "message": "Humidity rising — monitor conditions closely.",
            "recommendation": "Limit observation time and monitor humidity levels."
        }
    else:
        return {
            "level": "GREEN",
            "severity": "safe",
            "message": "Humidity within safe range.",
            "recommendation": None
        }

def get_dew_point_status(temp: float, dew: float) -> Dict[str, Any]:
    """
    Evaluate dew point difference and return status.

    Returns:
        dict: Contains status level (GREEN/YELLOW/RED), message, and difference
    """
    diff = temp - dew

    if diff >= DEW_POINT_SAFE_DIFF:
        return {
            "level": "GREEN",
            "severity": "safe",
            "difference": diff,
            "message": "Safe: Temperature and dew point are far apart.",
            "recommendation": None
        }
    elif diff >= DEW_POINT_WARNING_DIFF:
        return {
            "level": "YELLOW",
            "severity": "warning",
            "difference": diff,
            "message": "Warning: Temperature and dew point are getting close.",
            "recommendation": "Monitor conditions. Consider using dew heaters."
        }
    else:
        return {
            "level": "RED",
            "severity": "critical",
            "difference": diff,
            "message": "Alert: Imaging unsafe — telescope should be parked.",
            "recommendation": "Park telescope immediately to prevent condensation damage."
        }

def get_overall_status(humidity_status: Dict, dew_status: Dict) -> str:
    """
    Determine overall telescope safety status based on all conditions.

    Returns worst case between humidity and dew point checks.
    """
    statuses = [humidity_status["level"], dew_status["level"]]

    if "RED" in statuses:
        return "RED"
    elif "YELLOW" in statuses:
        return "YELLOW"
    else:
        return "GREEN"

def get_weather_status() -> Dict[str, Any]:
    """
    Fetch weather data and return comprehensive telescope safety status.

    Returns:
        dict: Contains all weather readings, individual check results,
              overall status, and any active alerts
    """
    # Fetch all weather data
    temp = fetch_latest_value(TEMP_URL)
    humidity = fetch_latest_value(HUMID_URL)
    pressure = fetch_latest_value(PRESSURE_URL)
    dew = fetch_latest_value(DEW_URL)

    # Check for missing critical data
    if temp is None or dew is None or humidity is None:
        return {
            "error": "Missing critical weather data",
            "temperature": temp,
            "humidity": humidity,
            "pressure": pressure,
            "dew_point": dew,
            "status": "UNKNOWN",
            "alerts": [{
                "severity": "error",
                "message": "Unable to retrieve weather data from sensors",
                "recommendation": "Do not operate telescope until data is available"
            }]
        }

    # Evaluate individual conditions
    humidity_check = get_humidity_status(humidity)
    dew_check = get_dew_point_status(temp, dew)

    # Determine overall status
    overall_status = get_overall_status(humidity_check, dew_check)

    # Collect active alerts
    alerts = []

    if humidity_check["severity"] in ["warning", "critical"]:
        alerts.append({
            "type": "humidity",
            "severity": humidity_check["severity"],
            "message": humidity_check["message"],
            "recommendation": humidity_check["recommendation"],
            "value": humidity
        })

    if dew_check["severity"] in ["warning", "critical"]:
        alerts.append({
            "type": "dew_point",
            "severity": dew_check["severity"],
            "message": dew_check["message"],
            "recommendation": dew_check["recommendation"],
            "difference": dew_check["difference"]
        })

    return {
        "timestamp": datetime.now().isoformat(),
        "temperature": temp,
        "humidity": humidity,
        "pressure": pressure,
        "dew_point": dew,
        "dew_difference": temp - dew,
        "status": overall_status,
        "humidity_status": humidity_check["level"],
        "dew_status": dew_check["level"],
        "alerts": alerts,
        "safe_to_observe": overall_status == "GREEN"
    }

if __name__ == "__main__":
    result = get_weather_status()
    print(json.dumps(result, indent=2))
