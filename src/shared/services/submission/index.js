export { default as EventTypes } from './eventTypes.js';
export { EventTypes as SubmissionEventTypes } from './eventTypes.js';
export { createMarkObject, orderMarkFields, MARK_FIELD_ORDER } from './createMarkObject.js';
export { default as createMarkObjectDefault } from './createMarkObject.js';
export { formatTimestamp as submissionFormatTimestamp } from './createMarkObject.js';
export { validateMarkObject } from './validateMarkObject.js';
export { default as validateMarkObjectDefault } from './validateMarkObject.js';
export { handleSessionExpired } from './handleSessionExpired.js';
export { default as defaultHandleSessionExpired } from './handleSessionExpired.js';
export { usePageSubmission } from './usePageSubmission.js';
export { default as usePageSubmissionDefault } from './usePageSubmission.js';

// Submodule adapter utilities
export * from './submoduleAdapter/index.ts';
