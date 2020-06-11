Feature: fake feature

   Scenario: successful scenario
      Given a good scenario
      When explorer test this
      Then the task should success

   Scenario: failing scenario
      Given a bad scenario
      When explorer test this
      Then the task should fail

   Scenario Outline: successful scenario outline
      Given a good scenario outline
      When explorer test <name>
      Then the task should success

      Examples: Cache Format
        | name  |
        | this  |

