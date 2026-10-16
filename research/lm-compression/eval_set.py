"""EXP-LM-001 harness: reproducible small-LM compression experiments.

Lineage: experiment_id EXP-LM-001, parent none (root), owner aetherius-os
research lane (superposition-lab), hardware i7-870/16GB/GTX1050Ti-CPU-mode,
seed 1337 everywhere, eval set EVAL-SET-001 (40 hand-written TinyStories-style
sentences, provenance: authored for this experiment 2026-10-06, NOT a sample
of any external dataset).

Every run prints one JSON line per variant with: negative log-likelihood mean
(= cross-entropy), perplexity, bytes, wall times, peak RAM, repeat index.
Raw JSONL is the evidence; summaries are derived, never edited.
"""
import json
import time

EVAL_SENTENCES = [
    "Once upon a time there was a little dog named Max.",
    "Max liked to run in the big green park every day.",
    "One sunny morning Max found a red ball under a tree.",
    "He picked up the ball and ran home very fast.",
    "At home his friend Lily was waiting by the door.",
    "Lily smiled and threw the ball far across the yard.",
    "Max chased it and brought it back in his mouth.",
    "They played together until the sun went down.",
    "Then they ate dinner and fell fast asleep.",
    "The next day it rained and they stayed inside.",
    "Lily read a book about a brave little boat.",
    "The boat sailed across the wide blue sea.",
    "A big storm came and the waves grew tall.",
    "The brave boat sailed on through wind and rain.",
    "At last the storm passed and the sky cleared.",
    "The boat reached a small island with palm trees.",
    "On the island lived a kind old turtle.",
    "The turtle showed them where to find fresh water.",
    "They drank and rested under the warm sun.",
    "Soon a ship came to take them back home.",
    "Max barked happily when he saw the ship.",
    "Lily waved goodbye to the turtle friend.",
    "The ship sailed home across the calm sea.",
    "Back home they told their story to everyone.",
    "Everyone laughed and clapped for the brave pair.",
    "That night the stars shone bright above the house.",
    "Max dreamed of boats and islands and new friends.",
    "In the morning they ate pancakes for breakfast.",
    "Lily drew a picture of the island adventure.",
    "She hung the picture on the kitchen wall.",
    "Max sat beside her and wagged his tail.",
    "Outside the birds sang a cheerful song.",
    "A cat walked by but did not bother them.",
    "They decided to visit the park again today.",
    "At the park they met a boy with a kite.",
    "The kite flew high above the tall trees.",
    "Max jumped trying to catch its long tail.",
    "Everybody laughed at the funny jumping dog.",
    "When it got dark they walked slowly home.",
    "Home is the best place of all, they agreed.",
]
