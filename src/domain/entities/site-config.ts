export interface ContactInfo {
  readonly whatsappNumber: string;
  readonly whatsappDisplay: string;
  readonly email: string;
  readonly address: string;
  readonly city: string;
  readonly schedule: string;
}

export interface SiteConfig {
  readonly name: string;
  readonly legalName: string;
  readonly formerName: string;
  readonly domain: string;
  readonly url: string;
  readonly tagline: string;
  readonly description: string;
  readonly contact: ContactInfo;
}
