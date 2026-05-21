## ADDED Requirements

### Requirement: Login page configuration model
The system SHALL define a `LoginPageConfig` type with the following fields:
- `id`: optional number or string
- `version`: optional number
- `cacheVersion`: optional string
- `logo.displayType`: `'none' | 'image' | 'text' | 'image_text'`
- `logo.position`: `'top_left' | 'top_center' | 'top_right'`
- `logo.imageUrl`: optional string
- `logo.text`: optional string
- `logo.imageAlt`: optional string
- `title.highlightText`: string
- `title.mainText`: string
- `title.subtitleText`: optional string
- `loginBoxTitle`: string
- `password.hidden`: boolean
- `password.defaultPasswordPolicy`: `'fixed_1234'`

The system SHALL maintain an internal default configuration with all fields populated, matching the current hardcoded login page content.

#### Scenario: Default configuration is complete
- **WHEN** no backend configuration is available
- **THEN** the system uses the internal default configuration where all required fields are non-empty

#### Scenario: Default configuration matches current page
- **WHEN** the internal default configuration is used
- **THEN** the login page renders identically to the current hardcoded version (same logo, same titles, same password behavior as `VITE_PASSWORD_FREE` mode)

### Requirement: Login page configuration API client
The system SHALL provide an API client function `fetchLoginPageConfig()` that calls `GET /stu/api/login-page-config/active` and returns a normalized `LoginPageConfig` or `null`.

The API client SHALL handle the following response patterns:
- `code: 200, obj: {...}` → normalize and return config
- `code: 200, obj: null` → return `null`
- Network error or non-200 response → throw error (caller handles fallback)

#### Scenario: Successful config fetch
- **WHEN** the API returns `code: 200` with a valid `obj`
- **THEN** the function returns a normalized `LoginPageConfig` object

#### Scenario: No active config
- **WHEN** the API returns `code: 200` with `obj: null`
- **THEN** the function returns `null`

#### Scenario: API failure
- **WHEN** the API request fails due to network error or non-200 status
- **THEN** the function throws an error without returning a config

### Requirement: Login page configuration cache
The system SHALL cache the last successfully fetched configuration in localStorage under key `hci-login-page-config`.

The cache entry SHALL contain: `cacheVersion`, `config` (full payload), `cachedAt` (ISO timestamp).

The system SHALL write to cache only after a successful fetch with valid `obj`. The system SHALL read from cache only as a fallback when the API request fails.

The cache SHALL NOT store any password or sensitive fields.

#### Scenario: Cache write on successful fetch
- **WHEN** `fetchLoginPageConfig()` returns a valid config
- **THEN** the system writes `{ cacheVersion, config, cachedAt }` to localStorage key `hci-login-page-config`

#### Scenario: Cache read on API failure
- **WHEN** `fetchLoginPageConfig()` throws an error
- **THEN** the system reads the cached config from localStorage and uses it if present

#### Scenario: No cache available on API failure
- **WHEN** `fetchLoginPageConfig()` throws an error AND localStorage has no cached config
- **THEN** the system falls back to the internal default configuration

### Requirement: Configuration priority chain
The system SHALL resolve the effective configuration using this priority order:
1. Backend API response (if successful with valid `obj`)
2. localStorage cached config (if API fails and cache exists)
3. Internal default configuration (if API fails and no cache)

#### Scenario: Backend config takes priority
- **WHEN** the API returns a valid config AND a cached config exists
- **THEN** the system uses the backend config and updates the cache

#### Scenario: Fallback to cache
- **WHEN** the API fails AND a cached config exists in localStorage
- **THEN** the system uses the cached config

#### Scenario: Fallback to default
- **WHEN** the API fails AND no cached config exists
- **THEN** the system uses the internal default configuration

### Requirement: Field anomaly tolerance
The system SHALL tolerate unrecognized or missing configuration fields:
- Unrecognized `displayType` → treated as `'none'`
- Unrecognized `position` → treated as `'top_center'`
- Empty required title fields → use default config's corresponding field
- Empty `imageUrl` when display type requires image → degrade to text logo or hide logo
- `password.defaultPasswordPolicy` not `fixed_1234` → still use default password `1234` in hidden mode

#### Scenario: Unrecognized displayType
- **WHEN** config `logo.displayType` is `'fancy'` (unrecognized)
- **THEN** the system treats it as `'none'` and does not render the logo area

#### Scenario: Missing imageUrl with image display type
- **WHEN** config `logo.displayType` is `'image'` but `logo.imageUrl` is empty
- **THEN** the system degrades to not showing the logo image

#### Scenario: Empty title fields
- **WHEN** config `title.highlightText` is empty
- **THEN** the system uses the default config's `title.highlightText` value

### Requirement: Mock mode support
The system SHALL support Mock mode by intercepting `GET /stu/api/login-page-config/active` in the Vite dev server mock plugin.

The mock SHALL return a configuration with `password.hidden: true` by default, consistent with current `VITE_PASSWORD_FREE=1` behavior.

#### Scenario: Mock mode returns config
- **WHEN** `VITE_USE_MOCK=1` and the login page requests the config API
- **THEN** the mock plugin returns a valid `LoginPageConfig` with `password.hidden: true`
