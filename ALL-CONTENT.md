# CONNECT — Complete Content Inventory

Every user-visible text string in the app: headings, paragraphs, buttons, labels, toasts, empty states, mock data, AI replies, glossary, articles, and accessibility labels.

---

# 1. Global Chrome

## 1.1 Navbar

- Wordmark: `CONNECT`
- Logo link aria-label: `CONNECT home`
- Nav items: `Features` · `Baymax AI` · `Orayan AI` · `Dashboard` · `Health Records` · `Family` · `Blog`
- Logged out: `Login` (desktop) · `Login / Sign up` (mobile)
- Account menu aria-label: `Open account menu`
- Menu items: `Dashboard` · `Family profiles` · `Emergency access` · `Sign out`
- Mobile toggle aria-labels: `Open menu` / `Close menu`
- Toast: `Signed out. Your demo data stays saved on this device.` (info)

## 1.2 Footer

- Wordmark: `CONNECT`; link aria-label: `CONNECT home`
- Tagline: `Your Comprehensive Personal Health Companion — AI-powered insights, organized health records, and effortless health management for you and your family.`
- Social aria-labels: `CONNECT on X` · `CONNECT on Instagram` · `CONNECT on LinkedIn` · `CONNECT on YouTube`
- **Product** column: `Baymax AI` · `Orayan AI` · `Dashboard` · `Health Records` · `Medications`
- **Company** column: `About` · `Blog` · `Contact`
- **Get in touch**: `support@connect.health` · `+94 11 245 8890` · `42 Flower Rd, Colombo 07, Sri Lanka`
- Copyright: `© {year} CONNECT Health Technologies · Demo prototype`
- Legal links: `Privacy Policy` · `Terms of Service`
- Disclaimer: `CONNECT provides general health information and organizational tools. It is not a medical device and does not replace professional medical advice, diagnosis or treatment.`

## 1.3 Intro Splash

- Wordmark letters: `C O N N E C T`
- Tagline: `Your Comprehensive Personal Health Companion`
- Buttons/aria: `Skip intro` · `Skip intro animation` (also dismissible by click, Esc, Enter)

## 1.4 Notification Bell

- aria-labels: `Notifications, {n} unread` / `Notifications, none unread`; badge caps at `99+`
- Panel heading: `Notifications` · subheading `{n} unread` or `All caught up`
- Buttons: `Mark all read` · `Clear all notifications`
- Empty state: `You're all caught up` / `Reminders about appointments, medications and reports will appear here.`
- Item aria-label: `Unread`
- Relative time: `just now` · `{n}m ago` · `{n}h ago` · `{n}d ago` · date fallback
- **Seed notifications:**
  1. `Report analysis ready` — `Your Full Blood Count report has been analyzed by Orayan. Tap to review the results.`
  2. `Medication reminder` — `Metformin 500 mg — take one tablet with your evening meal.`
  3. `Appointment in 4 days` — `Dr. N. Fernando · Cardiology · 09:30 at Colombo Heart Centre.`
  4. `Lab result outside target` — `HbA1c 7.1% is above your target range of 4.0–5.6%.`

---

# 2. Home Page

## 2.1 Hero

- **H1:** `Health care, made easier for you and your family.` (gradient on "made easier")
- **Lead:** `Keep your health information, reports, medicines, appointments, and family members in one simple place.`
- **Secondary:** `Ask questions when you’re unsure. Understand your medical reports without all the complicated words. Keep track of the people you care about. All from one calm space.`
- **Buttons:** `Get Started` · `Explore Features`
- **Chips:** `Ask health questions with AI` · `Keep your family's health organized` · `Your information stays private`
- Image alt: `Three generations of a family smiling together at home`
- Image fallback label: `Six generations of care, one calm place`
- Floating badge: `Ask Baymax AI`

## 2.2 What is CONNECT

- Eyebrow: `What is CONNECT?`
- Title: `One calm place for your family's health`
- Subtitle: `CONNECT combines an AI health assistant, organized medical records and family coordination into a single, accessible companion.`
- Cards:
  1. `AI-Powered Guidance` — `Calm, plain-language health guidance from Baymax AI and step-by-step report explanations from Orayan AI — available whenever you need them.`
  2. `Secure Health Hub` — `Reports, lab results, vaccinations and medical history organized in one place — stored privately on your own device for this prototype.`
  3. `Family Health Management` — `Follow vitals, medications and appointments for every family member, from children to grandparents, without losing track of anything.`
- Hover affordance: `Explore →`

## 2.3 AI Companions

- Eyebrow: `AI Companions` · Title: `Meet Your AI Companions`
- Subtitle: `Two focused assistants — one helps you understand how you feel, the other helps you understand what your reports say.`
- **Baymax AI card:** badge `Personal Health Assistant` · `A friendly companion for everyday health questions. Describe how you feel and get calm, structured guidance — day or night.`
  - Chips: `Symptom guidance` · `Wellness tips` · `24/7 availability` · `Health conversations` · CTA `Start a conversation`
- **Orayan AI card:** badge `Medical Report Assistant` · `Upload a lab report and see what each value actually means — with plain English and Sinhala explanations for every medical term.`
  - Chips: `Simplified explanations` · `Key data extraction` · `Out-of-range highlighting` · `Report history` · CTA `Analyze a report`

## 2.4 Dashboard Showcase

- Eyebrow: `Centralized Health Dashboard`
- Heading: `Every number that matters, on a single screen`
- Description: `Heart rate, blood pressure, glucose, sleep and water intake — trended over time, next to your reports, medicines and appointments.`
- Bullets: `Live vitals with 30-day trend charts` · `Upcoming appointments and medication schedule` · `Recent reports with out-of-range alerts` · `A quick overview of the whole family`
- Button: `Open the dashboard`
- Visual caption: `Centralized health dashboard`

## 2.5 Features Grid

- Eyebrow: `Everything included` · Title: `Features At A Glance`
- Subtitle: `Every card below opens a working part of CONNECT — no dead ends.`
- Cards (title — subtitle):
  1. `Baymax AI` — `Personal companion`
  2. `Orayan AI` — `Report explanation`
  3. `Health Dashboard` — `Overview`
  4. `Medications` — `Track prescriptions`
  5. `Appointments` — `Manage schedule`
  6. `Health Records` — `All documents`
  7. `Health Education` — `Learn concepts`
  8. `Symptom Journal` — `Track symptoms`
  9. `Report History` — `Store & compare`
  10. `Doctor Prep` — `Prepare questions`
  11. `Family Profiles` — `Manage family health`
  12. `Emergency Access` — `24/7 quick access`

## 2.6 Family Section

- Eyebrow: `Family health`
- Title: `Care for everyone you look after`
- Subtitle: `One profile per person — vitals, medications, allergies and upcoming visits, always a tap away.`
- Card heading: `Health that stays in the family`
- Card paragraph: `Grandparents' blood pressure, a child's vaccination due date, a parent's prescription refill — CONNECT keeps each thread separate and easy to follow.`
- Badges: `Vitals at a glance` · `Shared medication lists` · `Appointment reminders`
- Button: `Open family profiles`
- Image placeholder label: `Family profiles in CONNECT`
- Member card hover: `View health overview →`
- Member stats labels: `Heart rate` · `Blood pressure`

## 2.7 Social Proof

- Eyebrow: `Testimonials` · Title: `Real Stories, Real Health`
- Subtitle: `Feedback from the demo personas used throughout this CONNECT prototype.`
- Header badge: `Demo content — fictional personas`
- Testimonials:
  1. “Everything about my parents’ medication and appointments now lives in one calm place. I stopped keeping three different notebooks.” — **Ishara M.** · Caring for two parents
  2. “Orayan explained my blood test line by line in simple words. I finally understood what I was actually being tested for.” — **Rukshan P.** · Lab report user
  3. “The symptom journal plus Baymax’s calm answers helped me describe everything clearly at my next appointment.” — **Dilini S.** · Asthma patient
- CTA heading: `Take Control of Your Health Journey Today`
- CTA description: `Create your CONNECT account and bring your records, medications and family's care into one calm, organized space.`
- Buttons: `Sign Up Now` (logged out) / `Open my dashboard` (logged in) · `Explore CONNECT`

---

# 3. Baymax AI (Chat)

## 3.1 Baymax.tsx

- Welcome message: `Hello, I'm Baymax — your personal health assistant.` / `Tell me how you're feeling, ask about a symptom, or ask how to prepare for your next appointment. I'll reply in calm, simple steps.`
- Default conversation title: `New conversation`
- Sidebar aria: `Conversation history` · heading `Conversations` · button `New chat` · delete aria `Delete conversation: {title}`
- Info card: `Good to know` (shows baymaxDisclaimer) · link `Emergency access` · backdrop aria `Close history panel`
- Header aria: `Toggle conversation history` · title `Baymax AI` · status `Personal Health Assistant · online` · button `New chat`
- Warning banner: **`General information only.`** + emergencyLine
- Typing aria: `Baymax is typing`
- Suggested block label: `Suggested questions`
- Composer aria: `Describe how you're feeling` · placeholder `Describe how you're feeling…` · submit aria `Send message`
- Footer disclaimer: `Baymax AI shares general health information only — it does not diagnose conditions or replace professional medical care.`
- Empty state: `No conversations yet` / `Start a new chat with Baymax.`

## 3.2 MessageBubble.tsx

- Attribution: `You · {time}` / `Baymax · {time}`
- Emergency notice: `This may need urgent attention` / `If symptoms are severe or sudden, contact your local emergency services now. Baymax cannot assess emergencies through chat.`

## 3.3 mockAI.ts — disclaimer, emergency line, chips

- **baymaxDisclaimer:** `Baymax AI provides general health information for education only. It does not diagnose conditions and does not replace a doctor, pharmacist or emergency service.`
- **emergencyLine:** `If this is an emergency — severe chest pain, trouble breathing, unresponsiveness, heavy bleeding or sudden weakness — contact your local emergency services immediately.`
- **Suggested questions:** `I have a headache` · `What does a fever mean?` · `I feel tired all the time` · `How can I improve my sleep?` · `My blood pressure is a little high` · `How much water should I drink?` · `I feel stressed and anxious` · `How do I prepare for a doctor visit?`

## 3.4 mockAI.ts — keyword replies

**Rule 1 — chest pain / heart attack / crushing pain / left arm pain:**
> Chest pain should always be taken seriously.
> • Stop any activity and sit or lie in a comfortable position.
> • If the pain is severe, spreads to your arm, jaw or back, or comes with sweating, nausea or breathlessness, contact emergency services right now.
> • If you have been prescribed GTN spray or aspirin and your doctor told you to use it in this situation, follow that advice.
> I can help you prepare notes for a doctor afterwards, but please do not wait for a chat reply in an emergency.

**Rule 2 — difficulty breathing / can't breathe / shortness of breath / wheezing badly:**
> Trouble breathing needs prompt attention.
> • Sit upright and loosen any tight clothing.
> • If you use a reliever inhaler, take it as prescribed.
> • If breathing does not improve quickly, is severe, or your lips look blue, call emergency services immediately.
> Once you are stable, we can log the episode in your symptom journal so your doctor has a clear record.

**Rule 3 — headache / head pain / migraine:**
> Headaches are very common and usually not dangerous, but it helps to narrow down the cause.
> • Try water first — mild dehydration is a frequent trigger.
> • Rest in a quiet, dim room for 20–30 minutes.
> • Note when it started, what you ate, and how you slept.
> Seek urgent care if the headache is sudden and severe (“worst ever”), follows a head injury, or comes with fever, confusion, vision loss or weakness.
> Would you like to add this to your symptom journal?

**Rule 4 — fever / temperature / hot body:**
> A fever means your body is fighting something — most often a viral infection.
> • Rest and drink fluids regularly to avoid dehydration.
> • Light clothing and a cool room help; skip cold baths.
> • Paracetamol can help you feel more comfortable if you are otherwise healthy — follow the leaflet for dose and timing.
> See a doctor if fever is above 39°C, lasts more than 3 days, or comes with a stiff neck, rash, confusion or trouble breathing.

**Rule 5 — tired / fatigue / no energy / sleepy / exhausted:**
> Feeling tired all the time usually has a few common contributors.
> • Check sleep quantity and consistency first — aim for a fixed wake-up time.
> • Low iron, low vitamin D and thyroid issues are common, simple blood tests to rule out.
> • Long gaps between meals, dehydration and low activity all drain energy.
> If tiredness lasts more than two weeks, interferes with daily life, or comes with weight change or breathlessness, book a check-up and mention it clearly.

**Rule 6 — sleep / insomnia / can't sleep / wake up:**
> Better sleep is mostly built during the day.
> • Fixed wake-up time, even after a short night.
> • Daylight within an hour of waking sets your body clock.
> • No caffeine after early afternoon; keep the bedroom cool, dark and screen-free.
> • If your mind races at night, write tomorrow’s tasks on paper before bed.
> Persistent insomnia lasting over a month is worth discussing with a doctor rather than managing alone.

**Rule 7 — stress / anxious / anxiety / panic / worried / overwhelmed:**
> That sounds heavy — let’s slow it down.
> • Try box breathing: in for 4, hold for 4, out for 4, hold for 4. Five cycles.
> • Name three things you can see and two you can feel to come back to the present.
> • Write down the single most urgent task and postpone the rest.
> If anxiety affects your sleep, appetite or work for more than a few weeks, speaking to a doctor or counsellor is a strong, normal step — not a last resort.

**Rule 8 — blood pressure / hypertension / bp:**
> Blood pressure moves through the day, so one reading never tells the whole story.
> • Measure seated, after 5 minutes rest, same arm, same time of day.
> • Take readings for a week and record them with date and time.
> • Reducing salty food, moving daily and sleeping well all move the numbers in the right direction.
> Bring your week of readings to your doctor. If a reading is consistently above 180/120, or comes with headache, chest pain or vision changes, seek urgent care.

**Rule 9 — sugar / diabetes / glucose:**
> Blood sugar is influenced by food, activity, sleep and stress.
> • Pair carbohydrates with protein or healthy fat to slow the rise.
> • A 10–15 minute walk after meals genuinely lowers post-meal sugar.
> • Keep testing at the times your doctor recommended and write the results down.
> If readings are repeatedly above your target range, or you have thirst, frequent urination or unexplained weight loss, contact your care team promptly.

**Rule 10 — medicine / medication / pill / dosage / missed dose:**
> A few golden rules for medicines:
> • Take them at consistent times linked to a daily habit.
> • Never double a missed dose unless the leaflet or your pharmacist says to.
> • Keep one master list of everything you take, including supplements.
> • Check interactions before adding anything new — your pharmacist is the fastest person to ask.
> Tell me the medicine name and I can explain what it is generally used for — always confirm the specifics with your pharmacist.

**Rule 11 — exercise / workout / fitness / walking / gym:**
> A realistic starting point works better than an ambitious one.
> • Aim for 150 minutes of moderate activity a week — brisk walking counts.
> • Add two short strength sessions: squats, push-ups, rows or carrying weights.
> • Start with 10-minute blocks if that is all the time you have; they still count.
> If you have a heart condition, joint problems or are returning after a long break, check with your doctor before increasing intensity.

**Rule 12 — water / hydrat / drink:**
> Hydration is one of the cheapest health wins.
> • Around 1.5–2 litres a day is a common guide; heat and exercise add to that.
> • Pale straw-coloured urine is a good practical sign you are on track.
> • Keep a bottle in sight — visibility beats willpower.
> If you have kidney or heart conditions, fluid targets can differ, so follow your doctor’s advice.

**Rule 13 — allergy / allergic / rash / itchy / sneezing:**
> Allergy symptoms are your immune system overreacting to something harmless.
> • Note when and where symptoms appear — that pattern often reveals the trigger.
> • Antihistamines work best before symptoms fully build; follow the leaflet.
> • For dust allergies, hot-water bedding washes and closed windows on high-pollen mornings help.
> If you ever get facial swelling, throat tightness or breathing difficulty, that is an emergency — use your prescribed adrenaline and call emergency services.

**Rule 14 — back pain / lower back / neck pain / stiff:**
> Most everyday back and neck pain settles within a few weeks.
> • Keep gently moving — bed rest beyond a day or two usually slows recovery.
> • Heat, short walks and changing position regularly help more than staying still.
> • Check your chair height and screen position; posture loads add up.
> Seek urgent assessment if pain follows an injury, or comes with numbness, weakness, fever or loss of bladder control.

**Rule 15 — doctor visit / appointment / prepare / check-up:**
> A short plan makes even a 10-minute appointment useful:
> • Write your top 3 concerns in order, with start dates.
> • List current medicines and recent test results.
> • Say exactly what you want: a prescription, a referral, or reassurance.
> • Repeat back what you heard in your own words before leaving.
> I can open your Doctor Prep checklist so you can save these questions.

**Rule 16 — report / lab test / blood test / results:**
> Lab reports are easiest to read in three steps:
> • Find the reference range printed next to each value.
> • Note anything outside that range — one abnormal value is a conversation starter, not a diagnosis.
> • Ask what the value means in plain words before worrying about it.
> Upload your report to Orayan AI for a value-by-value breakdown with simple English and Sinhala explanations.

**Greeting reply** (starts with: hi, hello, hey, good morning, good evening, ayubowan):
> Hello! I am Baymax, your personal health assistant.
> You can tell me how you are feeling, ask about a symptom, or ask how to prepare for an appointment. What would you like to start with?

**Thank-you reply** (contains: thank, thanks):
> You are very welcome. Take care of yourself — and remember to reach out to a professional if things change or worsen.

**Fallback replies (rotated):**
1. > I can help with that in general terms. Could you tell me a bit more — when did it start, how severe is it on a scale of 1 to 10, and is anything making it better or worse?
2. > Thanks for sharing that. To give more useful guidance: what symptoms are you noticing, how long have they lasted, and do you have any ongoing conditions or medicines?
3. > Understood. Let’s look at it together — describe what you feel, when it happens, and anything you have already tried.

**Emergency detection phrases:** `chest pain` · `cannot breathe` · `can't breathe` · `difficulty breathing` · `unconscious` · `severe bleeding` · `stroke` · `suicid`

---

# 4. Orayan AI (Report Analysis)

## 4.1 Orayan.tsx

- Eyebrow: `Orayan AI` · Title: `Understand your medical reports`
- Description: `Upload a report and Orayan extracts every value, highlights anything outside the reference range, and explains the medical terms in simple English and Sinhala.`
- Buttons: `Analyze another report` · `Report history`
- Stepper aria: `Analysis steps` → `Upload report` · `Analyze` · `Results`
- Upload heading: `Step 1 — Upload medical report` / `Blood tests, lipid profiles, thyroid panels or any lab report.`
- Button: `Analyze report` · sample file: `sample-blood-test-report.pdf`
- Aside heading: `What Orayan does`
  1. `Reads the document and finds every measured value.`
  2. `Compares each value with its printed reference range.`
  3. `Marks values that need attention — without diagnosing.`
  4. `Explains hard terms in plain English and Sinhala.`
- Aside disclaimer: `Orayan shows your report values for understanding only. It never diagnoses conditions — always discuss results with your doctor.`
- Toast: `Report analyzed and saved to your report history.`
- Notification: `Report analysis ready` — `{file} was analyzed and saved to your report history.`
- Report types: `Scanned Blood Test` / `Blood Test` · Lab: `Nishadi Labs, Colombo` · Patient fallback: `Demo User`
- Overview heading: `Report overview` · badge `Analysis complete`
- Field labels: `Patient` · `Report date` · `Report type` · `Laboratory` · meta `File: {name}` · `Report ID: {id}`
- Summary heading: `Report summary` · toggle `English / සිංහල`
- Stat labels: `values analyzed` · `within reference range` · `outside reference range` · `terms you've explained`
- Summary disclaimer: `This information is provided for understanding your report and is not a medical diagnosis. Share these results with your doctor or pharmacist for advice that fits your history.`
- Results heading: `Extracted results` · helper: `{n} values · click “Explain simply” on any term`
- Follow-up buttons: `See it on your dashboard` · `Prepare questions for your doctor`
- Empty state: `Nothing to show` / `Upload a report to begin.`

## 4.2 OrayanParts.tsx

- DropZone errors: `Unsupported file. Please upload a PDF, PNG, JPG or JPEG.` · `File is larger than 15 MB. Please upload a smaller document.`
- Selected file: `{size} KB · ready to analyze` · button `Remove`
- DropZone aria: `Upload a medical report: drag a file here or press Enter to browse`
- Headline: `Drag & drop your medical report`
- Sub-line: `or **browse files** — PDF, PNG, JPG up to 15 MB`
- Button: `Try a sample report` · Privacy: `Your file stays on this device — nothing is uploaded.`
- Progress steps: `Reading document…` · `Detecting report sections…` · `Extracting medical values…` · `Matching reference ranges…` · `Preparing simple explanations…`
- Progress heading: `Orayan is analyzing your report` · aria `Report analysis progress` · button `Cancel analysis`
- Result status labels: `Within reference range` · `Attention` · `Outside reference range`
- Range bar: `{low} {unit}` · `Reference: {reference}` · `{high} {unit}`
- Explanation panel: button `Explain simply` · toggle `English / සිංහල` · labels `Technical:` · `Simple English:` · `සිංහලෙන්:` · button `Hide explanation`

## 4.3 Glossary (13 terms — technical / simple English / Sinhala)

1. **Haemoglobin** — Tech: `Haemoglobin is an iron-containing protein in red blood cells that binds to oxygen and carbon dioxide.` Simple: `A protein in your blood that carries oxygen from your lungs to the rest of your body.` Si: `ඔබේ ලේ තුළ ඇති ප්‍රෝටීනයක් වන අතර, එය පෙනහළුවලින් ශරීරයේ අනෙකුත් කොටස් වෙත ඔක්සිජන් ගෙන යයි.`
2. **Fasting Glucose** — Tech: `The concentration of glucose in blood plasma after at least eight hours of fasting.` Simple: `The amount of sugar in your blood after you have not eaten for several hours.` Si: `පැය කිහිපයක් කෑමක් නොමැතිව සිටීමෙන් පසු ඔබේ ලේ තුළ ඇති සීනි ප්‍රමාණය.`
3. **Creatinine** — Tech: `Creatinine is a waste product produced by muscles during normal activity.` Simple: `A blood test value that can give doctors information about kidney function.` Si: `වකුගඩුවල ක්‍රියාකාරිත්වය පිළිබඳ වෛද්‍යවරයාට තොරතුරු ලබා දෙන ලේ පරීක්ෂණ අගයකි.`
4. **TSH** — Tech: `Thyroid-stimulating hormone, released by the pituitary gland to regulate thyroid function.` Simple: `A hormone that tells your thyroid how much work to do. It helps check how your thyroid is behaving.` Si: `ඔබේ තයිරොයිඩ් ග්‍රන්ථිය කොතරම් වැඩ කළ යුතුද යන්න පවසන හෝමෝනයකි.`
5. **Total Cholesterol** — Tech: `The total amount of cholesterol in the blood, including LDL, HDL and VLDL fractions.` Simple: `A measure of the fat-like substances flowing in your blood.` Si: `ඔබේ ලේ තුළ ගමන් කරන මේද වැනි ද්‍රව්‍ය ප්‍රමාණය මැනෙන අගයකි.`
6. **LDL Cholesterol** — Tech: `Low-density lipoprotein carries cholesterol to tissues and can accumulate in arterial walls.` Simple: `Often called “bad” cholesterol — too much of it can build up inside your artery walls.` Si: `ඔබේ ධමනි බිත්තිවල තැන්පත් වී ඒවා තද කළ හැකි “නරක” කොලෙස්ට්‍රෝල් වර්ගයකි.`
7. **HDL Cholesterol** — Tech: `High-density lipoprotein transports cholesterol back to the liver for excretion.` Simple: `Often called “good” cholesterol — it helps move fat away from your arteries.` Si: `මේදය ධමනිවලින් ඉවත් කිරීමට උපකාරී වන “හොඳ” කොලෙස්ට්‍රෝල් වර්ගයකි.`
8. **Vitamin D** — Tech: `A fat-soluble secosteroid required for intestinal calcium absorption and bone mineralisation.` Simple: `A vitamin that helps your body use calcium so your bones stay strong.` Si: `ශක්තිමත් අස්ථි පවත්වා ගැනීමට කැල්සියම් භාවිත කිරීමට ශරීරයට උපකාරී වන විටමිනයකි.`
9. **Triglycerides** — Tech: `Esterified glycerol and fatty acids; the most abundant form of fat in the body.` Simple: `A type of fat in your blood that is closely linked to the food you eat.` Si: `ඔබ ආහාරයට ගන්නා ආහාර සමඟ සම්බන්ධ, ලේ තුළ ඇති මේද වර්ගයකි.`
10. **Systolic pressure** — Tech: `The peak arterial pressure during ventricular systole, when the heart contracts.` Simple: `The top number in a blood pressure reading — the pressure while your heart is squeezing.` Si: `ඔබේ හෘදය පොම්ප කරන විට ධමනිවල ඇති පීඩනය — රක්ත පීඩන අගයෙහි ඉහළ අංකයයි.`
11. **Diastolic pressure** — Tech: `The minimum arterial pressure during ventricular diastole and relaxation of the myocardium.` Simple: `The bottom number in a blood pressure reading — the pressure while your heart rests.` Si: `හෘදය විවේක ගන්නා විට ධමනිවල ඇති පීඩනය — රක්ත පීඩන අගයෙහි පහළ අංකයයි.`
12. **BMI** — Tech: `Body mass index: weight in kilograms divided by the square of height in metres.` Simple: `A simple number that compares your weight with your height to give a rough idea of body size.` Si: `ඔබේ බර සහ උස සසඳන සරල අංකයක් — ශරීර ස්වරූපය ගැන මූලික අදහසක් දෙයි.`
13. **INR** — Tech: `International Normalised Ratio — a standardised prothrombin time used to monitor anticoagulation.` Simple: `A test that checks how quickly your blood clots, often used with blood-thinning medicine.` Si: `ඔබේ ලේ ගැලීමේ වේගය පරීක්ෂා කරන පරීක්ෂණයකි; ලේ තුනී කරන ඖෂධ භාවිතයේදී භාවිතා වේ.`

---

# 5. Dashboard

## 5.1 Dashboard.tsx

- Eyebrow: current date · Title: `{Good morning|Good afternoon|Good evening}, {firstName}` (fallback: `there`)
- Description: `Here is the latest picture of your health — vitals, reports, medicines and your family at a glance.`
- Header actions: `Log a symptom` · `Emergency`
- Section: `Health overview` / `Tap any card to see its trend in detail.`
- Section: `Trends & adherence` / `Thirty days of readings, plus how consistently medicines are taken.`
- Chart card: `Health trends` / `Last 30 days · {trend}`; tabs aria `Trend metric`; tabs: `Blood glucose` (mg/dL) · `Systolic BP` (mmHg) · `Resting heart rate` (bpm); chart aria `{label} over the last 30 days`; axis: `-29 … -1` · `Today`
- Chart card: `Medication adherence` / `Last 30 days`; donut `92%` / `doses taken`; aria `Medication adherence`
- Chart card: `Vitals history · sleep` / `Hours per night this week`; aria `Sleep hours for the last seven days`; unit ` h`
- Card: `Recent reports` / `From your report history` · link `View all`
- Card: `Upcoming appointments` / `Next visits on your calendar` · link `Manage`
- Section: `Medications, insights & family` / `Everything else you track in CONNECT.`
- Card: `Current medications` / `Today's schedule` · link `Manage` · button `Add or edit medication`
- Card: `AI insights` / `Generated from your data`
- Card: `Family overview` / `{n} profiles · {n} upcoming visits` · link `All`
- Modal: description `Last 7 days · {unit}` · badges `Looking good` / `Keep an eye on it` · aria `{label} over the last seven days`
- Modal footnote: `These readings are demo data for the CONNECT prototype. Connect a device or enter readings manually to populate this chart with your own values.`
- Modal button: `Open health records`

## 5.2 DashboardWidgets.tsx

- Recent reports empty: `No reports yet` / `Upload one with Orayan AI.` · badge `{n} values`
- Appointments empty: `Nothing scheduled` / `Book an appointment to see it here.` · chip `DATE`
- Medication badges: `Taken` · `Pending`
- **AI insights:**
  1. `Glucose trending upward` — `Your last 3 readings moved above your usual range. Orayan flagged the same value in your March report.` — CTA `Review in Orayan`
  2. `Sleep is improving` — `You gained 22 minutes of average sleep this week. A consistent wake-up time is the biggest driver.` — CTA `Ask Baymax for tips`
  3. `Vitamin D below range` — `Your March blood work showed 21 ng/mL against a 30–100 reference. Worth discussing at your next visit.` — CTA `Prepare questions`
- Family overview: row link `View` · Emergency card: `Emergency access` / `Contacts, allergies and medications`
- Next visit card: eyebrow `Next visit` · button `All appointments`

---

# 6. Feature Pages

## 6.1 Health Records

- Eyebrow: `Secure Health Hub` · Title: `Health Records`
- Description: `Reports, lab results, vaccinations, conditions and medical history — searchable in one place.`
- Search placeholder: `Search records, providers, notes…` · aria `Search health records`
- Filters: `All` · `Medical Reports` · `Lab Results` · `Vaccinations` · `Conditions` · `Allergies` · `Medical History`
- Count: `{n} record(s)` + ` in {category}`
- Empty: `No records match your search` / `Try a different keyword or clear the filters.` · button `Clear filters`
- Card: meta `{date} · {provider}` · statuses `Active`/`Resolved`/`Completed` · hover `Open details →`
- Modal: sections `Details` · label `Attachment` · badge `Provider: {provider}` · button `Close`

## 6.2 Medications

- Eyebrow: `Track prescriptions` · Title: `Medications`
- Description: `Everything you take, when it is due, and who prescribed it — with quick daily check-offs.`
- Button: `Add medication`
- Tiles: `Active medications` · `Taken today` · `Refill within 7 days`
- Empty: `No medications yet` / `Add your first medication to start tracking doses and refills.` · button `Add medication`
- Card badges: `Taken today` · `Pending`; cells: `Next dose` · `Refill` · `Prescriber` · `With food`
- Buttons: `Mark as taken` · `Undo`; aria: `Edit {name}` / `Delete {name}`
- Modal: `Add medication` / `Edit medication` · desc `Saved locally on this device.` · buttons `Cancel` · `Add medication` · `Save changes`
- Form fields: `Medication name` (e.g. Metformin 500mg) · `Dosage` (e.g. 500 mg) · `Frequency` (e.g. Twice daily) · `Times` hint `Separate with commas` (08:00, 20:00) · `Next dose` (08:00) · `Prescriber` (e.g. Dr. N. Jayasinghe) · `Refill date` · `Food instruction` options `Any time`/`Before food`/`After food`/`With food` · `Purpose / notes` (What is this medicine for?)
- Defaults: frequency `Once daily` · dosage `As prescribed` · prescriber `Not specified` · purpose `General wellbeing`
- Delete modal: `Remove medication?` / `This removes it from your list on this device.` / `{name} will be removed from your medication list.` · buttons `Keep it` · `Remove`
- Toasts: `Please enter the medication name.` (warning) · `Medication added.` · `Medication updated.` · `{name} marked as not taken.` (info) · `{name} marked as taken. Well done!` · `{name} removed from your list.` (info)
- Notification: `Medication added` — `{name} {dosage} · {frequency}.`

## 6.3 Appointments

- Eyebrow: `Manage schedule` · Title: `Appointments`
- Description: `Upcoming visits, past consultations and everything in between.`
- Button: `Add appointment` · Tabs: `Upcoming` · `Past`
- Empty upcoming: `No upcoming appointments` / `Book a visit and it will appear here with reminders.` · button `Add appointment`
- Empty past: `No past appointments` / `Completed and cancelled visits will be listed here.`
- Statuses: `completed` · `cancelled` · modes `In person` · `Video call`
- Actions: `View` · `Reschedule` · `Cancel`
- Modal: `Add appointment` / `Reschedule appointment` · desc `Stored locally on this device.` · buttons `Cancel` · `Add appointment` · `Save new time`
- Form: `Doctor` (e.g. Dr. N. Jayasinghe) · `Specialty` (e.g. General Practice) · `Date` · `Time` (09:00) · `Location` (Clinic, room or video link) · `Mode` · `Reason for visit` (What would you like to discuss?)
- Fallbacks: specialty `General Practice` · location `To be confirmed` · reason `Consultation`
- Details modal: labels `Date` · `Location` · `Reason` · `Status` · `Notes` · buttons `Close` · `Reschedule`
- Cancel modal: `Cancel appointment?` / `You can add a new appointment at any time.` / `Cancel your visit with {doctor} on {date} at {time}?` · buttons `Keep appointment` · `Cancel appointment`
- Toasts: `Doctor and date are required.` (warning) · `Appointment added to your calendar.` · `Appointment rescheduled.` · `Appointment cancelled.` (info)
- Notifications: `Appointment confirmed` — `{doctor} · {specialty} · {relative day} at {time}.` · `Appointment rescheduled` — `{doctor} · {relative day} at {time}.`

## 6.4 Family

- Eyebrow: `Manage family health` · Title: `Family Profiles`
- Description: `A calm overview of everyone you care for — vitals, conditions, medications and upcoming visits.`
- Header badge: `{n} upcoming visits`
- Card: `{relationship} · {age} years · {gender}` · badge `Blood {type}`
- Vital cells: `Heart rate` ({n} bpm) · `Blood pressure` (118/76) · `Glucose` ({n} mg/dL) · `Weight` ({n} kg)
- Empty badge: `No recorded conditions` · appointment: `Visit {relative} · {date}` or `No upcoming visit` · hover `Open →`

## 6.5 Family Member Page

- Not found: `Family member not found` / `This profile may have been removed.` · button `Back to family`
- Back link: `All family profiles`
- Eyebrow: `{relationship} profile` · badges `{age} years` · `Blood {type}` · `Last checkup {date}`
- Buttons: `Appointments` · `Medications`
- Vitals: `Vitals at a glance` · units `bpm` · `mmHg` · `mg/dL` · `kg`
- Disclaimer: `Values shown are demo readings for the CONNECT prototype. In a connected product these would sync from home devices or manual entries.`
- Sections: `Upcoming appointment` (button `Manage appointments` · empty `Nothing scheduled right now.`) · `Allergies` · `Conditions` (empty `No recorded conditions.`) · `Current medications` (empty `No regular medications.`)

## 6.6 Health Education (Blog)

- Eyebrow: `Learn concepts` · Title: `Health Education`
- Description: `Short, plain-language articles on nutrition, sleep, exercise, mental wellness and preventive care.`
- Search: `Search articles…` · aria `Search health articles`
- Categories: `All` · `Nutrition` · `Sleep` · `Exercise` · `Mental Wellness` · `Medication Safety` · `Preventive Care` · `General Health`
- Count: `{n} article(s)` · Empty: `No articles found` / `Try another keyword or pick a different category.` · button `Reset search`
- Card: `{n} min read` · hover `Read →`
- Reader: disclaimer `Educational content only — it does not consider your personal medical history.` · button `Done reading`

## 6.7 Articles (12 — title / category / read time / excerpt / body)

**1. Building a balanced plate without counting every calorie** — Nutrition · 5 min read
- Excerpt: `A simple visual method for portioning vegetables, protein and grains at every meal.`
- Body: (1) `A balanced plate does not require a kitchen scale. Fill half of your plate with vegetables or fruit, one quarter with a protein such as fish, eggs, lentils or chicken, and the quarter with a whole grain like brown rice or wholemeal bread.` (2) `Drink water with your meal and eat slowly — it takes around 20 minutes for your brain to register fullness. Serving on a smaller plate also helps you avoid oversized portions without thinking about it.` (3) `If you manage a condition like diabetes, keep carbohydrate portions consistent across meals and check your levels as advised by your care team.`

**2. Why a steady sleep schedule beats “catching up” on weekends** — Sleep · 4 min read
- Excerpt: `Consistent bed and wake times keep your body clock stable, even after a short night.`
- Body: (1) `Your internal clock prefers rhythm. Going to bed and waking up within the same 30-minute window each day keeps energy, appetite and mood more stable than sleeping late on weekends and getting up early on Monday.` (2) `Build a wind-down routine: dim the lights, stop screens 30 minutes before bed, and keep the bedroom cool and quiet. A short walk in daylight during the day also strengthens your sleep drive at night.` (3) `If you lie awake for more than 20 minutes, get up, read something paper-based in low light, and return when you feel sleepy. This prevents your bed from becoming associated with frustration.`

**3. Movement snacks: fitness in ten-minute blocks** — Exercise · 4 min read
- Excerpt: `Short bursts of activity through the day add up to real cardiovascular benefit.`
- Body: (1) `You do not need a full gym session to stay active. Three 10-minute blocks — a brisk walk, a set of stairs, or bodyweight squats — give your heart and muscles meaningful work.` (2) `Aim for a mix each week: aerobic activity most days, plus two sessions of strength work for major muscle groups. Strength training supports bone density and blood sugar control.` (3) `Start smaller than you think you should. Two short sessions a week that you actually keep doing beat an ambitious plan you abandon in March.`

**4. Simple breathing techniques for stressful moments** — Mental Wellness · 3 min read
- Excerpt: `Slow, even breathing is one of the fastest ways to calm your nervous system.`
- Body: (1) `When stress rises, your breathing becomes quick and shallow. Slowing it down sends a direct signal to your body that you are safe.` (2) `Try box breathing: breathe in for four counts, hold for four, out for four, hold for four. Repeat five cycles. You can do this sitting at a desk without anyone noticing.` (3) `If anxious thoughts keep returning, name five things you can see and four you can feel. Grounding your senses gives your mind something concrete to hold on to.`

**5. Getting the most from your medicines safely** — Medication Safety · 5 min read
- Excerpt: `Timing, storage and one shared list prevent most everyday medication mistakes.`
- Body: (1) `Keep one master list of everything you take — prescriptions, supplements and anything you take occasionally. Show it to every doctor and pharmacist you visit.` (2) `Take medicines at consistent times and link them to a daily habit such as breakfast or brushing your teeth. If you miss a dose, follow the leaflet or ask your pharmacist rather than doubling the next one.` (3) `Store medicines as the label says, check expiry dates twice a year, and never share prescription medicine with family members — the same pill can affect two people very differently.`

**6. Preventive check-ups worth putting in your calendar** — Preventive Care · 5 min read
- Excerpt: `A short list of age-appropriate screenings that catch problems early.`
- Body: (1) `Most conditions are easier to manage when they are found early. Blood pressure checks are worth doing at least once a year, and cholesterol screening every few years for most adults.` (2) `Dental cleanings twice a year, eye tests every two years, and vaccinations on the national schedule are low-effort ways to avoid bigger problems later.` (3) `Write your screening dates into CONNECT so they travel with you — and bring the results to your next appointment instead of relying on memory.`

**7. Reading your blood pressure numbers** — General Health · 4 min read
- Excerpt: `What the two numbers mean and when a reading is worth mentioning to your doctor.`
- Body: (1) `The first number is systolic — pressure while the heart squeezes. The second is diastolic — pressure while the heart rests between beats. Both matter.` (2) `A single high reading is not a diagnosis. Readings taken at home on several days, at the same time, give a far clearer picture than one measurement in a clinic.` (3) `Write down your readings with the date and time. Bringing a week of readings to your appointment helps your doctor make a much better decision.`

**8. Hydration: how much is actually enough?** — Nutrition · 3 min read
- Excerpt: `Fluid needs vary, but a few simple signals tell you whether you are on track.`
- Body: (1) `A common starting point is around 1.5 to 2 litres of fluid a day, but hot weather, exercise and illness all increase what you need.` (2) `Pale straw-coloured urine is a practical sign you are drinking enough. Dark urine, dry lips and headaches often mean it is time for a glass of water.` (3) `Remember that tea, coffee and water-rich foods count towards your intake. Keep a bottle within sight — visibility does more for hydration than willpower.`

**9. Managing screen time for better eyes and posture** — General Health · 4 min read
- Excerpt: `Small adjustments that reduce eye strain and neck pain during long work days.`
- Body: (1) `Follow the 20-20-20 rule: every 20 minutes, look at something 20 feet away for 20 seconds. It gives your focusing muscles a genuine break.` (2) `Set your screen so the top of it sits at or slightly below eye level, and keep your elbows around 90 degrees. Most strain comes from setup, not from screen time itself.` (3) `If your eyes feel dry, blink deliberately and consider a humidifier in an air-conditioned room.`

**10. Talking to your doctor: a five-point appointment plan** — Preventive Care · 4 min read
- Excerpt: `A short checklist that makes short appointments far more useful.`
- Body: (1) `Before you go, write down your three main concerns in order of priority, plus the date each one started. Doctors can solve problems faster with a clear timeline.` (2) `List your current medicines and any recent test results, and note exactly what you want from the visit — a prescription, a referral, or simply reassurance.` (3) `At the end, repeat back what you heard in your own words. Ask what to do if things get worse before the next appointment.`

**11. Stress, sleep and blood sugar: the quiet connection** — Mental Wellness · 5 min read
- Excerpt: `Why anxious days often show up in your energy levels and appetite.`
- Body: (1) `Stress hormones push glucose into the bloodstream so you have energy to act. On a stressful day that can leave you wired, hungry and tired in quick succession.` (2) `You cannot remove every stressor, but regular sleep, short walks and actual lunch breaks noticeably soften the physical response.` (3) `If you notice a pattern between stressful weeks and how you feel, write it in your symptom journal. Patterns you can see are patterns you can plan around.`

**12. Seasonal allergies: a practical home routine** — General Health · 4 min read
- Excerpt: `Reduce exposure and know when to seek advice about persistent symptoms.`
- Body: (1) `Keep windows closed on high-pollen mornings, shower after outdoor time, and wash bedding weekly in hot water to reduce dust mites.` (2) `Antihistamines work best when taken before symptoms build rather than after a sneezing fit has started — follow the leaflet for timing.` (3) `See a doctor if symptoms last more than a few weeks, disturb your sleep, or come with wheezing — those need a proper assessment rather than over-the-counter relief.`

## 6.8 Symptom Journal

- Eyebrow: `Track symptoms` · Title: `Symptom Journal`
- Description: `Record how you feel day by day — useful context to bring to any appointment.`
- Button: `Add entry`
- Tiles: `Total entries` · `Logged this month` · `Severe episodes`
- Empty: `Your journal is empty` / `Log your first symptom to start building a history you can share with your doctor.` · button `Add first entry`
- Severity: `Mild` · `Moderate` · `Severe` · chip `Duration: {duration}` (fallback `Not noted`)
- Aria: `Edit entry: {symptom}` · `Delete entry: {symptom}`
- Modal: `Add symptom entry` / `Edit entry` · desc `Saved on this device.` · fields `Date` · `Duration` (e.g. 2 hours) · `Symptom` (e.g. Mild headache) · `Severity` · `Notes` (What were you doing? What helped?) · buttons `Cancel` · `Save changes` / `Log symptom`
- Delete: `Delete this entry?` / `The entry for {symptom} will be removed permanently.` · buttons `Keep it` · `Delete`
- Toasts: `Please describe the symptom.` (warning) · `Journal entry updated.` · `Symptom logged.` · `Entry removed from your journal.` (info) · dismiss aria `Dismiss notification`
- Notification: `Symptom logged` — `{symptom} · {severity} severity · {date}.`

## 6.9 Report History

- Eyebrow: `Store & compare` · Title: `Report History`
- Description: `Every report you have analyzed with Orayan, kept in one place for easy comparison.`
- Button: `Upload report`
- Empty: `No reports yet` / `Upload your first medical report and it will be saved here automatically.` · link `Upload a report`
- Stats: `Values` · `In range` · `Outside` · action `View` · delete aria `Delete report {fileName}`
- Footnote: `Report values are provided for understanding only and are never a diagnosis.`
- Delete modal: `Delete report?` / `This removes it from this device.` / `{fileName} will be permanently removed from your history.` · buttons `Keep report` · `Delete`
- Toast: `Report deleted from history.` (info)

## 6.10 Report Detail

- Not found: `Report not found` / `It may have been deleted from your history.` · link `Back to report history`
- Back link: `Report history`
- Eyebrow: `{type}` · Title: `{fileName}` · Description: `Analyzed {date} · {lab}`
- Buttons: `Print summary` · `Analyze another`
- Overview labels: `Patient` · `Report date` · `Report type` · `Report ID`
- Summary: `Report summary` · toggle `English / සිංහල` · stats `values analyzed` · `within reference range` · `outside reference range` · `terms you've explained`
- Disclaimer: `This information is provided for understanding your report and is not a medical diagnosis.`
- Section: `Values` · (ResultCard strings as in OrayanParts)

## 6.11 Doctor Prep

- Eyebrow: `Prepare questions` · Title: `Doctor Prep`
- Description: `Build a short checklist for your next visit so nothing important gets forgotten.`
- Button: `Print checklist`
- Checklist: heading `My questions` · progress `{n} of {n} discussed` · input aria `Add your own question` · placeholder `Type your own question…` · button `Add`
- Empty: `No questions yet` / `Add your own, or pick from the suggestions on the right.`
- Suggestions: heading `Suggested questions` · subtitle `Tap to add to your checklist.` · all-added `You have added every suggestion — nice work!`
  1. `What are the likely causes of my symptoms?`
  2. `Do I need any tests, and what do they involve?`
  3. `Are my current medicines still the right choice?`
  4. `What side effects should I watch for?`
  5. `What lifestyle changes would help most right now?`
  6. `How often should I come in for follow-up?`
  7. `What signs mean I should come back sooner?`
  8. `Can you explain my last blood test in simple words?`
- Notes: heading `Notes for the visit` · placeholder `Symptom timeline, medicines you brought, questions from family…` · footnote `Saved automatically on this device.`
- Next appointment: eyebrow `Your next appointment` · link `Manage appointments`
- Before you go: heading `Before you go` · items:
  - `Bring your current medicine list.`
  - `Note when symptoms started.`
  - `Write your top 3 concerns in order.`
  - `Repeat back what you hear before leaving.`
- Toasts: `That question is already on your list.` (info) · `Question added to your checklist.`
- Aria: `Mark as discussed` / `Mark as not discussed` · `Remove question: {question}`

## 6.12 Emergency

- Eyebrow: `24/7 quick access` · Title: `Emergency Access`
- Description: `The essential information you or a responder may need in an urgent situation — kept calm, clear and ready.`
- Button: `Print this page`
- Heading: `In an emergency, call first`
- Body: `If someone has severe chest pain, trouble breathing, heavy bleeding, loses consciousness or shows signs of a stroke, contact emergency services immediately. Do not wait for an app.`
- Services: `Ambulance` · `1990` · `Suwa Seriya emergency ambulance` — `Police` · `119` · `National police emergency line` — `Fire & Rescue` · `110` · `Fire brigade emergency line`
- Note: `Numbers shown are for Sri Lanka. If you are elsewhere, use your local emergency number.`
- Card: `My emergency contacts` · button `Call` · link `Manage family profiles` · aria `Call {name}`
- Card: `Important medical information` · badge `Blood {type}` · blocks `Allergies` · `Conditions` · `Current medications` · `Emergency notes`
- Disclaimer: `CONNECT helps you stay organized, but it cannot call for help or monitor you. In any emergency, contact local emergency services or go to the nearest hospital. This screen is for reference only and is not a substitute for professional medical care.`

---

# 7. Auth & Static Pages

## 7.1 Login

- Signed-in state: `You're signed in` · buttons `Open my dashboard` · `Family profiles` · `Sign out`
- Brand panel heading: `Your Comprehensive Personal Health Companion` / paragraph `AI-powered insights, organized health records, and effortless health management for you and your family.`
- Bullets: `Baymax AI health conversations` · `Orayan report explanations in English & Sinhala` · `Your data stays on this device`
- Footnote: `Demo prototype — no real accounts or servers are used.`
- Tabs: `Sign in` · `Create account`
- Headings: `Welcome back` / `Sign in to continue to your health partner.` — `Create your CONNECT account` / `Set up your personal health space in seconds.`
- Fields: `Full name` (e.g. Amara Perera) · `Email` (you@example.com) · `Password` (At least 6 characters) · aria `Show password` / `Hide password`
- Errors: `Please enter your full name.` · `Enter a valid email address.` · `Password must be at least 6 characters.`
- Buttons: `Sign in` / `Create account` · divider `or` · `Continue with demo account`
- Disclaimer: `This is a front-end prototype. Accounts are simulated and stored only in your browser's local storage.`
- Toasts: `Welcome to CONNECT!` · `Welcome back!` · `Signed in with the demo account.` · `Signed out.` (info)

## 7.2 404

- `404` · `Page not found` / `The page you are looking for does not exist or may have been moved. Let's get you back to a familiar place.`
- Buttons: `Go back` · `Home` · `Dashboard` · `Explore features`

## 7.3 About

- Eyebrow `About us` · Title `About CONNECT` · Desc `CONNECT is a personal health companion designed for individuals and families who want clarity, not complexity.`
- **Why CONNECT exists:** `Health information is scattered across paper reports, WhatsApp messages, memory and half-filled notebooks. CONNECT brings it into one calm, organized space.` / `The platform pairs two focused AI companions — Baymax for everyday health questions, Orayan for medical report explanations — with practical tools for records, medications and appointments.`
- **Designed for families:** `Care rarely involves just one person. Family profiles keep each member’s vitals, conditions, allergies and visits separate but equally accessible.` / `From a child’s vaccination due date to a grandparent’s blood pressure log, everyone stays visible without becoming overwhelming.`
- **Our principles:** `Clarity over jargon, calm over alarm, and honesty about limits. CONNECT never diagnoses — it helps you understand and prepare, then points you to professionals who can help.`

## 7.4 Contact

- Eyebrow `Get in touch` · Title `Contact Us` · Desc `Questions, feedback or partnership ideas — we read every message.`
- Form: `Your name` (Full name) · `Email` (you@example.com) · `Message` (How can we help?) · button `Send message`
- Success: `Message received` / `This is a demo, so nothing was actually sent — but the flow works end to end.` · button `Send another`
- Toasts: `Please fill in every field.` (warning) · `Thanks! Your message has been recorded for this demo.`

## 7.5 Privacy Policy

- Eyebrow `Legal` · Title `Privacy Policy` · Desc `This prototype stores data locally in your browser. This page explains what is kept and why.`
- **What we store:** `In this front-end prototype, your name, email, medications, appointments, symptom entries, doctor-prep notes and report history are stored in your browser’s localStorage.` / `Nothing is sent to a server. Clearing your browser data or using the reset option removes it permanently.`
- **Uploaded reports:** `Medical reports selected in Orayan are analyzed locally in the interface. Files are not transmitted anywhere and are discarded when you leave the page.`
- **Health data caution:** `Do not enter real medical information into a prototype you do not control. This product is a demonstration of interface and interaction design.`

## 7.6 Terms of Service

- Eyebrow `Legal` · Title `Terms of Service` · Desc `The ground rules for using CONNECT as a demonstration product.`
- **Not a medical device:** `CONNECT provides general health information and organizational tools. It is not a medical device, does not provide diagnosis or treatment, and is not a substitute for professional medical advice.`
- **Emergency use:** `CONNECT does not contact emergency services and does not monitor your condition. In an emergency, call your local emergency number immediately.**
- **Demo content:** `Profiles, reports, testimonials and readings shown in this product are fictional demo data created for demonstration purposes.`

## 7.7 Static pages sidebar (all variants)

- `Contact details` — `support@connect.health` · `+94 11 245 8890` · `42 Flower Rd, Colombo 07, Sri Lanka`
- `Quick links` — `Ask Baymax AI` · `Analyze a report` · `Emergency access`

---

# 8. Mock Data (display strings)

## 8.1 User profile

- `Amara Perera` · `amara.perera@connect.health` · initials `AP` · blood `O+` · age `34` · joined `2024-11-02`

## 8.2 Family members

1. **Amara Perera** — Self · 34 · Female · O+ · Conditions: `Mild asthma` · Allergies: `Penicillin` · Vitals: 72 bpm / 118/76 / 92 mg/dL / 61 kg · Meds: `Salbutamol inhaler`, `Vitamin D3` · Visit: Dr. N. Jayasinghe 09:30 (+4d) · Note: `Prefers morning appointments.`
2. **Sunil Perera** — Father · 63 · Male · A+ · Conditions: `Hypertension`, `Type 2 diabetes` · Allergies: `Sulfa drugs` · Vitals: 78 / 138/88 / 142 / 76 · Meds: `Amlodipine 5mg`, `Metformin 500mg`, `Atorvastatin 10mg` · Visit: Dr. R. Fernando 14:00 (+9d) · Note: `Home BP log uploaded weekly.`
3. **Nadeesha Perera** — Mother · 58 · Female · B+ · Conditions: `Hypothyroidism` · Allergies: `No known allergies` · Vitals: 70 / 122/80 / 98 / 64 · Meds: `Levothyroxine 50mcg` · Visit: Dr. S. Wickramasinghe 11:15 (+16d)
4. **Dinuka Perera** — Child · 9 · Male · O+ · Conditions: `Seasonal allergies` · Allergies: `Dust mites` · Vitals: 88 / 102/66 / 88 / 29 · Meds: `Cetirizine syrup (seasonal)` · Note: `Annual vaccination due next month.`
5. **Wimal Perera** — Grandparent · 79 · Male · AB+ · Conditions: `Osteoarthritis`, `Atrial fibrillation` · Allergies: `Aspirin` · Vitals: 76 / 132/84 / 105 / 68 · Meds: `Warfarin 3mg`, `Paracetamol (as needed)` · Visit: Dr. R. Fernando 08:45 (+2d) · Note: `Warfarin INR check every 4 weeks.`

## 8.3 Lab results

| Test | Value | Unit | Reference | Status | Note |
|---|---|---|---|---|---|
| Haemoglobin | 13.2 | g/dL | 12.0 – 16.0 | Within reference range | Carries oxygen in the blood. |
| Fasting Glucose | 180 | mg/dL | 70 – 140 | Outside reference range | Sugar level after fasting. |
| Total Cholesterol | 196 | mg/dL | < 200 | Attention | Overall cholesterol content. |
| Creatinine | 0.9 | mg/dL | 0.6 – 1.2 | Within reference range | Waste product filtered by the kidneys. |
| TSH | 4.6 | mIU/L | 0.4 – 4.0 | Outside reference range | Thyroid stimulating hormone. |
| Vitamin D | 21 | ng/mL | 30 – 100 | Outside reference range | Important for bones and immunity. |
| LDL Cholesterol | 112 | mg/dL | < 130 | Within reference range | Often called “bad” cholesterol. |
| HDL Cholesterol | 54 | mg/dL | > 40 | Attention | Often called “good” cholesterol. |

## 8.4 Reports

- `full-blood-count-march.pdf` · Blood Test · Nishadi Labs, Colombo · NL-2025-40912 · 3 explained terms
- `lipid-profile-feb.pdf` · Lipid Profile · City Clinical Laboratory · CC-2025-11873 · 2 explained terms
- `thyroid-panel-jan.png` · Thyroid Panel · Nishadi Labs, Colombo · NL-2025-30118 · 1 explained term

## 8.5 Health records (10)

1. `Complete Blood Count — March` · Lab Results · Nishadi Labs · Completed — `Routine CBC with differential. Two values outside the reference range.` · details `Haemoglobin 13.2 g/dL (12.0 – 16.0)` / `Fasting Glucose 180 mg/dL (70 – 140)` / `Vitamin D 21 ng/mL (30 – 100)` / `Sample collected fasting at 07:40.` · file `full-blood-count-march.pdf`
2. `Lipid Profile — February` · Lab Results · City Clinical Laboratory · Completed — `Cholesterol panel with LDL/HDL split. All values within range.` · details `Total Cholesterol 196 mg/dL` / `LDL 112 mg/dL` / `HDL 54 mg/dL` / `Triglycerides 128 mg/dL` · file `lipid-profile-feb.pdf`
3. `Annual Physical Examination` · Medical Reports · Dr. N. Jayasinghe · Completed — `General check-up with blood pressure, BMI and lifestyle review.` · details `Blood pressure 118/76 mmHg` / `BMI 22.4 — normal range` / `Vision and hearing within normal limits` / `Follow-up advised in 12 months`
4. `Asthma — Maintenance Plan` · Conditions · Dr. P. Silva · Stable — `Mild intermittent asthma, triggered by dust and cold air.` · details `Reliever inhaler as needed` / `Avoid known dust triggers` / `Review if reliever used more than twice a week`
5. `Penicillin Allergy` · Allergies · Dr. P. Silva · Active — `Rash and facial swelling after amoxicillin in 2016.` · details `Reaction: widespread rash, mild facial swelling` / `Avoid penicillin-class antibiotics` / `Antihistamine relieved symptoms in 24 hours`
6. `MMR Vaccination (2nd dose)` · Vaccinations · Public Health Clinic · Completed — `Second dose of measles, mumps and rubella vaccine.` · details `Left upper arm` / `No adverse reaction reported` / `Next booster not required`
7. `COVID-19 Booster` · Vaccinations · Central Hospital · Completed — `Seasonal booster dose administered.` · details `Right upper arm` / `Mild soreness for 1 day` / `Certificate filed in records`
8. `Appendectomy — 2014` · Medical History · National Hospital · Resolved — `Laparoscopic appendectomy, uncomplicated recovery.` · details `Performed laparoscopically` / `Discharged after 2 nights` / `No complications`
9. `Iron Deficiency Anaemia` · Conditions · Dr. N. Jayasinghe · Resolved — `Low ferritin following heavy menstrual bleeding; corrected with supplements.` · details `Ferritin 8 ng/mL at diagnosis` / `Iron supplementation for 12 weeks` / `Resolved on retest`
10. `Thyroid Panel — January` · Lab Results · Nishadi Labs · Completed — `TSH slightly above the reference range; repeat advised in 6 weeks.` · details `TSH 4.6 mIU/L (0.4 – 4.0)` / `Free T4 within range` / `Repeat test advised` · file `thyroid-panel-jan.png`

## 8.6 Medications (4)

1. `Salbutamol Inhaler` · 100 mcg / puff · As needed · Dr. P. Silva · `Relieves asthma symptoms quickly` · Any time · not taken
2. `Vitamin D3` · 1000 IU · Once daily · 08:00 · Dr. N. Jayasinghe · `Supports bone health and immunity` · After food · taken
3. `Cetirizine` · 10 mg · Once daily (seasonal) · 21:00 · Dr. P. Silva · `Eases allergy and dust symptoms` · Any time · not taken
4. `Ferrous Sulphate` · 200 mg · Twice daily · 08:00, 20:00 · Dr. N. Jayasinghe · `Replenishes iron stores` · After food · taken

## 8.7 Appointments (6)

1. Dr. N. Jayasinghe · General Practice · +4d 09:30 · Nawala Medical Centre, Room 3 · In person · upcoming · `Annual follow-up and blood work review`
2. Dr. P. Silva · Respiratory Medicine · +11d 16:15 · Video consultation · Video call · upcoming · `Asthma control review` · notes `Bring inhaler usage log.`
3. Dr. S. Wickramasinghe · Endocrinology · +19d 11:00 · Central Hospital, Level 2 · In person · upcoming · `Thyroid function follow-up`
4. Dr. R. Fernando · Cardiology · -9d 14:00 · Heart Care Clinic, Kandy · In person · completed · `Blood pressure review with father`
5. Dr. N. Jayasinghe · General Practice · -34d 08:45 · Nawala Medical Centre, Room 3 · In person · completed · `Annual physical examination`
6. Dr. K. Amarasinghe · Dermatology · -27d 15:30 · Skin Clinic, Colombo 05 · In person · cancelled · `Persistent skin irritation` · notes `Rescheduled by clinic.`

## 8.8 Symptom journal seeds (3)

1. `Mild headache` · Mild · 2 hours (-1d) · `Started after long screen time. Improved after a walk and water.`
2. `Blocked nose` · Mild · 1 day (-3d) · `Dusty room at work. Antihistamine helped in the evening.`
3. `Lower back stiffness` · Moderate · 3 hours (-6d) · `After long drive. Stretching and heat pack gave relief.`

## 8.9 Dashboard metrics

1. `Heart Rate` 72 bpm · `-3 vs last week` · good · week: Mon 78, Tue 76, Wed 81, Thu 74, Fri 75, Sat 70, Sun 72
2. `Blood Pressure` 118/76 mmHg · `Stable` · good · 122, 120, 124, 119, 121, 117, 118
3. `Blood Glucose` 180 mg/dL · `+24 vs last test` · not good · 142, 150, 138, 161, 158, 172, 180
4. `Weight` 61 kg · `-0.4 vs last month` · good · 61.8, 61.7, 61.6, 61.5, 61.4, 61.4, 61.0
5. `Sleep` `7h 20m` per night · `+22 min avg` · good · 6.5, 7.1, 6.9, 7.6, 7.2, 8.1, 7.3
6. `Water Intake` 1.9 L / day · `+0.2 L avg` · good · 1.6, 1.8, 1.7, 2.0, 1.9, 2.1, 1.9
- Adherence donut: `Taken` 92 · `Missed` 6 · `Skipped` 2

## 8.10 Emergency data

- Contacts: `Sunil Perera` · Father · +94 77 123 4567 — `Nadeesha Perera` · Mother · +94 71 987 6543 — `Dr. N. Jayasinghe` · Family Doctor · +94 11 245 8890
- Blood: `O+` · Allergies: `Penicillin — rash and facial swelling` · `No food allergies recorded`
- Conditions: `Mild intermittent asthma`
- Medications: `Salbutamol inhaler` · `Vitamin D3 1000 IU` · `Ferrous Sulphate 200 mg`
- Notes: `Asthma reliever inhaler kept in the blue side pocket of the work bag.` / `If breathing difficulty occurs, sit upright and use the reliever inhaler.` / `Emergency contact prefers a call before any hospital admission.`

---

*End of inventory. Covers all pages, components, data files, toasts, notifications, aria-labels, and both English + Sinhala strings.*
