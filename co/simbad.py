from astroquery.simbad import SIMBAD
result = SIMBAD.query_object("M42")
print(result)
