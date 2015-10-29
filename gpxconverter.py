import json
import random
from lxml import html, etree
import xml.etree.ElementTree as ET
import sys

class Converter:

    def __init__(self):
        self.file = sys.argv[1]
        self.data = {"vertices":[]}
        self.convert()
        self._dump_json_to_file()

    def convert(self):
        trackRoot = None
        with open(self.file, 'r') as i:
            gpx = i.read()

        fragments = html.fromstring(gpx)
        for f in fragments:
            if f.tag == 'trk':
                trackRoot = f

        trkseg = trackRoot.find('trkseg')
        trkpts = trkseg.findall('trkpt')

        for point in trkpts:
            attribs = {}
            for k,v in point.attrib.iteritems():
                attribs[k] = v

            time = point.find('time')
            attribs['time'] = time.text

            ele = point.find('ele')
            attribs['ele'] = ele.text
            self.data["vertices"].append(attribs)

    def _dump_json_to_file(self):
        with open('output.json', 'w') as outfile:
            json_data = json.dumps(self.data, default=lambda o: o.__dict__)
            outfile.write(json_data)

if __name__ == "__main__":
    converter = Converter()
