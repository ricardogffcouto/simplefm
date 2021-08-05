#!/usr/bin/python
#encoding: utf-8

from kivy.app import App
from kivy.uix.screenmanager import Screen
from lib.Game import Game
import pickle

class StartScreen(Screen):
    def new_game(self):
        self.manager.current = "NewGameScreen"

    def load_game(self):
        self.manager.current = "LoadGameScreen"
        self.manager.get_screen("LoadGameScreen").load_last_game()
