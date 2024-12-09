import { processPackage } from '../utils/packageProcessor';
import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';
import * as tar from 'tar';

describe('processPackage', () => {
  it('should process a simple zip package, debloat it, and return a gzipped tarball', async () => {
    // Step 1: Create a mock package in memory as a zip file
    // This package includes:
    // - package.json (with "main": "index.js")
    // - index.js (an entry point)
    // - A docs folder (unnecessary content)
    // - A tests folder (unnecessary content)
    const zip = new AdmZip();
    zip.addFile('package.json', Buffer.from(JSON.stringify({ name: "test-pkg", version: "1.0.0", main: "index.js" }), 'utf-8'));
    zip.addFile('index.js', Buffer.from('console.log("hello world");', 'utf-8'));
    zip.addFile('docs/readme.md', Buffer.from('Some docs', 'utf-8'));
    zip.addFile('tests/test.js', Buffer.from('console.log("test");', 'utf-8'));

    const packageBuffer = zip.toBuffer();

    // Step 2: Run processPackage on this buffer
    const result = await processPackage(packageBuffer);

    // The result should be a Buffer containing a tar.gz file
    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBeGreaterThan(0);

    // Step 3: Extract the result tarball in a temporary directory and inspect its contents
    const tempDir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'process-package-test-'));

    // Write the result to a file so we can extract it
    const resultFile = path.join(tempDir, 'result.tgz');
    fs.writeFileSync(resultFile, result);

    // Extract the tarball
    await tar.x({ file: resultFile, cwd: tempDir, gzip: true });

    // After extraction, we expect that:
    // - dist/index.js should exist (bundled and minified)
    // - docs and tests directories should NOT exist
    // - package.json should still be there
    const distIndexPath = path.join(tempDir, 'dist', 'index.js');
    const packageJsonPath = path.join(tempDir, 'package.json');
    const docsPath = path.join(tempDir, 'docs');
    const testsPath = path.join(tempDir, 'tests');

    expect(fs.existsSync(distIndexPath)).toBe(true);
    expect(fs.existsSync(packageJsonPath)).toBe(true);
    expect(fs.existsSync(docsPath)).toBe(false);
    expect(fs.existsSync(testsPath)).toBe(false);

    // Clean up
    fs.rmSync(tempDir, { recursive: true, force: true });
  });
});
