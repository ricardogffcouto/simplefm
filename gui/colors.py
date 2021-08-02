colors = [
    (255, 78, 17),
    (250, 183, 51),
    (172, 179, 52),
    (105, 179, 76),
    (84, 143, 61), 
]

def tuple_step(a,b):
    return tuple((x-y)/5 for x,y in zip(a,b))

def tuple_sum(a,b):
    return tuple(x+y for x,y in zip(a,b))

def tuple_multi(a,b):
    return tuple(x*y for x,y in zip(a,b))

def tuple_01(a):
    return tuple(round(x/y,2) for x,y in zip(a,[255]*4))

new_colors = []

for i, color in enumerate(colors):
    if (i < len(colors) - 1):
        next_color = colors[i + 1]
        step = tuple_step(next_color, color)
        for s in range(5):
            this_step = tuple_multi(step, [s + 1]*3)
            this_color = tuple_sum(color, this_step)
            new_colors.append(this_color)
            
for color in new_colors:
    c = list(color)
    c.append(255)
    print(str(tuple_01(c)) + ',')
            