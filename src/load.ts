import { TestSuiteInfo, TestInfo } from "vscode-test-adapter-api";
import { Option } from "./types";


const loadTestSuite = async (featureRoot: string): Promise<TestSuiteInfo> => {
    const fs = require("fs").promises;
    const fg = require("fast-glob");

    const featureFiles = await fg([featureRoot + "/**/*.feature"]);

    let promises = featureFiles.map( async (f: string) =>
        grepTestSuite(await fs.readFile(f, "utf-8"))
    );

    let children: Option<TestInfo>[] = await Promise.all(promises);

    return Promise.resolve<TestSuiteInfo>( {
        type: "suite",
        id: "root",
        label: "behave",
        children: filter(children)
    } )
}


const grepTestSuite = (text: string): Option<TestSuiteInfo> => {
    const feature = grepFeatureFrom(text);

    if (feature === undefined) return undefined;

    return {
        type: "suite" as const,
        id: feature,
        label: "F: " + feature,
        children: testsFrom(feature, text)
    }
}


const grepFeatureFrom = (text: string) => grepFeatureFromLines(text.split("\n"))


const grepFeatureFromLines = (lines: string[]): Option<string> => {
    for (let line of lines) {
        let feature = grepFeature(line);
        if (feature != undefined) return feature;
    }
    return undefined
}


const testsFrom = (feature: string, text: string) =>
    testsFromLines(feature, text.split("\n"))


const testsFromLines = (feature: string, lines: string[]): TestInfo[] => {

    const scenarios = filterMap<string, string>(lines, grepScenario);
    const scenariosOutlines = filterMap<string, string>(lines, grepScenarioOutline);

    const scenarioTests = scenarios.map(s => {
        return {
            type: "test" as const,
            id: `${feature}:${s}`,
            label: "S: " + s
        }
    })

    const scenarioOutlineTests = scenariosOutlines.map(s => {
        return {
            type: "test" as const,
            id: `${feature}:${s}`,
            label: "SO: " + s
        }
    })

    return scenarioTests.concat(scenarioOutlineTests)
}


function filterMap<A, B>(arr: A[], f: (x: A) => Option<B>): B[] {
    let init: B[] = [];

    return arr.reduce( (acc, it) => {
        let val = f(it);
        if (val != undefined) {
            acc.push(val);
        }
        return acc
    }, init)
}


function filter<T>(arr: Option<T>[]): T[] {
    let init: T[] = [];
    return arr.reduce( (acc, it) => {
        if (it != undefined) {
            acc.push(it);
        }
        return acc
    }, init)
}


const grepFeature = (line: string) => grepPattern(line, "Feature:")

const grepScenario = (line: string) => grepPattern(line, "Scenario:")

const grepScenarioOutline = (line: string) => grepPattern(line, "Scenario Outline:")


const grepPattern = (line: string, pattern: string): Option<string> => {
    let regex = new RegExp("\\s*" + pattern + "\\s*(.*\\w)", "g");
    let ok = regex.exec(line);
    if (ok) {
        return ok[1]
    } else {
        return undefined
    }
}


export { grepFeature, grepScenario, grepScenarioOutline, filter, grepTestSuite };
export default loadTestSuite;