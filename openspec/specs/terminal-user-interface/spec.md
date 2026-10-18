# OpenSpec Specification: Terminal User Interface

## Purpose
Provides an enhanced split-view terminal user interface for Pi.

## Requirements

### Requirement: English Interface Localization
The application SHALL render all user interface text in English.

#### Scenario: User navigates TUI
- **WHEN** user interacts with any screen in the TUI
- **THEN** all rendered text, headers, and tabs are in English.

### Requirement: Active Agent Visualization and Dynamic Switching
The active agent SHALL be visualized in the input box header and MUST be easily switchable.

#### Scenario: User cycles through installed agents
- **WHEN** user presses the agent switch key combination
- **THEN** the active agent changes and the input box title updates.

### Requirement: Project and Git Branch Display
The bottom-left border of the input box SHALL display the current project name and git branch.

#### Scenario: User views input box
- **WHEN** the input box renders
- **THEN** the bottom-left area displays project name and git branch.
