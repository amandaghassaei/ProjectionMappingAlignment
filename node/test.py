import sys
for v in sys.argv[1:]:
    print v

print("hi")

def getData():
    data = raw_input()
    print(data)
    getData()


getData()