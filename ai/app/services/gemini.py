# Baymax - Personal Healthcare Companion
# Chatbot (textonly)
# chatbot (voice+text)




import google.generativeai as genai
import os # loads library from computer
from dotenv import load_dotenv # tools that read env fils 
import re

# Load API key from .env file
load_dotenv() # open env and reads everything
genai.configure(api_key=os.getenv("GEMINI_API_KEY")) # get API from env and gives to GEMINI



# Remove emojis before speaking
def clean_text(text):
    # removes all emojis and special characters
    return re.sub(r'[^\w\s\.,!?]', '', text)
