import { TestSuiteInfo, TestInfo, TestRunStartedEvent, TestRunFinishedEvent,
    TestSuiteEvent, TestEvent, TestLoadStartedEvent, TestLoadFinishedEvent
} from "vscode-test-adapter-api";


type Option<T> = T | undefined;

type AllTest = TestSuiteInfo | TestInfo;

type TestRunEvents = TestRunStartedEvent | TestRunFinishedEvent;

type TestEvents = TestSuiteEvent | TestEvent;

type TestEventsAfterLoad = TestRunEvents | TestEvents;

type TestLoadEvents = TestLoadStartedEvent | TestLoadFinishedEvent;


export { Option, AllTest, TestEventsAfterLoad, TestLoadEvents };