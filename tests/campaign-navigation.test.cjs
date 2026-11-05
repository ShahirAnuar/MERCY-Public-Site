'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const script = fs.readFileSync(path.join(root, 'assets/purchase-referral-navigation.js'), 'utf8');
const sourceQuery = 'affiliate=AFF-ORIGINAL01&coupon=LESS5&ref=family&utm_campaign=local-books';
const decodeAttribute = text => text.replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#39;', "'");

// This adapter supplies the browser DOM boundary; all URL decisions run in the real asset.
function runNavigation(currentUrl, hrefs, { loadHelper = true, readyState = 'complete' } = {}) {
  const location = new URL(currentUrl);
  const listeners = new Map();
  const links = hrefs.map(raw => ({
    raw,
    getAttribute(name) { return name === 'href' ? this.raw : null; },
    get href() { return new URL(this.raw, location).href; },
    set href(value) { this.raw = value; }
  }));
  const document = {
    readyState,
    querySelectorAll(selector) {
      assert.equal(selector, 'a[href]');
      return links;
    },
    addEventListener(name, callback) { listeners.set(name, callback); }
  };
  if (loadHelper) vm.runInNewContext(script, { URL, URLSearchParams, location, document });
  return {
    links,
    click(index) {
      listeners.get('click')?.({ target: { closest: selector => {
        assert.equal(selector, 'a[href]');
        return links[index];
      } } });
      return links[index].href;
    },
    ready() { listeners.get('DOMContentLoaded')?.(); }
  };
}

function loadPage(currentUrl) {
  const url = new URL(currentUrl);
  const relative = url.pathname.endsWith('/') ? url.pathname + 'index.html' : url.pathname;
  const html = fs.readFileSync(path.join(root, relative.replace(/^\//, '')), 'utf8');
  const hrefs = [...html.matchAll(/<a\b[^>]*\bhref=["']([^"']*)["'][^>]*>/gi)]
    .map(match => decodeAttribute(match[1]));
  const externalScripts = [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)]
    .map(match => new URL(decodeAttribute(match[1]), currentUrl));
  const loadHelper = externalScripts.some(url => url.pathname === '/assets/purchase-referral-navigation.js');
  const page = runNavigation(currentUrl, hrefs, { loadHelper });
  return {
    follow(href) {
      const index = hrefs.indexOf(href);
      assert.notEqual(index, -1, 'The public page must expose the intended navigation link: ' + href);
      return page.click(index);
    }
  };
}

// Removing a guide from the allowed destinations, or its asset include, loses the sale's attribution.
test('a buyer can explore the actual campaign pages and return to buy with their referral intact', () => {
  let url = 'https://mercyseries.com/buy/?' + sourceQuery;
  url = loadPage(url).follow('/malaysia/');
  url = loadPage(url).follow('/islamic-childrens-books/');
  url = loadPage(url).follow('/affiliate-program/amazon-clickbank/');
  url = loadPage(url).follow('/affiliate-program/');
  url = loadPage(url).follow('/buy/');
  assert.equal(url, 'https://mercyseries.com/buy/?affiliate=AFF-ORIGINAL01&coupon=LESS5&ref=family&utm_campaign=local-books');
});

// The homepage and official edition page are common detours before a buyer returns to checkout.
test('visiting home and the official book page during campaign discovery keeps the sale attributed', () => {
  let url = 'https://mercyseries.com/buy/?' + sourceQuery;
  url = loadPage(url).follow('/malaysia/');
  url = loadPage(url).follow('/');
  url = loadPage(url).follow('/mercy/');
  url = loadPage(url).follow('/buy/#print-editions');
  assert.equal(url, 'https://mercyseries.com/buy/?affiliate=AFF-ORIGINAL01&coupon=LESS5&ref=family&utm_campaign=local-books#print-editions');
});

// Omitting promote support loses an affiliate after the new sharing-kit reading-guide links.
test('exploring the sharing kit before choosing a Malaysia edition keeps the referral', () => {
  let url = 'https://mercyseries.com/affiliate-program/?' + sourceQuery;
  url = loadPage(url).follow('/affiliate-program/promote/');
  url = loadPage(url).follow('/malaysia/');
  url = loadPage(url).follow('/buy/');
  assert.equal(url, 'https://mercyseries.com/buy/?affiliate=AFF-ORIGINAL01&coupon=LESS5&ref=family&utm_campaign=local-books');
});

// A trailing index.html is the same public navigation route and must not drop attribution.
test('public index.html routes retain the referral and destination fragments', () => {
  const fixture = [
    ['/index.html#story', 'https://mercyseries.com/index.html?affiliate=AFF-ORIGINAL01&coupon=LESS5&ref=family&utm_campaign=local-books#story'],
    ['/malaysia/index.html#faq', 'https://mercyseries.com/malaysia/index.html?affiliate=AFF-ORIGINAL01&coupon=LESS5&ref=family&utm_campaign=local-books#faq'],
    ['/islamic-childrens-books/index.html#faq', 'https://mercyseries.com/islamic-childrens-books/index.html?affiliate=AFF-ORIGINAL01&coupon=LESS5&ref=family&utm_campaign=local-books#faq'],
    ['/affiliate-program/amazon-clickbank/index.html#amazon-title', 'https://mercyseries.com/affiliate-program/amazon-clickbank/index.html?affiliate=AFF-ORIGINAL01&coupon=LESS5&ref=family&utm_campaign=local-books#amazon-title'],
    ['/affiliate-program/promote/index.html#find-readers', 'https://mercyseries.com/affiliate-program/promote/index.html?affiliate=AFF-ORIGINAL01&coupon=LESS5&ref=family&utm_campaign=local-books#find-readers'],
    ['/mercy/index.html#editions', 'https://mercyseries.com/mercy/index.html?affiliate=AFF-ORIGINAL01&coupon=LESS5&ref=family&utm_campaign=local-books#editions']
  ];
  const page = runNavigation('https://mercyseries.com/buy/?' + sourceQuery, fixture.map(row => row[0]), { readyState: 'loading' });
  page.ready();
  fixture.forEach((row, index) => assert.equal(page.click(index), row[1]));
});

// Copying the source coupon/ref into a different affiliate's destination misattributes a purchase.
test('a destination affiliate keeps its own attribution without borrowing another affiliate coupon', () => {
  const page = runNavigation('https://mercyseries.com/buy/?' + sourceQuery, [
    '/malaysia/?affiliate=AFF-DESTINATION02#formats',
    '/affiliate-program/amazon-clickbank/?affiliate=AFF-DESTINATION02&coupon=THEIRS&ref=their-reader#amazon-title'
  ]);
  assert.equal(page.click(0), 'https://mercyseries.com/malaysia/?affiliate=AFF-DESTINATION02&utm_campaign=local-books#formats');
  assert.equal(page.click(1), 'https://mercyseries.com/affiliate-program/amazon-clickbank/?affiliate=AFF-DESTINATION02&coupon=THEIRS&ref=their-reader&utm_campaign=local-books#amazon-title');
});

// Losing explicit destination parameters or adding a second copy changes campaign reporting.
test('explicit campaign values win and repeat clicks do not duplicate incoming parameters', () => {
  const page = runNavigation('https://mercyseries.com/malaysia/?' + sourceQuery, [
    '/buy/?utm_campaign=destination-campaign#editions'
  ]);
  const expected = 'https://mercyseries.com/buy/?utm_campaign=destination-campaign&affiliate=AFF-ORIGINAL01&coupon=LESS5&ref=family#editions';
  assert.equal(page.click(0), expected);
  assert.equal(page.click(0), expected);
});

// Widening the whitelist to external or private routes would expose irrelevant purchase parameters.
test('Amazon ClickBank payment auth and dashboard destinations stay untouched', () => {
  const hrefs = [
    'https://www.amazon.com/dp/B0HGVJ4RTN?tag=creator-20',
    'https://example.hop.clickbank.net/?tid=creator-campaign',
    'https://buy.stripe.com/example?prefilled_promo_code=THEIRS',
    'https://accounts.google.com/o/oauth2/auth?client_id=public-client',
    '/affiliate-program/dashboard/#payouts',
    '/community-access/?kind=kkm_staff#apply',
    '/guide/international/',
    '/reader/',
    '/api/affiliate/register',
    '#faq'
  ];
  const page = runNavigation('https://mercyseries.com/malaysia/?' + sourceQuery, hrefs);
  hrefs.forEach((expected, index) => {
    page.click(index);
    assert.equal(page.links[index].getAttribute('href'), expected);
  });
});

