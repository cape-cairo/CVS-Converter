
export type FormatId = 'fnb_standard' | 'bidvest' | 'bccei';

export interface FieldDefinition {
  key: string;
  label: string;
  required: boolean;
  defaultValue?: string;
  transform?: (value: any) => string;
}

export interface TargetFormat {
  id: FormatId;
  name: string;
  description: string;
  delimiter: string;
  fields: FieldDefinition[];
  hasCustomHeader?: boolean;
  generateCustomHeader?: (config: BatchConfig) => string;
  rowFormatter?: (row: any, fields: FieldDefinition[]) => string;
}

export interface BatchConfig {
  fromAccountNumber?: string;
  batchReference?: string;
  executionDate?: string;
}

export interface Mapping {
  [fieldKey: string]: string; // targetFieldKey -> sourceExcelHeader
}
