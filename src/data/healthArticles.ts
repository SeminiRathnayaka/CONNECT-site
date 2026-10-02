import type { HealthArticle } from '../types';

export const healthArticles: HealthArticle[] = [
  {
    id: 'a-1',
    title: 'Building a balanced plate without counting every calorie',
    category: 'Nutrition',
    readMinutes: 5,
    icon: 'apple',
    excerpt:
      'A simple visual method for portioning vegetables, protein and grains at every meal.',
    body: [
      'A balanced plate does not require a kitchen scale. Fill half of your plate with vegetables or fruit, one quarter with a protein such as fish, eggs, lentils or chicken, and the quarter with a whole grain like brown rice or wholemeal bread.',
      'Drink water with your meal and eat slowly — it takes around 20 minutes for your brain to register fullness. Serving on a smaller plate also helps you avoid oversized portions without thinking about it.',
      'If you manage a condition like diabetes, keep carbohydrate portions consistent across meals and check your levels as advised by your care team.',
    ],
  },
  {
    id: 'a-2',
    title: 'Why a steady sleep schedule beats “catching up” on weekends',
    category: 'Sleep',
    readMinutes: 4,
    icon: 'moon',
    excerpt:
      'Consistent bed and wake times keep your body clock stable, even after a short night.',
    body: [
      'Your internal clock prefers rhythm. Going to bed and waking up within the same 30-minute window each day keeps energy, appetite and mood more stable than sleeping late on weekends and getting up early on Monday.',
      'Build a wind-down routine: dim the lights, stop screens 30 minutes before bed, and keep the bedroom cool and quiet. A short walk in daylight during the day also strengthens your sleep drive at night.',
      'If you lie awake for more than 20 minutes, get up, read something paper-based in low light, and return when you feel sleepy. This prevents your bed from becoming associated with frustration.',
    ],
  },
  {
    id: 'a-3',
    title: 'Movement snacks: fitness in ten-minute blocks',
    category: 'Exercise',
    readMinutes: 4,
    icon: 'footprints',
    excerpt:
      'Short bursts of activity through the day add up to real cardiovascular benefit.',
    body: [
      'You do not need a full gym session to stay active. Three 10-minute blocks — a brisk walk, a set of stairs, or bodyweight squats — give your heart and muscles meaningful work.',
      'Aim for a mix each week: aerobic activity most days, plus two sessions of strength work for major muscle groups. Strength training supports bone density and blood sugar control.',
      'Start smaller than you think you should. Two short sessions a week that you actually keep doing beat an ambitious plan you abandon in March.',
    ],
  },
  {
    id: 'a-4',
    title: 'Simple breathing techniques for stressful moments',
    category: 'Mental Wellness',
    readMinutes: 3,
    icon: 'wind',
    excerpt:
      'Slow, even breathing is one of the fastest ways to calm your nervous system.',
    body: [
      'When stress rises, your breathing becomes quick and shallow. Slowing it down sends a direct signal to your body that you are safe.',
      'Try box breathing: breathe in for four counts, hold for four, out for four, hold for four. Repeat five cycles. You can do this sitting at a desk without anyone noticing.',
      'If anxious thoughts keep returning, name five things you can see and four you can feel. Grounding your senses gives your mind something concrete to hold on to.',
    ],
  },
  {
    id: 'a-5',
    title: 'Getting the most from your medicines safely',
    category: 'Medication Safety',
    readMinutes: 5,
    icon: 'pill',
    excerpt:
      'Timing, storage and one shared list prevent most everyday medication mistakes.',
    body: [
      'Keep one master list of everything you take — prescriptions, supplements and anything you take occasionally. Show it to every doctor and pharmacist you visit.',
      'Take medicines at consistent times and link them to a daily habit such as breakfast or brushing your teeth. If you miss a dose, follow the leaflet or ask your pharmacist rather than doubling the next one.',
      'Store medicines as the label says, check expiry dates twice a year, and never share prescription medicine with family members — the same pill can affect two people very differently.',
    ],
  },
  {
    id: 'a-6',
    title: 'Preventive check-ups worth putting in your calendar',
    category: 'Preventive Care',
    readMinutes: 5,
    icon: 'shield-check',
    excerpt:
      'A short list of age-appropriate screenings that catch problems early.',
    body: [
      'Most conditions are easier to manage when they are found early. Blood pressure checks are worth doing at least once a year, and cholesterol screening every few years for most adults.',
      'Dental cleanings twice a year, eye tests every two years, and vaccinations on the national schedule are low-effort ways to avoid bigger problems later.',
      'Write your screening dates into CONNECT so they travel with you — and bring the results to your next appointment instead of relying on memory.',
    ],
  },
  {
    id: 'a-7',
    title: 'Reading your blood pressure numbers',
    category: 'General Health',
    readMinutes: 4,
    icon: 'activity',
    excerpt:
      'What the two numbers mean and when a reading is worth mentioning to your doctor.',
    body: [
      'The first number is systolic — pressure while the heart squeezes. The second is diastolic — pressure while the heart rests between beats. Both matter.',
      'A single high reading is not a diagnosis. Readings taken at home on several days, at the same time, give a far clearer picture than one measurement in a clinic.',
      'Write down your readings with the date and time. Bringing a week of readings to your appointment helps your doctor make a much better decision.',
    ],
  },
  {
    id: 'a-8',
    title: 'Hydration: how much is actually enough?',
    category: 'Nutrition',
    readMinutes: 3,
    icon: 'glass-water',
    excerpt:
      'Fluid needs vary, but a few simple signals tell you whether you are on track.',
    body: [
      'A common starting point is around 1.5 to 2 litres of fluid a day, but hot weather, exercise and illness all increase what you need.',
      'Pale straw-coloured urine is a practical sign you are drinking enough. Dark urine, dry lips and headaches often mean it is time for a glass of water.',
      'Remember that tea, coffee and water-rich foods count towards your intake. Keep a bottle within sight — visibility does more for hydration than willpower.',
    ],
  },
  {
    id: 'a-9',
    title: 'Managing screen time for better eyes and posture',
    category: 'General Health',
    readMinutes: 4,
    icon: 'monitor',
    excerpt:
      'Small adjustments that reduce eye strain and neck pain during long work days.',
    body: [
      'Follow the 20-20-20 rule: every 20 minutes, look at something 20 feet away for 20 seconds. It gives your focusing muscles a genuine break.',
      'Set your screen so the top of it sits at or slightly below eye level, and keep your elbows around 90 degrees. Most strain comes from setup, not from screen time itself.',
      'If your eyes feel dry, blink deliberately and consider a humidifier in an air-conditioned room.',
    ],
  },
  {
    id: 'a-10',
    title: 'Talking to your doctor: a five-point appointment plan',
    category: 'Preventive Care',
    readMinutes: 4,
    icon: 'messages',
    excerpt:
      'A short checklist that makes short appointments far more useful.',
    body: [
      'Before you go, write down your three main concerns in order of priority, plus the date each one started. Doctors can solve problems faster with a clear timeline.',
      'List your current medicines and any recent test results, and note exactly what you want from the visit — a prescription, a referral, or simply reassurance.',
      'At the end, repeat back what you heard in your own words. Ask what to do if things get worse before the next appointment.',
    ],
  },
  {
    id: 'a-11',
    title: 'Stress, sleep and blood sugar: the quiet connection',
    category: 'Mental Wellness',
    readMinutes: 5,
    icon: 'brain',
    excerpt:
      'Why anxious days often show up in your energy levels and appetite.',
    body: [
      'Stress hormones push glucose into the bloodstream so you have energy to act. On a stressful day that can leave you wired, hungry and tired in quick succession.',
      'You cannot remove every stressor, but regular sleep, short walks and actual lunch breaks noticeably soften the physical response.',
      'If you notice a pattern between stressful weeks and how you feel, write it in your symptom journal. Patterns you can see are patterns you can plan around.',
    ],
  },
  {
    id: 'a-12',
    title: 'Seasonal allergies: a practical home routine',
    category: 'General Health',
    readMinutes: 4,
    icon: 'flower',
    excerpt:
      'Reduce exposure and know when to seek advice about persistent symptoms.',
    body: [
      'Keep windows closed on high-pollen mornings, shower after outdoor time, and wash bedding weekly in hot water to reduce dust mites.',
      'Antihistamines work best when taken before symptoms build rather than after a sneezing fit has started — follow the leaflet for timing.',
      'See a doctor if symptoms last more than a few weeks, disturb your sleep, or come with wheezing — those need a proper assessment rather than over-the-counter relief.',
    ],
  },
];

export const articleCategories = [
  'All',
  'Nutrition',
  'Sleep',
  'Exercise',
  'Mental Wellness',
  'Medication Safety',
  'Preventive Care',
  'General Health',
] as const;
