const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const outputPath = path.join(__dirname, '..', 'test-chemicals.pdf');

const chunks = [];
const doc = new PDFDocument({ compress: false });
doc.on('data', chunk => chunks.push(chunk));
doc.on('end', () => {
  const buf = Buffer.concat(chunks);
  fs.writeFileSync(outputPath, buf);
  console.log('Test PDF generated at:', outputPath, '(' + buf.length + ' bytes)');
});

doc.fontSize(20).text('Chemical Reference Document', { align: 'center' });
doc.moveDown();
doc.fontSize(14).text('A comprehensive collection of chemical compounds', { align: 'center' });
doc.moveDown(2);

doc.fontSize(12).text('Aromatic Hydrocarbons:', { underline: true });
doc.moveDown(0.5);
const aromatic = [
  'Benzene (C6H6) - c1ccccc1',
  'Toluene (C7H8) - Cc1ccccc1', 
  'Phenol (C6H6O) - Oc1ccccc1',
  'Aniline (C6H7N) - Nc1ccccc1',
  'Naphthalene (C10H8) - c1ccc2ccccc2c1',
  'Nitrobenzene - O=[N+]([O-])c1ccccc1',
  'Benzoic acid - OC(=O)c1ccccc1',
];
aromatic.forEach(c => { doc.text(c); doc.moveDown(0.3); });

doc.moveDown();
doc.fontSize(12).text('Pharmaceuticals:', { underline: true });
doc.moveDown(0.5);
const pharma = [
  'Aspirin (C9H8O4) - CC(=O)Oc1ccccc1C(=O)O',
  'Caffeine (C8H10N4O2) - Cn1c(=O)c2c(ncn2C)n(C)c1=O',
  'Ibuprofen - CC(C)Cc1ccc(cc1)C(C)C(=O)O',
  'Paracetamol (Acetaminophen) - CC(=O)Nc1ccc(O)cc1',
  'Morphine - CN1CCC23c4c5ccc(O)c4OC2C(=CC1C3C5)O',
  'Penicillin G - beta-lactam antibiotic',
  'Nicotine - CN1CCCC1c1cccnc1',
];
pharma.forEach(c => { doc.text(c); doc.moveDown(0.3); });

doc.moveDown();
doc.fontSize(12).text('Heterocyclic Compounds:', { underline: true });
doc.moveDown(0.5);
const hetero = [
  'Pyridine - c1ccncc1',
  'Quinoline - c1ccc2ncccc2c1',
  'Furan - c1ccoc1',
  'Thiophene - c1ccsc1',
  'Pyrrole - c1cc[nH]c1',
  'Indole - c1ccc2[nH]ccc2c1',
];
hetero.forEach(c => { doc.text(c); doc.moveDown(0.3); });

doc.moveDown();
doc.fontSize(12).text('Nucleobases:', { underline: true });
doc.moveDown(0.5);
const nucleobases = [
  'Adenine - Nc1ncnc2[nH]cnc12',
  'Guanine - nucleobase of DNA',
  'Cytosine - Nc1ccn(c(=O)n1)',
  'Thymine - Cc1cn(c(=O)[nH]c1=O)',
  'Uracil - O=c1cc[nH]c(=O)[nH]1',
];
nucleobases.forEach(c => { doc.text(c); doc.moveDown(0.3); });

doc.moveDown();
doc.fontSize(12).text('Steroids and Hormones:', { underline: true });
doc.moveDown(0.5);
const steroids = [
  'Cholesterol - steroid compound',
  'Testosterone - steroid hormone C19H28O2',
  'Estradiol - estrogen hormone',
  'Cortisol - glucocorticoid hormone',
  'Progesterone - progesterone hormone',
];
steroids.forEach(c => { doc.text(c); doc.moveDown(0.3); });

doc.moveDown();
doc.fontSize(12).text('Neurotransmitters:', { underline: true });
doc.moveDown(0.5);
const neuro = [
  'Dopamine - NCCc1ccc(O)c(O)c1',
  'Serotonin - NCCc1c[nH]c2ccc(O)cc12',
  'Adrenaline (Epinephrine) - fight-or-flight hormone',
];
neuro.forEach(c => { doc.text(c); doc.moveDown(0.3); });

doc.moveDown();
doc.fontSize(12).text('Sugars and Carbohydrates:', { underline: true });
doc.moveDown(0.5);
const sugars = [
  'Glucose - OCC1OC(O)C(O)C(O)C1O',
  'Fructose - fruit sugar',
  'Sucrose - table sugar disaccharide',
];
sugars.forEach(c => { doc.text(c); doc.moveDown(0.3); });

doc.moveDown();
doc.fontSize(12).text('Terpenes and Natural Products:', { underline: true });
doc.moveDown(0.5);
const natural = [
  'Vanillin - O=Cc1ccc(O)c(OC)c1',
  'Cinnamaldehyde - O=C/C=C/c1ccccc1',
  'Limonene - CC(=C)C1CCC(=CC1)C',
  'Menthol - CC1CCC(C(C1)O)C(C)C',
  'Camphor - monoterpene ketone',
  'Retinol - Vitamin A',
  'Ascorbic acid - Vitamin C',
];
natural.forEach(c => { doc.text(c); doc.moveDown(0.3); });

doc.moveDown();
doc.fontSize(12).text('Simple Organic Compounds:', { underline: true });
doc.moveDown(0.5);
const simple = [
  'Acetone - CC(=O)C',
  'Ethanol - CCO',
  'Acetic acid - CC(=O)O',
  'Methanol - CO',
  'Glycine - NCC(=O)O',
  'Alanine - CC(N)C(=O)O',
];
simple.forEach(c => { doc.text(c); doc.moveDown(0.3); });

doc.end();
