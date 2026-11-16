# Trello Status mapping is configured per Project link

Linear and Jira map a Feedback's Status through a primitive the Tracker provides:
Linear state types, Jira status categories. The mapping is fixed in code and no
User configures it. Trello has no such primitive: a Trello card has no status, a
list has no type, and progress is only the list a card sits in. The Trello Project
link therefore stores the mapping itself. The User picks the lists when linking a
Trello board, and the list is the only signal that drives a Status in either
direction.

## The mapping

- `new` and `resolved` each require a list. `in_progress` is optional; when it is
  unmapped, the card stays where it is on that Status change.
- Mapped lists are distinct, so a card arriving in a list always names one Status.
- Outbound, a Status change moves the card to the mapped list. `resolved` also
  marks the card complete, and leaving `resolved` clears the mark.
- Inbound, a card moved to a mapped list sets that Status, `new` included. A card
  moved to an unmapped list ("QA", "Blocked") changes nothing.
- The complete mark is write-only. A card marked complete in Trello without
  changing list changes nothing.

## Archiving

Trello teams archive finished cards to tidy the board, so an archived card does not
mean "will not fix".

- Outbound, an Archived Feedback archives its card. A Restore unarchives it and
  moves it to the `new` list.
- Inbound, a card archived from the `resolved` list changes nothing: the Feedback
  stays `resolved`. A card archived from any other list archives the Feedback.
- An unarchived card takes the Status of its list when that list is mapped.

## Considered options

- **Infer the mapping from list names** ("Done", "In progress"). Rejected: names
  are free text in any language, and a wrong guess moves cards silently.
- **No list mapping, complete mark only.** Rejected: nothing would move on the
  board, and the board is where a Trello team reads progress.
- **Treat an unmapped list as `in_progress`**, as Jira treats any non-done
  category. Rejected: without a category behind the list it is a guess.

## Consequences

- The Trello link has a failure mode the other Trackers lack: a mapped list can be
  archived or deleted. That is a Project link health issue, which suspends card
  creation for the Project. It never puts the Installation in Reconnect required.
- Changing the mapped lists is an in-place edit. Changing the Trello board means
  unlinking and linking again.
- Inbound sync must know the list a card was archived from, so the handler reads
  the card back from Trello instead of trusting the webhook payload.
