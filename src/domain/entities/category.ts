export interface Category {
  readonly id: string;
  readonly name: string;
  readonly tagline: string;
  readonly description: string;
  readonly examples: readonly string[];
  readonly icon: string;
}
