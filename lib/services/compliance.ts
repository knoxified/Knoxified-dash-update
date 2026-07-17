import { DataService } from "./data";

export interface SuppressionEntry {
  id: string;
  userId: string;
  phoneNumber: string;
  reason?: string;
  sourceAutomationId?: string;
  addedAt: string;
  addedBy: string;
  notes?: string;
}

export class ComplianceService {
  /**
   * #1 Suppression List Enforcement
   * This is checked BEFORE any outbound call is placed.
   * If the number is in the list, it throws a blocked exception.
   */
  static async checkSuppressionList(userId: string, phoneNumber: string): Promise<boolean> {
    // In a real implementation:
    // const { data } = await supabase.from('suppression_list').select('id').eq('user_id', userId).eq('phone_number', phoneNumber);
    // return data.length > 0;
    
    // Mock
    const isSuppressed = phoneNumber === "+1 (555) 019-2834";
    if (isSuppressed) {
      await this.logAudit(userId, "Call Blocked by Suppression List", `Attempted to call ${phoneNumber}. System blocked the dispatch.`);
      throw new Error("Call Blocked: Number exists on the global suppression list.");
    }
    return false;
  }

  /**
   * #1.1 Real-time in-call detection addition
   * Voice agent webhook calls this when opt-out phrase is detected.
   */
  static async addInCallOptOut(userId: string, phoneNumber: string, automationId: string) {
    // await supabase.from('suppression_list').insert({ ... })
    await this.logAudit(userId, "In-Call Opt Out Added", `Added ${phoneNumber} to suppression list from live agent.`);
    return true;
  }

  /**
   * #2 & #3 AI/Recording Disclosures
   * Returns the script preamble that the voice agent MUST read.
   */
  static async getCallDisclosures(agentConfigId: string) {
    // AI Disclosure is default-on and not configurable off.
    let disclosure = "Hello, you are speaking with an AI assistant on a recorded line. ";
    return disclosure;
  }

  /**
   * #6 Immutable Audit Logs
   * Appends to audit_logs. No update/delete exposed.
   */
  static async logAudit(userId: string, action: string, details: string) {
    // await supabase.from('audit_logs').insert({ user_id: userId, action, details, timestamp: new Date() })
    console.log(`[AUDIT] ${action}: ${details}`);
    return true;
  }

  /**
   * #7 Calling Window Enforcement
   * Returns true if current time in recipient's tz is within allowed bounds.
   */
  static isWithinCallingWindow(timezone: string, startHour = 8, endHour = 21): boolean {
    // Mock check based on time
    const currentHour = new Date().getHours(); 
    return currentHour >= startHour && currentHour < endHour;
  }
}
