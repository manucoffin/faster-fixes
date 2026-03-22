---
name: spec-interview
description: Interview user in-depth to create a detailed specification document
argument-hint: [instructions]
allowed-tools: AskUserQuestion, Write
---

# Specification Interview

This skill conducts thorough, in-depth interviews with users to create comprehensive specification documents. Instead of making assumptions, it systematically explores all aspects of requirements through detailed questioning.

## When to Use This Skill

- Planning a new feature or functionality
- Defining requirements for a complex implementation
- Clarifying ambiguous project goals
- Creating detailed technical specifications
- Gathering comprehensive UX/UI requirements
- Understanding technical tradeoffs and constraints
- Documenting architectural decisions
- Before starting significant development work

## What This Skill Does

1. **Deep Questioning**: Asks detailed, non-obvious questions about every aspect of the requirement
2. **Comprehensive Coverage**: Explores technical implementation, UI/UX, edge cases, tradeoffs, and concerns
3. **Iterative Clarification**: Continues interviewing until all aspects are thoroughly understood
4. **Spec Generation**: Compiles all gathered information into a structured specification document
5. **Written Output**: Saves the final specification to a file for reference

## How to Use

### Basic Usage

```
/spec-interview Create a user authentication system
```

```
/spec-interview Build a dashboard with real-time analytics
```

```
/spec-interview Add payment processing to the application
```

### With Custom Instructions

```
/spec-interview Design an admin panel - focus on security and role-based access
```

## The Interview Process

The skill will systematically ask about:

- **Technical Implementation**: Architecture, frameworks, libraries, integrations
- **User Experience**: Workflows, interactions, visual design, accessibility
- **Edge Cases**: Error handling, validation, boundary conditions
- **Performance**: Load requirements, optimization needs, scalability
- **Security**: Authentication, authorization, data protection
- **Tradeoffs**: Alternative approaches, pros/cons, decision factors
- **Constraints**: Timeline, resources, technical limitations
- **Success Criteria**: How to measure completion and quality

## Example Session

**User**: `/spec-interview Add a comment system to blog posts`

**Skill**:
- Where should comments appear? Below posts, in a sidebar, or modal?
- Should comments be threaded (replies to replies)?
- What authentication is required? Sign in to comment, or allow anonymous?
- How should comments be moderated? Pre-approval, post-approval, or auto-published?
- What spam prevention measures should be implemented?
- Should there be upvoting/downvoting?
- How should comment notifications work?
- What's the expected comment volume?
- ...continues until complete...

**Output**: `blog-comments-spec.md` with all requirements documented

## Tips

- Provide initial context in your command to focus the interview
- Be specific about critical constraints or preferences upfront
- The more detailed your answers, the better the final spec
- Review the generated spec and iterate if needed
- Use the spec as input for implementation planning

## Prompt Instructions

Follow the user instructions and interview me in detail using the AskUserQuestion tool about literally anything: technical implementation, UI & UX, concerns, tradeoffs, etc. but make sure the questions are not obvious. Be very in-depth and continue interviewing me continually until it's complete. Then, write the spec to a file.

<instructions>$ARGUMENTS</instructions>
