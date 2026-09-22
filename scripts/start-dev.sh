#!/bin/bash
# Persistent dev server starter — keeps the server running across sessions
cd /home/z/my-project
while true; do
  echo "[$(date)] Starting dev server..."
  bun run dev > dev.log 2>&1
  echo "[$(date)] Dev server exited with code $?, restarting in 3s..."
  sleep 3
done
