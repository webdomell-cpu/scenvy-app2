const fs = require('fs');
const { DOMParser } = require('xmldom');

fs.readdirSync('public').filter(f => f.endsWith('.svg')).forEach(file => {
  const content = fs.readFileSync('public/' + file, 'utf-8');
  const parser = new DOMParser({
    errorHandler: {
      warning: () => {},
      error: e => console.error(file, 'error:', e),
      fatalError: e => console.error(file, 'fatal:', e)
    }
  });
  parser.parseFromString(content, 'text/xml');
});
console.log('done');
