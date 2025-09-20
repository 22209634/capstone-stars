from astroquery.simbad import Simbad
from astropy.coordinates import Skycoord, EarthLocation, AltAz
from astropy.time import Time
import astropy.units as u
import numpy as np

lat, lon = -37.7, 145.05
location = EarthLocation(lat = lat*u.deg, lon = lon*u.deg)
time = Time.now()

altaz_frame = Altaz(obstime = time, location = location)
center = SkyCoord("


result = Simbad.query_object("M42")
print(result)
