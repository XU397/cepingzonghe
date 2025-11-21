const fs = require('fs');

// Read all page files and fix them
const pages = [
  {
    file: 'src/submodules/g8-drone-imaging/pages/Page01_Cover.tsx',
    fixes: [
      {
        search: /const countdownClass = isWarning[\s\S]*?: styles\.countdownTimer;/m,
        replace: `const countdownClass = isWarning
    ? \`\${styles.countdownTimer} \${styles.warning}\`
    : countdown === 0
      ? \`\${styles.countdownTimer} \${styles.expired}\`
      : styles.countdownTimer;`
      },
      {
        search: /<label className=\{\s*\}>/m,
        replace: '<label className={`${styles.checkboxLabel} ${isCountdownActive ? styles.disabled : \'\'}`}>'
      }
    ]
  },
  {
    file: 'src/submodules/g8-drone-imaging/pages/Page02_Background.tsx',
    fixes: [
      {
        search: /<span className=\{\s*\}>/m,
        replace: '<span className={`${styles.timerText} ${styles.timerComplete}`}>'
      },
      {
        search: /<div className=\{\s*\}>\s*<h3 className=\{styles\.infoBoxTitle\}>什么是GSD\?<\/h3>/m,
        replace: '<div className={`${styles.infoBox} ${styles.primary}`}>\n            <h3 className={styles.infoBoxTitle}>什么是GSD?</h3>'
      },
      {
        search: /<div className=\{\s*\}>\s*<h3 className=\{styles\.infoBoxTitle\}>影响GSD的因素<\/h3>/m,
        replace: '<div className={`${styles.infoBox} ${styles.secondary}`}>\n            <h3 className={styles.infoBoxTitle}>影响GSD的因素</h3>'
      }
    ]
  }
];

// Process each page
pages.forEach(page => {
  let content = fs.readFileSync(page.file, 'utf8');
  page.fixes.forEach(fix => {
    content = content.replace(fix.search, fix.replace);
  });
  fs.writeFileSync(page.file, content, 'utf8');
  console.log(`Fixed ${page.file}`);
});

console.log('All pages fixed');
