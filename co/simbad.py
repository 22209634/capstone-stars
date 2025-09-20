from astroquery.simbad import Simbad
from astropy.coordinates import Skycoord, EarthLocation, AltAz
from astropy.time import Time
import astropy.units as u

lat, lon = -37.7, 145.05
location = EarthLocation(lat = lat*u.deg, lon = lon*u.deg)
time = Time.now()


result = Simbad.query_object("M42")
print(result)
