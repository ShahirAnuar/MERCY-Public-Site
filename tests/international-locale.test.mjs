import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  internationalLocaleModel,
  internationalLocaleOptions,
  initialiseInternationalCountry
} from '../guide/international/locale.mjs';

test('country options advertise only available translations', () => {
  for (const country of ['MY', 'BN', 'SG']) {
    assert.deepEqual(internationalLocaleModel(country).languages, ['en', 'ms']);
  }
  for (const country of ['SA', 'ae', 'DZ', 'TD', 'PS', 'DJ']) {
    assert.deepEqual(internationalLocaleModel(country).languages, ['en', 'ar']);
  }
  for (const country of ['US', 'GB', 'CA', 'JP', 'IN', 'FR', 'global', 'ZZ', null]) {
    assert.deepEqual(internationalLocaleModel(country).languages, ['en']);
    assert.equal(internationalLocaleModel(country).secondaryLanguage, null);
  }
  assert.deepEqual(internationalLocaleModel('AE', ['en', 'ms']).languages, ['en']);
  assert.equal(internationalLocaleModel(' MY ').labels.ms, 'Bahasa Melayu');
});

test('country selector contains 250 regions and one global choice', () => {
  const options = internationalLocaleOptions('MY');
  assert.equal([...options.matchAll(/<option /g)].length, 251);
  assert.equal([...options.matchAll(/ selected>/g)].length, 1);
  assert.match(options, /^<option value="global">Global \/ other<\/option>/);
  assert.match(options, /<option value="MY" selected>Malaysia<\/option>/);
  assert.match(internationalLocaleOptions('<script>'), /^<option value="global" selected>/);
});

function browser(t, { query = '', countries = ['en-SG'], stored, privateMode = false } = {}) {
  const key = 'mercyInternationalCountry';
  const originals = new Map(['navigator', 'localStorage', 'location', 'history'].map(
    name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]
  ));
  const location = { href: 'https://mercyseries.com/guide/international/' + query };
  const state = { reader: 17 };
  const events = [];
  const callbacks = [];
  const store = new Map(stored === undefined ? [] : [[key, stored]]);
  const globals = {
    navigator: { languages: countries },
    localStorage: {
      getItem(name) {
        if (privateMode) throw Error('Disabled');
        return store.get(name);
      },
      setItem(name, value) {
        if (privateMode) throw Error('Disabled');
        store.set(name, value);
      }
    },
    location,
    history: {
      state,
      replaceState(previous, title, url) {
        assert.equal(previous, state);
        location.href = url.href;
        events.push(url.href);
      }
    }
  };
  for (const [name, value] of Object.entries(globals)) {
    Object.defineProperty(globalThis, name, { configurable: true, value });
  }
  t.after(() => {
    for (const [name, original] of originals) {
      if (original) Object.defineProperty(globalThis, name, original);
      else delete globalThis[name];
    }
  });

  let change;
  const select = {
    addEventListener(name, listener) {
      assert.equal(name, 'change');
      change = listener;
    }
  };
  const model = initialiseInternationalCountry(select, { onChange: current => callbacks.push(current) });
  return {
    select, callbacks, model, events,
    stored: () => store.get(key),
    choose(country) {
      select.value = country;
      change();
    }
  };
}

test('browser locale can suggest a country and a manual selection updates without navigating', t => {
  const app = browser(t, { query: '?thread=5#read', countries: ['invalid_tag', 'ar', 'zh-Hant-SG'] });
  assert.deepEqual(app.model.languages, ['en', 'ms']);
  assert.equal(app.select.value, 'SG');
  app.choose('JO');
  assert.deepEqual(app.callbacks.at(-1).languages, ['en', 'ar']);
  assert.equal(app.events[0], 'https://mercyseries.com/guide/international/?thread=5&country=JO#read');
  assert.equal(app.stored(), 'JO');
  app.choose('global');
  assert.equal(app.stored(), 'global');
  assert.deepEqual(app.callbacks.at(-1).languages, ['en']);
});

test('a valid explicit country takes precedence and a global preference survives locale inference', async t => {
  await t.test('explicit query', tt => {
    const app = browser(tt, { query: '?country=AE', stored: 'MY', countries: ['en-US'] });
    assert.equal(app.model.country, 'AE');
    assert.equal(app.stored(), 'AE');
  });
  await t.test('stored global', tt => {
    assert.equal(browser(tt, { stored: 'global' }).model.country, 'global');
  });
  await t.test('blocked storage', tt => {
    const app = browser(tt, { privateMode: true, countries: ['ar-JO'] });
    assert.equal(app.model.country, 'JO');
    app.choose('MY');
    assert.equal(app.callbacks.at(-1).country, 'MY');
  });
});
