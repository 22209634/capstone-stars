from astroquery.simbad import Simbad
result = Simbad.query_object("M42")
print(result)
