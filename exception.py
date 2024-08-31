import traceback
from kivy.app import App
from kivy.uix.button import Button
from kivy.uix.popup import Popup
from kivy.uix.label import Label
from kivy.uix.boxlayout import BoxLayout


class ExceptionHandler(App):
    def build(self):
        # Show the fatal error popup immediately upon starting the ExceptionHandler app
        self.fatal_error_popup()

    def fatal_error_popup(self):
        # Create a popup layout
        layout = BoxLayout(orientation='vertical')
        layout.add_widget(Label(text="A fatal error occurred."))
        layout.add_widget(Label(text="This error was reported to the developer."))
        layout.add_widget(Label(text="We're really sorry :("))


        # Close button
        close_button = Button(text="Close")
        close_button.bind(on_release=lambda *args: App.get_running_app().stop())

        layout.add_widget(close_button)

        # Create and display the popup
        popup = Popup(title="Fatal Error", content=layout, size_hint=(0.8, 0.5))
        popup.open()