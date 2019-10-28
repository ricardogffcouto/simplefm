from kivy.app import App
from kivy.lang import Builder

root = Builder.load_string("""
PageLayout:
    Button:
        text: 'page1'
    Button:
        text: 'page2'
    Button:
        text: 'page3'""")

class TestApp(App):
    def build(self):
        return root

if __name__ == '__main__':
    TestApp().run()
