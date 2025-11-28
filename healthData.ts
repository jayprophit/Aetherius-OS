
import React from 'react';
import { HealthWellnessData } from './types';
import { CodeBracketIcon, SpeakerWaveIcon } from './components/Icons';

export const healthAndWellnessData: HealthWellnessData = {
  bodyComposition: {
    table: [
      { feature: 'Full Name', dexa: 'Dual-Energy X-ray Absorptiometry', mri: 'Magnetic Resonance Imaging', bia: 'Bioelectrical Impedance Analysis' },
      { feature: 'How It Works', dexa: 'Uses two low-dose X-ray beams to differentiate tissue types.', mri: 'Uses strong magnetic fields and radio waves to create detailed images.', bia: 'Sends a tiny, safe electrical current through the body and measures resistance.' },
      { feature: 'What It Measures', dexa: 'Fat Mass, Lean Mass, Bone Mineral Density. Can show visceral fat.', mri: 'Detailed images of all tissues (fat, muscle, organs). Can precisely locate and quantify fat deposits.', bia: 'Estimates Body Fat %, Lean Mass, Water. Some estimate Visceral Fat.' },
      { feature: 'Accuracy', dexa: 'Very High. Considered a gold standard for fat/lean/bone mass.', mri: 'Extremely High. The gold standard for visualizing and quantifying specific tissues.', bia: 'Variable (Low to Moderate). Highly influenced by hydration, food intake, and exercise.' },
      { feature: 'Cost', dexa: 'Moderate to High', mri: 'Very High', bia: 'Very Low (for consumer devices)' },
      { feature: 'Accessibility', dexa: 'Medical/Research clinics, some gyms.', mri: 'Hospitals, specialized imaging centers.', bia: 'Widespread (home scales, handheld devices, gyms).' },
      { feature: 'Time', dexa: '5-15 minutes', mri: '30-60 minutes', bia: 'Less than 1 minute' },
      { feature: 'Key Advantage', dexa: 'Excellent balance of accuracy, detail, and low radiation for body composition.', mri: 'Unmatched detail and precision for visualizing soft tissues without radiation.', bia: 'Extreme convenience, low cost, and ability to track trends at home.' },
      { feature: 'Key Limitation', dexa: 'Requires a dedicated machine and trained operator.', mri: 'Very expensive, time-consuming, not practical for routine body comp.', bia: 'Less accurate; readings can fluctuate daily based on hydration.' },
    ],
    inDepth: [
      {
        id: 'dexa',
        title: '1. DEXA (Dual-Energy X-ray Absorptiometry)',
        principle: 'You lie still on a table while a scanner arm passes over you, emitting two very low-energy X-ray beams. Different tissues (bone, lean mass, fat) absorb these energies at different rates, allowing the software to create a detailed pixel-by-pixel map of your body.',
        primaryUse: {
          title: 'Primary Use',
          points: [
            '<strong>Clinical:</strong> The gold standard for diagnosing osteoporosis and measuring bone mineral density (BMD).',
            '<strong>Research & Sports Medicine:</strong> Highly accurate assessment of body fat percentage, lean muscle mass, and fat distribution (including visceral fat).',
          ]
        },
        pros: 'Highly accurate and reproducible. Provides regional analysis (arms, legs, trunk). Very low radiation exposure (less than a chest X-ray).',
        cons: 'Not as readily available as BIA. More expensive than BIA. Requires you to remain still for several minutes.'
      },
      {
        id: 'mri',
        title: '2. MRI (Magnetic Resonance Imaging)',
        principle: 'Uses a powerful magnet and radio waves to align the protons in your body\'s water molecules. When the radio waves are turned off, the protons realign, emitting signals that are used to create incredibly detailed cross-sectional images of your body\'s internal structures.',
        primaryUse: {
          title: 'Primary Use',
          points: [
            '<strong>Clinical:</strong> Diagnosing injuries, diseases, and conditions in soft tissues like the brain, muscles, joints, heart, and organs.',
            '<strong>Research:</strong> The gold standard for precisely quantifying specific fat deposits (like visceral, subcutaneous, intramuscular fat) and organ size without any radiation.',
          ]
        },
        pros: 'Exceptional detail and accuracy for soft tissues. No ionizing radiation.',
        cons: 'Extremely expensive. Time-consuming for both the scan and analysis. Not used for routine body composition testing due to cost and complexity.'
      },
      {
        id: 'bia',
        title: '3. BIA (Bioelectrical Impedance Analysis)',
        principle: 'A very weak, safe electrical current is sent through the body (often via foot-to-foot scales or hand-to-hand devices). Lean tissue, which contains over 70% water, is a good conductor. Fat tissue is a poor conductor. The device estimates body fat based on the "impedance" (resistance) to the current.',
        primaryUse: {
          title: 'Primary Use',
          points: [
            '<strong>Home & Fitness:</strong> Quick, convenient tracking of body composition trends.',
            '<strong>Clinical Settings:</strong> Monitoring hydration status and body composition changes over time in a non-invasive way.',
          ]
        },
        pros: 'Very inexpensive, fast, and easy to use. Excellent for tracking relative changes over time.',
        cons: 'Accuracy is highly dependent on hydration levels, recent meals, exercise, and the specific device algorithm. Not a diagnostic tool.'
      }
    ]
  },
  frequencyHealing: [
    {
      id: 'crispr',
      title: 'Genetic Anomaly Scanning (CRISPR)',
      icon: CodeBracketIcon,
      content: [
        'CRISPR (Clustered Regularly Interspaced Short Palindromic Repeats) technology is a powerful tool for editing genomes. It allows researchers to alter DNA sequences and modify gene function. Its main applications include correcting genetic defects, treating and preventing the spread of diseases, and improving crops.',
        'In the context of "scanning for anomalies," advanced diagnostic tools based on CRISPR, such as SHERLOCK and DETECTR, can be used to detect specific genetic sequences, including those from viruses, bacteria, or those associated with genetic disorders. These tools can identify genetic anomalies with high precision, offering a new frontier in diagnostics.'
      ]
    },
    {
      id: 'rife',
      title: 'Dr. Royal Rife\'s Healing Practices',
      icon: SpeakerWaveIcon,
      content: [
        'Dr. Royal Raymond Rife was an American inventor who claimed that every disease has a specific electrical "frequency." He developed a device known as the "Rife Machine" or "Rife Frequency Generator," which he asserted could produce energy waves of the same frequency as that of a given ailment.',
        'The core of his theory was that exposing a disease-causing organism to its own resonant frequency would induce structural stress, causing it to vibrate and shatter, much like a crystal glass shattering in response to a specific musical tone. This is often referred to as the principle of "sympathetic resonance."',
        '<strong>Recommended Frequencies:</strong> Based on the results of bio-resonance scans (a practice related to BIA), practitioners of Rife\'s methods might recommend specific frequencies to address perceived imbalances or pathogens in the body. These frequencies are programmed into a frequency generator device to be administered to the individual.',
        '<em>It is important to note that Rife\'s claims and the efficacy of his devices are not supported by mainstream science and are considered pseudoscientific by the medical community.</em>'
      ]
    }
  ],
  healingWeb: [
    {
        ailment: "Headache (Tension-Type)",
        pharma: {
            points: [
                '<strong>Aspirin/Ibuprofen (NSAIDs):</strong> Reduces inflammation and pain by blocking prostaglandin production.',
                '<strong>Acetaminophen:</strong> Acts on the parts of the brain that receive pain signals.',
                '<strong>Details:</strong> Fast-acting and effective for acute pain. Overuse can lead to side effects like stomach issues or liver damage.'
            ]
        },
        nature: {
            points: [
                '<strong>Peppermint Oil:</strong> Applied topically to the temples, its cooling effect can soothe muscle tension.',
                '<strong>Ginger Tea:</strong> Contains anti-inflammatory compounds that can ease pain.',
                '<strong>Details:</strong> Focuses on alleviating root causes like muscle tension or inflammation with fewer side effects. May act more slowly than pharmaceuticals.'
            ]
        }
    },
    {
        ailment: "Insomnia",
        pharma: {
            points: [
                '<strong>Zolpidem (Ambien):</strong> A sedative-hypnotic that slows brain activity to induce sleep.',
                '<strong>Benzodiazepines:</strong> Depress the central nervous system to aid sleep, but can be habit-forming.',
                '<strong>Details:</strong> Highly effective for short-term sleep induction. Potential for dependency, morning grogginess, and other side effects.'
            ]
        },
        nature: {
            points: [
                '<strong>Valerian Root:</strong> An herb that may increase levels of GABA, a calming neurotransmitter in the brain.',
                '<strong>Melatonin:</strong> A hormone that regulates the sleep-wake cycle. Supplementing can help reset the body\'s internal clock.',
                '<strong>Details:</strong> Aims to support the body\'s natural sleep processes. Generally considered safer for long-term use with fewer side effects, but efficacy can vary.'
            ]
        }
    },
    {
        ailment: "Inflammation (Minor)",
        pharma: {
            points: [
                '<strong>NSAIDs (Ibuprofen, Naproxen):</strong> Directly inhibit COX enzymes, which are key to the inflammatory pathway.',
                '<strong>Topical Corticosteroids:</strong> Applied to the skin to reduce local inflammation, redness, and itching.',
                '<strong>Details:</strong> Provide powerful, targeted reduction of inflammation. Long-term systemic use has significant side effects.'
            ]
        },
        nature: {
            points: [
                '<strong>Turmeric (Curcumin):</strong> Curcumin is a potent anti-inflammatory compound that can block inflammatory molecules.',
                '<strong>Omega-3 Fatty Acids:</strong> Found in fish oil, these fats are precursors to inflammation-resolving compounds.',
                '<strong>Details:</strong> Work by providing the body with compounds that naturally modulate and resolve inflammation over time. Best used for chronic, low-grade inflammation.'
            ]
        }
    }
  ],
  healingWebFull: {
    nature: {
      "Organic Food": {
        category: "Nutrition",
        description: "Food produced without synthetic pesticides, fertilizers, GMOs, antibiotics, or growth hormones",
        pros: [
          "No synthetic pesticides or herbicides",
          "Higher antioxidant content in some studies",
          "Better for environmental sustainability",
          "No GMOs or synthetic additives",
          "May have better taste and freshness",
          "Supports biodiversity and soil health",
          "Reduces exposure to antibiotic-resistant bacteria"
        ],
        cons: [
          "Significantly more expensive (20-100% higher cost)",
          "Shorter shelf life",
          "Limited availability in some areas",
          "Not always pesticide-free (organic pesticides used)",
          "Nutritional differences may be minimal",
          "Still requires washing and food safety practices",
          "May have lower crop yields"
        ],
        uses: ["Daily nutrition", "Disease prevention", "Reduced toxin exposure", "Environmental health"],
        relatedConditions: ["Cancer prevention", "Hormonal health", "Autoimmune conditions", "Children's health"]
      },
      "Grass-Fed Beef": {
        category: "Nutrition",
        description: "Beef from cattle raised on pasture and grass rather than grain",
        pros: [
          "Higher omega-3 fatty acids",
          "More conjugated linoleic acid (CLA)",
          "Higher levels of vitamins A and E",
          "Better omega-6 to omega-3 ratio",
          "More humane animal treatment",
          "Better for environment (when managed properly)",
          "No routine antibiotics or hormones"
        ],
        cons: [
          "Much more expensive (2-3x cost)",
          "Less marbling/different taste",
          "Limited availability",
          "Still high in saturated fat",
          "Environmental impact varies by farming method",
          "Nutritional differences may be modest",
          "Longer production time"
        ],
        uses: ["Heart health", "Anti-inflammatory diet", "Weight management", "Protein source"],
        relatedConditions: ["Cardiovascular health", "Inflammation", "Metabolic syndrome"]
      },
      "Eggs": {
        category: "Nutrition",
        description: "Whole eggs, particularly from pasture-raised chickens",
        pros: [
          "Complete protein source",
          "Rich in vitamins D, B12, choline",
          "Contains lutein and zeaxanthin for eye health",
          "Supports brain development",
          "Affordable protein source",
          "Versatile and easy to prepare",
          "Pasture-raised have higher omega-3s"
        ],
        cons: [
          "Cholesterol concerns for some individuals",
          "Common allergen",
          "Risk of Salmonella if undercooked",
          "Quality varies greatly by source",
          "Some people should limit intake",
          "Environmental impact of conventional production"
        ],
        uses: ["Protein supplementation", "Brain health", "Eye health", "Muscle building"],
        relatedConditions: ["Malnutrition", "Pregnancy nutrition", "Cognitive health"]
      },
      "Leafy Greens": {
        category: "Nutrition",
        description: "Dark leafy vegetables like kale, spinach, collards, swiss chard",
        pros: [
          "Extremely nutrient-dense",
          "High in vitamins K, A, C, folate",
          "Rich in antioxidants",
          "Anti-inflammatory properties",
          "Supports eye health",
          "May reduce cancer risk",
          "Very low calorie",
          "High in fiber"
        ],
        cons: [
          "Can contain high oxalates (kidney stone risk)",
          "May interfere with blood thinners (vitamin K)",
          "Some people find taste bitter",
          "Requires proper washing (pesticide residue)",
          "Can cause bloating/gas in some people",
          "Nutritional value decreases with cooking"
        ],
        uses: ["General nutrition", "Disease prevention", "Weight management", "Detoxification support"],
        relatedConditions: ["Cancer prevention", "Heart disease", "Eye health", "Inflammation"]
      },
      "Mushrooms": {
        category: "Nutrition/Medicine",
        description: "Edible and medicinal fungi including shiitake, reishi, lion's mane, turkey tail",
        pros: [
          "Immune-boosting properties",
          "Rich in antioxidants",
          "May have anti-cancer properties",
          "Supports brain health (lion's mane)",
          "Natural source of vitamin D",
          "Prebiotic fiber for gut health",
          "Anti-inflammatory effects",
          "Adaptogenic properties (medicinal varieties)"
        ],
        cons: [
          "Some varieties can cause allergic reactions",
          "Wild mushrooms can be toxic if misidentified",
          "Medicinal mushroom evidence still emerging",
          "Can be expensive (especially medicinal)",
          "May interact with medications",
          "Quality varies in supplements",
          "Some people find texture unpalatable"
        ],
        uses: ["Immune support", "Cancer adjunct therapy", "Cognitive function", "General nutrition"],
        relatedConditions: ["Cancer", "Immune deficiency", "Cognitive decline", "Inflammation"]
      },
      "Black Tea": {
        category: "Beverage/Herbal",
        description: "Traditional tea from Camellia sinensis, oxidized leaves",
        pros: [
          "Rich in antioxidants (theaflavins, catechins)",
          "May improve heart health",
          "Contains L-theanine for calm focus",
          "May reduce stroke risk",
          "Supports gut health",
          "May improve blood sugar control",
          "Contains beneficial polyphenols",
          "Less caffeine than coffee"
        ],
        cons: [
          "Contains caffeine (can affect sleep)",
          "May stain teeth",
          "Can interfere with iron absorption",
          "May cause stomach upset on empty stomach",
          "Can interact with some medications",
          "Excessive intake may affect bones",
          "May increase anxiety in sensitive individuals"
        ],
        uses: ["Antioxidant support", "Heart health", "Mental alertness", "Diabetes management"],
        relatedConditions: ["Cardiovascular disease", "Type 2 diabetes", "Cognitive decline"]
      },
      "Green Tea": {
        category: "Beverage/Herbal",
        description: "Unoxidized tea leaves with high catechin content",
        pros: [
          "Very high in antioxidants (EGCG)",
          "May support weight loss",
          "May reduce cancer risk",
          "Supports brain health",
          "Improves insulin sensitivity",
          "Anti-inflammatory properties",
          "May improve cholesterol",
          "Supports liver health"
        ],
        cons: [
          "Contains caffeine",
          "Can cause nausea on empty stomach",
          "May interfere with iron absorption",
          "High doses can be hepatotoxic",
          "Can interact with blood thinners",
          "May affect thyroid function in high amounts",
          "Can stain teeth"
        ],
        uses: ["Weight management", "Antioxidant support", "Cancer prevention", "Metabolic health"],
        relatedConditions: ["Obesity", "Type 2 diabetes", "Cancer risk", "Cardiovascular disease"]
      },
      "Turmeric": {
        category: "Herb/Spice",
        description: "Golden spice containing curcumin, powerful anti-inflammatory",
        pros: [
          "Potent anti-inflammatory effects",
          "Strong antioxidant properties",
          "May reduce arthritis symptoms",
          "May improve brain function",
          "May reduce depression symptoms",
          "Supports heart health",
          "May have anti-cancer properties",
          "Supports liver function"
        ],
        cons: [
          "Poor bioavailability (needs black pepper/fat)",
          "Can cause digestive upset",
          "May interact with blood thinners",
          "Can interfere with diabetes medications",
          "May cause iron deficiency in high doses",
          "Can worsen gallbladder problems",
          "Stains everything yellow"
        ],
        uses: ["Inflammation", "Arthritis", "Depression", "Antioxidant support"],
        relatedConditions: ["Arthritis", "Depression", "Inflammatory conditions", "Alzheimer's research"]
      },
      "Supplements": {
        category: "Nutrition",
        description: "Vitamins, minerals, herbs, and other dietary supplements",
        pros: [
          "Can address specific deficiencies",
          "Convenient and standardized",
          "May support optimal health",
          "Useful when diet is inadequate",
          "Can fill nutritional gaps",
          "Some have strong evidence (vitamin D, omega-3)"
        ],
        cons: [
          "Often unnecessary if diet is adequate",
          "Can be expensive",
          "Quality and purity vary greatly",
          "Possible contamination or adulteration",
          "Can interact with medications",
          "May cause side effects in high doses",
          "Not regulated like drugs (FDA)",
          "Cannot replace healthy diet"
        ],
        uses: ["Addressing deficiencies", "Supporting specific health goals", "Prevention"],
        relatedConditions: ["Vitamin deficiencies", "Osteoporosis", "Heart health", "Immune support"]
      },
      "Probiotics": {
        category: "Supplement",
        description: "Live beneficial bacteria for gut health",
        pros: [
          "Supports gut microbiome",
          "May reduce antibiotic-associated diarrhea",
          "Supports immune function",
          "May help IBS symptoms",
          "Supports mental health (gut-brain axis)",
          "May improve lactose digestion",
          "Generally safe"
        ],
        cons: [
          "Strain-specific effects (not all work)",
          "May not survive stomach acid",
          "Expensive",
          "Requires refrigeration (many brands)",
          "Can cause gas/bloating initially",
          "Risk of infection in immunocompromised",
          "Quality varies greatly",
          "Effects may be temporary"
        ],
        uses: ["Gut health", "After antibiotics", "IBS", "Immune support"],
        relatedConditions: ["IBS", "IBD", "Antibiotic use", "Immune disorders"]
      },
      "Exercise": {
        category: "Lifestyle Essential",
        description: "Regular physical activity and movement",
        pros: [
          "Reduces disease risk broadly",
          "Improves mental health",
          "Supports weight management",
          "Strengthens cardiovascular system",
          "Improves bone density",
          "Enhances longevity",
          "Boosts energy",
          "Improves sleep quality"
        ],
        cons: [
          "Risk of injury",
          "Time commitment",
          "Can be expensive (gyms, equipment)",
          "May be difficult with disabilities",
          "Requires motivation",
          "Overtraining can be harmful",
          "May not be safe for all conditions"
        ],
        uses: ["Disease prevention", "Weight management", "Mental health", "Strength"],
        relatedConditions: ["Cardiovascular disease", "Diabetes", "Depression", "Obesity", "Osteoporosis"]
      },
      "Sleep": {
        category: "Lifestyle Essential",
        description: "Quality sleep of 7-9 hours per night",
        pros: [
          "Essential for health",
          "Supports immune function",
          "Improves cognitive function",
          "Regulates hormones",
          "Supports emotional health",
          "Aids weight management",
          "Reduces disease risk",
          "Free"
        ],
        cons: [
          "Difficult to achieve for many",
          "Sleep disorders require treatment",
          "Modern lifestyle disrupts sleep",
          "Takes time (7-9 hours)",
          "Quality varies",
          "Environmental factors affect it"
        ],
        uses: ["Overall health", "Disease prevention", "Mental health", "Performance"],
        relatedConditions: ["All health conditions benefit from adequate sleep"]
      },
      "Meditation": {
        category: "Mind-Body Practice",
        description: "Mental training practices for mindfulness and awareness",
        pros: [
          "Reduces stress and anxiety",
          "Improves focus and concentration",
          "May reduce depression symptoms",
          "Lowers blood pressure",
          "Improves emotional regulation",
          "Free and accessible",
          "Strong scientific support",
          "Can be practiced anywhere"
        ],
        cons: [
          "Requires consistent practice",
          "Benefits take time",
          "Can be difficult for beginners",
          "May bring up difficult emotions",
          "Not a replacement for therapy",
          "Some find it boring or frustrating",
          "Can be challenging with certain conditions"
        ],
        uses: ["Stress reduction", "Anxiety management", "Focus", "Sleep improvement"],
        relatedConditions: ["Anxiety disorders", "Depression", "Chronic pain", "Hypertension", "PTSD"]
      },
      "Yoga": {
        category: "Mind-Body Practice",
        description: "Physical postures, breathing, and meditation practice",
        pros: [
          "Improves flexibility and strength",
          "Reduces stress and anxiety",
          "May help lower back pain",
          "Improves balance",
          "Supports mental health",
          "Can be practiced at any level",
          "Low cost",
          "Builds mind-body connection"
        ],
        cons: [
          "Risk of injury if done improperly",
          "Some poses not suitable for injuries",
          "Requires instruction initially",
          "Time commitment",
          "Not a replacement for medical treatment",
          "May be difficult for some body types"
        ],
        uses: ["Stress management", "Flexibility", "Strength", "Back pain", "Mental health"],
        relatedConditions: ["Anxiety", "Depression", "Chronic pain", "Hypertension"]
      },
      "Acupuncture": {
        category: "Traditional Medicine",
        description: "Traditional Chinese medicine practice using needles at specific body points",
        pros: [
          "Effective for chronic pain",
          "May help nausea",
          "May reduce headache frequency",
          "Generally safe when done by trained practitioner",
          "Few side effects",
          "May help fertility",
          "Accepted by many insurance plans"
        ],
        cons: [
          "Requires multiple sessions (expensive)",
          "Risk of infection if not sterile",
          "Can cause bruising or bleeding",
          "Not effective for all conditions",
          "Mechanisms not fully understood",
          "May not be covered by insurance",
          "Practitioner quality varies"
        ],
        uses: ["Chronic pain", "Headaches", "Nausea", "Lower back pain"],
        relatedConditions: ["Chronic pain", "Migraines", "Osteoarthritis", "Chemotherapy side effects"]
      }
    },
    pharmaceutical: {
      "Insulin": {
        category: "Diabetes Drug",
        description: "Hormone for blood sugar regulation in diabetes",
        pros: [
          "Life-saving for Type 1 diabetes",
          "Essential for advanced Type 2 diabetes",
          "Precise blood sugar control",
          "Prevents diabetic complications",
          "Multiple formulations available",
          "Rapid and long-acting options",
          "Over 100 years of use"
        ],
        cons: [
          "Very expensive (especially in US)",
          "Risk of hypoglycemia (dangerous)",
          "Requires injections",
          "Weight gain common",
          "Requires frequent monitoring",
          "Storage requirements",
          "Can be complicated to dose",
          "Does not cure diabetes"
        ],
        uses: ["Type 1 diabetes", "Type 2 diabetes", "Gestational diabetes"],
        relatedConditions: ["Type 1 diabetes mellitus", "Type 2 diabetes mellitus", "Diabetic ketoacidosis"]
      },
      "Metformin": {
        category: "Diabetes Drug",
        description: "First-line medication for Type 2 diabetes",
        pros: [
          "Very effective for Type 2 diabetes",
          "May promote weight loss",
          "Low risk of hypoglycemia",
          "May have anti-aging effects",
          "Reduces cardiovascular events",
          "Inexpensive and widely available",
          "May reduce cancer risk",
          "Generally well-tolerated"
        ],
        cons: [
          "GI side effects common (diarrhea, nausea)",
          "Can cause vitamin B12 deficiency",
          "Not suitable for kidney disease",
          "May cause lactic acidosis (rare but serious)",
          "Must be stopped before surgery/contrast dye",
          "Metallic taste",
          "Does not work for everyone"
        ],
        uses: ["Type 2 diabetes", "Prediabetes", "PCOS", "Metabolic syndrome"],
        relatedConditions: ["Type 2 diabetes", "Polycystic ovary syndrome", "Insulin resistance"]
      },
      "Statins": {
        category: "Cardiovascular Drug",
        description: "Cholesterol-lowering medications",
        pros: [
          "Very effective at lowering LDL cholesterol",
          "Significantly reduces heart attack and stroke risk",
          "Well-studied with strong evidence",
          "Reduces cardiovascular mortality",
          "May have anti-inflammatory effects",
          "Generally well-tolerated",
          "Available as generics (affordable)"
        ],
        cons: [
          "Muscle pain and weakness (common)",
          "May increase diabetes risk slightly",
          "Can affect liver enzymes",
          "May cause memory issues (rare)",
          "Requires lifelong use",
          "Can interact with other medications",
          "Side effects can be significant",
          "Does not address lifestyle factors"
        ],
        uses: ["High cholesterol", "Heart disease prevention", "Post-heart attack"],
        relatedConditions: ["Hyperlipidemia", "Atherosclerosis", "Coronary artery disease", "Stroke prevention"]
      },
      "Antibiotics": {
        category: "Antimicrobial",
        description: "Medications that kill or inhibit bacterial growth",
        pros: [
          "Life-saving for bacterial infections",
          "Fast-acting and highly effective",
          "Prevents serious complications",
          "Wide variety for different bacteria",
          "Well-studied and proven",
          "Can prevent sepsis",
          "Essential for modern medicine"
        ],
        cons: [
          "Antibiotic resistance growing rapidly",
          "Destroys beneficial gut bacteria",
          "Common side effects (nausea, diarrhea)",
          "Can cause allergic reactions",
          "May lead to C. diff infection",
          "Ineffective against viruses",
          "Overuse is major health problem",
          "Can cause yeast infections"
        ],
        uses: ["Bacterial infections", "Sepsis", "Pneumonia", "UTIs", "Skin infections"],
        relatedConditions: ["Bacterial pneumonia", "Urinary tract infections", "Strep throat", "Sepsis"]
      },
      "NSAIDs": {
        category: "Pain/Anti-inflammatory",
        description: "Non-steroidal anti-inflammatory drugs (ibuprofen, naproxen)",
        pros: [
          "Effective pain relief",
          "Reduces inflammation",
          "Reduces fever",
          "Available over-the-counter",
          "Multiple formulations",
          "Fast-acting",
          "Inexpensive"
        ],
        cons: [
          "GI bleeding risk",
          "Can cause ulcers",
          "Kidney damage with long-term use",
          "Increases cardiovascular risk",
          "Can worsen heart failure",
          "May increase blood pressure",
          "Masks underlying problems",
          "Can interact with blood thinners"
        ],
        uses: ["Pain relief", "Inflammation", "Fever", "Arthritis", "Headaches"],
        relatedConditions: ["Arthritis", "Acute pain", "Fever", "Inflammatory conditions"]
      },
      "Antidepressants": {
        category: "Psychiatric Medication",
        description: "Medications for depression and anxiety",
        pros: [
          "Effective for moderate-severe depression",
          "Helps anxiety disorders",
          "Generally well-tolerated",
          "Non-addictive",
          "Multiple options available",
          "Can be life-saving",
          "May help OCD, PTSD, panic disorder"
        ],
        cons: [
          "Takes 4-6 weeks to work",
          "Sexual dysfunction (very common)",
          "Weight gain possible",
          "Emotional blunting",
          "Withdrawal symptoms",
          "May increase suicide risk initially",
          "Can cause insomnia or sedation",
          "Does not work for everyone"
        ],
        uses: ["Major depression", "Anxiety disorders", "OCD", "PTSD", "Panic disorder"],
        relatedConditions: ["Major depressive disorder", "Generalized anxiety disorder", "OCD", "PTSD"]
      },
      "Chemotherapy": {
        category: "Cancer Treatment",
        description: "Cytotoxic drugs that kill rapidly dividing cells",
        pros: [
          "Can cure certain cancers",
          "Shrinks tumors",
          "Prevents metastasis",
          "Extends life in many cancers",
          "Combination therapies very effective",
          "Constantly improving",
          "Can be curative for leukemias, lymphomas"
        ],
        cons: [
          "Severe side effects (nausea, fatigue, hair loss)",
          "Kills healthy cells too",
          "Weakens immune system dramatically",
          "Risk of secondary cancers",
          "Very expensive",
          "Quality of life significantly impacted",
          "Organ damage possible",
          "Fertility effects"
        ],
        uses: ["Cancer treatment", "Leukemia", "Lymphoma", "Solid tumors"],
        relatedConditions: ["Various cancers", "Leukemia", "Lymphoma", "Breast cancer", "Colon cancer"]
      },
      "Vaccines": {
        category: "Preventive Medicine",
        description: "Biological preparations providing immunity to diseases",
        pros: [
          "Prevents serious infectious diseases",
          "Saves millions of lives",
          "Creates herd immunity",
          "Cost-effective prevention",
          "Extensively tested for safety",
          "Eradicated smallpox",
          "Nearly eliminated polio",
          "Protects vulnerable populations"
        ],
        cons: [
          "Rare adverse reactions possible",
          "Not 100% effective",
          "Some require boosters",
          "Temporary side effects common",
          "Preservatives concern some",
          "Contraindicated for certain conditions",
          "Misinformation creates hesitancy"
        ],
        uses: ["Disease prevention", "Public health", "Herd immunity", "Travel protection"],
        relatedConditions: ["Prevents measles, mumps, rubella, polio, hepatitis, flu, COVID-19, HPV"]
      },
      "Blood Pressure Meds": {
        category: "Cardiovascular Drug",
        description: "Medications to control hypertension",
        pros: [
          "Effective for high blood pressure",
          "Reduces heart attack and stroke risk",
          "Protects kidney function",
          "Helps heart failure",
          "Generally well-tolerated",
          "Inexpensive generics available",
          "Well-studied"
        ],
        cons: [
          "Requires lifelong use",
          "Side effects vary by type",
          "Can cause dizziness",
          "May affect electrolytes",
          "Does not address lifestyle causes",
          "May require medication adjustments",
          "Some interactions with other drugs"
        ],
        uses: ["Hypertension", "Heart failure", "Kidney protection", "Stroke prevention"],
        relatedConditions: ["Hypertension", "Heart failure", "Chronic kidney disease", "Coronary artery disease"]
      },
      "Corticosteroids": {
        category: "Anti-inflammatory",
        description: "Powerful anti-inflammatory drugs (prednisone, dexamethasone)",
        pros: [
          "Extremely effective anti-inflammatory",
          "Life-saving for many conditions",
          "Rapid symptom relief",
          "Treats autoimmune diseases",
          "Prevents organ rejection",
          "Essential for severe asthma",
          "Treats severe allergic reactions"
        ],
        cons: [
          "Serious long-term side effects",
          "Weight gain and fluid retention",
          "Increases infection risk",
          "Weakens bones (osteoporosis)",
          "Increases blood sugar",
          "Mood changes, insomnia",
          "Can cause adrenal suppression",
          "Must taper slowly"
        ],
        uses: ["Autoimmune diseases", "Severe asthma", "Allergic reactions", "Inflammatory conditions"],
        relatedConditions: ["Rheumatoid arthritis", "Lupus", "IBD", "Severe asthma", "COPD exacerbations"]
      }
    }
  },
  nutrition: {
    cleanRecipes: [
      {
        title: "Super Alkaline Green Smoothie",
        description: "A perfect way to start your day, packed with nutrients and alkalizing greens.",
        ingredients: ['1 cup spinach', '1/2 cucumber', '1/2 avocado', '1/2 lemon, juiced', '1 cup almond milk', '1 tbsp chia seeds'],
        instructions: "Blend all ingredients until smooth. For a colder smoothie, use a frozen banana slice or add a few ice cubes."
      },
      {
        title: "Quinoa and Roasted Vegetable Bowl",
        description: "A hearty and grounding meal that's both delicious and nourishing.",
        ingredients: ['1 cup cooked quinoa', '1 sweet potato, diced', '1 head broccoli, chopped', '1 tbsp olive oil', 'Tahini dressing'],
        instructions: "Toss vegetables with olive oil and roast at 400°F (200°C) until tender. Serve over a bed of quinoa and drizzle with tahini dressing."
      }
    ],
    dirtyFoods: [
      {
        title: "Processed Sugars (e.g., High-Fructose Corn Syrup)",
        description: "Found in sodas, candies, and many processed foods. Linked to inflammation, weight gain, and metabolic issues. Opt for natural sweeteners like raw honey or maple syrup in moderation."
      },
      {
        title: "Artificial Additives & Preservatives",
        description: "Chemicals like BHT, sodium nitrate, and artificial colors are used to enhance flavor or extend shelf life but can have negative health effects for some individuals. Reading labels is key."
      },
      {
        title: "Genetically Modified Organisms (GMOs)",
        description: "Foods that have had their DNA altered. While regulatory agencies deem them safe, some prefer to avoid them due to concerns about long-term effects and farming practices. Look for 'Non-GMO Project Verified' labels."
      }
    ]
  }
};
