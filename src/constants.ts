import { TargetFormat } from './types';

export const TARGET_FORMATS: TargetFormat[] = [
  {
    id: 'fnb_standard',
    name: 'FNB / Standard Bank',
    description: 'Standard salary payment format with headers.',
    delimiter: ',',
    fields: [
      { key: 'pay_type', label: 'Payment Type', required: true, defaultValue: 'SALARY_PAYMENTS' },
      { key: 'branch_code', label: 'Branch Code', required: true },
      { key: 'account_number', label: 'Account Number', required: true },
      { key: 'amount', label: 'Amount', required: true },
      { key: 'reference', label: 'Reference', required: true },
      { key: 'execution_date', label: 'Batch Execution Date', required: true },
    ],
  },
  {
    id: 'bidvest',
    name: 'Bidvest Bank',
    description: 'Format with custom <<BB_HEADER>> and specific row layout.',
    delimiter: ',',
    hasCustomHeader: true,
    generateCustomHeader: (config) => {
      const acc = config.fromAccountNumber || 'From Account Number';
      const ref = config.batchReference || 'Batch Reference';
      const date = config.executionDate || 'DD/MM/YYYY';
      return `<<BB_HEADER>>,SALARY,${acc},0.00,${ref},${date}`;
    },
    fields: [
      { key: 'name', label: 'Employee Name', required: true },
      { key: 'surname', label: 'Employee Surname', required: true },
      { key: 'branch_code', label: 'To Branch Code', required: true },
      { key: 'account_number', label: 'To Account Number', required: true },
      { key: 'amount', label: 'Amount', required: true, defaultValue: '0.00' },
      { key: 'reference', label: 'Their Reference', required: true },
    ],
    rowFormatter: (row, fields) => {
      // Bidvest example has a trailing comma or extra fields sometimes
      return fields.map(f => row[f.key] || f.defaultValue || '').join(',') + ',';
    }
  },
  {
    id: 'bccei',
    name: 'BCCEI Submission',
    description: 'Barge Council for the Civil Engineering Industry format (Pipe delimited).',
    delimiter: '|',
    fields: [
      { key: 'contract', label: 'Contract', required: false },
      { key: 'emp_num', label: 'Employee Number', required: true },
      { key: 'sa_citizen', label: 'SA Citizen', required: true, defaultValue: 'Yes' },
      { key: 'id_number', label: 'ID Number', required: true },
      { key: 'passport', label: 'Passport', required: false },
      { key: 'name', label: 'Name', required: true },
      { key: 'surname', label: 'Surname', required: true },
      { key: 'emp_type', label: 'Employment Type', required: true },
      { key: 'start_date', label: 'Employment start date', required: true },
      { key: 'grade', label: 'Grade', required: true },
      { key: 'rate', label: 'Rate of pay (hourly)', required: true },
      { key: 'hours', label: 'Hours worked', required: true },
      { key: 'levy_emp', label: 'Levy Contribution Employee', required: true },
      { key: 'levy_employer', label: 'Levy Contribution Employer', required: true },
      { key: 'union', label: 'Union Name', required: true, defaultValue: 'None' },
    ],
    rowFormatter: (row, fields) => {
      // BCCEI starts with a pipe | if the first field is empty/optional in example?
      // Actually example shows: |100|Yes|...
      // Let's follow that.
      return '|' + fields.map(f => row[f.key] || f.defaultValue || '').join('|');
    }
  }
];
