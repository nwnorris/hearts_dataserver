import torch

d_in = 24
h = 25
output_size = 52

model = torch.nn.Sequential(
	torch.nn.Linear(d_in, h),
	torch.nn.ReLU(),
	torch.nn.Linear(h, output_size),
)

model.load_state_dict(torch.load("./models/latest"))
model.eval()
