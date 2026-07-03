const { writeFileSync } = require('node:fs');
const { join } = require('node:path');

writeFileSync(
  join(__dirname, '..', 'dist', 'cjs', 'package.json'),
  `${JSON.stringify({ type: 'commonjs' }, null, 2)}\n`,
);
