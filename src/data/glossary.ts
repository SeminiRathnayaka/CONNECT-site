import type { TermExplanation } from '../types';

/**
 * Medical glossary used by Orayan AI.
 * `sinhala` is a simple, non-technical explanation for Sinhala readers.
 */
export const glossary: TermExplanation[] = [
  {
    term: 'Haemoglobin',
    technical:
      'Haemoglobin is an iron-containing protein in red blood cells that binds to oxygen and carbon dioxide.',
    simple:
      'A protein in your blood that carries oxygen from your lungs to the rest of your body.',
    sinhala:
      'ඔබේ ලේ තුළ ඇති ප්‍රෝටීනයක් වන අතර, එය පෙනහළුවලින් ශරීරයේ අනෙකුත් කොටස් වෙත ඔක්සිජන් ගෙන යයි.',
  },
  {
    term: 'Fasting Glucose',
    technical:
      'The concentration of glucose in blood plasma after at least eight hours of fasting.',
    simple:
      'The amount of sugar in your blood after you have not eaten for several hours.',
    sinhala:
      'පැය කිහිපයක් කෑමක් නොමැතිව සිටීමෙන් පසු ඔබේ ලේ තුළ ඇති සීනි ප්‍රමාණය.',
  },
  {
    term: 'Creatinine',
    technical: 'Creatinine is a waste product produced by muscles during normal activity.',
    simple:
      'A blood test value that can give doctors information about kidney function.',
    sinhala:
      'වකුගඩුවල ක්‍රියාකාරිත්වය පිළිබඳ වෛද්‍යවරයාට තොරතුරු ලබා දෙන ලේ පරීක්ෂණ අගයකි.',
  },
  {
    term: 'TSH',
    technical:
      'Thyroid-stimulating hormone, released by the pituitary gland to regulate thyroid function.',
    simple:
      'A hormone that tells your thyroid how much work to do. It helps check how your thyroid is behaving.',
    sinhala:
      'ඔබේ තයිරොයිඩ් ග්‍රන්ථිය කොතරම් වැඩ කළ යුතුද යන්න පවසන හෝමෝනයකි.',
  },
  {
    term: 'Total Cholesterol',
    technical:
      'The total amount of cholesterol in the blood, including LDL, HDL and VLDL fractions.',
    simple:
      'A measure of the fat-like substances flowing in your blood.',
    sinhala:
      'ඔබේ ලේ තුළ ගමන් කරන මේද වැනි ද්‍රව්‍ය ප්‍රමාණය මැනෙන අගයකි.',
  },
  {
    term: 'LDL Cholesterol',
    technical:
      'Low-density lipoprotein carries cholesterol to tissues and can accumulate in arterial walls.',
    simple:
      'Often called “bad” cholesterol — too much of it can build up inside your artery walls.',
    sinhala:
      'ඔබේ ධමනි බිත්තිවල තැන්පත් වී ඒවා තද කළ හැකි “නරක” කොලෙස්ට්‍රෝල් වර්ගයකි.',
  },
  {
    term: 'HDL Cholesterol',
    technical:
      'High-density lipoprotein transports cholesterol back to the liver for excretion.',
    simple:
      'Often called “good” cholesterol — it helps move fat away from your arteries.',
    sinhala:
      'මේදය ධමනිවලින් ඉවත් කිරීමට උපකාරී වන “හොඳ” කොලෙස්ට්‍රෝල් වර්ගයකි.',
  },
  {
    term: 'Vitamin D',
    technical:
      'A fat-soluble secosteroid required for intestinal calcium absorption and bone mineralisation.',
    simple:
      'A vitamin that helps your body use calcium so your bones stay strong.',
    sinhala:
      'ශක්තිමත් අස්ථි පවත්වා ගැනීමට කැල්සියම් භාවිත කිරීමට ශරීරයට උපකාරී වන විටමිනයකි.',
  },
  {
    term: 'Triglycerides',
    technical:
      'Esterified glycerol and fatty acids; the most abundant form of fat in the body.',
    simple:
      'A type of fat in your blood that is closely linked to the food you eat.',
    sinhala:
      'ඔබ ආහාරයට ගන්නා ආහාර සමඟ සම්බන්ධ, ලේ තුළ ඇති මේද වර්ගයකි.',
  },
  {
    term: 'Systolic pressure',
    technical:
      'The peak arterial pressure during ventricular systole, when the heart contracts.',
    simple:
      'The top number in a blood pressure reading — the pressure while your heart is squeezing.',
    sinhala:
      'ඔබේ හෘදය පොම්ප කරන විට ධමනිවල ඇති පීඩනය — රක්ත පීඩන අගයෙහි ඉහළ අංකයයි.',
  },
  {
    term: 'Diastolic pressure',
    technical:
      'The minimum arterial pressure during ventricular diastole and relaxation of the myocardium.',
    simple:
      'The bottom number in a blood pressure reading — the pressure while your heart rests.',
    sinhala:
      'හෘදය විවේක ගන්නා විට ධමනිවල ඇති පීඩනය — රක්ත පීඩන අගයෙහි පහළ අංකයයි.',
  },
  {
    term: 'BMI',
    technical:
      'Body mass index: weight in kilograms divided by the square of height in metres.',
    simple:
      'A simple number that compares your weight with your height to give a rough idea of body size.',
    sinhala:
      'ඔබේ බර සහ උස සසඳන සරල අංකයක් — ශරීර ස්වරූපය ගැන මූලික අදහසක් දෙයි.',
  },
  {
    term: 'INR',
    technical:
      'International Normalised Ratio — a standardised prothrombin time used to monitor anticoagulation.',
    simple:
      'A test that checks how quickly your blood clots, often used with blood-thinning medicine.',
    sinhala:
      'ඔබේ ලේ ගැලීමේ වේගය පරීක්ෂා කරන පරීක්ෂණයකි; ලේ තුනී කරන ඖෂධ භාවිතයේදී භාවිතා වේ.',
  },
];

export function findTerm(term: string): TermExplanation | undefined {
  const q = term.trim().toLowerCase();
  return glossary.find((g) => g.term.toLowerCase() === q);
}
