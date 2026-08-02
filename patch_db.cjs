const fs = require('fs');
let content = fs.readFileSync('src/lib/db.js', 'utf-8');

const target = `      try {
        const snap = await getDocs(collection(db, 'tenants'))
        let items = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        if (items.length === 0) {
          const mockTenants = [
            { id: 't-ocean', name: 'Ocean Beach Club', plan: 'pro', status: 'active', users: 12, modules: ['flow', 'menu'], joined: '2025-01-15' },
            { id: 't-marina', name: 'Marina Group', plan: 'enterprise', status: 'active', users: 45, modules: ['flow', 'menu', 'board', 'host'], joined: '2024-11-02' },
            { id: 't-cafe', name: 'Café Vienna', plan: 'starter', status: 'trial', users: 3, modules: ['flow'], joined: '2025-03-20' },
            { id: 't-alpine', name: 'Alpine Resort Hotel', plan: 'enterprise', status: 'active', users: 85, modules: ['flow', 'menu', 'board', 'host', 'link'], joined: '2024-05-12' },
            { id: 't-burger', name: 'Urban Burger Co', plan: 'pro', status: 'trial', users: 8, modules: ['menu'], joined: '2025-04-01' }
          ]
          for (const t of mockTenants) {
            await setDoc(doc(db, 'tenants', t.id), t).catch(() => {});
          }
          items = mockTenants;
        }
        return items
      } catch (e) {
        console.warn('Firestore tenants query notice:', e)
        return []
      }`;

const replacement = `      const mockTenants = [
        { id: 't-ocean', name: 'Ocean Beach Club', plan: 'pro', status: 'active', users: 12, modules: ['flow', 'menu'], joined: '2025-01-15' },
        { id: 't-marina', name: 'Marina Group', plan: 'enterprise', status: 'active', users: 45, modules: ['flow', 'menu', 'board', 'host'], joined: '2024-11-02' },
        { id: 't-cafe', name: 'Café Vienna', plan: 'starter', status: 'trial', users: 3, modules: ['flow'], joined: '2025-03-20' },
        { id: 't-alpine', name: 'Alpine Resort Hotel', plan: 'enterprise', status: 'active', users: 85, modules: ['flow', 'menu', 'board', 'host', 'link'], joined: '2024-05-12' },
        { id: 't-burger', name: 'Urban Burger Co', plan: 'pro', status: 'trial', users: 8, modules: ['menu'], joined: '2025-04-01' }
      ];
      try {
        const snap = await getDocs(collection(db, 'tenants'))
        let items = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        if (items.length === 0) {
          for (const t of mockTenants) {
            await setDoc(doc(db, 'tenants', t.id), t).catch(() => {});
          }
          items = mockTenants;
        }
        return items
      } catch (e) {
        console.warn('Firestore tenants query notice, falling back to mock:', e)
        return mockTenants
      }`;

content = content.replace(target, replacement);
fs.writeFileSync('src/lib/db.js', content);
