from astroquery.simbad import Simbad
from astropy.coordinates import SkyCoord, EarthLocation, AltAz
from astropy.time import Time
import astropy.units as u
import numpy as np

lat, lon = -37.7, 145.05
min_alt_deg = 30.0
magnitude = 6.5
row_limit = 100
current_time = True 

def visible_objects_bundoora(min_alt_deg, magnitude):
  observation = Time.now() if current_time else Time("2025-09-21T12:00:00")
  location = EarthLocation(lat = lat*u.deg, lon = lon*u.deg)
  altaz = AltAz(obstime = observation, location = location)


  zenith = SkyCoord(alt = 90*u.deg, az = 0*u.deg, frame = altaz)
  center_icrs = zenith.icrs

  sim = Simbad()
  sim.row_limit = row_limit
  sim.add_votable_fields("ra", "dec", "V", "flux(V)", "otype", "main_id", "ids")

  print(f"Querying SIMBAD hemisphere @ {observation}...")
  result = sim.query_region(center_icrs, radius = "1d")
  if result is None or len(result) == 0:
    print("No astronomical objects found. Check if it is night time in Bundoora or adjust filters.")
    return []

  colnames = result.colnames
  
  ra_col = "ra" if "ra" in colnames else ("RA_d" if "RA_d" in colnames else "RA")
  dec_col = "dec" if "dec" in colnames else ("DEC_d" if "DEC_d" in colnames else "DEC")
  if "RA_d" in colnames and "DEC_d" in colnames:
    coords = SkyCoord(ra = result [ra_col]*u.deg, dec = result[dec_col]*u.deg, frame = "icrs")
  else:
    coords = SkyCoord(ra = result[ra_col], dec = result[dec_col], unit = (u.hourangle, u.deg), frame = "icrs")
    
  aa = coords.transform_to(altaz)
  mag = result["V"] if "V" in result.colnames else np.array([np.nan]*len(result))
  otype = result["OTYPE"] if "OTYPE" in result.colnames else np.array(["?"]*len(result))
  name_col = None
  for cand in ("MAIN_ID", "main_id", "IDS", "ids"):
    if cand in result.colnames:
        name_col = cand
        break

  if name_col:
    names = np.array([str(x).strip() for x in result[name_col]])
  else:
    names = np.array([f"Obj_{i+1}" for i in range(len(result))])

  alt_deg = aa.alt.deg
  mag_arr = np.array(mag, dtype = float)
  has_mag = np.isfinite(mag_arr)
  keep = (alt_deg >= min_alt_deg) & ((~has_mag) | (mag_arr <= magnitude))

  visible = []
  for i in np.where(keep)[0]:
    name = names[i].decode("utf-8") if hasattr(names[i], "decode") else str(names[i])
    m = float (mag_arr[i]) if np.isfinite(mag_arr[i]) else None
    visible.append({
      "name": name,
      "otype": str(otype[i]),
      "ra": float(coords.ra.deg[i]),
      "dec": float(coords.dec.deg[i]),
      "alt": float(alt_deg[i]),
      "az": float(aa.az.deg[i]),
      "magnitude": m
    })
  return visible


def search_objects(query: str, max_results: int = 10):
  """
  Search for astronomical objects by name or coordinates using SIMBAD.

  Args:
    query: The search term (object name, identifier, or coordinates like "10.68 +41.27")
    max_results: Maximum number of results to return

  Returns:
    List of matching objects with their details
  """
  if not query or len(query.strip()) == 0:
    return []

  try:
    sim = Simbad()
    sim.row_limit = max_results
    sim.add_votable_fields("ra", "dec", "V", "flux(V)", "otype", "main_id", "ids")

    print(f"Searching SIMBAD for: '{query}'")

    # Check if query looks like coordinates (contains numbers and spaces/commas)
    # Format: "RA DEC" like "10.68 +41.27" or "10.68,+41.27"
    if any(char.isdigit() for char in query) and (' ' in query or ',' in query):
      try:
        # Try to parse as coordinates
        coords_str = query.replace(',', ' ')
        parts = coords_str.split()
        if len(parts) >= 2:
          print(f"Attempting coordinate search: {coords_str}")
          coord = SkyCoord(coords_str, unit=(u.deg, u.deg), frame='icrs')
          # Search within 5 arcminutes of the coordinates
          result = sim.query_region(coord, radius=5*u.arcmin)
          print(f"Coordinate search returned: {len(result) if result else 0} results")
        else:
          result = None
      except Exception as e:
        print(f"Coordinate parsing failed: {e}, trying name search")
        result = None
    else:
      result = None

    # If coordinate search didn't work or wasn't attempted, try name searches
    if result is None or len(result) == 0:
      # Try direct object name search (searches common names like "Andromeda Galaxy")
      print(f"Trying direct name search for: '{query}'")
      result = sim.query_object(query)

      if result is None or len(result) == 0:
        # Try wildcard search for partial matches
        print(f"Trying wildcard search for: '{query}*'")
        result = sim.query_object(query + "*", wildcard=True)

    if result is None or len(result) == 0:
      print(f"No results found for query: '{query}'")
      return []

    print(f"Found {len(result)} result(s)")

    # Get location for calculating altitude/azimuth
    observation = Time.now()
    location = EarthLocation(lat=lat*u.deg, lon=lon*u.deg)
    altaz = AltAz(obstime=observation, location=location)

    colnames = result.colnames
    ra_col = "ra" if "ra" in colnames else ("RA_d" if "RA_d" in colnames else "RA")
    dec_col = "dec" if "dec" in colnames else ("DEC_d" if "DEC_d" in colnames else "DEC")

    if "RA_d" in colnames and "DEC_d" in colnames:
      coords = SkyCoord(ra=result[ra_col]*u.deg, dec=result[dec_col]*u.deg, frame="icrs")
    else:
      coords = SkyCoord(ra=result[ra_col], dec=result[dec_col], unit=(u.hourangle, u.deg), frame="icrs")

    aa = coords.transform_to(altaz)
    mag = result["V"] if "V" in result.colnames else np.array([np.nan]*len(result))
    otype = result["OTYPE"] if "OTYPE" in result.colnames else np.array(["?"]*len(result))

    name_col = None
    for cand in ("MAIN_ID", "main_id", "IDS", "ids"):
      if cand in result.colnames:
        name_col = cand
        break

    if name_col:
      names = np.array([str(x).strip() for x in result[name_col]])
    else:
      names = np.array([f"Obj_{i+1}" for i in range(len(result))])

    alt_deg = aa.alt.deg
    mag_arr = np.array(mag, dtype=float)

    objects = []
    for i in range(min(len(result), max_results)):
      name = names[i].decode("utf-8") if hasattr(names[i], "decode") else str(names[i])
      m = float(mag_arr[i]) if np.isfinite(mag_arr[i]) else None
      objects.append({
        "name": name,
        "object_type": str(otype[i]),
        "ra": float(coords.ra.deg[i]),
        "dec": float(coords.dec.deg[i]),
        "altitude": float(alt_deg[i]),
        "azimuth": float(aa.az.deg[i]),
        "magnitude": m
      })

    return objects

  except Exception as e:
    print(f"Error searching SIMBAD: {e}")
    return []


if __name__ == "__main__":
  objects = visible_objects_bundoora(min_alt_deg, magnitude)
  if not objects:
    print("No objects found. Check if night time or adjust filters.")
  else:
    print(f"Visible objects (minimum altitude = {min_alt_deg}°, magnitude <= {magnitude}): {len(objects)}\n")
    print("Preview")
    for obj in objects[:5]:
      print(f" {obj['name']} | RA = {obj['ra']:.2f}° | Dec = {obj['dec']:.2f}° | alt = {obj['alt']:.1f}° | az = {obj['az']:.1f}° | magnitude = {obj['magnitude']}")



