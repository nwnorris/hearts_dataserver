import torch
import pandas
import time

use_cuda = torch.cuda.is_available()
device = torch.device("cuda:0" if use_cuda else "cpu")

max_epochs = 60000
batch_size = 512
print("Loading data set...")
#Import and shuffle
data = pandas.np.array(pandas.read_csv("hearts_1600655128918.csv", header=None))
print(data.shape)

#Split into training and test sets
train_size = (data.shape[0] // 4) * 3
test_size = data.shape[0] - train_size

train = torch.tensor(data[0:train_size, :], dtype=torch.float, device=device)
validation = torch.tensor(data[train_size:, :], dtype=torch.float, device=device)
train_sampler = torch.utils.data.RandomSampler(train)
validation_sampler = torch.utils.data.RandomSampler(validation)
#train_y = torch.tensor(train[24].values, dtype=torch.long, device=device)
#train_x = torch.tensor(pandas.np.array(train.iloc[:, 0:24]), dtype=torch.float, device=device)

#test_y = torch.tensor(train[24].values, dtype=torch.long, device=device)
#test_x = torch.tensor(pandas.np.array(train.iloc[:, 0:24]), dtype=torch.float, device=device)

training_set = torch.utils.data.DataLoader(train, batch_size = train.shape[0], sampler=train_sampler)
validation_set = torch.utils.data.DataLoader(validation, batch_size = validation.shape[0], sampler=validation_sampler)

d_in = data.shape[1] - 1
h = 25
output_size = 52

model = torch.nn.Sequential(
	torch.nn.Linear(d_in, h),
	torch.nn.ReLU(),
	torch.nn.Linear(h, output_size),
)
model.cuda()

loss_fn = torch.nn.CrossEntropyLoss(reduction='sum')
learning_rate = 1e-4
optimizer = torch.optim.Adam(model.parameters(), lr=learning_rate)
loss = None
print("Training model...")
for i in range(max_epochs):
	for batch in training_set:
		y = torch.tensor(batch[:, -1], dtype=torch.long, device=device)
		x = batch[:, :-1]
		y_pred = model(x)
		loss = loss_fn(y_pred, y)
		optimizer.zero_grad()
		loss.backward()
		optimizer.step()
	if((i) % 100 == 0):
		print(i, loss.item())

print()
print("Model test set results:")
#Each output tensor has 52 elements, we want the max output node for each input tensor.
for i in range(10):
	for batch in validation_set:
		y = torch.tensor(batch[:, -1], dtype=torch.long, device=device)
		x = batch[:, :-1]
		y_pred = model(x)
		loss = loss_fn(y_pred, y)
		print("Mean error: ", loss.item())
#Save model
path = "./models/" + str(round(time.time()))
torch.save(model.state_dict(), path)
