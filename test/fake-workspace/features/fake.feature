Feature: fake feature

  Scenario: success
     Given good scenario
      When explorer test this
      Then the task should success

  Scenario: fail
     Given bad scenario
      When explorer test this
      Then the task should fail