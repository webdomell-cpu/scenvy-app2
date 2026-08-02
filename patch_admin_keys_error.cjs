const fs = require('fs');
let content = fs.readFileSync('src/pages/Admin.jsx', 'utf-8');

const target = `        } catch(e) { console.error('Failed to save') }
        setNewKeyValue('')
        fetchLiveKeys()`;

const replacement = `        } catch(e) { notify('❌ Error saving to database: ' + e.message); console.error(e) }
        setNewKeyValue('')
        fetchLiveKeys()`;

content = content.replace(target, replacement);
fs.writeFileSync('src/pages/Admin.jsx', content);
