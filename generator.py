import json
import random
import hashlib
import math
from time import gmtime, strftime
from datetime import date, datetime, time, timedelta


class Generator:

    def __init__(self):
        self.points = int(
            raw_input("How many points of data would you like to generate? "))
        self.radius = int(raw_input(
            "How large -- in geographic degrees -- should the circular track be? "))

        self.vertices = self._generate_vertices()
        self.edges = self._generate_edges()
        self.data = self._dump_json_to_file()

    def __getstate__(self):
        state = dict(self.__dict__)
        del state['radius']
        del state['points']
        return state

    def _format_time(self, time_struct, offset):
        delta = timedelta(seconds=offset)
        new = datetime.combine(date.today(), time()) + delta
        return new.strftime("%Y-%m-%dT%H:%M:%S")

    def _generate_vertices(self):
        vertices = []
        start_lat = random.uniform(0.0, 90.0)
        start_lon = random.uniform(0.0, 179.0)
        start_time = gmtime()
        start_ele = random.randrange(0, 6000)

        # How many degrees each point should move within the circle
        degree_step = math.radians(360.0 / self.points)

        for x in range(self.points):
            start_ele = start_ele + random.randint(-10, 10)
            wobble_x = random.uniform(0.9, 1.0)
            wobble_y = random.uniform(0.9, 1.0)

            lat_offset = math.sin(degree_step * x) * self.radius * wobble_y
            lon_offset = math.cos(degree_step * x) * self.radius * wobble_x

            vert = Vertice(start_lat + lat_offset, start_lon +
                           lon_offset, start_ele, self._format_time(start_time, x))
            vertices.append(vert)

        # Return json formatted data
        return vertices

    def _generate_edges(self):
        edges = []

        if not self.vertices:
            self.vertices = self._generate_vertices()

        for index in range(len(self.vertices)):
            if index == len(self.vertices) - 1:
                break

            id_a = self.vertices[index].id
            id_b = self.vertices[index + 1].id
            weight = random.uniform(1.0, 3.0)
            edge = Edge(id_a, id_b, weight)
            edges.append(edge)
        return edges

    def _dump_json_to_file(self):
        with open('sample.json', 'w') as outfile:
            json_data = json.dumps(self, default=lambda o: o.__dict__)
            outfile.write(json_data)

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


class Edge(object):

    def __init__(self, id_a, id_b, weight):
        self.id_a = id_a
        self.id_b = id_b
        self.weight = weight

    def __repr__(self):
        return "(Edge connecting {0} to {1})" \
            .format(self.id_a, self.id_b)


if __name__ == "__main__":
    gen = Generator()
