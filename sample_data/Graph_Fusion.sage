G=DiGraph(weighted=true,sparse=True)
G.add_vertices([\
'34',\
'22',\
'4',\
'45',\
'36',\
'0',\
'1',\
'2',\
'15',\
'37',\
'6',\
'12',\
'13',\
'20',\
'28',\
'29',\
'3',\
'14',\
'33',\
])
G.add_edges([\
('15', '22', '0.000e+00'),\
('3', '22', '0.000e+00'),\
('45', '29', '0.000e+00'),\
('1', '13', '-9.630e+01'),\
('2', '14', '-2.087e+01'),\
('1', '6', '0.000e+00'),\
('0', '12', '-3.001e+01'),\
('28', '45', '-6.125e+01'),\
('28', '29', '0.000e+00'),\
('15', '3', '-2.347e+01'),\
('0', '4', '0.000e+00'),\
('2', '20', '0.000e+00'),\
('0', '36', '-5.656e+01'),\
('13', '6', '0.000e+00'),\
('12', '4', '0.000e+00'),\
('36', '37', '0.000e+00'),\
('14', '20', '0.000e+00'),\
('33', '34', '0.000e+00'),\
])
vertex_colors = {(0.8,1.0,1.0):[\
'45',\
'36',\
'0',\
'1',\
'2',\
'15',\
'12',\
'13',\
'28',\
'3',\
'14',\
'33',\
],
(1.0,0.8,0.1):[\
],
(0.1,0.8,1.0):[\
'34',\
'22',\
'4',\
'37',\
'6',\
'20',\
'29',\
],
(0.1,0.1,1.0):[\
]}