# Baymax - Personal Healthcare Companion
# Chatbot (textonly)
# chatbot (voice+text)




import google.generativeai as genai
import os # loads library from computer
from dotenv import load_dotenv # tools that read env fils 
import pyttsx3  # voice library to baymax speak
import re
import threading  # lets voice run sperately without freezing
import sys  # utf8 stdout fix

# Windows console defaults to cp1252 and crashes on emoji
for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# Load API key from .env file
load_dotenv() # open env and reads everything
genai.configure(api_key=os.getenv("GEMINI_API_KEY")) # get API from env and gives to GEMINI



# Remove emojis before speaking
def clean_text(text):
    # removes all emojis and special characters
    return re.sub(r'[^\w\s\.,!?]', '', text)


#Baymax voice setup 
def speak(text):
      def run(): # function for the speaking
          engine = pyttsx3.init() # start the voice engine 
          engine.setProperty('rate',150) #calm speaking speed 
          engine.setProperty('volume', 1.0)  # full volume
          voices = engine.getProperty('voices')
          engine.setProperty('voice', voices[0].id) # male voice female its
          engine.say(clean_text(text))  # clean emogies
          engine.runAndWait()
          engine.stop()


      thread = threading.Thread(target=run)
      thread.start()
      thread.join()


# Import the prompt from prompts folder
from app.prompts.baymax import BAYMAX_PERSONALITY

# Starting the Gemini model 
model = genai.GenerativeModel(
    model_name="gemini-2.5-flash",
    system_instruction=BAYMAX_PERSONALITY
    )    # creates the ai model gemini and give baymax his personality 

# starting the chatting session 
chat = model.start_chat(history=[]) # this always start a fresh chat no history

# BAYMAX greeting part
greeting_text = "Hey there , I am Baymax , your personal health care companion , How are you feeling today ?"
print("\n"+"="*50) # this line print = 50 times 
print("Hey there , I am Baymax , your personal health care companion , How are you feeling today ?")
print("\n"+"="*50)
print("(type 'quit' to exit)\n")

speak(greeting_text)




# CHAT LOOP 
while True :
       # chat runs 4ever untill user close it 
      # user input
       user_input = input (" You: ")


      #how to close 
       if user_input.lower()=="quit":
            print("\nBaymax: I think you're satisfied with my care. Goodbye! 🤍 ")
            speak("I think you are satisfied with my care. Goodbye!") # ✅ FIX 3 - speak() replaces engine.say()
            break
       

       if not user_input.strip(): # strip checks input is empty or not
             print("Baymax: Please tell me how you are feeling.😊 ") # if its blank ask again 
             continue
       

       try:
             response = chat.send_message(user_input) # send user massga eto gemini to respond 
             print(f"\nBaymax: {response.text}\n") # baymax reply back to the user
             speak(response.text) # waits until speaking is done
       except Exception as e :
             print(f"Baymax: I am sorry . Something went wrong . Please try again")
             print(f"DEBUG ERROR: {e}")
 # try and except for something goes wrong how baymax handle ir (lesson exeption)


               


          
             
       

