import random

l = [random.expovariate(0.3) for i in range(10)]
print(max(l))