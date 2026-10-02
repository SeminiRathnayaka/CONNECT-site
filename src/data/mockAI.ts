/**
 * Baymax AI — front-end mock response engine.
 * Deterministic keyword matching so the prototype behaves consistently.
 */

export const baymaxDisclaimer =
  'Baymax AI provides general health information for education only. It does not diagnose conditions and does not replace a doctor, pharmacist or emergency service.';

export const emergencyLine =
  'If this is an emergency — severe chest pain, trouble breathing, unresponsiveness, heavy bleeding or sudden weakness — contact your local emergency services immediately.';

export const suggestedQuestions: string[] = [
  'I have a headache',
  'What does a fever mean?',
  'I feel tired all the time',
  'How can I improve my sleep?',
  'My blood pressure is a little high',
  'How much water should I drink?',
  'I feel stressed and anxious',
  'How do I prepare for a doctor visit?',
];

interface Rule {
  keywords: string[];
  reply: string;
}

const rules: Rule[] = [
  {
    keywords: ['chest pain', 'heart attack', 'crushing pain', 'left arm pain'],
    reply:
      'Chest pain should always be taken seriously.\n\n• Stop any activity and sit or lie in a comfortable position.\n• If the pain is severe, spreads to your arm, jaw or back, or comes with sweating, nausea or breathlessness, contact emergency services right now.\n• If you have been prescribed GTN spray or aspirin and your doctor told you to use it in this situation, follow that advice.\n\nI can help you prepare notes for a doctor afterwards, but please do not wait for a chat reply in an emergency.',
  },
  {
    keywords: ['difficulty breathing', 'cannot breathe', "can't breathe", 'shortness of breath', 'wheezing badly'],
    reply:
      'Trouble breathing needs prompt attention.\n\n• Sit upright and loosen any tight clothing.\n• If you use a reliever inhaler, take it as prescribed.\n• If breathing does not improve quickly, is severe, or your lips look blue, call emergency services immediately.\n\nOnce you are stable, we can log the episode in your symptom journal so your doctor has a clear record.',
  },
  {
    keywords: ['headache', 'head pain', 'migraine'],
    reply:
      'Headaches are very common and usually not dangerous, but it helps to narrow down the cause.\n\n• Try water first — mild dehydration is a frequent trigger.\n• Rest in a quiet, dim room for 20–30 minutes.\n• Note when it started, what you ate, and how you slept.\n\nSeek urgent care if the headache is sudden and severe (“worst ever”), follows a head injury, or comes with fever, confusion, vision loss or weakness.\n\nWould you like to add this to your symptom journal?',
  },
  {
    keywords: ['fever', 'temperature', 'hot body'],
    reply:
      'A fever means your body is fighting something — most often a viral infection.\n\n• Rest and drink fluids regularly to avoid dehydration.\n• Light clothing and a cool room help; skip cold baths.\n• Paracetamol can help you feel more comfortable if you are otherwise healthy — follow the leaflet for dose and timing.\n\nSee a doctor if fever is above 39°C, lasts more than 3 days, or comes with a stiff neck, rash, confusion or trouble breathing.',
  },
  {
    keywords: ['tired', 'fatigue', 'no energy', 'sleepy', 'exhausted'],
    reply:
      'Feeling tired all the time usually has a few common contributors.\n\n• Check sleep quantity and consistency first — aim for a fixed wake-up time.\n• Low iron, low vitamin D and thyroid issues are common, simple blood tests to rule out.\n• Long gaps between meals, dehydration and low activity all drain energy.\n\nIf tiredness lasts more than two weeks, interferes with daily life, or comes with weight change or breathlessness, book a check-up and mention it clearly.',
  },
  {
    keywords: ['sleep', 'insomnia', 'cant sleep', "can't sleep", 'wake up'],
    reply:
      'Better sleep is mostly built during the day.\n\n• Fixed wake-up time, even after a short night.\n• Daylight within an hour of waking sets your body clock.\n• No caffeine after early afternoon; keep the bedroom cool, dark and screen-free.\n• If your mind races at night, write tomorrow’s tasks on paper before bed.\n\nPersistent insomnia lasting over a month is worth discussing with a doctor rather than managing alone.',
  },
  {
    keywords: ['stress', 'anxious', 'anxiety', 'panic', 'worried', 'overwhelmed'],
    reply:
      'That sounds heavy — let’s slow it down.\n\n• Try box breathing: in for 4, hold for 4, out for 4, hold for 4. Five cycles.\n• Name three things you can see and two you can feel to come back to the present.\n• Write down the single most urgent task and postpone the rest.\n\nIf anxiety affects your sleep, appetite or work for more than a few weeks, speaking to a doctor or counsellor is a strong, normal step — not a last resort.',
  },
  {
    keywords: ['blood pressure', 'hypertension', 'bp'],
    reply:
      'Blood pressure moves through the day, so one reading never tells the whole story.\n\n• Measure seated, after 5 minutes rest, same arm, same time of day.\n• Take readings for a week and record them with date and time.\n• Reducing salty food, moving daily and sleeping well all move the numbers in the right direction.\n\nBring your week of readings to your doctor. If a reading is consistently above 180/120, or comes with headache, chest pain or vision changes, seek urgent care.',
  },
  {
    keywords: ['sugar', 'diabetes', 'glucose'],
    reply:
      'Blood sugar is influenced by food, activity, sleep and stress.\n\n• Pair carbohydrates with protein or healthy fat to slow the rise.\n• A 10–15 minute walk after meals genuinely lowers post-meal sugar.\n• Keep testing at the times your doctor recommended and write the results down.\n\nIf readings are repeatedly above your target range, or you have thirst, frequent urination or unexplained weight loss, contact your care team promptly.',
  },
  {
    keywords: ['medicine', 'medication', 'pill', 'dosage', 'missed dose'],
    reply:
      'A few golden rules for medicines:\n\n• Take them at consistent times linked to a daily habit.\n• Never double a missed dose unless the leaflet or your pharmacist says to.\n• Keep one master list of everything you take, including supplements.\n• Check interactions before adding anything new — your pharmacist is the fastest person to ask.\n\nTell me the medicine name and I can explain what it is generally used for — always confirm the specifics with your pharmacist.',
  },
  {
    keywords: ['exercise', 'workout', 'fitness', 'walking', 'gym'],
    reply:
      'A realistic starting point works better than an ambitious one.\n\n• Aim for 150 minutes of moderate activity a week — brisk walking counts.\n• Add two short strength sessions: squats, push-ups, rows or carrying weights.\n• Start with 10-minute blocks if that is all the time you have; they still count.\n\nIf you have a heart condition, joint problems or are returning after a long break, check with your doctor before increasing intensity.',
  },
  {
    keywords: ['water', 'hydrat', 'drink'],
    reply:
      'Hydration is one of the cheapest health wins.\n\n• Around 1.5–2 litres a day is a common guide; heat and exercise add to that.\n• Pale straw-coloured urine is a good practical sign you are on track.\n• Keep a bottle in sight — visibility beats willpower.\n\nIf you have kidney or heart conditions, fluid targets can differ, so follow your doctor’s advice.',
  },
  {
    keywords: ['allergy', 'allergic', 'rash', 'itchy', 'sneezing'],
    reply:
      'Allergy symptoms are your immune system overreacting to something harmless.\n\n• Note when and where symptoms appear — that pattern often reveals the trigger.\n• Antihistamines work best before symptoms fully build; follow the leaflet.\n• For dust allergies, hot-water bedding washes and closed windows on high-pollen mornings help.\n\nIf you ever get facial swelling, throat tightness or breathing difficulty, that is an emergency — use your prescribed adrenaline and call emergency services.',
  },
  {
    keywords: ['back pain', 'lower back', 'neck pain', 'stiff'],
    reply:
      'Most everyday back and neck pain settles within a few weeks.\n\n• Keep gently moving — bed rest beyond a day or two usually slows recovery.\n• Heat, short walks and changing position regularly help more than staying still.\n• Check your chair height and screen position; posture loads add up.\n\nSeek urgent assessment if pain follows an injury, or comes with numbness, weakness, fever or loss of bladder control.',
  },
  {
    keywords: ['doctor visit', 'appointment', 'prepare', 'check-up', 'checkup'],
    reply:
      'A short plan makes even a 10-minute appointment useful:\n\n• Write your top 3 concerns in order, with start dates.\n• List current medicines and recent test results.\n• Say exactly what you want: a prescription, a referral, or reassurance.\n• Repeat back what you heard in your own words before leaving.\n\nI can open your Doctor Prep checklist so you can save these questions.',
  },
  {
    keywords: ['report', 'lab test', 'blood test', 'results'],
    reply:
      'Lab reports are easiest to read in three steps:\n\n• Find the reference range printed next to each value.\n• Note anything outside that range — one abnormal value is a conversation starter, not a diagnosis.\n• Ask what the value means in plain words before worrying about it.\n\nUpload your report to Orayan AI for a value-by-value breakdown with simple English and Sinhala explanations.',
  },
];

const fallbacks = [
  'I can help with that in general terms. Could you tell me a bit more — when did it start, how severe is it on a scale of 1 to 10, and is anything making it better or worse?',
  'Thanks for sharing that. To give more useful guidance: what symptoms are you noticing, how long have they lasted, and do you have any ongoing conditions or medicines?',
  'Understood. Let’s look at it together — describe what you feel, when it happens, and anything you have already tried.',
];

let fallbackIndex = 0;

export function getBaymaxReply(input: string): string {
  const text = input.toLowerCase();

  for (const rule of rules) {
    if (rule.keywords.some((k) => text.includes(k))) {
      return rule.reply;
    }
  }

  if (/^(hi|hello|hey|good morning|good evening|ayubowan)/.test(text.trim())) {
    return 'Hello! I am Baymax, your personal health assistant.\n\nYou can tell me how you are feeling, ask about a symptom, or ask how to prepare for an appointment. What would you like to start with?';
  }

  if (/(thank|thanks)/.test(text)) {
    return 'You are very welcome. Take care of yourself — and remember to reach out to a professional if things change or worsen.';
  }

  const reply = fallbacks[fallbackIndex % fallbacks.length];
  fallbackIndex += 1;
  return reply;
}

export function isEmergencyLanguage(input: string): boolean {
  const text = input.toLowerCase();
  const markers = [
    'chest pain',
    'cannot breathe',
    "can't breathe",
    'difficulty breathing',
    'unconscious',
    'severe bleeding',
    'stroke',
    'suicid',
  ];
  return markers.some((m) => text.includes(m));
}
