export type DocumentType = string;
export type PermitType = string;

export type BankRules = {
  bank: string;
  accepted_permits: PermitType[];
  required_documents: {
    always: DocumentType[];
    employment: DocumentType[];
    conditional: Record<string, DocumentType[]>;
  };
  online_application: boolean;
  notes?: string;
};

export type ExtractedDocument = {
  type: DocumentType;
  fields: Record<string, string | number | boolean>;
  confidence: number;
};

export type MatchResult = {
  bank: string;
  ready: boolean;
  missing_documents: DocumentType[];
  warnings: string[];
};
