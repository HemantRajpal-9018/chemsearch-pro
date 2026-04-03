const PDFDocument = require('pdfkit');
const fs = require('fs');

const doc = new PDFDocument({ margin: 50 });
doc.pipe(fs.createWriteStream('complex-chemicals.pdf'));

doc.fontSize(18).text('Complex Chemical Structures Database', { align: 'center' });
doc.moveDown();
doc.fontSize(10).text('A comprehensive reference of complex organic molecules for chemical search testing', { align: 'center' });
doc.moveDown(2);

// Categories of complex molecules with SMILES
const categories = [
  {
    title: 'Steroids & Hormones',
    chemicals: [
      'Cholesterol', 'Testosterone', 'Estradiol', 'Cortisol', 
      'Progesterone', 'Dexamethasone', 'Prednisone'
    ]
  },
  {
    title: 'Alkaloids',
    chemicals: [
      'Morphine', 'Codeine', 'Caffeine', 'Quinine',
      'Strychnine', 'Atropine', 'Cocaine', 'Nicotine',
      'Ephedrine', 'Colchicine'
    ]
  },
  {
    title: 'Heterocyclic Compounds',
    chemicals: [
      'Quinoline', 'Isoquinoline', 'Indole', 'Pyrimidine',
      'Imidazole', 'Thiophene', 'Furan', 'Oxazole',
      'Pyrazine', 'Purine', 'Carbazole', 'Acridine'
    ]
  },
  {
    title: 'Pharmaceuticals',
    chemicals: [
      'Penicillin G', 'Amoxicillin', 'Metformin', 'Omeprazole',
      'Atorvastatin', 'Diazepam', 'Warfarin', 'Methotrexate',
      'Ciprofloxacin', 'Fluoxetine', 'Sertraline', 'Loratadine'
    ]
  },
  {
    title: 'Natural Products',
    chemicals: [
      'Resveratrol', 'Curcumin', 'Capsaicin', 'Quercetin',
      'Artemisinin', 'Taxol', 'Vinblastine', 'Camptothecin'
    ]
  },
  {
    title: 'Complex Polycyclic',
    chemicals: [
      'Pyrene', 'Fluoranthene', 'Coronene', 'Triphenylene',
      'Chrysene', 'Perylene', 'Fluorene', 'Acenaphthylene'
    ]
  }
];

for (const cat of categories) {
  if (doc.y > 650) doc.addPage();
  doc.fontSize(14).fillColor('#1a5276').text(cat.title, { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor('#000000');
  
  const lines = [];
  for (let i = 0; i < cat.chemicals.length; i += 4) {
    const chunk = cat.chemicals.slice(i, i + 4);
    lines.push(chunk.join('  |  '));
  }
  lines.forEach(line => {
    doc.text(line);
    doc.moveDown(0.3);
  });
  doc.moveDown(1);
}

// Add a page with SMILES strings directly
doc.addPage();
doc.fontSize(18).text('SMILES Reference', { align: 'center' });
doc.moveDown();

const smilesRef = [
  { name: 'Cholesterol', smiles: 'CC(C)CCCC(C)C1CCC2C1(CCC3C2CC=C4C3(CCC(C4)O)C)C' },
  { name: 'Testosterone', smiles: 'CC12CCC3C(C1CCC2O)CCC4=CC(=O)CCC34C' },
  { name: 'Caffeine', smiles: 'Cn1c(=O)c2c(ncn2C)n(c1=O)C' },
  { name: 'Morphine', smiles: 'CN1CCC23c4c5ccc(O)c4OC2C(O)C=CC3C1C5' },
  { name: 'Quinine', smiles: 'COc1ccc2nccc(C(O)C3CC4CCN3CC4=C)c2c1' },
  { name: 'Indole', smiles: 'c1ccc2[nH]ccc2c1' },
  { name: 'Purine', smiles: 'c1ncc2[nH]cnc2n1' },
  { name: 'Artemisinin', smiles: 'CC1CCC2C(C)C(OC3OC4(C)CCC1C23)OO4' },
  { name: 'Diazepam', smiles: 'CN1C(=O)CN=C(c2ccccc2)c3cc(Cl)ccc13' },
  { name: 'Pyrene', smiles: 'c1cc2ccc3cccc4ccc(c1)c2c34' },
  { name: 'Resveratrol', smiles: 'Oc1ccc(/C=C/c2cc(O)cc(O)c2)cc1' },
  { name: 'Curcumin', smiles: 'COc1cc(/C=C/C(=O)CC(=O)/C=C/c2ccc(O)c(OC)c2)ccc1O' },
];

doc.fontSize(9);
for (const item of smilesRef) {
  doc.fillColor('#1a5276').text(item.name, { continued: true });
  doc.fillColor('#000000').text(': ' + item.smiles);
  doc.moveDown(0.3);
}

doc.end();
console.log('Complex chemicals PDF generated');
