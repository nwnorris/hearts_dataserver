import torch
import pandas
import time

print("Loading data set...")
#Import and shuffle
data = pandas.read_csv("hearts_1600655128918_new.csv", header=None)
df = data.sample(frac=1)

#Split into training and test sets
train_size = (df.shape[0] // 4) * 3
test_size = df.shape[0] - train_size

train = df.iloc[0:train_size, :]
test = df.iloc[train_size:, :]

train_y = torch.tensor(train[24].values, dtype=torch.long)
train_x = torch.tensor(pandas.np.array(train.iloc[:, 0:24]), dtype=torch.float)

test_y = torch.tensor(train[24].values, dtype=torch.long)
test_x = torch.tensor(pandas.np.array(train.iloc[:, 0:24]), dtype=torch.float)

print("Training set size: ", str(train_x.shape))
d_in = train_x.shape[1]
h = 25

model = torch.nn.Sequential(
	torch.nn.Linear(d_in, h),
	torch.nn.ReLU(),
	torch.nn.Linear(h, 13),
)

loss_fn = torch.nn.CrossEntropyLoss(reduction='mean')

learning_rate = 1e-4
optimizer = torch.optim.Adam(model.parameters(), lr=learning_rate)

print("Training model...")
for i in range(10000):
	y_pred = model(train_x)
	loss = loss_fn(y_pred, train_y)
	if(i % 100 == 0):
		print(i, loss.item())
	optimizer.zero_grad()
	loss.backward()
	optimizer.step()

print()
print("Model test set results:")
#Each output tensor has 13 elements, we want the max output node for each input tensor.
y_pred = model(test_x)
loss = loss_fn(y_pred, test_y)
print("Mean error: ", loss.item())

#Save model
path = "./models/" + str(round(time.time())) 
torch.save(model.state_dict(), path)




