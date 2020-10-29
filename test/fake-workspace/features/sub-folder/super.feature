Feature: super feature

   Scenario: successful super scenario
      Given a good scenario
      When explorer test this
      Then the task should success

   Scenario: failing super scenario
      Given a bad scenario
      When explorer test this
      Then the task should fail

   Scenario Outline: successful super scenario outline
      Given a good scenario outline
      When explorer test <name>
      Then the task should success

      Examples: Cache Format
        | name  |
        | this  |

