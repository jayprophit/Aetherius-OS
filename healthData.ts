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