# Context Architecture - Initial

## Goal
The goal is to use context engineering principles to setup my solopreneur work system files, tools, and workflows to operate efficiently as a human recruiting maximum leverage from agents. This is an expansion of the Founder HQ (fka Enterprise OS) framework meant to incorporate GenAI agents that can operate within the system and externally with appropriate context knowledge at multiple different levels.



## Requirements:
- Enable solo developed and operated projects and outcomes when possible with the help of AI (to be scaled to teams down the line)
- Design feedback loops of learning to improve systems
    - for example, executions can be tracked and analized to influence decision-making and future system design
- Maintain context appropriate to each level of my structure and make updates both upstream and downstream
    - changes in a lower-hierarchy layer may demand updates in the higher layer and sub layer
- Efficient and accurate session handoffs to maintain context accross discrete sessions for humans and agents
- Resource Templates: Asset templates used to plan and carryout tasks. These can include worksheets, checklists, performance tracking sheets, 
- Context information and data resources should be exposed to AI tools at the appropriate times and secured at appropriate times
- When possible system should be designed to be tool-agnostic and expandible in scale and automation level

## References: 
Founder HQ Schema and README


## Domain Structure
This is the high-level tree my system (see Founder HQ docs)

Portfolio/ 
--> Ventures/
    --> Projects/


## Domain Details

### Portfolio
This is the domain describing my solopreneur activity containing my many ventures
### Ventures
Venture describes my "businesses" or "orgs" I operate. Ventures have different "business models" some ventures are non-revenue earning like learning cs50, or internal asset building
### Projects
Projects are inititative that deliver outcomes to serve the venture. They comprise of sprints (time bound groups of tasks). Some lead to billable revenue earning outcomes, others are non-billable
### Sprints
Sprints refer to the chunks of time of task execution with the goal of accomplishing specific project outcomes (features in terms of a software dev project, or engagement for a service project)
### Tasks
Tasks are the action items that produce outcomes they can bundle in sprints or can be independent "sprint = null"

**Repeatable patterns are templatized** (layers of traditional SOPs) as much as possilbe in the forms of: 
- Service Blueprints (Strategic Level): Describe engagement pattern related to customer journey (the SOP portfolio) "What services (or features) create value?"
- Workflows (Operational Level): Core SOPs "What steps must we take to deliver the value?"
- Process Templates (Tactical Level): "sub-SOPs" Series of tasks and required resources needed to produce outcome/deliverable "What checklists do we reuse each time?"("Reusable SOPs")
- Resource Templates: Asset templates used to plan and carryout tasks. These can include client reports, proposal docs, performance tracking sheets,"What document or assets do we use here?"  
- Should be able to generate Product Requirement Prompts and Product Requirement Docs as well as Project and Context Docs as seen in ColeAM00 context-engineering-intro

These are some objects and patterns I imagine incorporating at different levels
- Planning (High-level brainstorming and Designing)
- Roadmap    
- Decision Log (questions)
    - Questions - Considerations (not sure about the term here)
    - Question Status: Active | Closed | Decision (made)
- Versioning (or Build Version)
- Project Facts
- Compression --> Session Handoffs
- Execution Plan
- Testing 
- Execution Log
- Evaluation & Analysis
- Generate Templates & SOPs
- Agent Docs - hierarchy - level and context appropriate


## Tools and Resources: 
This are the basic tools in my workflow. The list is not exhaustive and new tools can be incorporated or replaced as needed. Design should be tool and ai model agnostic when possible. I am a coding beginer and my capabilites will increase and can be assisted with LLM guidance for direct API use.

- My local computer
    - macOs

- Gen AI Interface
    - Claude Code (CLI)
        - can use "/"commands
        - can use sub-agents 
    - ChatGPT Web Chat
    - Claude Desktop & Web Chat
    - Gemini Web Chat
- Model Context Protocol Servers
    - will need a method for organizing and listing tools available 
- Agent System Docs and configs
    - (Claude.md) (Claude.json)
    - Agent dir and/or files or .agent files or agents.md
- IDE
    - VS Code (with Claude Code, OpenAI Codex, Co-pilot)
    - Warp (CLI)
    - mac terminal
- Version Control
    - Github and Git Repos
    - Git architecture decisions should balance flow, readability, and separation of concerns
    - Version control for my local files synced with cloud repos
- Workstation and Task Management - "Founder OS"
    - Task manager and human workstation (my personal ERP)
    - Notion (with Notion API)
    - Can use connectors and MCPs to expose Notion data to ChatGPT, Claude and Claude Code
    - Coda is an alternative tool I have but currently prioritizing notion for integrations with GenAI
- Markdown Editor
    - Obsidian
    - Human interface for my markdown files stored locally
    - Can use Obsidian Plugins "Share to Notion" & "Importer" to share/sync files with Notion API
- Automation and Agent Orchestration
    - n8n to begin with
    - also have Boost.space LTD 5k rows
        - Scale to more robust agentic architecture and orchestrators (like langchain, )
- considering using open router
- Cloud Storage
    - Google Drive 100GB
- Mobile Device
    - iphone XR

## Context Management

Every layer of the architecture should have the appropriate level of contextual information available so humans and agents can reasonably perform given functions. 

## Output

File structure for my local drives
Method for updating context
Roadmap for system build