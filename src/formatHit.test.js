/* eslint-env jest, jasmine */

jest.unmock('./formatHit.js');
import formatHit from './formatHit.js';
import findCountryCode from './findCountryCode.js';
import findType from './findType.js';

jest.mock('./findCountryCode.js', () => jest.fn(() => 'countryCode'));
jest.mock('./findType.js', () => jest.fn(() => 'type'));

describe('formatHit', () => {
  beforeEach(() => findCountryCode.mockClear());
  beforeEach(() => findType.mockClear());

  const testCases = [
    getTestCase({name: 'simple'}),
    getTestCase({
      name: 'no administrative',
      hit: {administrative: undefined},
      expected: {administrative: undefined}
    }),
    getTestCase({
      name: 'administrative[0] === locale_names[0]',
      hit: {administrative: ['Île-de-France'], locale_names: ['Île-de-France']},
      expected: {administrative: undefined, name: 'Île-de-France'}
    }),
    getTestCase({
      name: 'no city',
      hit: {city: undefined},
      expected: {city: undefined}
    }),
    getTestCase({
      name: 'city[0] === locale_names[0]',
      hit: {city: ['Paris'], locale_names: ['Paris']},
      expected: {city: undefined, name: 'Paris'}
    })
  ];

  testCases.forEach(
    testCase => it(`${testCase.name} test case`, () => {
      const output = formatHit(testCase.input);

      // check properties
      Object.keys(testCase.expected).forEach(key =>
        expect(output[key]).toEqual(testCase.expected[key])
      );

      // hit is passed through
      expect(output.hit).toEqual(testCase.expected.hit);

      // check fn calls
      expect(output.countryCode).toEqual('countryCode');
      expect(findCountryCode).toBeCalledWith(['tags']);

      expect(output.type).toEqual('type');
      expect(findType).toBeCalledWith(['tags']);

      expect(output.value).toEqual('value');
      expect(testCase.input.formatInputValue).toBeCalledWith({
        name: output.name,
        administrative: output.administrative,
        city: output.city,
        country: output.country,
        countryCode: output.countryCode,
        type: output.type,
        latlng: output.latlng,
        postcode: output.postcode
      });

      expect(output.rawAnswer).toEqual('rawAnswer');
      expect(output.query).toEqual('query');
      expect(output.hitIndex).toEqual(0);
    })
  );

  it('returns a default object when unable to parse it', () => {
    const consoleError = console.error;  // eslint-disable-line no-console
    console.error = jest.fn(); // eslint-disable-line no-console
    const output = formatHit({bad: 'data'});
    const expected = {value: 'Could not parse object'};
    expect(output).toEqual(expected);
    expect(console.error).toBeCalled(); // eslint-disable-line no-console
    console.error = consoleError; // eslint-disable-line no-console
  });
});

function getTestCase({
  name,
  hit: userHit,
  expected: userExpected
}) {
  const defaultHit = {
    locale_names: ['rue de rivoli'],
    country: 'France',
    administrative: ['Île-de-France'],
    city: ['Paris'],
    _geoloc: {
      lat: '123',
      lng: '456'
    },
    postcode: ['75004'],
    _tags: ['tags']
  };

  const defaultExpected = {
    name: 'rue de rivoli',
    administrative: 'Île-de-France',
    city: 'Paris',
    country: 'France',
    latlng: {
      lat: '123',
      lng: '456'
    },
    postcode: '75004',
    hitIndex: 0,
    query: 'query',
    rawAnswer: 'rawAnswer'
  };

  const hit = {
    ...defaultHit,
    ...userHit
  };

  const expected = {
    ...defaultExpected,
    ...userExpected,
    hit
  };

  return {
    name,
    input: {
      formatInputValue: jest.fn(() => 'value'),
      hit,
      hitIndex: 0,
      query: 'query',
      rawAnswer: 'rawAnswer'
    },
    expected
  };
}
