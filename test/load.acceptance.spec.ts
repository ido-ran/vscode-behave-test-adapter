import load from '../src/load';


const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;


describe('loadTestSuite()', function () {
    context('given a workspace', () => {
        it('should load test suite', () => {
            return expect(load('test'))
                .to.eventually.deep.equal(
                    {
                        type: 'suite',
                        id: 'root',
                        label: 'behave',
                        children: [
                            {
                                type: 'suite' as const,
                                id: 'fake feature',
                                label: 'Feature: fake feature',
                                children: [
                                    {
                                        type: 'test',
                                        id: 'fake feature:success',
                                        label: 'Scenario: success'
                                    },
                                    {
                                        type: 'test',
                                        id: 'fake feature:fail',
                                        label: 'Scenario: fail'
                                    },
                                ]
                            }
                        ]
                    }
                )
            }
        );
    })
});