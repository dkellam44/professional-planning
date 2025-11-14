# Claude Code Capabilities

Claude Code provides extensive extensibility and customization capabilities through several mechanisms, enabling you to automate workflows, extend functionality, and share configurations across teams.

## Skills

**What they are**: Skills are modular, autonomous capabilities that extend Claude's functionality. Each skill consists of a `SKILL.md` file with instructions plus optional supporting files like scripts and templates.

**How they're used**: Skills are model-invoked, meaning Claude autonomously decides when to activate them based on your request and the skill's description. This differs from slash commands, which require explicit user invocation.

**Key characteristics**:
- Available from three sources: personal (`~/.claude/skills/`), project (`.claude/skills/`), and plugin skills
- Automatically discovered by Claude without requiring explicit triggers
- Can restrict tool access using the `allowed-tools` frontmatter field
- Shared across teams via git repositories or plugins

**Main benefits**:
- Reduce repetitive prompting
- Package expertise into discoverable capabilities
- Extend Claude's abilities for specific workflows
- Enable team collaboration through shared repositories

## Hooks

**What they are**: Hooks are automated scripts that execute at specific events during your Claude Code session. They enable you to extend Claude Code's functionality with custom validation, formatting, and automation.

**Key capabilities**:
- **Event-Triggered Execution**: Hooks respond to events like tool usage, user input, session lifecycle changes, and notifications
- **Permission and Control**: You can use hooks to approve, deny, or request confirmation for specific tool calls
- **Flexible Configuration**: Hooks match patterns (like specific tools or regex patterns) and execute bash commands
- **Dynamic Context**: Add context to prompts, validate commands, and block unsafe operations
- **Integration Points**: Work across all Claude Code tools, including Model Context Protocol (MCP) tools
- **Configuration Levels**: Can be configured at user, project, or enterprise levels

**Common use cases**:
- Validating bash commands before execution
- Auto-formatting code after file writes
- Adding dynamic context at session start
- Enforcing security policies
- Logging and monitoring tool usage

**Execution model**: Hooks execute in parallel when multiple hooks match an event, making them powerful for automation while maintaining security through explicit configuration.

## Slash Commands

**What they are**: Slash commands are tools that control Claude's behavior during an interactive session. They enable you to manage your workflow through simple text commands.

**Three categories**:

### Built-in Commands
Handle essential operations:
- `/clear` - Clear conversation history
- `/model` - Switch models
- `/cost` - View token usage
- And more...

### Custom Commands
Let you define reusable prompts as Markdown files organized in:
- Project directory: `.claude/commands/`
- Personal directory: `~/.claude/commands/`

Custom commands support:
- Arguments and parameters
- Bash execution
- File references
- Standardization across projects and teams

### Plugin and MCP Commands
Extended by installed plugins and connected MCP servers, following patterns like:
- `/plugin-name:command-name`
- `/mcp__server__prompt`

**Invocation**: Use the syntax `/<command-name> [arguments]`

## Plugins

**What they are**: Plugins are extensions that enhance Claude Code's functionality through custom additions. They allow you to "extend Claude Code with custom functionality that can be shared across projects and teams."

**What plugins can include**:
- Custom slash commands for frequently used operations
- Agents that perform specialized tasks
- Skills that expand Claude's autonomous capabilities
- Hooks for event handling and automation
- MCP servers for integrating external tools

**Deployment options**:
- Discover plugins through marketplaces
- Install them with simple commands
- Create your own for personal or team use
- Automatic installation through repository configuration for team workflows

## MCP Servers

**What they are**: Model Context Protocol (MCP) servers are integration points that connect Claude to external tools and services. They enable Claude to interact with systems outside of Claude Code's built-in capabilities.

**Purpose**: Extend Claude's ability to:
- Interact with specialized services
- Access custom APIs and tools
- Integrate with third-party platforms
- Connect to domain-specific systems

**Integration**: MCP servers are discoverable and can be installed to enhance Claude's capabilities for specific workflows.

## Subagents

**What they are**: Specialized agents available through the Task tool that handle different types of autonomous, multi-step work. Each subagent type is optimized for specific tasks.

**Available types**:
- **general-purpose**: General-purpose agent for researching complex questions, searching for code, and executing multi-step tasks
- **statusline-setup**: Configure Claude Code status line settings
- **output-style-setup**: Create custom output styles
- **Explore**: Fast agent specialized for exploring codebases, finding files by patterns, and answering codebase questions

**Key benefits**:
- Handle complex, multi-step tasks autonomously
- Specialize in different domains (code exploration, setup, configuration, etc.)
- Reduce context window usage by handling focused tasks independently
- Enable parallel execution of independent tasks

## Output Styles

**What they are**: Custom formatting configurations for Claude's responses in your terminal.

**Purpose**: Enable you to:
- Customize how responses are displayed
- Format output to match your preferences
- Adapt Claude Code's interface to your workflow

## Integration and Configuration

All of these capabilities can be:
- Configured at individual, project, or team/enterprise levels
- Discovered and shared through standard mechanisms
- Combined to create powerful automation workflows
- Extended through plugins and marketplace integrations

### Directory Structure
Claude Code uses consistent directory structures for extensibility:
- `~/.claude/` - Personal configuration
- `.claude/` - Project-specific configuration
- Plugin directories for shared capabilities

This allows seamless sharing across teams and repositories while maintaining per-project customization.
