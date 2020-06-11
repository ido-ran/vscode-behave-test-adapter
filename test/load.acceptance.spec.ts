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
                                label: 'F: fake feature',
                                children: [
                                    {
                                        type: 'test',
                                        id: 'fake feature:successful scenario',
                                        label: 'S: successful scenario'
                                    },
                                    {
                                        type: 'test',
                                        id: 'fake feature:failing scenario',
                                        label: 'S: failing scenario'
                                    },
                                    {
                                        type: 'test',
                                        id: 'fake feature:successful scenario outline',
                                        label: 'SO: successful scenario outline'
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