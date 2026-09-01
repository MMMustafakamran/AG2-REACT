# Versions in this recording

# The app under test is the CLI starter: `npx copilotkit@latest init -f ag2`.
# Nothing here was chosen by hand -- these are the versions the starter's own
# committed package-lock.json resolves.

## Frontend

@copilotkit/react-core  1.51.4
@copilotkit/react-ui    1.51.4
@copilotkit/runtime     1.51.4
next                    15.5.12
react                   19.2.4
tailwindcss             4.2.0

## @ag-ui/client -- three copies in one tree

# This is the whole error. `HttpAgent` is constructed from the top-level
# copy; the `AbstractAgent` that `CopilotRuntime` accepts comes from the one
# nested under @copilotkit/runtime. Different versions, different types.

@ag-ui/client                                         0.0.45
@copilotkit/react-core/@ag-ui/client                  0.0.43
@copilotkit/runtime/@ag-ui/client                     0.0.43
@copilotkitnext/agent/@ag-ui/client                   0.0.42
@copilotkitnext/core/@ag-ui/client                    0.0.42
@copilotkitnext/react/@ag-ui/client                   0.0.42
@copilotkitnext/runtime/@ag-ui/client                 0.0.42
@copilotkitnext/shared/@ag-ui/client                  0.0.42
@copilotkitnext/web-inspector/@ag-ui/client           0.0.42

## Backend

# agent-py/requirements.txt asks for `ag2[openai,ag-ui]`, unpinned.

ag2                   1.0.3   (resolved from `ag2[openai,ag-ui]`)
requires              python >=3.10
