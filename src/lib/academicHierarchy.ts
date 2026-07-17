export interface SubConcept {
  name: string;
}

export interface Concept {
  name: string;
  subConcepts: string[];
}

export interface Chapter {
  name: string;
  concepts: Concept[];
}

export interface AcademicHierarchy {
  [subject: string]: {
    [classVal: string]: Chapter[];
  };
}

export const ACADEMIC_HIERARCHY: AcademicHierarchy = {
  Physics: {
    "Class 11": [
      {
        name: "Physical World",
        concepts: [
          { name: "What is Physics", subConcepts: ["Scope of Physics", "Excitement of Physics"] },
          { name: "Physics, Technology and Society", subConcepts: ["Scientific Method", "Link between Physics and Technology"] },
          { name: "Fundamental Forces in Nature", subConcepts: ["Gravitational Force", "Electromagnetic Force", "Strong & Weak Nuclear Forces"] }
        ]
      },
      {
        name: "Units and Measurements",
        concepts: [
          { name: "System of Units", subConcepts: ["SI Units", "Base and Derived Units"] },
          { name: "Dimensional Analysis", subConcepts: ["Dimensions of Physical Quantities", "Applications of Dimensional Equations"] },
          { name: "Errors in Measurement", subConcepts: ["Systematic and Random Errors", "Significant Figures", "Propagation of Errors"] }
        ]
      },
      {
        name: "Motion in a Straight Line",
        concepts: [
          { name: "Kinematic Equations", subConcepts: ["Uniformly Accelerated Motion", "Free Fall Equations"] },
          { name: "Position-Time Graphs", subConcepts: ["Slope and Area", "Velocity-Time Interpretation"] },
          { name: "Relative Velocity", subConcepts: ["One Dimension relative motion", "Crossing Problems"] }
        ]
      },
      {
        name: "Motion in a Plane",
        concepts: [
          { name: "Vectors", subConcepts: ["Vector Addition & Subtraction", "Resolution of Vectors", "Scalar and Vector Products"] },
          { name: "Projectile Motion", subConcepts: ["Time of Flight", "Maximum Height", "Horizontal Range"] },
          { name: "Uniform Circular Motion", subConcepts: ["Centripetal Acceleration", "Angular Velocity and Acceleration"] }
        ]
      },
      {
        name: "Laws of Motion",
        concepts: [
          { name: "Newton's Laws of Motion", subConcepts: ["Inertia & First Law", "Linear Momentum & Second Law", "Action-Reaction & Third Law"] },
          { name: "Friction", subConcepts: ["Static and Kinetic Friction", "Laws of Friction", "Rolling Friction"] },
          { name: "Circular Dynamics", subConcepts: ["Banking of Roads", "Bending of Cyclist"] }
        ]
      },
      {
        name: "Work Energy and Power",
        concepts: [
          { name: "Work and Kinetic Energy", subConcepts: ["Work done by Constant/Variable Forces", "Work-Energy Theorem"] },
          { name: "Potential Energy", subConcepts: ["Conservative and Non-conservative Forces", "Conservation of Mechanical Energy"] },
          { name: "Collisions", subConcepts: ["Elastic Collision in 1D/2D", "Inelastic Collision & Coefficient of Restitution"] }
        ]
      },
      {
        name: "System of Particles and Rotational Motion",
        concepts: [
          { name: "Center of Mass", subConcepts: ["Center of Mass of 2-Particle System", "Center of Mass of Rigid Body"] },
          { name: "Rotational Kinematics and Dynamics", subConcepts: ["Torque and Angular Momentum", "Equilibrium of Rigid Bodies"] },
          { name: "Moment of Inertia", subConcepts: ["Parallel and Perpendicular Axis Theorems", "Radius of Gyration"] }
        ]
      },
      {
        name: "Gravitation",
        concepts: [
          { name: "Kepler's Laws", subConcepts: ["Law of Orbits", "Law of Areas", "Law of Periods"] },
          { name: "Universal Law of Gravitation", subConcepts: ["Gravitational Constant", "Acceleration due to Gravity (Variation with Altitude/Depth)"] },
          { name: "Satellites", subConcepts: ["Escape Speed", "Orbital Speed", "Geostationary Satellites"] }
        ]
      },
      {
        name: "Mechanical Properties of Solids",
        concepts: [
          { name: "Elastic Behavior", subConcepts: ["Stress and Strain", "Hooke's Law"] },
          { name: "Elastic Moduli", subConcepts: ["Young's Modulus", "Shear Modulus", "Bulk Modulus", "Poisson's Ratio"] }
        ]
      },
      {
        name: "Mechanical Properties of Fluids",
        concepts: [
          { name: "Fluid Pressure", subConcepts: ["Pascal's Law", "Atmospheric Pressure", "Archimedes Principle"] },
          { name: "Fluid Flow", subConcepts: ["Equation of Continuity", "Bernoulli's Theorem & Applications", "Viscosity & Terminal Velocity"] },
          { name: "Surface Tension", subConcepts: ["Surface Energy", "Angle of Contact", "Capillary Rise"] }
        ]
      },
      {
        name: "Thermal Properties of Matter",
        concepts: [
          { name: "Temperature and Heat", subConcepts: ["Thermal Expansion", "Specific Heat Capacity", "Calorimetry"] },
          { name: "Heat Transfer", subConcepts: ["Conduction", "Convection", "Radiation & Stefan-Boltzmann Law"] },
          { name: "Newton's Law of Cooling", subConcepts: ["Rate of Cooling", "Experimental Verification"] }
        ]
      },
      {
        name: "Thermodynamics",
        concepts: [
          { name: "Laws of Thermodynamics", subConcepts: ["Zeroth Law", "First Law (Internal Energy, Work Done)", "Second Law"] },
          { name: "Thermodynamic Processes", subConcepts: ["Isothermal & Adiabatic Processes", "Isobaric & Isochoric Processes"] },
          { name: "Heat Engines and Refrigerators", subConcepts: ["Carnot Cycle & Efficiency", "Coefficient of Performance"] }
        ]
      },
      {
        name: "Kinetic Theory",
        concepts: [
          { name: "Molecular Nature of Matter", subConcepts: ["Behavior of Gas Laws", "Ideal Gas Equation"] },
          { name: "Pressure and Temperature of an Ideal Gas", subConcepts: ["Kinetic Interpretation of Temperature", "RMS Speed"] },
          { name: "Specific Heat Capacities", subConcepts: ["Law of Equipartition of Energy", "Degree of Freedom"] }
        ]
      },
      {
        name: "Oscillations",
        concepts: [
          { name: "Simple Harmonic Motion (SHM)", subConcepts: ["Displacement, Velocity and Acceleration in SHM", "Force Law for SHM"] },
          { name: "Energy in SHM", subConcepts: ["Kinetic Energy in SHM", "Potential Energy in SHM"] },
          { name: "Simple Pendulum", subConcepts: ["Time Period Derivation", "Damped & Forced Oscillations"] }
        ]
      },
      {
        name: "Waves",
        concepts: [
          { name: "Wave Motion", subConcepts: ["Transverse and Longitudinal Waves", "Speed of Wave"] },
          { name: "Superposition of Waves", subConcepts: ["Reflection of Waves & Standing Waves", "Beats", "Doppler Effect"] }
        ]
      }
    ],
    "Class 12": [
      {
        name: "Electric Charges and Fields",
        concepts: [
          { name: "Coulomb's Law", subConcepts: ["Electrostatic Force", "Permittivity"] },
          { name: "Electric Field", subConcepts: ["Field due to Point Charge", "Electric Field Lines", "Electric Dipole & Dipole Moment"] },
          { name: "Gauss's Law", subConcepts: ["Electric Flux", "Applications of Gauss's Law"] }
        ]
      },
      {
        name: "Electrostatic Potential and Capacitance",
        concepts: [
          { name: "Electrostatic Potential", subConcepts: ["Potential due to Point Charge & Dipole", "Equipotential Surfaces"] },
          { name: "Capacitance", subConcepts: ["Parallel Plate Capacitor", "Dielectrics and Polarization", "Combination of Capacitors"] }
        ]
      },
      {
        name: "Current Electricity",
        concepts: [
          { name: "Electric Current and Ohm's Law", subConcepts: ["Drift Velocity & Mobility", "Resistivity & Temperature Dependence"] },
          { name: "Kirchhoff's Rules", subConcepts: ["Junction Rule", "Loop Rule", "Wheatstone Bridge & Meter Bridge"] },
          { name: "Cells and Potentiometer", subConcepts: ["EMF and Internal Resistance", "Potentiometer Applications"] }
        ]
      },
      {
        name: "Moving Charges and Magnetism",
        concepts: [
          { name: "Biot-Savart Law", subConcepts: ["Magnetic Field of Circular Loop", "Straight Wire Magnetic Field"] },
          { name: "Ampere's Circuital Law", subConcepts: ["Solenoid and Toroid", "Force between Two Parallel Currents"] },
          { name: "Motion in Magnetic Field", subConcepts: ["Lorentz Force", "Cyclotron", "Galvanometer to Ammeter/Voltmeter"] }
        ]
      },
      {
        name: "Magnetism and Matter",
        concepts: [
          { name: "Magnetic Dipole", subConcepts: ["Bar Magnet", "Earth's Magnetic Field & Magnetic Elements"] },
          { name: "Magnetic Properties of Materials", subConcepts: ["Diamagnetism", "Paramagnetism", "Ferromagnetism & Hysteresis Loop"] }
        ]
      },
      {
        name: "Electromagnetic Induction",
        concepts: [
          { name: "Faraday's & Lenz's Laws", subConcepts: ["Induced EMF", "Lenz's Law & Conservation of Energy"] },
          { name: "Self and Mutual Induction", subConcepts: ["Self Inductance", "Mutual Inductance", "AC Generator"] }
        ]
      },
      {
        name: "Alternating Current",
        concepts: [
          { name: "AC Voltage applied to LCR Circuit", subConcepts: ["Phasor Diagram", "Impedance", "Resonance in LCR Circuit"] },
          { name: "Power in AC Circuits", subConcepts: ["Power Factor", "Wattless Current", "Transformers"] }
        ]
      },
      {
        name: "Electromagnetic Waves",
        concepts: [
          { name: "Displacement Current", subConcepts: ["Maxwell's Equations", "Source of EM Waves"] },
          { name: "Electromagnetic Spectrum", subConcepts: ["Radio, Microwave, Infrared, Visible, UV, X-ray, Gamma waves"] }
        ]
      },
      {
        name: "Ray Optics",
        concepts: [
          { name: "Reflection and Refraction", subConcepts: ["Spherical Mirrors", "Total Internal Reflection", "Refraction through Prism"] },
          { name: "Optical Instruments", subConcepts: ["Simple & Compound Microscope", "Astronomical Telescope"] }
        ]
      },
      {
        name: "Wave Optics",
        concepts: [
          { name: "Huygens Principle", subConcepts: ["Wavefronts", "Reflection/Refraction using Wave Theory"] },
          { name: "Interference", subConcepts: ["Young's Double Slit Experiment", "Coherent Sources"] },
          { name: "Diffraction & Polarization", subConcepts: ["Single Slit Diffraction", "Polaroid filters & Brewster's Law"] }
        ]
      },
      {
        name: "Dual Nature",
        concepts: [
          { name: "Photoelectric Effect", subConcepts: ["Hertz & Lenard Observations", "Einstein's Photoelectric Equation"] },
          { name: "Matter Waves", subConcepts: ["de Broglie Hypothesis", "Davisson-Germer Experiment"] }
        ]
      },
      {
        name: "Atoms",
        concepts: [
          { name: "Alpha-particle Scattering", subConcepts: ["Rutherford Model", "Distance of Closest Approach"] },
          { name: "Bohr Model", subConcepts: ["Postulates of Bohr Model", "Energy Levels & Hydrogen Line Spectra"] }
        ]
      },
      {
        name: "Nuclei",
        concepts: [
          { name: "Nuclear Structure", subConcepts: ["Size of Nucleus", "Mass defect and Binding Energy"] },
          { name: "Radioactivity", subConcepts: ["Alpha, Beta, Gamma decays", "Radioactive Decay Law", "Nuclear Fission & Fusion"] }
        ]
      },
      {
        name: "Semiconductor Electronics",
        concepts: [
          { name: "PN Junction Diode", subConcepts: ["Forward and Reverse Bias", "Diode as Rectifier"] },
          { name: "Optoelectronic Junction Devices", subConcepts: ["LEDs", "Photodiodes", "Solar Cells", "Logic Gates"] }
        ]
      }
    ]
  },
  Chemistry: {
    "Class 11": [
      {
        name: "Some Basic Concepts of Chemistry",
        concepts: [
          { name: "Laws of Chemical Combination", subConcepts: ["Law of Conservation of Mass", "Law of Definite Proportions", "Gay Lussac's Law"] },
          { name: "Mole Concept & Stoichiometry", subConcepts: ["Molar Mass", "Empirical & Molecular Formula", "Limiting Reagent"] }
        ]
      },
      {
        name: "Structure of Atom",
        concepts: [
          { name: "Bohr Model of Hydrogen Atom", subConcepts: ["Line Spectra", "Energy levels and orbitals"] },
          { name: "Quantum Mechanical Model", subConcepts: ["de Broglie relation", "Heisenberg Uncertainty Principle", "Quantum Numbers", "Aufbau Principle"] }
        ]
      },
      {
        name: "Classification of Elements and Periodicity in Properties",
        concepts: [
          { name: "Periodic Table Evolution", subConcepts: ["Modern Periodic Law", "Group and Period classifications"] },
          { name: "Periodic Trends", subConcepts: ["Atomic and Ionic Radii", "Ionization Enthalpy", "Electron Gain Enthalpy", "Electronegativity"] }
        ]
      },
      {
        name: "Chemical Bonding and Molecular Structure",
        concepts: [
          { name: "Ionic and Covalent Bonds", subConcepts: ["Lewis Structure", "Formal Charge", "Fajans' Rules"] },
          { name: "Valence Shell Electron Pair Repulsion (VSEPR)", subConcepts: ["Geometry of Molecules", "Hybridization (sp, sp2, sp3, sp3d)"] },
          { name: "Molecular Orbital Theory", subConcepts: ["Bond Order", "Magnetic Behavior of O2, N2"] }
        ]
      },
      {
        name: "Thermodynamics",
        concepts: [
          { name: "First Law of Thermodynamics", subConcepts: ["Work, Heat, Internal Energy", "Enthalpy & Hess's Law of Constant Heat Summation"] },
          { name: "Spontaneity and Entropy", subConcepts: ["Second & Third Laws", "Gibbs Free Energy & Equilibrium"] }
        ]
      },
      {
        name: "Equilibrium",
        concepts: [
          { name: "Chemical Equilibrium", subConcepts: ["Equilibrium Constants (Kc, Kp)", "Le Chatelier's Principle"] },
          { name: "Ionic Equilibrium", subConcepts: ["pH Scale", "Buffer Solutions", "Solubility Product (Ksp)", "Common Ion Effect"] }
        ]
      },
      {
        name: "Redox Reactions",
        concepts: [
          { name: "Oxidation Number", subConcepts: ["Rules for assigning ON", "Balancing Redox Reactions (Half-Reaction & ON methods)"] }
        ]
      },
      {
        name: "Organic Chemistry – Some Basic Principles and Techniques",
        concepts: [
          { name: "IUPAC Nomenclature", subConcepts: ["Alkanes, Alkenes, Alkynes", "Functional Groups naming"] },
          { name: "Electronic Displacements", subConcepts: ["Inductive Effect", "Electromeric Effect", "Resonance & Mesomeric Effect", "Hyperconjugation"] },
          { name: "Purification and Chromatography", subConcepts: ["Crystallization", "Distillation", "Thin Layer Chromatography"] }
        ]
      },
      {
        name: "Hydrocarbons",
        concepts: [
          { name: "Alkanes and Alkenes", subConcepts: ["Conformations of Ethane", "Markownikoff's & Anti-Markownikoff's rule"] },
          { name: "Aromatic Hydrocarbons", subConcepts: ["Resonance in Benzene", "Electrophilic Substitution Reactions"] }
        ]
      }
    ],
    "Class 12": [
      {
        name: "Solutions",
        concepts: [
          { name: "Concentration Terms", subConcepts: ["Molarity & Molality", "Mole Fraction", "Raoult's Law"] },
          { name: "Colligative Properties", subConcepts: ["Relative lowering of vapor pressure", "Elevation of boiling point", "Depression of freezing point", "Osmotic Pressure & Van't Hoff factor"] }
        ]
      },
      {
        name: "Electrochemistry",
        concepts: [
          { name: "Galvanic Cells", subConcepts: ["Nernst Equation", "Gibbs Energy and Cell Potential"] },
          { name: "Electrolysis and Conductance", subConcepts: ["Kohlrausch's Law", "Faraday's Laws of Electrolysis", "Batteries & Fuel Cells"] }
        ]
      },
      {
        name: "Chemical Kinetics",
        concepts: [
          { name: "Rate of Reaction", subConcepts: ["Order and Molecularity", "Integrated Rate Equations (Zero & First Order)"] },
          { name: "Collision Theory", subConcepts: ["Arrhenius Equation & Activation Energy", "Catalysis"] }
        ]
      },
      {
        name: "d-and f-Block Elements",
        concepts: [
          { name: "Transition Metals", subConcepts: ["Electronic Configuration", "Oxidation States", "Magnetic Properties", "Lanthanoid Contraction"] }
        ]
      },
      {
        name: "Coordination Compounds",
        concepts: [
          { name: "Nomenclature and Isomerism", subConcepts: ["IUPAC naming Rules", "Geometrical and Optical Isomerism"] },
          { name: "Valence Bond and Crystal Field Theories", subConcepts: ["CFT in Octahedral/Tetrahedral fields", "Spectrochemical Series"] }
        ]
      },
      {
        name: "Haloalkanes and Haloarenes",
        concepts: [
          { name: "Nucleophilic Substitution", subConcepts: ["SN1 and SN2 mechanism", "Stereochemistry of Substitution"] },
          { name: "Electrophilic Substitution", subConcepts: ["Reactions of Haloarenes", "Grignard Reagents"] }
        ]
      },
      {
        name: "Alcohols, Phenols and Ethers",
        concepts: [
          { name: "Preparation and Properties", subConcepts: ["Acidity of Phenols", "Lucas Test", "Reimer-Tiemann Reaction"] },
          { name: "Ethers synthesis", subConcepts: ["Williamson Ether Synthesis", "Cleavage of ethers by HX"] }
        ]
      },
      {
        name: "Aldehydes, Ketones and Carboxylic Acids",
        concepts: [
          { name: "Nucleophilic Addition Reactions", subConcepts: ["Hemiacetal formation", "Aldol Condensation & Cannizzaro Reaction"] },
          { name: "Carboxylic Acids acidity", subConcepts: ["HVZ Reaction", "Decarboxylation"] }
        ]
      },
      {
        name: "Amines",
        concepts: [
          { name: "Basicity of Amines", subConcepts: ["Aliphatic vs Aromatic Amines", "Hinsberg's Test"] },
          { name: "Diazonium Salts", subConcepts: ["Sandmeyer Reaction", "Gattermann Reaction", "Coupling Reactions"] }
        ]
      },
      {
        name: "Biomolecules",
        concepts: [
          { name: "Carbohydrates", subConcepts: ["Monosaccharides (Glucose/Fructose)", "Disaccharides", "Polysaccharides"] },
          { name: "Proteins and Nucleic Acids", subConcepts: ["Amino Acids", "Peptide Bond & Protein Structure", "DNA and RNA structures"] }
        ]
      }
    ]
  },
  Biology: {
    "Class 11": [
      {
        name: "The Living World",
        concepts: [
          { name: "Biodiversity", subConcepts: ["Binomial Nomenclature", "Taxonomic Categories"] }
        ]
      },
      {
        name: "Biological Classification",
        concepts: [
          { name: "Five Kingdom Classification", subConcepts: ["Monera", "Protista", "Fungi", "Viruses and Lichens"] }
        ]
      },
      {
        name: "Plant Kingdom",
        concepts: [
          { name: "Plant Classification", subConcepts: ["Algae", "Bryophytes", "Pteridophytes", "Gymnosperms", "Angiosperms"] }
        ]
      },
      {
        name: "Animal Kingdom",
        concepts: [
          { name: "Invertebrates vs Vertebrates", subConcepts: ["Porifera to Echinodermata", "Chordata Classes"] }
        ]
      },
      {
        name: "Morphology of Flowering Plants",
        concepts: [
          { name: "Plant Parts Modification", subConcepts: ["Roots & Stem Modifications", "Leaves and Venation", "Inflorescence & Flower parts"] }
        ]
      },
      {
        name: "Anatomy of Flowering Plants",
        concepts: [
          { name: "Plant Tissues", subConcepts: ["Meristematic and Permanent Tissues", "Dicot vs Monocot Anatomy", "Secondary Growth"] }
        ]
      },
      {
        name: "Structural Organisation in Animals",
        concepts: [
          { name: "Animal Tissues", subConcepts: ["Epithelial, Connective, Muscular, Nervous Tissues", "Cockroach/Frog anatomy"] }
        ]
      },
      {
        name: "Cell: The Unit of Life",
        concepts: [
          { name: "Cell Structure", subConcepts: ["Prokaryotic vs Eukaryotic Cell", "Cell Organelles (Mitochondria, Plastids, Ribosomes)"] }
        ]
      },
      {
        name: "Biomolecules",
        concepts: [
          { name: "Chemical Constituents of Cell", subConcepts: ["Enzymes (Mechanism of action & factors)", "Proteins, Lipids, Carbohydrates"] }
        ]
      },
      {
        name: "Cell Cycle and Cell Division",
        concepts: [
          { name: "Mitosis & Meiosis", subConcepts: ["Phases of Cell Cycle (G1, S, G2, M)", "Prophase I stages in Meiosis"] }
        ]
      },
      {
        name: "Photosynthesis in Higher Plants",
        concepts: [
          { name: "Light vs Dark Reactions", subConcepts: ["Cyclic & Non-cyclic Photophosphorylation", "C3 and C4 Pathways", "Photorespiration"] }
        ]
      },
      {
        name: "Respiration in Plants",
        concepts: [
          { name: "Aerobic Respiration Steps", subConcepts: ["Glycolysis", "Kreb's Cycle (TCA)", "Electron Transport System (ETS)"] }
        ]
      },
      {
        name: "Plant Growth and Development",
        concepts: [
          { name: "Plant Growth Regulators", subConcepts: ["Auxins & Gibberellins", "Cytokinins, Ethylene & ABA", "Photoperiodism"] }
        ]
      },
      {
        name: "Breathing and Exchange of Gases",
        concepts: [
          { name: "Mechanism of Breathing", subConcepts: ["Respiratory Volumes & Capacities", "Oxygen-Haemoglobin Dissociation Curve"] }
        ]
      },
      {
        name: "Body Fluids and Circulation",
        concepts: [
          { name: "Blood and Lymph", subConcepts: ["Coagulation of Blood", "Cardiac Cycle & ECG", "Double Circulation"] }
        ]
      },
      {
        name: "Excretory Products and their Elimination",
        concepts: [
          { name: "Urine Formation", subConcepts: ["Glomerular Filtration", "Counter Current Mechanism", "Regulation of Kidney Function"] }
        ]
      },
      {
        name: "Locomotion and Movement",
        concepts: [
          { name: "Muscle Contraction", subConcepts: ["Sliding Filament Theory", "Skeletal System & Joints"] }
        ]
      },
      {
        name: "Neural Control and Coordination",
        concepts: [
          { name: "Nervous Transmission", subConcepts: ["Generation of Nerve Impulse", "Reflex Action", "Structure of Eye and Ear"] }
        ]
      },
      {
        name: "Chemical Coordination and Integration",
        concepts: [
          { name: "Endocrine Hormones", subConcepts: ["Hypothalamus & Pituitary", "Thyroid, Adrenal & Pancreas", "Mechanism of Hormone Action"] }
        ]
      }
    ],
    "Class 12": [
      {
        name: "Sexual Reproduction in Flowering Plants",
        concepts: [
          { name: "Microsporogenesis & Megasporogenesis", subConcepts: ["Pollen development", "Embryo sac structure"] },
          { name: "Pollination & Fertilization", subConcepts: ["Outbreeding devices", "Double Fertilization & Endosperm formation"] }
        ]
      },
      {
        name: "Human Reproduction",
        concepts: [
          { name: "Gametogenesis", subConcepts: ["Spermatogenesis", "Oogenesis & Menstrual Cycle"] },
          { name: "Fertilization to Lactation", subConcepts: ["Implantation", "Embryonic development"] }
        ]
      },
      {
        name: "Reproductive Health",
        concepts: [
          { name: "Birth Control Methods", subConcepts: ["Contraceptive devices", "MTP & STDs", "Assisted Reproductive Technology (ART - IVF, ZIFT)"] }
        ]
      },
      {
        name: "Principles of Inheritance and Variation",
        concepts: [
          { name: "Mendelian Genetics", subConcepts: ["Monohybred/Dihybrid Cross", "Non-Mendelian inheritance (Codominance, Linkage)"] },
          { name: "Genetic Disorders", subConcepts: ["Chromosomal aberrations", "Pedigree analysis", "Mendelian disorders (Haemophilia, Sickle-cell)"] }
        ]
      },
      {
        name: "Molecular Basis of Inheritance",
        concepts: [
          { name: "DNA Structure and Replication", subConcepts: ["Griffith's/Hershey-Chase experiments", "Semi-conservative Replication"] },
          { name: "Gene Expression & Regulation", subConcepts: ["Transcription & Translation", "Lac Operon", "Human Genome Project & DNA Fingerprinting"] }
        ]
      },
      {
        name: "Evolution",
        concepts: [
          { name: "Origin of Life Theories", subConcepts: ["Urey-Miller Experiment", "Homologous & Analogous Organs", "Adaptive Radiation"] },
          { name: "Mechanism of Evolution", subConcepts: ["Hardy-Weinberg Principle", "Natural Selection types", "Human Evolution"] }
        ]
      },
      {
        name: "Human Health and Disease",
        concepts: [
          { name: "Pathogenic Diseases", subConcepts: ["Malaria lifecycle", "Typhoid, Pneumonia, Elephantiasis"] },
          { name: "Immunity & Cancer", subConcepts: ["Innate vs Acquired Immunity", "AIDS & HIV transmission", "Cancer diagnostics"] }
        ]
      },
      {
        name: "Microbes in Human Welfare",
        concepts: [
          { name: "Industrial & Domestic Uses", subConcepts: ["Sewage Treatment", "Biogas production", "Biofertilizers & Biopesticides"] }
        ]
      },
      {
        name: "Biotechnology: Principles and Processes",
        concepts: [
          { name: "Recombinant DNA Technology", subConcepts: ["Restriction Enzymes", "Cloning Vectors (pBR322)", "PCR Steps"] }
        ]
      },
      {
        name: "Biotechnology and its Applications",
        concepts: [
          { name: "Agriculture & Medicine Application", subConcepts: ["Bt Cotton", "RNA Interference (RNAi)", "Humulin production", "Gene Therapy"] }
        ]
      },
      {
        name: "Organisms and Populations",
        concepts: [
          { name: "Organism Responses", subConcepts: ["Adaptations", "Population Growth curves (Exponential/Logistic)", "Population Interactions (Mutualism, Parasitism)"] }
        ]
      },
      {
        name: "Ecosystem",
        concepts: [
          { name: "Ecosystem Structure & Function", subConcepts: ["Productivity and Decomposition", "Energy Flow & Ecological Pyramids", "Nutrient Cycles"] }
        ]
      },
      {
        name: "Biodiversity and Conservation",
        concepts: [
          { name: "Loss of Biodiversity Causes", subConcepts: ["In-situ vs Ex-situ conservation", "Red Data Book"] }
        ]
      }
    ]
  },
  Mathematics: {
    "Class 11": [
      {
        name: "Sets",
        concepts: [
          { name: "Set Representations", subConcepts: ["Roster & Set-builder form", "Types of Sets (Empty, Finite, Infinite)"] },
          { name: "Set Operations", subConcepts: ["Union, Intersection, Difference", "Venn Diagrams & Cartesian Product"] }
        ]
      },
      {
        name: "Relations and Functions",
        concepts: [
          { name: "Domain and Range", subConcepts: ["Relation representations", "Real Functions (Identity, Polynomial, Rational, Modulus, Signum)"] }
        ]
      },
      {
        name: "Trigonometric Functions",
        concepts: [
          { name: "Angles & Circular Functions", subConcepts: ["Radian and Degree Measure", "Signs of Trigonometric Functions"] },
          { name: "Trigonometric Identities", subConcepts: ["Compound angles formulas", "Double & Triple angle formulas", "Trigonometric Equations"] }
        ]
      },
      {
        name: "Complex Numbers and Quadratic Equations",
        concepts: [
          { name: "Algebra of Complex Numbers", subConcepts: ["Modulus and Conjugate", "Polar representation & Argand Plane"] },
          { name: "Quadratic Equations in Complex Plane", subConcepts: ["Roots with negative discriminant"] }
        ]
      },
      {
        name: "Linear Inequalities",
        concepts: [
          { name: "Algebraic Solutions", subConcepts: ["One variable inequalities", "Graphical solution of two variable system"] }
        ]
      },
      {
        name: "Permutations and Combinations",
        concepts: [
          { name: "Counting Principles", subConcepts: ["Fundamental Principle of Counting", "Factorial notation"] },
          { name: "Permutations and Combinations formulas", subConcepts: ["nPr and nCr derivations", "Restricted Permutations"] }
        ]
      },
      {
        name: "Binomial Theorem",
        concepts: [
          { name: "Binomial Expansion", subConcepts: ["General and Middle terms", "Pascal's Triangle"] }
        ]
      },
      {
        name: "Sequences and Series",
        concepts: [
          { name: "Arithmetic Progression (AP)", subConcepts: ["nth term of AP", "Sum of n terms of AP", "Arithmetic Mean (AM)"] },
          { name: "Geometric Progression (GP)", subConcepts: ["nth term of GP", "Sum of n terms of GP", "Sum of infinite GP", "Geometric Mean (GM)"] }
        ]
      },
      {
        name: "Straight Lines",
        concepts: [
          { name: "Slope of Line", subConcepts: ["Angle between two lines", "Collinearity of three points"] },
          { name: "Forms of Equation of a Line", subConcepts: ["Slope-intercept & Intercept forms", "Normal and General forms", "Distance of Point from Line"] }
        ]
      },
      {
        name: "Conic Sections",
        concepts: [
          { name: "Standard Equations of Conics", subConcepts: ["Circle", "Parabola (focus, directrix, latus rectum)", "Ellipse", "Hyperbola"] }
        ]
      },
      {
        name: "Introduction to Three Dimensional Geometry",
        concepts: [
          { name: "Coordinate Axes & Planes in 3D", subConcepts: ["Distance Formula in 3D space", "Section Formula"] }
        ]
      },
      {
        name: "Limits and Derivatives",
        concepts: [
          { name: "Intuitive Idea of Limit", subConcepts: ["Limits of Trigonometric/Algebraic functions", "Left hand and Right hand limits"] },
          { name: "Derivatives", subConcepts: ["First Principle definition", "Product & Quotient Rules"] }
        ]
      },
      {
        name: "Statistics",
        concepts: [
          { name: "Measures of Dispersion", subConcepts: ["Mean Deviation (grouped & ungrouped)", "Variance & Standard Deviation", "Coefficient of Variation"] }
        ]
      },
      {
        name: "Probability",
        concepts: [
          { name: "Random Experiments", subConcepts: ["Sample Space & Events", "Axiomatic Probability"] }
        ]
      }
    ],
    "Class 12": [
      {
        name: "Relations and Functions",
        concepts: [
          { name: "Types of Relations", subConcepts: ["Reflexive, Symmetric, Transitive Relations", "Equivalence Relations"] },
          { name: "Types of Functions", subConcepts: ["One-One (Injective) Functions", "Onto (Surjective) Functions", "Bijective Functions"] }
        ]
      },
      {
        name: "Inverse Trigonometric Functions",
        concepts: [
          { name: "Principal Value Branches", subConcepts: ["Graphs of Inverse Trigonometric Functions"] },
          { name: "Properties of Inverse Trig Functions", subConcepts: ["Substitution and Simplification"] }
        ]
      },
      {
        name: "Matrices",
        concepts: [
          { name: "Matrix Operations", subConcepts: ["Addition & Scalar multiplication", "Matrix multiplication properties", "Transpose & Symmetric/Skew-symmetric matrices"] }
        ]
      },
      {
        name: "Determinants",
        concepts: [
          { name: "Properties of Determinants", subConcepts: ["Expansion rules", "Area of Triangle", "Adjoint and Inverse of Matrix"] },
          { name: "Systems of Linear Equations", subConcepts: ["Cramer's Rule / Matrix Method", "Consistency and Inconsistency"] }
        ]
      },
      {
        name: "Continuity and Differentiability",
        concepts: [
          { name: "Continuity Check", subConcepts: ["Continuity at a point / interval", "Algebra of continuous functions"] },
          { name: "Differentiability Rules", subConcepts: ["Chain Rule", "Implicit Differentiation", "Logarithmic Differentiation", "Parametric Forms", "Second Order Derivatives"] }
        ]
      },
      {
        name: "Application of Derivatives",
        concepts: [
          { name: "Rate of Change & Approximations", subConcepts: ["Increasing and Decreasing Functions", "Tangent and Normal slopes"] },
          { name: "Maxima and Minima", subConcepts: ["First Derivative Test", "Second Derivative Test", "Applied Word Problems"] }
        ]
      },
      {
        name: "Integrals",
        concepts: [
          { name: "Indefinite Integrals", subConcepts: ["Integration by Substitution", "Integration by Partial Fractions", "Integration by Parts"] },
          { name: "Definite Integrals", subConcepts: ["Fundamental Theorem of Calculus", "Properties of Definite Integrals"] }
        ]
      },
      {
        name: "Application of Integrals",
        concepts: [
          { name: "Area under Simple Curves", subConcepts: ["Area between a Line and a Curve", "Area between Two Curves"] }
        ]
      },
      {
        name: "Differential Equations",
        concepts: [
          { name: "Order and Degree", subConcepts: ["General and Particular solutions"] },
          { name: "Methods of Solving 1st Order DE", subConcepts: ["Variable Separable Method", "Homogeneous Differential Equations", "Linear Differential Equations"] }
        ]
      },
      {
        name: "Vector Algebra",
        concepts: [
          { name: "Vector Components", subConcepts: ["Direction Cosines & Direction Ratios"] },
          { name: "Products of Vectors", subConcepts: ["Scalar (Dot) Product", "Vector (Cross) Product", "Scalar Triple Product"] }
        ]
      },
      {
        name: "Three Dimensional Geometry",
        concepts: [
          { name: "Direction Cosines of a Line", subConcepts: ["Angle between two lines"] },
          { name: "Equation of a Line & Plane in 3D", subConcepts: ["Shortest distance between two skew lines", "Equation of Plane", "Angle between Line and Plane"] }
        ]
      },
      {
        name: "Linear Programming",
        concepts: [
          { name: "LPP Formulation", subConcepts: ["Mathematical formulation", "Graphical solution method (Feasible region, Corner points)"] }
        ]
      },
      {
        name: "Probability",
        concepts: [
          { name: "Conditional Probability", subConcepts: ["Multiplication Theorem on Probability", "Independent Events", "Bayes' Theorem"] },
          { name: "Probability Distribution", subConcepts: ["Random Variable & its Mean", "Bernoulli Trials & Binomial Distribution"] }
        ]
      }
    ]
  }
};

export function getChapters(subject: string, classVal: string): Chapter[] {
  const normSubject = subject === "Mathematics" ? "Mathematics" : subject;
  const normClass = classVal === "11th" ? "Class 11" : classVal === "12th" ? "Class 12" : classVal;
  return ACADEMIC_HIERARCHY[normSubject]?.[normClass] || [];
}

export function getConcepts(subject: string, classVal: string, chapterName: string): Concept[] {
  const chapters = getChapters(subject, classVal);
  const chapter = chapters.find(c => c.name.toLowerCase() === chapterName.toLowerCase());
  return chapter?.concepts || [];
}
