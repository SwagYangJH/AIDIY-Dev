# openai_helper.py

import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()  # Load your OpenAI key from .env

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Prompt for GPT-4o
prompt = "I want to buy a $250 bike in 10 weeks. To make this happen, I need a clear savings plan."
#A 10-year-old wants to save up for a bicycle by the end of the month. Create a fun 4-week savings plan with weekly goals and a motivational message.
# Send the request
try:
    completion = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are a helpful financial coach for kids."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=300,
        temperature=0.7
    )

    # Print the assistant's reply to the console
    print("Assistant:\n" + completion.choices[0].message.content)

except Exception as e:
    print(f"[OpenAI Error] {e}")