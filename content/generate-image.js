#!/usr/bin/env node

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
function getArg(name) {
  const idx = args.indexOf('--' + name);
  return idx !== -1 ? args[idx + 1] : '';
}

const type = getArg('type');
const title = getArg('title');
const subtitle = getArg('subtitle');
const body = getArg('body');
const output = getArg('output') || path.join(__dirname, 'images', Date.now() + '.png');

if (!type || !title) {
  console.error('Usage: generate-image.js --type <type> --title "..." [--subtitle "..."] [--body "..."] [--output path.png]');
  process.exit(1);
}

let templatePath = path.join(__dirname, 'templates', type + '-card.html');
if (!fs.existsSync(templatePath)) {
  templatePath = path.join(__dirname, 'templates', type + '.html');
}
if (!fs.existsSync(templatePath)) {
  console.error('Template not found for type: ' + type);
  process.exit(1);
}

(async () => {
  let html = fs.readFileSync(templatePath, 'utf8');
  html = html.replace(/\{\{TITLE\}\}/g, title);
  html = html.replace(/\{\{SUBTITLE\}\}/g, subtitle || '');
  html = html.replace(/\{\{BODY\}\}/g, body || '');

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 675 });
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.screenshot({ path: output, type: 'png' });
  await browser.close();

  console.log(output);
})();
