const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, obj) {
  fs.writeFileSync(filePath, JSON.stringify(obj, null, 2) + '\n');
}

function loadEnvFile() {
  const envPath = path.join(ROOT, '.env.local');
  if (!fs.existsSync(envPath)) {
    console.warn('Warning: .env.local not found. Keystore credentials must be set manually.');
    return;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=');
      if (key && value) {
        process.env[key] = value;
      }
    }
  }
}

function getCurrentVersionCode() {
  const appJson = readJson(path.join(ROOT, 'app.json'));
  return appJson.expo.android?.versionCode || 1;
}

function bumpSemver(version, type) {
  const parts = version.split('.').map(Number);
  if (type === 'major') {
    parts[0]++;
    parts[1] = 0;
    parts[2] = 0;
  } else if (type === 'minor') {
    parts[1]++;
    parts[2] = 0;
  } else {
    parts[2]++;
  }
  return parts.join('.');
}

function updateVersionCodes(newCode, bumpType) {
  const appJsonPath = path.join(ROOT, 'app.json');
  const appJson = readJson(appJsonPath);
  
  appJson.expo.android.versionCode = newCode;
  
  const oldVersion = appJson.expo.version;
  appJson.expo.version = bumpSemver(oldVersion, bumpType);
  
  writeJson(appJsonPath, appJson);

  return { oldVersion, newVersion: appJson.expo.version };
}

function runBuild() {
  console.log('Building release bundle...');
  loadEnvFile();
  execSync('cd android && ./gradlew bundleRelease', { cwd: ROOT, stdio: 'inherit' });
}

function main() {
  const bumpType = process.argv[2] || 'patch';
  if (!['patch', 'minor', 'major'].includes(bumpType)) {
    console.error('Usage: node release.js [patch|minor|major]');
    process.exit(1);
  }

  const currentCode = getCurrentVersionCode();
  const newCode = currentCode + 1;

  console.log(`Current versionCode: ${currentCode}`);
  console.log(`New versionCode: ${newCode}`);

  const { oldVersion, newVersion } = updateVersionCodes(newCode, bumpType);
  console.log(`Version: ${oldVersion} → ${newVersion} (${bumpType})`);

  runBuild();

  const bundleDir = path.join(ROOT, 'android/app/build/outputs/bundle/release');
  execSync(`open ${bundleDir}`, { cwd: ROOT });

  console.log(`\n✅ Release bundle ready in Finder`);
}

main();
