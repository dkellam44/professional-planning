## ADDED Requirements

### Requirement: LiteLLM Integration
The system SHALL provide a self-hosted LiteLLM proxy server as an alternative to OpenRouter for LLM inference routing.

#### Scenario: Service Deployment
- **WHEN** the system starts up
- **THEN** LiteLLM service SHALL be available at `https://litellm.bestviable.com`
- **AND** the service SHALL expose a `/health` endpoint for monitoring

#### Scenario: Provider Configuration
- **WHEN** administrators configure LLM providers
- **THEN** the system SHALL support configuration for OpenAI, Anthropic, Google, Cohere, and Mistral
- **AND** each provider SHALL be configurable with individual API keys

### Requirement: BYOK Key Management
The system SHALL provide Bring Your Own Key (BYOK) management for LLM API keys with encrypted storage and usage tracking.

#### Scenario: Key Storage
- **WHEN** a user adds an API key
- **THEN** the key SHALL be encrypted using Infisical before storage
- **AND** the key SHALL be associated with a specific provider and user

#### Scenario: Key Usage Tracking
- **WHEN** API calls are made through LiteLLM
- **THEN** the system SHALL track usage per API key
- **AND** provide cost attribution reports

#### Scenario: Key Validation
- **WHEN** a key is added or used
- **THEN** the system SHALL validate the key with a test API call
- **AND** mark invalid keys as disabled

### Requirement: Provider Selection
The system SHALL allow dynamic provider selection based on task requirements, cost, and availability.

#### Scenario: Model Selection
- **WHEN** an agent or user requests an LLM
- **THEN** the system SHALL allow selection of specific models from configured providers
- **AND** provide fallback options if the primary provider is unavailable

#### Scenario: Cost Optimization
- **WHEN** multiple providers support the same model
- **THEN** the system SHALL provide cost comparison data
- **AND** allow automatic selection of the most cost-effective option

## MODIFIED Requirements

### Requirement: LLM Inference Routing
**Previous**: The system SHALL use OpenRouter as the primary LLM inference provider.

**Updated**: The system SHALL support both OpenRouter and LiteLLM as LLM inference providers, with LiteLLM as the primary option and OpenRouter as fallback.

#### Scenario: Primary Provider
- **WHEN** LiteLLM is available and configured
- **THEN** all LLM requests SHALL route through LiteLLM
- **AND** usage SHALL be tracked per configured API key

#### Scenario: Fallback Provider
- **WHEN** LiteLLM is unavailable or misconfigured
- **THEN** the system SHALL automatically fallback to OpenRouter
- **AND** log the fallback event for monitoring

### Requirement: Configuration Management
**Previous**: LLM configuration SHALL be limited to OpenRouter API key and model selection.

**Updated**: LLM configuration SHALL support multiple providers with individual API keys, model selection, and usage limits per provider.

#### Scenario: Multi-Provider Configuration
- **WHEN** configuring LLM providers
- **THEN** administrators SHALL be able to configure multiple providers simultaneously
- **AND** set individual rate limits and usage quotas per provider