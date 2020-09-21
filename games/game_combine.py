import os
import time
import sys

file_id = sys.argv[1]

lines = []
for f in os.listdir():
    if("hearts_game_" + file_id in f):
        with open(f) as file:
            filelines = file.readlines()
            filelines[-1] += '\n'
            for l in filelines:
                lines.append(l)
            file.close()
        os.remove(f)
lines[-1] = lines[-1][:-1]


with open("hearts_" + file_id + ".csv", 'w+') as out:
    out.writelines(lines)
    out.close()

print("Completed.")
