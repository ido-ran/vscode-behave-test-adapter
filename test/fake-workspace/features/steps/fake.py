from behave import given, when, then


@given('good scenario')
def given_good_scenario(context):
    context.ok = True


@given('bad scenario')
def given_bad_scenario(context):
    context.ok = False


@when('explorer test this')
def when_explorer_run_this(context):
    pass


@then('the task should success')
def then_the_task_should_success(context):
    assert context.ok


@then('the task should fail')
def then_the_task_should_fail(context):
    assert context.ok
