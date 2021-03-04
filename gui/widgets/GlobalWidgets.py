from kivy.uix.recycleview import RecycleView
from kivy.uix.recycleview.views import RecycleDataViewBehavior
from kivy.uix.label import Label
from kivy.properties import BooleanProperty
from kivy.uix.recycleboxlayout import RecycleBoxLayout
from kivy.uix.behaviors import FocusBehavior
from kivy.uix.recycleview.layout import LayoutSelectionBehavior
from kivy.uix.popup import Popup
from kivy.uix.behaviors import ButtonBehavior
from kivy.uix.image import Image
from kivy.uix.button import Button
from kivy.clock import Clock
from kivy.uix.widget import Widget
from kivy.core.window import Window


class Confirmation(Popup):
    pass

class ButtonWithImageAndText(Button):
    pass

class ButtonWithImage(Button):
    pass

class ImageButton(ButtonBehavior, Image):
    pass

class ScrollableList(RecycleView):
    '''RecycleView that scrolls'''
    def adjust_height_to_window(self, size = None):
        if not size:
            size = len(self.data)
        size_hint_y = (self.content_height * size) / Window.height + (0.001 * len(self.data))
        return size_hint_y

    def adjust_height_to_available_space(self):
        size_hint_y_used = 0
        for child in self.parent.children:
            if child != self:
                size_hint_y_used += child.size_hint_y

        size_hint_y = max(0, 1 - size_hint_y_used)
        return size_hint_y

    def color_label_background(self, color1 = (1, 1, 1, 1), color2 = (0.95, 0.95, 0.95, 1), highlight_data = None, highlight_color = (157/255.0, 178/255.0, 177/255.0, 1), bolden = False):
        for index, data in enumerate(self.data):
            data['bcolor'] = color1 if index % 2 == 0 else color2

            if highlight_data:
                if isinstance(highlight_data, dict) and data == highlight_data or isinstance(highlight_data, list) and data in highlight_data:
                    data['bcolor'] = highlight_color
                    if bolden:
                        for key, value in data.items():
                            if data[key] != data['bcolor']:
                                data[key] = "[b]{}[/b]".format(value)


class SwappableList(ScrollableList):
    '''Allows the swapping of its children. Needs the setting of a swap function returning true in case the swapping is well done'''
    previously_selected = None
    selected = None
    swappable = False
    widget_selected = None
    methods_selection_changed = []

    def clear_selection(self):
        self.previously_selected = None
        self.selected = None
        self.children[0].selected_nodes = []

    def selection_changed(self, index):
        self.previously_selected = self.selected

        for widget in self.children[0].children:
            if widget.selected:
                self.selected = widget.object

        if self.previously_selected is not None and self.swappable and self.selected != self.previously_selected:
            if self.swap(
                obj_out= self.previously_selected,
                obj_in= self.selected
            ):
                Clock.schedule_once(lambda dt: self.clear_selection())
                self.clear_selection()

        if self.previously_selected == self.selected:
            self.clear_selection()

        try:
            self.screen.selection_changed(self.children[0].selected_nodes)
        except:
            pass
        
        for method in self.methods_selection_changed:
            method()

    def selection_removed(self, index):
        pass

    def swap(self, obj_out, obj_in):
        pass

class SelectableLabel(RecycleDataViewBehavior, Label):
    ''' Add selection support to the Label '''
    index = None
    selectable = BooleanProperty(True)
    selected = BooleanProperty(False)

    def refresh_view_attrs(self, rv, index, data):
        ''' Catch and handle the view changes '''
        self.index = index
        return super(SelectableLabel, self).refresh_view_attrs(
            rv, index, data)

    def on_touch_down(self, touch):
        ''' Add selection on touch down '''
        if super(SelectableLabel, self).on_touch_down(touch):
            return True
        if self.collide_point(*touch.pos) and self.selectable:
            return self.parent.select_with_touch(self.index, touch)

    def apply_selection(self, rv, index, is_selected):
        ''' Respond to the selection of items in the view. '''
        self.selected = is_selected
        if is_selected:
            self.selection_changed(rv, index)
        else:
            self.selection_removed(rv, index)

    def selection_removed(self, rv, index):
        rv.selection_removed(index)
        self.selected = False

    def selection_changed(self, rv, index):
        rv.selection_changed(index)
        self.selected = False
        if self.parent:
            if index in self.parent.selected_nodes:
                self.selected = True

class SelectableRecycleBoxLayout(FocusBehavior, LayoutSelectionBehavior,
                                 RecycleBoxLayout):
    pass

class Information(Popup):
    def show(self, title, information):
        self.title = title
        self.information = information
        self.open()

class ConfirmationBox(Popup):
    pass
