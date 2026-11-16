import { PreconditionFailedError } from "@/server/errors/domain-errors";

/**
 * The expected Trello failures, as second-level subclasses of the vocabulary of
 * ADR 0012. Every message below is final user copy: tRPC surfaces it verbatim
 * on the Trello screens instead of a 500. `TrelloRequestError` is
 * infrastructure and stays a plain `Error`.
 */

export class TrelloNotConnectedError extends PreconditionFailedError {
  constructor() {
    super("Trello is not connected. Connect Trello first.");
    this.name = "TrelloNotConnectedError";
  }
}

// Thrown when Trello refuses the grant itself (revoked access, the member
// removed). The Installation is flipped to `reconnect_required` so the UI can
// prompt a re-authorization (ADR 0008). An outage is never this error.
export class TrelloReauthRequiredError extends PreconditionFailedError {
  constructor(readonly installationId: string) {
    super("The Trello connection needs to be re-authorized.");
    this.name = "TrelloReauthRequiredError";
  }
}
