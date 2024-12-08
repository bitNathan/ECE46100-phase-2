import fs from 'fs';
import path from 'path';
import tmp from 'tmp';
import stream, { Readable } from 'stream';
import { glob } from 'glob';
import AdmZip from 'adm-zip';
import { build } from 'esbuild';
import * as tar from 'tar';
import { PassThrough } from 'stream';

export const processPackage = async (packageBuffer: Buffer): Promise<Buffer> => {
  // Create a temporary directory
  const tmpDir = tmp.dirSync({ unsafeCleanup: true });
  const extractionDir = tmpDir.name;

  try {
    // Detect and extract package
    await extractPackage(packageBuffer, extractionDir);

    // Perform debloating: remove unnecessary files, run tree-shaking and minification
    await debloatPackage(extractionDir);

    // After debloating, repackage into a tarball
    const outputBuffer = await createTarball(extractionDir);

    return outputBuffer;
  } finally {
    // Clean up the temporary directory
    tmpDir.removeCallback();
  }
};

/**
 * Attempt to detect package format and extract accordingly.
 * If it's gzip/tarball, we use tar.x, else we try zip extraction.
 */
const extractPackage = async (buffer: Buffer, destination: string): Promise<void> => {
  if (isGzipTarball(buffer)) {
    // Extract tar.gz
    await new Promise<void>((resolve, reject) => {
      const s = Readable.from(buffer);
      s.pipe(tar.x({ cwd: destination, gzip: true }))
        .on('finish', resolve)
        .on('close', resolve)
        .on('error', reject);
    });
  } else {
    // Assume it's a zip
    const zip = new AdmZip(buffer);
    zip.extractAllTo(destination, true);
  }
};

/**
 * Check if a buffer appears to be a gzip tarball by magic bytes.
 */
const isGzipTarball = (buffer: Buffer): boolean => {
  // GZIP files start with 1F 8B
  return buffer.length > 2 && buffer[0] === 0x1f && buffer[1] === 0x8b;
};

const removeUnnecessaryFiles = async (packagePath: string): Promise<void> => {
  // Remove known unnecessary directories and file types
  const unnecessaryPatterns = [
    '**/test',
    '**/tests',
    '**/docs',
    '**/__tests__',
    '**/*.markdown',
    '**/*.map',
    '**/*.log',
    '**/.github',
    '**/.vscode',
    '**/example',
    '**/examples',
    '**/*.ts', // If we assume final build is JS only
    '**/*.md'  // If you want to keep README, remove this line
  ];

  for (const pattern of unnecessaryPatterns) {
    const files = await glob(pattern, { cwd: packagePath, absolute: true });
    for (const file of files) {
      fs.rmSync(file, { recursive: true, force: true });
    }
  }
};

/**
 * Try to discover an entry point. This is a simplistic approach:
 * - Check package.json for "main".
 * - If not found, guess "index.js" in the root.
 */
const findEntryPoint = async (packagePath: string): Promise<string | null> => {
  const pkgJsonPath = path.join(packagePath, 'package.json');
  let mainFile = 'index.js';

  if (!fs.existsSync(pkgJsonPath)) {
    // Check if files are extracted into a subdirectory
    const subdirs = fs.readdirSync(packagePath, { withFileTypes: true }).filter(f => f.isDirectory());
    if (subdirs.length === 1) {
      const subDirPath = path.join(packagePath, subdirs[0].name);
      const nestedPkgJsonPath = path.join(subDirPath, 'package.json');
      if (fs.existsSync(nestedPkgJsonPath)) {
        // Move package.json to root
        fs.renameSync(nestedPkgJsonPath, pkgJsonPath);

        // Update paths for other files if needed
        moveSubdirectoryFilesToRoot(subDirPath, packagePath);
      }
    }
  }

  // At this point, package.json should be in the root
  if (fs.existsSync(pkgJsonPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
      if (pkg.main && typeof pkg.main === 'string') {
        mainFile = pkg.main;
      }
    } catch (err) {
      console.warn('Error reading package.json:', err);
    }
  }

  const mainPath = path.join(packagePath, mainFile);
  if (fs.existsSync(mainPath)) {
    console.log('Entry point found at:', mainPath);
    return mainPath;
  } else {
    return null;
  }
};

/**
 * Move all files from the subdirectory to the root, excluding package.json.
 */
const moveSubdirectoryFilesToRoot = (subDirPath: string, rootPath: string): void => {
  const files = fs.readdirSync(subDirPath, { withFileTypes: true });
  for (const file of files) {
    const srcPath = path.join(subDirPath, file.name);
    const destPath = path.join(rootPath, file.name);
    if (fs.existsSync(destPath)) {
      continue;
    }
    fs.renameSync(srcPath, destPath);
  }

  // Remove the empty subdirectory
  fs.rmdirSync(subDirPath);
};


const debloatPackage = async (packagePath: string): Promise<void> => {
  // Remove unnecessary files first
  await removeUnnecessaryFiles(packagePath);

  const entryPoint = await findEntryPoint(packagePath);

  if (!entryPoint) {
    console.log('No entry point found, skipping bundling');
  } else {
    // If entry point found, proceed with esbuild
    await runEsbuildBundling(packagePath, entryPoint);

    // Clean up after bundling
    await cleanupAfterBundling(packagePath);
  }
};


/**
 * Run esbuild bundling to produce a minimized, tree-shaken output.
 * We'll output to a `dist` directory.
 */
const runEsbuildBundling = async (packagePath: string, entryPoint: string): Promise<void> => {
  const distDir = path.join(packagePath, 'dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir);
  }

  await build({
    entryPoints: [entryPoint],
    bundle: true,
    minify: true,
    treeShaking: true,
    platform: 'node',
    target: 'node14', // or desired node version
    outfile: path.join(distDir, 'index.js'),
    sourcemap: false,
  });
};

/**
 * After bundling, remove original source files, leaving only dist and any required package files.
 * Keep package.json so that the package remains installable. Remove all src directories and JS files outside of dist.
 */
const cleanupAfterBundling = async (packagePath: string): Promise<void> => {
  const distDir = path.join(packagePath, 'dist');

  // Remove all files except package.json and dist directory
  const files = await glob('**/*', { cwd: packagePath, absolute: true });
  for (const file of files) {
    if (file.startsWith(distDir)) continue; // keep dist
    if (file.endsWith('package.json')) continue; // keep package.json
    // remove all other files
    try {
      fs.rmSync(file, { recursive: true, force: true });
    } catch (err) {
      console.warn('Error removing file:', file, err);
    }
  }
};

const createTarball = async (directory: string): Promise<Buffer> => {
  return new Promise<Buffer>((resolve, reject) => {
    const pass = new PassThrough();
    const chunks: Buffer[] = [];

    pass.on('data', (chunk) => chunks.push(chunk));
    pass.on('end', () => resolve(Buffer.concat(chunks)));
    pass.on('error', reject);

    // tar.create should now be available since we imported as * as tar
    tar.create(
      { gzip: true, cwd: directory },
      ['.']
    )
    .on('error', reject)
    .pipe(pass);
  });
};
