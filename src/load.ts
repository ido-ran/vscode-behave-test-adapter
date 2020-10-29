import { TestSuiteInfo, TestInfo } from "vscode-test-adapter-api";
import { Option } from "./types";

const convertToLinuxPath = function(path: string): string {
    const linuxPath = path.replace(/\\/g, '/');
    return linuxPath;
}

const loadTestSuite = async (workspaceRoot: string, featureRoot: string): Promise<TestSuiteInfo> => {
    const fs = require("fs").promises;
    const fg = require("fast-glob");
    // const path = require("path");

    const linuxFeatureRoot = convertToLinuxPath(featureRoot);
    const featuresPattern = linuxFeatureRoot + "/**/*.feature";
    const featureFiles = await fg([featuresPattern]);
    // const featureFiles = featureFullPathFiles.map((fullPath: string) => 
    //     convertToLinuxPath(path.relative(workspaceRoot, fullPath)));

    let promises = featureFiles.map( async (f: string) =>
        grepTestSuite(f, await fs.readFile(f, "utf-8"))
    );

    let children: Option<TestInfo>[] = await Promise.all(promises);

    return Promise.resolve<TestSuiteInfo>( {
        type: "suite",
        id: "root",
        label: "behave",
        children: filter(children)
    } )
}


const grepTestSuite = (filePath: string, text: string): Option<TestSuiteInfo> => {
    const feature = grepFeatureFrom(text);

    if (feature === undefined) return undefined;

    return {
        type: "suite" as const,
        id: feature,
        label: "F: " + feature,
        file: filePath,
        debuggable: true,
        children: testsFrom(filePath, feature, text)
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


const testsFrom = (filePath: string, feature: string, text: string) =>
    testsFromLines(filePath, feature, text.split("\n"))


const testsFromLines = (filePath: string, feature: string, lines: string[]): TestInfo[] => {

    const scenarios = filterMap<string, string>(lines, grepScenario);
    const scenariosOutlines = filterMap<string, string>(lines, grepScenarioOutline);

    const scenarioTests = scenarios.map(s => {
        return {
            type: "test" as const,
            id: `${feature}:${s}`,
            label: "S: " + s,
            file: filePath,
            debuggable: true,
        }
    })

    const scenarioOutlineTests = scenariosOutlines.map(s => {
        return {
            type: "test" as const,
            id: `${feature}:${s}`,
            label: "SO: " + s,
            file: filePath,
            debuggable: true,
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
