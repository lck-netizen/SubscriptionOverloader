"""Bootstrap shim: replaces the Python uvicorn process with the Node.js
Express server so that the platform-managed supervisor (which is locked to
running this file via uvicorn) ends up running our Node backend on port 8001.
No Python business logic exists in this codebase.
"""
import os
import sys

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
os.chdir(BACKEND_DIR)

# Replace the current Python process with Node so supervisor keeps the same PID
node_entry = os.path.join(BACKEND_DIR, "index.js")
os.execvp("node", ["node", node_entry])
