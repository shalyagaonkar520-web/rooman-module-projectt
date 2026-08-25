const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

async function zipDirectory(sourceDir, outPath) {
  const zip = new JSZip();

  function addFilesRecursively(currentDir, relativePath) {
    const files = fs.readdirSync(currentDir);
    for (const file of files) {
      const fullPath = path.join(currentDir, file);
      const relPath = relativePath ? path.join(relativePath, file) : file;
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        addFilesRecursively(fullPath, relPath);
      } else {
        const content = fs.readFileSync(fullPath);
        zip.file(relPath.replace(/\\/g, '/'), content);
      }
    }
  }

  addFilesRecursively(sourceDir, '');
  const buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, buffer);
  console.log(`Zipped ${sourceDir} -> ${outPath}`);
}

async function main() {
  const baseDir = path.join(__dirname, '..', 'sample_modules');
  const modules = ['crm', 'books', 'inventory', 'payments', 'auth'];

  for (const mod of modules) {
    const modDir = path.join(baseDir, mod);
    if (fs.existsSync(modDir)) {
      const outZip = path.join(baseDir, `${mod}.zip`);
      await zipDirectory(modDir, outZip);
    }
  }
}

main().catch(console.error);
