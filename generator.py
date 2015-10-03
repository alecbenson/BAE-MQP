import json
import random
import hashlib
import math
from time import gmtime, strftime
from datetime import date, datetime, time, timedelta

class Generator:
    def __init__(self):
        self.points = int(raw_input("How many points of data would you like to generate? "))
        self.data = []
        self.json = self._generate()
        self._dump_json_to_file()

    def _format_time(self, time_struct, offset):
        delta = timedelta(seconds=offset)
        new = datetime.combine(date.today(), time()) + delta
        return new.strftime("%Y-%m-%dT%H:%M:%S")

    def _generate(self):
        vertices = []
        start_lat = random.uniform(0.0,90.0)
        start_lon = random.uniform(0.0,179.0)
        start_time = gmtime()
        start_ele = random.randrange(0,6000)

        #How big of a circle to move in
        degree_radius = random.uniform(0.5,3.0)
        #How many degrees each point should move within the circle
        degree_step = math.radians(360.0/self.points)

        for x in range(self.points):
            start_ele = start_ele + random.randint(-10,10)
            wobble_x = random.uniform(0.9,1.0)
            wobble_y = random.uniform(0.9,1.0)

            lat_offset = math.sin(degree_step * x) * degree_radius * wobble_y
            lon_offset = math.cos(degree_step * x) * degree_radius * wobble_x

            vert = Vertice(start_lat + lat_offset, start_lon + lon_offset, start_ele, self._format_time(start_time, x))
            vertices.append(vert)

        #Return json formatted data
        return json.dumps(vertices, default=lambda o: o.__dict__)

    def _dump_json_to_file(self):
        with open('sample.json', 'w') as outfile:
            outfile.write(self.json)


class Vertice(object):
    def __init__(self, lat, lon, ele, time):
        self.id = random.getrandbits(64)
        self.lat = lat
        self.lon = lon
        self.ele = ele
        self.time = time

    def __repr__(self):
        return "ID:{0}, LAT:{1} LON:{2} ELEV:{3} TIME:{4}" \
            .format(self.id, self.lat, self.lon, self.ele, self.time)


if __name__ == "__main__":
    gen = Generator()
