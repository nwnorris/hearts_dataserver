import os
import time

lines = []
for f in os.listdir():
    if("_pass.csv" in f):
        with open(f) as file:
            filelines = file.readlines()
            filelines[-1] += '\n'
            for l in filelines:
                lines.append(l)
            file.close()
        os.remove(f)
lines[-1] = lines[-1][:-1]


with open("complete_pass.csv", 'w+') as out:
    out.writelines(lines)
    out.close()

print("Completed.")
