import torch

d_in = 24
h = 25

model = torch.nn.Sequential(
	torch.nn.Linear(d_in, h),
	torch.nn.ReLU(),
	torch.nn.Linear(h, 13),
)

model.load_state_dict(torch.load("./models/latest"))
model.eval()