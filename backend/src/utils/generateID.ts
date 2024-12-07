import { createHash } from 'crypto';

export const generateID = (packageName: string, packageVersion: string) => {
  return createHash('sha256').update(packageName.toLowerCase() + packageVersion).digest('hex');
};
