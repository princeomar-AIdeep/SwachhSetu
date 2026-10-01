// Demo data for the hackathon. `npm run seed` WIPES these collections and re-inserts demo records.
// All demo logins use password  Demo@123  (admin: admin@swachhsetu.test)
// ENHANCE: awareness facts below are deliberately qualitative/dated & sourced. Add numeric statistics
//          (e.g. tonnes/day) ONLY after copying them from the official source (CPCB / MoHUA annual reports).
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const M = require('./models');
const { titleFor } = require('./utils/score');

const W = '/assets/waste/';
const categories = [
  { slug: 'wet', name: 'Wet / Organic Waste', hindi: 'गीला कचरा', color: '#2E9D34', bin: 'Green bin', image: W + 'wet-waste-bin.webp', order: 1,
    description: 'Kitchen and garden waste that breaks down naturally.', examples: ['Fruit & vegetable peels', 'Leftover food', 'Tea leaves & coffee grounds', 'Eggshells', 'Flowers'], steps: ['Keep a separate green bin in the kitchen', 'Drain excess liquid', 'Hand over daily or compost at home'] },
  { slug: 'dry', name: 'Dry / Recyclable Waste', hindi: 'सूखा कचरा', color: '#1F5FBF', bin: 'Blue bin', image: W + 'dry-waste-bin.webp', order: 2,
    description: 'Clean paper, plastic, metal and glass that can be recycled.', examples: ['Newspapers & cardboard', 'Plastic bottles & containers', 'Metal cans', 'Empty glass bottles', 'Old clothes & textiles'], steps: ['Empty and rinse containers', 'Let them dry', 'Store in the blue bin and hand over to the collector'] },
  { slug: 'hazardous', name: 'Hazardous Waste', hindi: 'हानिकारक कचरा', color: '#D0312D', bin: 'Red bin / container', image: W + 'hazardous-bin.webp', order: 3,
    description: 'Household items that can harm people or the environment.', examples: ['Expired medicines', 'Paints & solvents', 'Aerosol cans & pesticides', 'CFL / LED bulbs', 'Thermometers & sharp objects'], steps: ['Never mix with wet or dry waste', 'Seal liquids and wrap sharp items', 'Hand over at a hazardous collection point'] },
  { slug: 'ewaste', name: 'E-Waste', hindi: 'ई-कचरा', color: '#2B2F36', bin: 'Separate e-waste collection', image: W + 'ewaste-bin.webp', order: 4,
    description: 'Discarded electronics and electrical items.', examples: ['Mobile phones & chargers', 'Laptops & tablets', 'Cables & earphones', 'Remote controls', 'Batteries'], steps: ['Store separately and keep dry', 'Do not break or burn devices', 'Schedule a collection or use an authorised e-waste bin'] },
  { slug: 'sanitary', name: 'Sanitary Waste', hindi: 'सैनिटरी कचरा', color: '#C2527A', bin: 'Wrapped, handed over separately', image: W + 'separation-guide-poster.webp', order: 5,
    description: 'Used hygiene products that need safe, wrapped disposal.', examples: ['Sanitary napkins', 'Diapers', 'Used bandages'], steps: ['Wrap securely in paper or a pouch', 'Mark it so handlers know', 'Hand over separately - never flush'] },
  { slug: 'special', name: 'Special Waste', hindi: 'विशेष कचरा', color: '#C9871A', bin: 'Special / bulk pickup', image: W + 'separation-guide-poster.webp', order: 6,
    description: 'Bulky or unusual items that do not fit regular collection.', examples: ['Furniture & mattresses', 'Garden & construction debris', 'Large appliances'], steps: ['Do not leave on the street', 'Request a Bulk / Garden pickup in SWACHHSETU', 'Keep it accessible for the collector'] },
];
const I = (name, keywords, category, bio, rec, handling, extra = {}) => ({ name, keywords, category, biodegradable: bio, recyclable: rec, handling, ...extra });
const items = [
  I('Banana peel', ['banana', 'fruit peel', 'peel'], 'wet', true, false, 'Place with wet / organic waste in the green bin.', { composting: 'Suitable for home composting.', mistakes: 'Do not wrap it in a plastic bag.' }),
  I('Vegetable scraps', ['vegetable', 'veg', 'kitchen waste'], 'wet', true, false, 'Green bin, or compost at home.', { composting: 'Good compost material; chop small to speed it up.' }),
  I('Leftover food', ['food', 'cooked food', 'rice', 'roti'], 'wet', true, false, 'Drain liquids and place in the green bin.', { mistakes: 'Avoid mixing with packaging.' }),
  I('Tea leaves', ['tea', 'coffee grounds', 'coffee'], 'wet', true, false, 'Wet waste; squeeze out water first.', { composting: 'Excellent for compost.' }),
  I('Eggshell', ['egg', 'egg shell'], 'wet', true, false, 'Wet waste or compost.', { composting: 'Crush before composting.' }),
  I('Plastic bottle', ['bottle', 'pet bottle', 'water bottle', 'plastic'], 'dry', false, true, 'Empty, rinse, dry and place in the blue bin.', { mistakes: 'Do not leave liquid inside; remove caps if your collector asks.', environment: 'Plastic can persist in the environment for a very long time, so recycling matters.' }),
  I('Newspaper', ['paper', 'magazine', 'newsprint'], 'dry', true, true, 'Keep dry and stack in the blue bin.', { mistakes: 'Wet or greasy paper is hard to recycle.' }),
  I('Cardboard', ['box', 'carton', 'packaging'], 'dry', true, true, 'Flatten boxes and keep them dry.', { mistakes: 'Remove plastic tape and food residue if possible.' }),
  I('Glass bottle', ['glass', 'jar'], 'dry', false, true, 'Empty and rinse; hand over carefully.', { safety: 'Wrap broken glass in paper and mark it before handing over.' }),
  I('Metal can', ['tin', 'can', 'aluminium', 'steel'], 'dry', false, true, 'Rinse and place in the blue bin.', { safety: 'Press sharp edges inward.' }),
  I('Polythene bag', ['plastic bag', 'carry bag', 'polythene'], 'dry', false, true, 'Clean and dry bags go in the blue bin. Better: reuse them.', { environment: 'Reuse or refuse single-use bags wherever possible.' }),
  I('Old clothes', ['cloth', 'textile', 'shirt'], 'dry', false, true, 'Donate if usable; otherwise dry waste.'),
  I('Battery', ['cell', 'batteries', 'button cell'], 'hazardous', false, false, 'Store separately and hand over at a hazardous / e-waste point.', { safety: 'Never burn or puncture batteries. Tape terminals of spent lithium cells.', mistakes: 'Do not throw batteries into dry waste.' }),
  I('Expired medicines', ['medicine', 'tablet', 'syrup', 'drug'], 'hazardous', false, false, 'Keep in original packaging and hand over at a hazardous waste point.', { safety: 'Do not flush or throw with kitchen waste.' }),
  I('Paint tin', ['paint', 'solvent', 'thinner'], 'hazardous', false, false, 'Seal tightly and hand over as hazardous waste.', { safety: 'Keep away from heat and children.' }),
  I('CFL / LED bulb', ['bulb', 'tube light', 'cfl', 'led'], 'hazardous', false, false, 'Wrap to avoid breakage and hand over separately.', { safety: 'CFLs contain trace mercury - do not break them.' }),
  I('Aerosol can', ['spray', 'deodorant', 'pesticide'], 'hazardous', false, false, 'Do not puncture; hand over as hazardous waste.'),
  I('Thermometer', ['mercury', 'glass thermometer'], 'hazardous', false, false, 'Handle carefully and hand over at a hazardous point.', { safety: 'Mercury is toxic - do not touch spilled mercury.' }),
  I('Mobile phone', ['phone', 'smartphone', 'charger'], 'ewaste', false, true, 'Give to an authorised e-waste collector.', { mistakes: 'Do not throw old phones in household waste.' }),
  I('Laptop', ['computer', 'keyboard', 'monitor', 'electronic device', 'tablet'], 'ewaste', false, true, 'Schedule an e-waste pickup or use an authorised bin.', { safety: 'Erase personal data before handing over.' }),
  I('Cables and chargers', ['wire', 'cable', 'earphones', 'adapter'], 'ewaste', false, true, 'Bundle and place in the e-waste bin.'),
  I('Sanitary napkin', ['pad', 'napkin', 'sanitary pad'], 'sanitary', false, false, 'Wrap securely and hand over separately.', { mistakes: 'Never flush.' }),
  I('Diaper', ['diapers', 'nappy'], 'sanitary', false, false, 'Wrap securely and hand over separately.'),
  I('Old mattress', ['furniture', 'sofa', 'bulky'], 'special', false, false, 'Request a Bulk / Garden pickup in SWACHHSETU.'),
  I('Garden waste', ['leaves', 'branches', 'grass', 'garden'], 'special', true, false, 'Request a Bulk / Garden pickup or compost small quantities.', { composting: 'Dry leaves make great compost "browns".' }),
];

const A = (kind, slug, order, title, body, o = {}) => ({ kind, slug, order, title, body, ...o });
const awareness = [
  A('section', 'why-clean', 1, 'Why cleanliness matters', 'Uncollected and mixed waste blocks drains, spreads disease and pollutes soil and water. A clean neighbourhood is healthier, safer and better to live in - and it starts with what happens at home.', { image: W + 'separation-guide-poster.webp' }),
  A('section', 'segregation', 2, 'Segregate at source', 'Keep wet, dry and hazardous waste apart from the moment it is created. Segregated waste is easier to compost and recycle and keeps collectors safe. Green for wet, blue for dry, red for hazardous and a separate route for e-waste - local bodies may vary slightly.', { image: W + 'separation-guide-poster.webp', objective: 'Two bins at home is enough to start.' }),
  A('section', 'composting', 3, 'Composting basics', 'Wet waste such as peels, tea leaves and garden leaves can become compost. Layer wet "greens" with dry "browns", keep it moist, and turn it regularly.', { image: W + 'wet-waste-bin.webp' }),
  A('section', 'recycling', 4, 'Recycling the right way', 'Only clean and dry recyclables are useful. Rinse containers, flatten boxes and keep paper dry so it does not become rubbish.', { image: W + 'dry-waste-bin.webp' }),
  A('section', 'hazardous', 5, 'Handling hazardous waste', 'Medicines, batteries, paints, bulbs and aerosols can harm people and the environment. Keep them separate, sealed, and hand them over at designated points.', { image: W + 'hazardous-bin.webp' }),
  A('section', 'ewaste', 6, 'Responsible e-waste', 'Old electronics contain useful materials and harmful substances. Give them to authorised collectors and erase personal data first.', { image: W + 'ewaste-bin.webp' }),
  A('section', '3rs', 7, 'The 3Rs: Reduce, Reuse, Recycle', 'Reduce: buy and use less. Reuse: repair, refill and repurpose. Recycle: the last step, for what cannot be avoided or reused.'),
  A('tip', 'citizen-actions', 8, 'What citizens can do', 'Segregate at source, carry a cloth bag, compost kitchen waste, hand e-waste to authorised collectors, and report overflowing bins or dumping through SWACHHSETU.'),
  A('rule', 'rule-swm', 10, 'Solid Waste Management Rules, 2016', 'These rules require waste generators to segregate waste at source into biodegradable, non-biodegradable and domestic hazardous categories and hand it over to authorised collectors.', { sourceName: 'Ministry of Environment, Forest and Climate Change', sourceUrl: 'https://moef.gov.in' }),
  A('rule', 'rule-ewaste', 11, 'E-Waste (Management) Rules, 2022', 'A framework based on extended producer responsibility for the environmentally sound management of electronic waste, in force from 1 April 2023.', { sourceName: 'MoEFCC / CPCB', sourceUrl: 'https://cpcb.nic.in' }),
  A('rule', 'rule-plastic', 10, 'Single-use plastic ban', 'From 1 July 2022 India banned the manufacture, sale and use of identified single-use plastic items under the Plastic Waste Management framework.', { sourceName: 'MoEFCC', sourceUrl: 'https://moef.gov.in' }),
  A('fact', 'fact-sbm', 20, 'Swachh Bharat Mission', 'Launched on 2 October 2014, the national mission aims at a cleaner India through sanitation and solid waste management.', { sourceName: 'Swachh Bharat Mission', sourceUrl: 'https://swachhbharat.mygov.in' }),
  A('fact', 'fact-sbmu2', 21, 'SBM-Urban 2.0', 'Launched on 1 October 2021 with a vision of "Garbage Free Cities", including source segregation and scientific waste processing.', { sourceName: 'MoHUA - SBM-Urban', sourceUrl: 'https://sbmurban.org' }),
  A('fact', 'fact-survekshan', 22, 'Swachh Survekshan', 'An annual cleanliness survey of cities run under SBM-Urban to encourage healthy competition among cities.', { sourceName: 'MoHUA', sourceUrl: 'https://sbmurban.org' }),
  A('campaign', 'camp-sbm', 30, 'Swachh Bharat Mission', 'A nationwide movement for sanitation and cleanliness.', { objective: 'Clean villages and cities through citizen participation.', image: W + 'separation-guide-poster.webp', sourceName: 'swachhbharat.mygov.in', sourceUrl: 'https://swachhbharat.mygov.in' }),
  A('campaign', 'camp-sbmu2', 31, 'SBM-Urban 2.0', 'Focus on garbage-free cities and source segregation.', { objective: 'Segregate at source, process waste scientifically, reduce landfill.', image: W + 'dry-waste-bin.webp', sourceName: 'sbmurban.org', sourceUrl: 'https://sbmurban.org' }),
  A('campaign', 'camp-plastic', 32, 'Plastic-Free India', 'Phasing out identified single-use plastics and promoting reuse.', { objective: 'Reduce plastic pollution.', image: W + 'hazardous-bin.webp', sourceName: 'moef.gov.in', sourceUrl: 'https://moef.gov.in' }),
  A('campaign', 'camp-ewaste', 33, 'Responsible E-Waste', 'Producer-responsibility based recycling of electronics.', { objective: 'Safe recovery of materials from e-waste.', image: W + 'ewaste-bin.webp', sourceName: 'cpcb.nic.in', sourceUrl: 'https://cpcb.nic.in' }),
];

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await Promise.all(Object.values(M).map((m) => m.deleteMany({})));
  await M.WasteCategory.insertMany(categories); await M.WasteItem.insertMany(items); await M.Awareness.insertMany(awareness);
  const areas = ['Civil Lines', 'Swaroop Nagar', 'Kakadeo', 'Kidwai Nagar', 'Govind Nagar', 'Arya Nagar'];
  await M.ServiceArea.create({ state: 'Uttar Pradesh', city: 'Kanpur', areas, center: { lat: 26.4499, lng: 80.3319 } });

  const pw = await bcrypt.hash('Demo@123', 10);
  const mk = (name, email, role, score = 0, extra = {}) => ({ name, email, phone: '9' + Math.floor(100000000 + Math.random() * 899999999), password: pw, role, swachhScore: score, city: 'Kanpur', state: 'Uttar Pradesh', ...extra });
  const [admin, c1, c2, ...cit] = await M.User.insertMany([
    mk('Admin Kanpur', 'admin@swachhsetu.test', 'admin'),
    mk('Ramesh Yadav', 'collector1@swachhsetu.test', 'collector', 320, { serviceArea: 'Civil Lines' }),
    mk('Sunita Devi', 'collector2@swachhsetu.test', 'collector', 180, { serviceArea: 'Kakadeo' }),
    mk('Ankit Sharma', 'citizen@swachhsetu.test', 'citizen', 265, { alias: 'Ankit S.' }),
    mk('Priya Verma', 'priya@swachhsetu.test', 'citizen', 1120),
    mk('Rahul Gupta', 'rahul@swachhsetu.test', 'citizen', 540),
    mk('Neha Singh', 'neha@swachhsetu.test', 'citizen', 95),
    mk('Vikas Mishra', 'vikas@swachhsetu.test', 'citizen', 780),
    mk('Anita Tiwari', 'anita@swachhsetu.test', 'citizen', 410),
  ]);
  const demo = cit[0];
  const geo = { 'Civil Lines': [26.4730, 80.3450], 'Swaroop Nagar': [26.4750, 80.3380], Kakadeo: [26.4640, 80.3050], 'Kidwai Nagar': [26.4290, 80.3370], 'Govind Nagar': [26.4420, 80.3160] };
  const R = (u, type, loc, desc, status, ver, extra = {}) => ({ complaintId: 'SWC-2026-' + Math.floor(1000 + Math.random() * 9000), user: u._id, type, loc, desc, status, verification: ver, city: 'Kanpur', coords: { lat: geo[loc][0], lng: geo[loc][1] }, priority: 'MEDIUM', ...extra });
  await M.Report.insertMany([
    R(demo, 'Overflowing Bin', 'Civil Lines', 'Bin near the market gate has been overflowing for two days.', 'In Progress', 'verified', { adminRemark: 'Collection team assigned.', priority: 'HIGH' }),
    R(demo, 'Garbage on Road', 'Kakadeo', 'Garbage scattered on the roadside near the park.', 'Resolved', 'verified'),
    R(demo, 'Missed Collection', 'Swaroop Nagar', 'Collection skipped yesterday.', 'Pending', 'pending'),
    R(cit[1], 'Illegal Dumping', 'Kidwai Nagar', 'Construction debris dumped on an empty plot.', 'Under Review', 'needs_review', { priority: 'HIGH' }),
    R(cit[2], 'Overflowing Bin', 'Govind Nagar', 'Community bin overflowing.', 'Pending', 'pending', { priority: 'HIGH' }),
  ]);
  const today = new Date().toISOString().slice(0, 10);
  const P = (u, col, type, addr, status, hist, extra = {}) => ({ requestId: 'SWC-PU-2026-' + Math.floor(1000 + Math.random() * 9000), user: u._id, collector: col?._id, wasteType: type, date: today, slot: 'Morning (8 AM – 12 PM)', address: addr, phone: u.phone, city: 'Kanpur', status, history: hist.map((s) => ({ status: s })), coords: { lat: 26.4670, lng: 80.3420 }, ...extra });
  await M.Pickup.insertMany([
    P(demo, c1, 'Dry Waste', 'Civil Lines, House 12', 'On Route', ['Pending', 'Assigned', 'Accepted', 'On Route'], { collectorLocation: { lat: 26.4600, lng: 80.3330, updatedAt: new Date(), isDemo: true } }),
    P(demo, c1, 'E-Waste', 'Civil Lines, House 12', 'Completed', ['Pending', 'Assigned', 'Accepted', 'On Route', 'Completed'], { rating: 5 }),
    P(cit[1], c2, 'Wet Waste', 'Kakadeo, Lane 3', 'Assigned', ['Pending', 'Assigned'], { coords: { lat: 26.4640, lng: 80.3050 } }),
    P(cit[2], null, 'Hazardous Waste', 'Govind Nagar', 'Pending', ['Pending'], { coords: { lat: 26.4420, lng: 80.3160 } }),
  ]);
  // Demo verified penalty for Neha -> private notification + awareness popup
  const neha = cit[3];
  await M.ScoreEvent.insertMany([{ user: demo._id, points: 20, reason: 'Pickup completed', kind: 'pickup' }, { user: demo._id, points: 15, reason: 'Report verified', kind: 'report' }, { user: neha._id, points: -10, reason: 'Mixed waste was reported and verified.', kind: 'penalty', topic: 'segregation' }]);
  await M.Notification.insertMany([
    { user: demo._id, type: 'score', title: '+20 SwachhScore', message: 'Pickup completed' },
    { user: neha._id, type: 'penalty', title: 'A quick reminder', message: 'Your SwachhScore changed by -10 after a verified review. Mixed waste was reported and verified.', awarenessSlug: 'segregation' },
  ]);
  console.log('🌱 Seeded. Title check:', titleFor(1120).title, '\nLogins (password Demo@123): admin@ / collector1@ / citizen@ swachhsetu.test');
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
