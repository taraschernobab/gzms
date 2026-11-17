/* Деплой статического сайта GZMS.RU на Sprinthost.
   Требует SSH-ключ sprinthost_radio (по умолчанию ~/.ssh/sprinthost_radio).
   Хост и каталог можно переопределить через GZMS_DEPLOY_HOST / GZMS_DEPLOY_DIR.
*/
import { spawnSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');
const DEPLOY = path.join(ROOT, '.deploy');
const TAR = path.join(DEPLOY, 'gzms-site.tar.gz');
const HOST = process.env.GZMS_DEPLOY_HOST || 'taras@taras.xsph.ru';
const REMOTE_DIR = process.env.GZMS_DEPLOY_DIR || '~/domains/gzms.ru/public_html';
const KEY = process.env.GZMS_DEPLOY_KEY || path.join(os.homedir(), '.ssh', 'sprinthost_radio');

function run(command, args, opts = {}) {
  const res = spawnSync(command, args, { stdio: 'inherit', ...opts });
  if (res.status !== 0) throw new Error(`${command} завершился с кодом ${res.status}`);
}

const keyStat = await fs.stat(KEY).catch(() => null);
if (!keyStat?.isFile()) {
  console.error(`\nНе найден SSH-ключ: ${KEY}`);
  console.error('Задай GZMS_DEPLOY_KEY или положи ключ в ~/.ssh/sprinthost_radio.');
  process.exit(1);
}

const apk = path.join(PUBLIC, 'downloads', 'griazemes-1.4.4.apk');
const apkStat = await fs.stat(apk).catch(() => null);
if (!apkStat) {
  console.error(`\nНет APK: ${apk}`);
  console.error('Скопируй downloads/griazemes-1.4.4.apk из проекта griazemes перед деплоем.');
  process.exit(1);
}

await fs.mkdir(DEPLOY, { recursive: true });
run('tar', [
  ...(process.platform === 'win32' ? ['--force-local'] : []),
  '-czf',
  TAR,
  '-C',
  PUBLIC,
  '.',
]);
console.log(`[deploy] архив: ${TAR} (${(((await fs.stat(TAR)).size) / 1024 / 1024).toFixed(1)} МБ)`);

const sshBase = ['-i', KEY, '-o', 'BatchMode=yes', '-o', 'StrictHostKeyChecking=accept-new', '-o', 'ConnectTimeout=25'];

run('ssh', [...sshBase, HOST, `mkdir -p ${REMOTE_DIR.split('/public_html')[0]}/backup ${REMOTE_DIR}`]);
run('ssh', [
  ...sshBase,
  HOST,
  `cd ${REMOTE_DIR} && if [ -f index.php ]; then mv index.php ../backup/index.php.$(date +%Y%m%d-%H%M%S); fi; true`,
]);
run('scp', [...sshBase, TAR, `${HOST}:gzms-site.tar.gz`]);
run('ssh', [
  ...sshBase,
  HOST,
  `tar -xzf ~/gzms-site.tar.gz -C ${REMOTE_DIR} && rm -f ~/gzms-site.tar.gz && ` +
    `find ${REMOTE_DIR} -type d -exec chmod 755 {} + && find ${REMOTE_DIR} -type f -exec chmod 644 {} + && ` +
    `chmod 644 ${REMOTE_DIR}/.htaccess && echo OK`,
]);

console.log('[deploy] готово: https://gzms.ru/');
console.log(`[deploy] проверь: https://gzms.ru/, /privacy.html, /ugc.html, /downloads/griazemes-1.4.4.apk`);