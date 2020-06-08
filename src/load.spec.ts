import { TestSuiteInfo } from 'vscode-test-adapter-api';

import * as load from './load';


const expect = require('chai').expect;


describe('grepFeature()', () => {
    var runs = [
        {in: 'Feature: feature A', out: 'feature A'},
        {in: 'Feature:feature A', out: 'feature A'},
        {in: '  Feature:  feature A  ', out: 'feature A'},
        {in: 'Featur: feature A ', out: undefined},
    ];
    runs.forEach(function (run) {
        context('when input is ' + run.in, () =>
            it('should grep ' + run.out, () =>
                expect(load.grepFeature(run.in)).to.equal(run.out)
            )
        )
    });
});

describe('grepScenario()', () => {
    var runs = [
        {in: '  Scenario: scenario A', out: 'scenario A'},
        {in: 'Scenario:scenario A', out: 'scenario A'},
        {in: '  Scenario:  scenario A  ', out: 'scenario A'},
        {in: 'Scena: scenario A ', out: undefined},
    ];
    runs.forEach(run => {
        context('when input is ' + run.in, () => {
            it('should grep ' + run.out, () =>
                expect(load.grepScenario(run.in)).to.equal(run.out)
            );
        })
    });
});

describe('grepTestSuite()', () => {
    context('given text without feature', () => {
        it('should return undefined', () => {
            const text = `
                InvalidFeature A
                    blah blah
            `;
            expect(load.grepTestSuite(text)).to.equal(undefined)
        })
    })
});


describe('testSuiteFrom()', () => {
    it('should return TestSuiteInfo from a feature paragraph', () => {
        const text =
        `Feature: feature A
        explanations ...

        Scenario: scenario A
            Given blah
            When blah
            Then blah

        Scenario: scenario B
            Given blah
            When blah
            Then blah
        `;

        const expected: TestSuiteInfo = {
            type: 'suite' as const,
            id: 'feature A',
            label: 'Feature: feature A',
            children: [
                {
                    type: 'test',
                    id: 'feature A:scenario A',
                    label: 'Scenario: scenario A'
                },
                {
                    type: 'test',
                    id: 'feature A:scenario B',
                    label: 'Scenario: scenario B'
                }
            ]
        };

        expect(load.grepTestSuite(text)).to.deep.equal(expected)
    })
});


describe('filter()', () => {
    it('should filter undefined from arr', () =>
        expect(load.filter([1, undefined, 2])).to.deep.equal([1, 2])
    )
});