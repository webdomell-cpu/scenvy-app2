import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDocs, collection } from 'firebase/firestore';

const firebaseConfig = require('./firebase-applet-config.json');
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seed() {
  const tenantsSnap = await getDocs(collection(db, 'tenants'));
  if (tenantsSnap.empty) {
    console.log('Seeding tenants...');
    const tenants = [
      { id: 't-ocean', name: 'Ocean Beach Club', plan: 'pro', status: 'active', users: 12, modules: ['flow', 'menu'] },
      { id: 't-marina', name: 'Marina Group', plan: 'enterprise', status: 'active', users: 45, modules: ['flow', 'menu', 'board', 'host'] },
      { id: 't-cafe', name: 'Café Vienna', plan: 'starter', status: 'trial', users: 3, modules: ['flow'] }
    ];
    for (const t of tenants) {
      await setDoc(doc(db, 'tenants', t.id), t);
    }
    console.log('Done seeding tenants.');
  } else {
    console.log('Tenants already exist.');
  }
  
  process.exit(0);
}
seed().catch(console.error);
