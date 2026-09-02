import { getApiBaseUrl, safeFetch } from './config';
import { CreateTicketPayload, SupportTicket, SupportTicketAttachment } from './types';
import { getAccessToken } from '../authStorage';

// ── v5.0.0 Master Support System & Dispute Management APIs ────────

/**
 * 1. Submit Vendor Inquiry / Payout Dispute
 * POST /api/vendor/tickets (or /api/vendors/tickets)
 */
export async function createSupportTicketApi(payload: CreateTicketPayload): Promise<{
  ticket_id: string;
  ticket_number: string;
  status: string;
  priority: string;
  sla_minutes_remaining?: number;
  created_at_readable?: string;
  message?: string;
}> {
  const body = {
    subject: payload.subject.trim(),
    description: payload.description.trim(),
    category: payload.category || 'billing',
    priority: payload.priority || 'high',
    store_name: payload.store_name?.trim() || undefined,
    reporter_email: payload.reporter_email?.trim() || undefined,
    reporter_name: payload.reporter_name?.trim() || undefined,
    reporter_role: payload.reporter_role || 'vendor',
    order_id: payload.order_id?.trim() || undefined,
  };

  try {
    // Primary endpoint: POST /api/vendor/tickets
    let { res, data } = await safeFetch(`${getApiBaseUrl()}/vendor/tickets`, {
      method: 'POST',
      body: JSON.stringify(body)
    });

    // Fallback alias: POST /api/vendors/tickets
    if (!res.ok && res.status === 404) {
      const fallback = await safeFetch(`${getApiBaseUrl()}/vendors/tickets`, {
        method: 'POST',
        body: JSON.stringify(body)
      });
      res = fallback.res;
      data = fallback.data;
    }

    if (res.ok && data) {
      const ticketData = data.data || data.ticket || data;
      return {
        ticket_id: ticketData.ticket_id || `t-${Date.now()}`,
        ticket_number: ticketData.ticket_number || `TICK-${Math.floor(1000 + Math.random() * 9000)}`,
        status: ticketData.status || 'open',
        priority: ticketData.priority || body.priority,
        sla_minutes_remaining: ticketData.sla_minutes_remaining || 45,
        created_at_readable: ticketData.created_at_readable || 'Just now',
        message: data.message || 'Ticket submitted successfully.'
      };
    }

    throw new Error(data?.message || data?.error || 'Failed to submit support ticket.');
  } catch (err: any) {
    console.error('❌ [CREATE TICKET ERROR]:', err);
    throw err;
  }
}

/**
 * 2. Fetch Merchant's Submitted Tickets
 * GET /api/vendor/tickets (or /api/vendors/tickets)
 */
export async function fetchVendorTicketsApi(): Promise<SupportTicket[]> {
  try {
    // Primary endpoint: GET /api/vendor/tickets
    let { res, data } = await safeFetch(`${getApiBaseUrl()}/vendor/tickets`, {
      method: 'GET'
    });

    // Fallback alias: GET /api/vendors/tickets
    if (!res.ok && res.status === 404) {
      const fallback = await safeFetch(`${getApiBaseUrl()}/vendors/tickets`, {
        method: 'GET'
      });
      res = fallback.res;
      data = fallback.data;
    }

    if (res.ok && data) {
      const rawList = Array.isArray(data.data) ? data.data : (Array.isArray(data.tickets) ? data.tickets : (Array.isArray(data) ? data : []));
      return rawList.map((item: any) => ({
        ticket_id: item.ticket_id || item.id || `t-${Math.random()}`,
        ticket_number: item.ticket_number || item.number || 'TICK-0000',
        subject: item.subject || 'Support Inquiry',
        description: item.description || '',
        category: item.category || 'general',
        status: item.status || 'open',
        priority: item.priority || 'medium',
        unread_messages_count: item.unread_messages_count ?? 0,
        sla_minutes_remaining: item.sla_minutes_remaining,
        created_at_readable: item.created_at_readable || item.created_at || 'Recently',
        created_at: item.created_at,
        created_at_ist: item.created_at_ist,
        store_name: item.store_name,
        reporter_email: item.reporter_email,
        attachments: item.attachments || []
      }));
    }

    return [];
  } catch (err: any) {
    console.warn('⚠️ [FETCH TICKETS WARN]:', err.message || err);
    return [];
  }
}

/**
 * 3. Upload Document / Evidence Attachment
 * POST /api/support/tickets/:ticketId/attachments
 */
export async function uploadTicketAttachmentApi(
  ticketId: string,
  file: { uri: string; name?: string; type?: string }
): Promise<SupportTicketAttachment> {
  try {
    const accessToken = await getAccessToken();
    const formData = new FormData();

    const fileName = file.name || `attachment_${Date.now()}.jpg`;
    const mimeType = file.type || (fileName.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');

    formData.append('file', {
      uri: file.uri,
      name: fileName,
      type: mimeType
    } as any);

    const headers: Record<string, string> = {
      'Accept': 'application/json'
    };
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const res = await fetch(`${getApiBaseUrl()}/support/tickets/${ticketId}/attachments`, {
      method: 'POST',
      headers,
      body: formData
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok && data) {
      const att = data.data || data.attachment || data;
      return {
        attachment_id: att.attachment_id || `att_${Date.now()}`,
        ticket_id: ticketId,
        file_name: att.file_name || fileName,
        file_size_bytes: att.file_size_bytes,
        file_url: att.file_url || file.uri,
        uploaded_at_ist: att.uploaded_at_ist || new Date().toISOString()
      };
    }

    throw new Error(data?.message || data?.error || 'Failed to upload attachment.');
  } catch (err: any) {
    console.error('❌ [UPLOAD ATTACHMENT ERROR]:', err);
    throw err;
  }
}
