import torch
import sys
import json 
from decimal import Decimal

x = json.loads(sys.argv[1], parse_float=Decimal)

x = torch.tensor(x, dtype=torch.float)
d_in = 24
h = 25

model = torch.nn.Sequential(
	torch.nn.Linear(d_in, h),
	torch.nn.ReLU(),
	torch.nn.Linear(h, 13),
)

model.load_state_dict(torch.load("./model/models/latest"))
model.eval()
torch.no_grad()

result = torch.argmax(model(x))
print(str(result.item()))
sys.stdout.flush()