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
  sim.add_votable_fields("ra", "dec", "V", "otype")

  print(f"Querying SIMBAD hemisphere @ {observation}...")
  result = sim.query_region(center_icrs, radius = "8d")
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
  mag = result["FLUX_V"] if "FLUX_V" in result.colnames else np.array([np.nan]*len(result))
  otype = result["OTYPE"] if "OTYPE" in result.colnames else np.array(["?"]*len(result))
  if "MAIN_ID" in result.colnames:
    names = result["MAIN_ID"]
  elif "ID" in result.colnames:
    names = result["ID"]
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
      "vmag": m
    })
  return visible


if __name__ == "__main__":
  objects = visible_objects_bundoora(min_alt_deg, magnitude)
  if not objects:
    print("No objects found. Check if night time or adjust filters.")
  else: 
    print(f"Visible objects (min_alt_deg = {min_alt_deg},, V <= {magnitude}): {len(objects)}\n")
    print("Preview")
    for obj in objects[:5]:
      print(f" {obj['name']} | alt = {obj['alt']:.1f}")



