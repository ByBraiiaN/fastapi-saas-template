#!/usr/bin/env python3
"""Wrapper: ejecuta backend/scripts/seed_plans.py (fuente unica en backend/)."""
import runpy, os
here = os.path.dirname(os.path.abspath(__file__))
runpy.run_path(os.path.join(here, "..", "backend", "scripts", "seed_plans.py"), run_name="__main__")
