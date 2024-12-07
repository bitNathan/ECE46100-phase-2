import tar from 'tar';
import fs from 'fs';
import path from 'path';
import tmp from 'tmp';
import stream, { Readable } from 'stream';
import { glob } from 'glob';

export const processPackage = async (packageBuffer: Buffer): Promise<Buffer> => {
  // Create a temporary directory
  const tmpDir = tmp.dirSync({ unsafeCleanup: true });

  try {
    // Extract the package to the temporary directory
    await extractTarball(packageBuffer, tmpDir.name);

    // Perform debloating
    await debloatPackage(tmpDir.name);

    // Repackage the directory into a tarball
    const outputBuffer = await createTarball(tmpDir.name);

    return outputBuffer;
  } finally {
    // Clean up the temporary directory
    tmpDir.removeCallback();
  }
};

const extractTarball = async (buffer: Buffer, destination: string): Promise<void> => {
  await new Promise<void>((resolve, reject) => {
    const stream = Readable.from(buffer);
    stream.pipe(tar.x({ cwd: destination, gzip: true }))
      .on('finish', resolve)
      .on('close', resolve) // In case 'finish' doesn't fire
      .on('error', reject);
  });
};

const debloatPackage = async (packagePath: string): Promise<void> => {
  // Remove unnecessary files like tests, docs, etc.
  const unnecessaryPatterns = [
    'test',
    'tests',
    'docs',
    '__tests__',
    '*.md',
    '*.markdown',
    '*.map',
    'example',
    'examples',
    '*.log',
    '.github',
    '.vscode',
    '*.ts',
  ];

  const deletePatterns = unnecessaryPatterns.map((pattern) =>
    path.join(packagePath, '**', pattern)
  );

  for (const pattern of deletePatterns) {
    const files = await glob(pattern, { nodir: false, absolute: true });
    for (const file of files) {
      fs.rmSync(file, { recursive: true, force: true });
    }
  }
};

const createTarball = async (directory: string): Promise<Buffer> => {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    tar.c(
      {
        gzip: true,
        cwd: directory,
      },
      ['.']
    )
      .on('data', (chunk) => {
        chunks.push(chunk);
      })
      .on('end', () => {
        resolve(Buffer.concat(chunks));
      })
      .on('error', reject);
  });
};
