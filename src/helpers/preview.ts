import fs from 'fs';
import os from 'os';
import path from 'path';
import { compile } from 'handlebars';
import child_process from 'child_process';

export default function preview(id: string, params: any): string {
  const tmpFile = path.join(
    fs.mkdtempSync(path.join(os.tmpdir(), 'envelop-')),
    `preview-${id}.html`
  );
  const content = compile(fs.readFileSync('./src/templates/preview.hbs', 'utf-8'))({
    ...params,
    date: new Date()
  });

  fs.writeFile(tmpFile, content, err => {
    if (err) throw err;
  });

  if (process.env.AUTO_OPEN_PREVIEW) {
    const cmd =
      process.platform == 'darwin' ? 'open' : process.platform == 'win32' ? 'start' : 'xdg-open';
    child_process.exec(`${cmd} ${tmpFile}`);
  }

  return tmpFile;
}
