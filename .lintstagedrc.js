module.exports = {
  '*.{js,ts}': ['eslint --cache --fix'],
  '*.ts': ['tsc --noEmit', 'eslint --cache --fix'],
  '*.{js,ts,json}': ['prettier --write'],
};
