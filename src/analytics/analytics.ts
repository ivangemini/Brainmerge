export type AnalyticsEventName =
  | 'tier_discovered'
  | 'upgrade_purchased'
  | 'wait_shown'
  | 'campaign_started'
  | 'campaign_order_delivered'
  | 'visitor_started'
  | 'visitor_completed'
  | 'fever_started'
  | 'reward_claimed'
  | 'prestige_completed'
  | 'session_return';

export type AnalyticsProperties = Readonly<Record<string, string | number | boolean>>;

export interface AnalyticsSink {
  send(name: AnalyticsEventName, properties: AnalyticsProperties): void;
}

export class Analytics {
  constructor(private readonly sink: AnalyticsSink | null = null) {}

  track(name: AnalyticsEventName, properties: AnalyticsProperties = {}): void {
    // Event payloads are deliberately limited to gameplay aggregates. No account,
    // device, advertising or free-form player identifiers belong at this boundary.
    this.sink?.send(name, properties);
  }
}

export class BrowserEventAnalyticsSink implements AnalyticsSink {
  send(name: AnalyticsEventName, properties: AnalyticsProperties): void {
    window.dispatchEvent(new CustomEvent('brainmerge:analytics', { detail: { name, properties } }));
  }
}
