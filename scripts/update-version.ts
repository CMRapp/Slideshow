import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Get the current version from package.json
const packageJsonPath = path.join(process.cwd(), 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
const currentVersion = packageJson.version;

// Get the number of commits since the last version tag
const commitCount = execSync('git rev-list --count HEAD').toString().trim();
let lastTag = 'v0.0.0';

try {
  lastTag = execSync('git describe --tags --abbrev=0 2>/dev/null || echo v0.0.0').toString().trim();
} catch (error) {
  console.log('No tags found, using default version');
}

// Parse the current version
const [major, minor, patch] = currentVersion.split('.').map(Number);

// Update version based on commit messages since last tag
let commitMessages = '';
try {
  commitMessages = execSync(`git log --pretty=format:"%s" HEAD...${lastTag}`).toString();
} catch (error) {
  console.log('No previous commits found, using current version');
  commitMessages = '';
}

const hasBreakingChange = commitMessages.includes('BREAKING CHANGE');
const hasFeature = commitMessages.match(/feat\(|feat:/i);

let newVersion = currentVersion;

if (hasBreakingChange) {
  // Major version bump for breaking changes
  newVersion = `${major + 1}.0.0`;
} else if (hasFeature) {
  // Minor version bump for new features
  newVersion = `${major}.${minor + 1}.0`;
} else {
  // Patch version bump for other changes
  newVersion = `${major}.${minor}.${patch + 1}`;
}

// Update package.json
packageJson.version = newVersion;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

// Create a version file for the application to use
const versionInfo = {
  version: newVersion,
  commitCount,
  lastTag,
  buildTime: new Date().toISOString()
};

fs.writeFileSync(
  path.join(process.cwd(), 'app', 'version.json'),
  JSON.stringify(versionInfo, null, 2)
);

console.log(`Version updated from ${currentVersion} to ${newVersion}`); 