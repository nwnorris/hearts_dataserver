import pandas

data = pandas.read_csv("hearts_1600655128918.csv", header=None)
y = data.iloc[:, -1]
x = data.iloc[:, :13]
for index, row in x.iterrows():
	i = pandas.Index(row.values)
	y[index] = i.get_loc(y[index])
data.drop(24, axis=1, inplace=True)
data = pandas.concat([data, y], axis=1)

data.to_csv("hearts_1600655128918_new.csv", header=False, index=False)