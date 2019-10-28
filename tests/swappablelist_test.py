from kivy.app import App
from kivy.lang import Builder
from kivy.uix.recycleview import RecycleView
from kivy.uix.recycleview.views import RecycleDataViewBehavior
from kivy.uix.label import Label
from kivy.properties import BooleanProperty
from kivy.uix.recycleboxlayout import RecycleBoxLayout
from kivy.uix.behaviors import FocusBehavior
from kivy.uix.recycleview.layout import LayoutSelectionBehavior

Builder.load_string('''
<ScrollableList>:
    scroll_type: ['bars', 'content']
    scroll_wheel_distance: dp(114)
    bar_width: dp(8)
    content_height: dp(36)
    SelectableRecycleBoxLayout:
        default_size: None, root.content_height
        default_size_hint: 1, None
        size_hint_y: None
        height: self.minimum_height
        orientation: 'vertical'
        spacing: dp(2)

<SelectableLabel>:
    # Draw a background to indicate selection
    canvas.before:
        Color:
            rgba: (0.5, 0.2, 0.1, 1) if self.selected else (0.5, 0.5, 0.5, 1)
        Rectangle:
            pos: self.pos
            size: self.size

<SwappableList>:
    viewclass: 'SelectableLabel'
    swappable: True
''')

class ScrollableList(RecycleView):
    '''RecycleView that scrolls'''
    pass

class SwappableList(ScrollableList):
    '''List that allows selection of its children'''
    selected = None

    def selection_changed(self, index):
        for widget in self.children[0].children:
            if widget.selected:
                self.selected = widget.text

    def selection_removed(self, index):
        pass

class SwappableList(SwappableList):
    '''Allows the swapping of its children. Needs the setting of a swap function returning true in case the swapping is well done'''
    previously_selected = None
    selected = None
    swappable = False

    def selection_changed(self, index):
        self.previously_selected = self.selected
        for widget in self.children[0].children:
            if widget.selected:
                #

                self.selected = widget.text

        def clear_selection():
            for widget in self.children[0].children:
                widget.selected = False

        if self.previously_selected is not None and self.selected is not None and self.swappable and self.selected != self.previously_selected:
            if self.swap(
                obj_out= self.previously_selected,
                obj_in= self.selected
            ):
                from kivy.clock import Clock
                Clock.schedule_once(lambda dt: clear_selection())
                self.selected = None
                self.previously_selected = None

    def swap(self, obj_out, obj_in):
        value_list = App.get_running_app().value_list
        index_one = value_list.index(obj_out)
        index_two = value_list.index(obj_in)
        value_list[index_one], value_list[index_two] = value_list[index_two], value_list[index_one]
        App.get_running_app().refresh()
        return True

class SelectableLabel(RecycleDataViewBehavior, Label):
    ''' Add selection support to the Label '''
    index = None
    selected = BooleanProperty(False)
    selectable = BooleanProperty(True)

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
            self.selected = not self.selected
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

    def selection_changed(self, rv, index):
        rv.selection_changed(index)

class SelectableRecycleBoxLayout(FocusBehavior, LayoutSelectionBehavior,
                                 RecycleBoxLayout):
    pass


class TestApp(App):
    value_list = ["one", "two", "three", "four", "five"]

    def refresh(self):
        self.rv.data = [{'text': str(i)} for i in self.value_list]
        for widget in self.rv.children[0].children:
            widget.selected = False

    def build(self):
        self.rv = SwappableList()
        self.rv.data = [{'text': str(i)} for i in self.value_list]
        return self.rv


if __name__ == '__main__':
    TestApp().run()
