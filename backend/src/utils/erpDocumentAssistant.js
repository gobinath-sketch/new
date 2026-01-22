import axios from 'axios';

const OPENROUTER_API = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'openai/gpt-4o-mini';

const callAI = async (systemPrompt, userPrompt) => {
  try {
    const response = await axios.post(
      OPENROUTER_API,
      {
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3, // Lower temperature for formal, consistent output
        max_tokens: 500
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://singleplayground.com',
          'X-Title': 'Single Playground ERP'
        }
      }
    );

    const content = response.data.choices[0]?.message?.content?.trim();
    if (!content) {
      throw new Error('No response from AI');
    }

    return content;
  } catch (error) {
    console.error('ERP Document Assistant Error:', error.message);
    throw error;
  }
};

// Generate Invoice Document Summary
export const generateInvoiceSummary = async (invoiceData, role) => {
  const systemPrompt = `You are an Enterprise ERP Intelligence & Document Assistant operating inside Single Playground ERP.

You support document generation, validation, explanation, and monitoring for an enterprise ERP system used for real operations, finance, and compliance.

ABSOLUTE RULES:
- Use formal, professional business language
- Write in complete, structured sentences
- Maintain neutral, factual, confident tone
- Keep outputs concise (1-3 paragraphs maximum)
- NO emojis, symbols, bullets with icons, or decorative formatting
- NO casual language or conversational fillers
- NO marketing or sales copy
- NEVER calculate, modify, or adjust numeric values
- All numbers provided are final and system-calculated

Role Context: ${role}

Your responsibility is to generate a professional invoice summary that:
- Provides clear business-appropriate description of charges
- Ensures all mandatory sections are referenced
- Validates document completeness
- Provides short professional summary

You must NOT:
- Change amounts
- Recalculate tax
- Add or remove line items
- Suggest modifications`;

  const userPrompt = `Generate a professional invoice summary for the following invoice:

Invoice Number: ${invoiceData.clientInvoiceNumber || 'N/A'}
Client Name: ${invoiceData.clientName || 'N/A'}
Invoice Date: ${invoiceData.invoiceDate || 'N/A'}
Invoice Amount: ₹${invoiceData.invoiceAmount || 0}
Tax Amount: ₹${invoiceData.taxAmount || 0}
Total Amount: ₹${invoiceData.totalAmount || 0}
GST Type: ${invoiceData.gstType || 'N/A'}
GST Percent: ${invoiceData.gstPercent || 0}%
SAC Code: ${invoiceData.sacCode || 'N/A'}
Status: ${invoiceData.status || 'N/A'}
Program: ${invoiceData.programId ? 'Linked to program' : 'N/A'}

Generate a professional summary in 1-3 paragraphs. Do not modify any amounts or calculations.`;

  try {
    return await callAI(systemPrompt, userPrompt);
  } catch (error) {
    return 'Document insight could not be generated due to incomplete or unavailable data.';
  }
};

// Generate Internal PO Summary
export const generatePOSummary = async (poData, role) => {
  const systemPrompt = `You are an Enterprise ERP Intelligence & Document Assistant operating inside Single Playground ERP.

ABSOLUTE RULES:
- Use formal, professional business language
- Write in complete, structured sentences
- Maintain neutral, factual, confident tone
- Keep outputs concise (1-3 paragraphs maximum)
- NO emojis, symbols, bullets with icons, or decorative formatting
- NO casual language or conversational fillers
- NEVER modify approved values or reinterpret commercial terms

Role Context: ${role}

Your responsibility is to generate formal PO wording that:
- Clearly states purpose and scope
- Ensures vendor and program alignment
- Validates completeness of commercial references`;

  const userPrompt = `Generate a professional internal purchase order summary:

PO Number: ${poData.internalPONumber || 'N/A'}
Vendor: ${poData.vendorName || 'N/A'}
Deal: ${poData.dealId ? 'Linked to deal' : 'N/A'}
Approved Cost: ₹${poData.approvedCost || 0}
Adjusted Payable Amount: ₹${poData.adjustedPayableAmount || 0}
Status: ${poData.status || 'N/A'}
Cost Type: ${poData.costType || 'N/A'}

Generate a professional summary in 1-3 paragraphs. Do not modify any amounts.`;

  try {
    return await callAI(systemPrompt, userPrompt);
  } catch (error) {
    return 'Document insight could not be generated due to incomplete or unavailable data.';
  }
};

// Generate Tax/TDS Explanation
export const generateTaxExplanation = async (taxData, role) => {
  const systemPrompt = `You are an Enterprise ERP Intelligence & Document Assistant operating inside Single Playground ERP.

ABSOLUTE RULES:
- Use formal, professional business language
- Write in complete, structured sentences
- Maintain neutral, factual, confident tone
- Keep outputs concise (1-3 paragraphs maximum)
- NO emojis, symbols, bullets with icons, or decorative formatting
- Use precise accounting language for Finance role
- Reference applicable tax sections accurately

Role Context: ${role}

Your responsibility is to explain tax or TDS application in plain professional language that:
- References applicable section (e.g., Section 194C or 194J)
- Summarizes threshold or compliance impact
- Highlights compliance status

You must NOT:
- Suggest rates
- Apply tax
- Override system decisions`;

  const userPrompt = `Explain the tax/TDS application for the following record:

TDS Section: ${taxData.tdsSection || 'N/A'}
Payee Type: ${taxData.payeeType || 'N/A'}
Nature of Service: ${taxData.natureOfService || 'N/A'}
Applicable TDS Percent: ${taxData.applicableTdsPercent || 0}%
Payment Amount: ₹${taxData.paymentAmount || 0}
TDS Amount: ₹${taxData.tdsAmount || 0}
Net Payable Amount: ₹${taxData.netPayableAmount || 0}
Threshold Check: ${taxData.thresholdCheckResult || 'N/A'}
PAN Available: ${taxData.panAvailabilityFlag ? 'Yes' : 'No'}
Compliance Status: ${taxData.complianceStatus || 'N/A'}

Generate a professional explanation in 1-3 paragraphs. Do not suggest modifications or rates.`;

  try {
    return await callAI(systemPrompt, userPrompt);
  } catch (error) {
    return 'Document insight could not be generated due to incomplete or unavailable data.';
  }
};

// Generate Payment Summary
export const generatePaymentSummary = async (paymentData, role) => {
  const systemPrompt = `You are an Enterprise ERP Intelligence & Document Assistant operating inside Single Playground ERP.

ABSOLUTE RULES:
- Use formal, professional business language
- Write in complete, structured sentences
- Maintain neutral, factual, confident tone
- Keep outputs concise (1-3 paragraphs maximum)
- NO emojis, symbols, bullets with icons, or decorative formatting
- Focus on accuracy and compliance for Finance role
- Focus on commercial impact for Business Head role

Role Context: ${role}

Your responsibility is to provide a professional payment summary that:
- Clearly states payment status and amounts
- References associated documents
- Highlights any compliance or commercial implications`;

  const userPrompt = `Generate a professional payment summary:

Payment Reference: ${paymentData.vendorPayoutReference || paymentData.reference || 'N/A'}
Vendor: ${paymentData.vendorName || 'N/A'}
Amount: ₹${paymentData.adjustedPayableAmount || paymentData.amount || 0}
Outstanding Amount: ₹${paymentData.outstandingAmount || 0}
Status: ${paymentData.status || 'N/A'}
Due Date: ${paymentData.dueDate || 'N/A'}
Payment Terms: ${paymentData.paymentTerms || 'N/A'} days

Generate a professional summary in 1-3 paragraphs. Do not modify any amounts.`;

  try {
    return await callAI(systemPrompt, userPrompt);
  } catch (error) {
    return 'Document insight could not be generated due to incomplete or unavailable data.';
  }
};

// Generate Deal Summary
export const generateDealSummary = async (dealData, role) => {
  const systemPrompt = `You are an Enterprise ERP Intelligence & Document Assistant operating inside Single Playground ERP.

ABSOLUTE RULES:
- Use formal, professional business language
- Write in complete, structured sentences
- Maintain neutral, factual, confident tone
- Keep outputs concise (1-3 paragraphs maximum)
- NO emojis, symbols, bullets with icons, or decorative formatting
- Focus on commercial and margin impact for Business Head
- Focus on risk and governance for Director

Role Context: ${role}

Your responsibility is to provide a professional deal summary that:
- Clearly states commercial terms and scope
- Highlights margin and profitability implications
- References approval status and governance`;

  const userPrompt = `Generate a professional deal summary:

Deal ID: ${dealData.dealId || 'N/A'}
Client: ${dealData.clientName || 'N/A'}
Total Order Value: ₹${dealData.totalOrderValue || 0}
Gross Margin Percent: ${dealData.grossMarginPercent || 0}%
Margin Status: ${dealData.marginThresholdStatus || 'N/A'}
Approval Status: ${dealData.approvalStatus || 'N/A'}
Cost Breakdown:
- Trainer: ₹${dealData.trainerCost || 0}
- Lab: ₹${dealData.labCost || 0}
- Logistics: ₹${dealData.logisticsCost || 0}
- Content: ₹${dealData.contentCost || 0}
- Contingency: ₹${dealData.contingencyBuffer || 0}

Generate a professional summary in 1-3 paragraphs. Do not modify any amounts.`;

  try {
    return await callAI(systemPrompt, userPrompt);
  } catch (error) {
    return 'Document insight could not be generated due to incomplete or unavailable data.';
  }
};

// Generate Document Validation Report
export const validateDocument = async (documentType, documentData, role) => {
  const systemPrompt = `You are an Enterprise ERP Intelligence & Document Assistant operating inside Single Playground ERP.

ABSOLUTE RULES:
- Use formal, professional business language
- Write in complete, structured sentences
- Maintain neutral, factual, confident tone
- Keep outputs concise (1-3 paragraphs maximum)
- NO emojis, symbols, bullets with icons, or decorative formatting
- Focus on completeness and accuracy

Role Context: ${role}

Your responsibility is to validate document completeness and identify any missing mandatory sections or data.`;

  const userPrompt = `Validate the following ${documentType} document for completeness:

${JSON.stringify(documentData, null, 2)}

Identify any missing mandatory sections or incomplete data. Provide validation feedback in 1-3 paragraphs.`;

  try {
    return await callAI(systemPrompt, userPrompt);
  } catch (error) {
    return 'Document insight could not be generated due to incomplete or unavailable data.';
  }
};

export default {
  generateInvoiceSummary,
  generatePOSummary,
  generateTaxExplanation,
  generatePaymentSummary,
  generateDealSummary,
  validateDocument
};
