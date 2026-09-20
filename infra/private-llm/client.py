#!/usr/bin/env python3
"""Minimal client for your private 70B endpoint. Run from your laptop.

Usage:
    pip install openai
    PHALA_ENDPOINT=https://<your-cvm>.phala.app VLLM_API_KEY=... python3 client.py
"""
import os
import sys

from openai import OpenAI

endpoint = os.environ.get("PHALA_ENDPOINT")
api_key = os.environ.get("VLLM_API_KEY")
if not endpoint or not api_key:
    sys.exit("Set PHALA_ENDPOINT and VLLM_API_KEY environment variables first.")

client = OpenAI(base_url=endpoint.rstrip("/") + "/v1", api_key=api_key)

prompt = sys.argv[1] if len(sys.argv) > 1 else "Привет! Расскажи, кто ты, в двух предложениях."

resp = client.chat.completions.create(
    model="llama-70b",
    messages=[{"role": "user", "content": prompt}],
    stream=True,
)
for chunk in resp:
    delta = chunk.choices[0].delta.content
    if delta:
        print(delta, end="", flush=True)
print()
