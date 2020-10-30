import { TestSuiteInfo, TestInfo } from "vscode-test-adapter-api";
import { Option } from "./types";

interface LineInFile {
    text: string;
    line: number;
}

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
        id: feature.text,
        label: "F: " + feature.text,
        file: filePath,
        debuggable: true,
        children: testsFrom(filePath, feature.text, text)
    }
}

const SPLIT_LINE_REGEX = /\r\n|\r|\n/;

const grepFeatureFrom = (text: string) => grepFeatureFromLines(text.split(SPLIT_LINE_REGEX))


const grepFeatureFromLines = (lines: string[]): Option<LineInFile> => {
    for (let line = 0; line < lines.length; line++) {
        const text = lines[line];
        const feature = grepFeature(text, line);
        if (feature != undefined) {
            return {
                text: feature.text, line
            };
        };
    }

    return undefined
}


const testsFrom = (filePath: string, feature: string, text: string) =>
    testsFromLines(filePath, feature, text.split(SPLIT_LINE_REGEX))


const testsFromLines = (filePath: string, feature: string, lines: string[]): TestInfo[] => {

    const scenarios = filterMap<string, LineInFile>(lines, grepScenario);
    const scenariosOutlines = filterMap<string, LineInFile>(lines, grepScenarioOutline);

    const scenarioTests = scenarios.map((s: LineInFile) => {
        return {
            type: "test" as const,
            id: `${feature}:${s.text}`,
            label: "S: " + s.text,
            file: filePath,
            line: s.line,
        }
    })

    const scenarioOutlineTests = scenariosOutlines.map((s: LineInFile) => {
        return {
            type: "test" as const,
            id: `${feature}:${s.text}`,
            label: "SO: " + s.text,
            file: filePath,
            line: s.line,
        }
    })

    return scenarioTests.concat(scenarioOutlineTests)
}


function filterMap<A, B>(arr: A[], f: (x: A, index: number) => Option<B>): B[] {
    let init: B[] = [];

    return arr.reduce( (acc, it, index) => {
        let val = f(it, index);
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


const grepFeature = (text: string, line: number) => grepPattern(text, line, "Feature:")

const grepScenario = (text: string, line: number) => grepPattern(text, line, "Scenario:")

const grepScenarioOutline = (text: string, line: number) => grepPattern(text, line, "Scenario Outline:")


const grepPattern = (text: string, line: number, pattern: string): Option<LineInFile> => {
    let regex = new RegExp("\\s*" + pattern + "\\s*(.*\\w)", "g");
    let ok = regex.exec(text);
    if (ok) {
        return { text: ok[1], line }
    } else {
        return undefined
    }
}


export { grepFeature, grepScenario, grepScenarioOutline, filter, grepTestSuite };
export default loadTestSuite;
