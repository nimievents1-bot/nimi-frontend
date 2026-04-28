"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alert } from "@/components/primitives/Alert";
import { Button } from "@/components/primitives/Button";
import {
  SelectField,
  TextField,
  TextareaField,
} from "@/components/primitives/Field";
import { ApiError, apiFetch } from "@/lib/api";

interface Props {
  enquiryId: string;
  currentStatus: "NEW" | "CONTACTED" | "CLOSED" | "SPAM";
  currentInternalNotes: string;
  recipientEmail: string;
}

/**
 * Per-enquiry admin actions: change status, save internal notes, send a reply email.
 *
 * The reply email lands in the customer's inbox via the API mailer; the API also
 * automatically moves the enquiry from NEW → CONTACTED on the first reply.
 */
export function EnquiryActions({
  enquiryId,
  currentStatus,
  currentInternalNotes,
  recipientEmail,
}: Props) {
  const router = useRouter();

  const [status, setStatus] = useState(currentStatus);
  const [notes, setNotes] = useState(currentInternalNotes);
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [replySubject, setReplySubject] = useState("Re: your enquiry — Nimi Events");
  const [replyBody, setReplyBody] = useState("");
  const [sending, setSending] = useState(false);

  const saveStatus = async () => {
    setError(null);
    setSuccess(null);
    setSavingStatus(true);
    try {
      await apiFetch(`/admin/enquiries/${enquiryId}`, {
        method: "PATCH",
        body: { status },
      });
      setSuccess(`Status updated to ${status}.`);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Failed to update status.");
    } finally {
      setSavingStatus(false);
    }
  };

  const saveNotes = async () => {
    setError(null);
    setSuccess(null);
    setSavingNotes(true);
    try {
      await apiFetch(`/admin/enquiries/${enquiryId}`, {
        method: "PATCH",
        body: { internalNotes: notes },
      });
      setSuccess("Internal notes saved.");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Failed to save notes.");
    } finally {
      setSavingNotes(false);
    }
  };

  const sendReply = async () => {
    setError(null);
    setSuccess(null);
    if (!replyBody.trim()) {
      setError("Please write a reply before sending.");
      return;
    }
    setSending(true);
    try {
      await apiFetch(`/admin/enquiries/${enquiryId}/reply`, {
        method: "POST",
        body: { subject: replySubject, body: replyBody },
      });
      setSuccess(`Reply sent to ${recipientEmail}.`);
      setReplyBody("");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Failed to send reply.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="border border-cream-200 bg-paper p-6">
      <h2 className="m-0 mb-4 font-display text-2xl font-medium text-maroon-600">Actions</h2>

      {error ? (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      ) : null}
      {success ? (
        <Alert variant="success" className="mb-4">
          {success}
        </Alert>
      ) : null}

      <div className="mb-6">
        <SelectField
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
        >
          <option value="NEW">New</option>
          <option value="CONTACTED">Contacted</option>
          <option value="CLOSED">Closed</option>
          <option value="SPAM">Spam</option>
        </SelectField>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => void saveStatus()}
          disabled={savingStatus || status === currentStatus}
        >
          {savingStatus ? "Saving…" : "Save status"}
        </Button>
      </div>

      <div className="mb-6">
        <TextareaField
          label="Internal notes"
          rows={5}
          hint="Visible to admins only."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <Button
          size="sm"
          variant="secondary"
          onClick={() => void saveNotes()}
          disabled={savingNotes || notes === currentInternalNotes}
        >
          {savingNotes ? "Saving…" : "Save notes"}
        </Button>
      </div>

      <div>
        <h3 className="m-0 mb-3 font-display text-xl font-medium text-maroon-600">Reply</h3>
        <p className="mb-3 font-sans text-sm text-neutral-700">
          Send an email to{" "}
          <span className="font-mono text-orange-700">{recipientEmail}</span>.
        </p>
        <TextField
          label="Subject"
          value={replySubject}
          onChange={(e) => setReplySubject(e.target.value)}
        />
        <TextareaField
          label="Message"
          rows={8}
          value={replyBody}
          onChange={(e) => setReplyBody(e.target.value)}
        />
        <Button onClick={() => void sendReply()} disabled={sending}>
          {sending ? "Sending…" : "Send reply"}
        </Button>
      </div>
    </div>
  );
}
