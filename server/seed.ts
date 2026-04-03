import { db } from "./storage";
import { chemicals, reactions } from "@shared/schema";

const SEED_CHEMICALS = [
  { name: "Benzene", smiles: "c1ccccc1" },
  { name: "Toluene", smiles: "Cc1ccccc1" },
  { name: "Phenol", smiles: "Oc1ccccc1" },
  { name: "Aniline", smiles: "Nc1ccccc1" },
  { name: "Naphthalene", smiles: "c1ccc2ccccc2c1" },
  { name: "Anthracene", smiles: "c1ccc2cc3ccccc3cc2c1" },
  { name: "Aspirin", smiles: "CC(=O)Oc1ccccc1C(=O)O" },
  { name: "Caffeine", smiles: "Cn1c(=O)c2c(ncn2C)n(C)c1=O" },
  { name: "Ibuprofen", smiles: "CC(C)Cc1ccc(cc1)C(C)C(=O)O" },
  { name: "Paracetamol", smiles: "CC(=O)Nc1ccc(O)cc1" },
  { name: "Morphine", smiles: "CN1CC[C@]23c4c5ccc(O)c4O[C@H]2C(=C[C@@H]1[C@@H]3C5)O" },
  { name: "Cholesterol", smiles: "CC(CCCC(C)C)[C@H]1CC[C@@H]2[C@@]1(CC[C@H]3[C@H]2CC=C4[C@@]3(CC[C@@H](C4)O)C)C" },
  { name: "Glucose", smiles: "OC[C@H]1OC(O)[C@H](O)[C@@H](O)[C@@H]1O" },
  { name: "ATP", smiles: "c1nc(c2c(n1)n(cn2)[C@@H]3[C@@H]([C@@H]([C@H](O3)COP(=O)(O)OP(=O)(O)OP(=O)(O)O)O)O)N" },
  { name: "Nicotine", smiles: "CN1CCC[C@H]1c1cccnc1" },
  { name: "Penicillin G", smiles: "CC1([C@@H](N2[C@H](S1)[C@@H](C2=O)NC(=O)Cc3ccccc3)C(=O)O)C" },
  { name: "Vanillin", smiles: "O=Cc1ccc(O)c(OC)c1" },
  { name: "Cinnamaldehyde", smiles: "O=C/C=C/c1ccccc1" },
  { name: "Limonene", smiles: "CC(=C)[C@@H]1CCC(=CC1)C" },
  { name: "Menthol", smiles: "C[C@@H]1CC[C@H]([C@@H](C1)O)C(C)C" },
  { name: "Capsaicin", smiles: "COc1cc(ccc1O)CNC(=O)CCCC/C=C/C(C)C" },
  { name: "Dopamine", smiles: "NCCc1ccc(O)c(O)c1" },
  { name: "Serotonin", smiles: "NCCc1c[nH]c2ccc(O)cc12" },
  { name: "Adrenaline", smiles: "CNC[C@H](O)c1ccc(O)c(O)c1" },
  { name: "Testosterone", smiles: "C[C@]12CC[C@H]3[C@@H](CCC4=CC(=O)CC[C@@]34C)[C@@H]1CC[C@@H]2O" },
  { name: "Estradiol", smiles: "C[C@]12CC[C@H]3[C@@H](CCc4cc(O)ccc43)[C@@H]1CC[C@@H]2O" },
  { name: "Cortisol", smiles: "O[C@@]1(CC[C@@H]2[C@@]1(CC(=O)[C@H]3[C@H]2CCC4=CC(=O)CC[C@]34C)C)C(=O)CO" },
  { name: "Progesterone", smiles: "CC(=O)[C@H]1CC[C@@H]2[C@@]1(CC[C@H]3[C@H]2CCC4=CC(=O)CC[C@@]34C)C" },
  { name: "Thymol", smiles: "Cc1ccc(C(C)C)c(O)c1" },
  { name: "Eugenol", smiles: "C=CCc1ccc(O)c(OC)c1" },
  { name: "Camphor", smiles: "CC1(C)[C@H]2CC[C@@](C)(C2)C1=O" },
  { name: "Coumarin", smiles: "O=c1ccc2ccccc2o1" },
  { name: "Indole", smiles: "c1ccc2[nH]ccc2c1" },
  { name: "Pyrrole", smiles: "c1cc[nH]c1" },
  { name: "Furan", smiles: "c1ccoc1" },
  { name: "Thiophene", smiles: "c1ccsc1" },
  { name: "Pyridine", smiles: "c1ccncc1" },
  { name: "Quinoline", smiles: "c1ccc2ncccc2c1" },
  { name: "Isoquinoline", smiles: "c1ccc2cnccc2c1" },
  { name: "Acridine", smiles: "c1ccc2nc3ccccc3cc2c1" },
  { name: "Purine", smiles: "c1ncc2[nH]cnc2n1" },
  { name: "Adenine", smiles: "Nc1ncnc2[nH]cnc12" },
  { name: "Guanine", smiles: "Nc1nc2[nH]cnc2c(=O)[nH]1" },
  { name: "Cytosine", smiles: "Nc1ccn(c(=O)n1)" },
  { name: "Thymine", smiles: "Cc1cn(c(=O)[nH]c1=O)" },
  { name: "Uracil", smiles: "O=c1cc[nH]c(=O)[nH]1" },
  { name: "Ribose", smiles: "OC[C@H]1OC(O)[C@H](O)[C@@H]1O" },
  { name: "Fructose", smiles: "OC[C@@H](O)[C@@H](O)[C@H](O)C(=O)CO" },
  { name: "Sucrose", smiles: "OC[C@H]1OC(O[C@@]2(CO)O[C@H](CO)[C@@H](O)[C@@H]2O)[C@H](O)[C@@H](O)[C@@H]1O" },
  { name: "Lactose", smiles: "OC[C@H]1OC(O)[C@H](O)[C@@H](O[C@@H]2O[C@H](CO)[C@H](O)[C@H](O)[C@H]2O)[C@@H]1O" },
  { name: "Stearic acid", smiles: "CCCCCCCCCCCCCCCCCC(=O)O" },
  { name: "Oleic acid", smiles: "CCCCCCCC/C=C\\CCCCCCCC(=O)O" },
  { name: "Linoleic acid", smiles: "CCCCCC=CCC=CCCCCCCCC(=O)O" },
  { name: "Retinol", smiles: "CC1=C(C(CCC1)(C)C)/C=C/C(=C/C=C/C(=C/CO)/C)/C" },
  { name: "Ascorbic acid", smiles: "OC[C@@H](O)[C@H]1OC(=O)C(O)=C1O" },
  { name: "Nitrobenzene", smiles: "O=[N+]([O-])c1ccccc1" },
  { name: "Benzoic acid", smiles: "OC(=O)c1ccccc1" },
  { name: "Acetone", smiles: "CC(=O)C" },
  { name: "Ethanol", smiles: "CCO" },
  { name: "Acetic acid", smiles: "CC(=O)O" },
  { name: "Methanol", smiles: "CO" },
  { name: "Acetaldehyde", smiles: "CC=O" },
  { name: "Glycine", smiles: "NCC(=O)O" },
  { name: "Alanine", smiles: "CC(N)C(=O)O" },
];

const SEED_REACTIONS = [
  { reactantSmiles: "c1ccccc1", productSmiles: "O=[N+]([O-])c1ccccc1", conditions: "HNO3, H2SO4, 50°C", reagents: "Mixed acid" },
  { reactantSmiles: "c1ccccc1", productSmiles: "Clc1ccccc1", conditions: "Cl2, FeCl3, RT", reagents: "Lewis acid catalyst" },
  { reactantSmiles: "OC(=O)c1ccccc1", productSmiles: "COC(=O)c1ccccc1", conditions: "MeOH, H2SO4, reflux", reagents: "Fischer esterification" },
  { reactantSmiles: "CC(=O)Cl", productSmiles: "CC(=O)Nc1ccccc1", conditions: "Pyridine, 0°C to RT", reagents: "Schotten-Baumann" },
  { reactantSmiles: "Oc1ccccc1", productSmiles: "CC(=O)Oc1ccccc1", conditions: "Acetic anhydride, RT", reagents: "Acetylation" },
  { reactantSmiles: "c1ccc(Br)cc1", productSmiles: "c1ccc(-c2ccccc2)cc1", conditions: "Pd(PPh3)4, Na2CO3, DME, 80°C", reagents: "Suzuki coupling" },
  { reactantSmiles: "CC=O", productSmiles: "CC(O)c1ccccc1", conditions: "THF, -78°C to RT", reagents: "Grignard (PhMgBr)" },
  { reactantSmiles: "CC(=O)C", productSmiles: "CC(=CC(=O)C)C", conditions: "NaOH, H2O, RT", reagents: "Aldol condensation" },
];

export function seedDatabase() {
  const existingCount = db.select().from(chemicals).all().length;
  if (existingCount > 0) return;

  const now = new Date().toISOString();

  for (const chem of SEED_CHEMICALS) {
    try {
      db.insert(chemicals).values({
        name: chem.name,
        smiles: chem.smiles,
        canonicalSmiles: chem.smiles,
        formula: "",
        mw: 0,
        logp: 0,
        hbd: 0,
        hba: 0,
        tpsa: 0,
        rotatableBonds: 0,
        inchi: "",
        source: "built-in",
        pdfId: null,
        createdAt: now,
      }).run();
    } catch (e) {
      console.error(`Failed to seed ${chem.name}:`, e);
    }
  }

  for (const rxn of SEED_REACTIONS) {
    try {
      db.insert(reactions).values({
        reactantSmiles: rxn.reactantSmiles,
        productSmiles: rxn.productSmiles,
        conditions: rxn.conditions,
        reagents: rxn.reagents,
        source: "built-in",
        pdfId: null,
        createdAt: now,
      }).run();
    } catch (e) {
      console.error(`Failed to seed reaction:`, e);
    }
  }

  console.log(`Seeded ${SEED_CHEMICALS.length} chemicals and ${SEED_REACTIONS.length} reactions`);
}
