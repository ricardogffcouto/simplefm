import kivy
from kivy.app import App
from kivy.uix.button import button

class Person(object):
    def __init__(self, name):
        self.name = name

    def change_name(self, *args, **kwargs):
        self.name = "Jill"


class MyApp(App):
    def build(self):
        p = Person("Jack")
        return Button(text=p.name, on_press=p.change_name)


if __name__ == '__main__':
    MyApp().run()