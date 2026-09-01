# Versions in this recording

# The app is ag2-samples/ui -- the repo the AG2 quickstart tells you to
# clone. Nothing is upgraded: these are the versions its own committed
# package.json and pnpm-lock.yaml resolve.

## The project

tailwindcss (this project)  3.4.19   declared ^3.4.1
@copilotkit/react-core      1.67.1     declared 1.67.1
@copilotkit/react-ui        1.67.1     declared 1.67.1
@copilotkit/runtime         1.67.1     declared 1.67.1
next                        15.5.23
react                       19.0.0

## The conflict

# The project is Tailwind v3 and compiles CSS with the tailwindcss
# PostCSS plugin. But the stylesheet the Prebuilt Components page tells
# you to import is shipped pre-compiled, and it was built with Tailwind v4:

@copilotkit/react-core/dist/v2/index.css   built with tailwindcss v4.1.18

# Tailwind v4 emits `@layer properties` and `@layer base`. Tailwind v3's
# plugin sees `@layer` with no matching `@tailwind` directive and stops.
