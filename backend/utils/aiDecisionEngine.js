import axios from 'axios';

const OPENROUTER_API = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'openai/gpt-4o-mini';

const callAI = async (prompt, systemPrompt = null) => {
  try {
    const messages = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const response = await axios.post(
      OPENROUTER_API,
      {
        model: MODEL,
        messages,
        temperature: 0.1, // Low temperature for consistent, rule-like behavior
        response_format: { type: 'json_object' }
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

    try {
      return JSON.parse(content);
    } catch (e) {
      // If not JSON, return as string
      return { result: content };
    }
  } catch (error) {
    // Suppress log noise for expected failures (e.g. 401/500)
    throw error;
  }
};

// AI-driven TDS Calculation
export const calculateTDSWithAI = async (vendorType, natureOfService, paymentAmount, panNumber, vendorYearlyTotal = 0) => {
  const prompt = `You are an India TDS tax expert. Calculate TDS for the following payment:

Vendor Type: ${vendorType}
Nature of Service: ${natureOfService}
Payment Amount: ₹${paymentAmount}
PAN Number: ${panNumber || 'NOT PROVIDED'}
Vendor Yearly Total (including this payment): ₹${paymentAmount + vendorYearlyTotal}

India TDS Rules:
- Section 194C (Contractor/Sub-Contractor): Individual/HUF 1%, Company/Firm/LLP 2%. Threshold: >₹30,000 per contract OR >₹1,00,000/year
- Section 194J (Professional/Technical Services): Professional Services 10%, Technical Services 2%, Call Centre Services 2%. Threshold: >₹50,000/year
- If PAN not provided: Apply 20% TDS or higher rate

Return JSON with:
{
  "tdsSection": "194C" or "194J" or "None",
  "payeeType": "Individual/HUF" or "Company/Firm/LLP",
  "applicableTdsPercent": number (0-20),
  "thresholdCheckResult": "Above Threshold" or "Below Threshold",
  "tdsAmount": number,
  "netPayableAmount": number,
  "panAvailabilityFlag": boolean,
  "panNotProvidedTdsPercent": number (0 or 20),
  "complianceStatus": "Compliant" or "Pending PAN"
}`;

  const result = await callAI(prompt, 'You are a tax compliance expert. Return only valid JSON.');

  return {
    tdsSection: result.tdsSection || 'None',
    payeeType: result.payeeType || 'Company/Firm/LLP',
    applicableTdsPercent: result.applicableTdsPercent || 0,
    thresholdCheckResult: result.thresholdCheckResult || 'Below Threshold',
    tdsAmount: result.tdsAmount || 0,
    netPayableAmount: result.netPayableAmount || paymentAmount,
    panAvailabilityFlag: result.panAvailabilityFlag !== undefined ? result.panAvailabilityFlag : !!panNumber,
    panNotProvidedTdsPercent: result.panNotProvidedTdsPercent || 0,
    complianceStatus: result.complianceStatus || 'Compliant'
  };
};

// AI-driven Margin Calculation
export const calculateMarginWithAI = async (expectedRevenue, costs) => {
  const prompt = `Calculate margin status for a deal:

Expected Revenue: ₹${expectedRevenue}
Total Costs: ₹${costs.totalCost || 0}
Trainer Cost: ₹${costs.trainerCost || 0}
Lab Cost: ₹${costs.labCost || 0}
Logistics Cost: ₹${costs.logisticsCost || 0}
Content Cost: ₹${costs.contentCost || 0}
Contingency: ₹${costs.contingencyBuffer || 0}

Calculate:
- Gross Margin Percentage
- Margin Status: "Above Threshold" (>20%), "At Threshold" (10-20%), "Below Threshold" (<10%)

Return JSON:
{
  "grossMarginPercent": number,
  "marginStatus": "Above Threshold" or "At Threshold" or "Below Threshold",
  "totalCost": number,
  "netProfit": number
}`;

  const result = await callAI(prompt, 'You are a financial analyst. Return only valid JSON.');

  return {
    grossMarginPercent: result.grossMarginPercent || 0,
    marginStatus: result.marginStatus || 'Below Threshold',
    totalCost: result.totalCost || costs.totalCost || 0,
    netProfit: result.netProfit || (expectedRevenue - (costs.totalCost || 0))
  };
};

// AI-driven Deal Approval Decision
export const shouldApproveDealWithAI = async (dealData) => {
  const prompt = `Evaluate if this deal should be approved:

Client Name: ${dealData.clientName}
Offering Type: ${dealData.offeringType}
Expected Revenue: ₹${dealData.expectedRevenue}
Expected Start Date: ${dealData.expectedStartDate}
Expected End Date: ${dealData.expectedEndDate}
Margin Status: ${dealData.marginStatus || 'Unknown'}

Consider:
- Revenue amount and profitability
- Timeline feasibility
- Margin thresholds
- Business risk

Return JSON:
{
  "shouldApprove": boolean,
  "reason": "string explaining decision",
  "riskLevel": "Low" or "Medium" or "High",
  "recommendations": "string with recommendations"
}`;

  const result = await callAI(prompt, 'You are a business head making deal approval decisions. Return only valid JSON.');

  return {
    shouldApprove: result.shouldApprove !== undefined ? result.shouldApprove : true,
    reason: result.reason || 'AI evaluation pending',
    riskLevel: result.riskLevel || 'Medium',
    recommendations: result.recommendations || ''
  };
};

// AI-driven Tax Classification
export const classifyTaxWithAI = async (vendorType, serviceDescription, paymentAmount) => {
  const prompt = `Classify the nature of service for TDS purposes:

Vendor Type: ${vendorType}
Service Description: ${serviceDescription}
Payment Amount: ₹${paymentAmount}

Classify as:
- "Contractor" (for 194C)
- "Professional Services" (for 194J)
- "Technical Services" (for 194J)
- "Call Centre Services" (for 194J)
- "Other"

Return JSON:
{
  "natureOfService": "Contractor" or "Professional Services" or "Technical Services" or "Call Centre Services" or "Other",
  "confidence": "High" or "Medium" or "Low",
  "reasoning": "string explaining classification"
}`;

  const result = await callAI(prompt, 'You are a tax classification expert. Return only valid JSON.');

  return {
    natureOfService: result.natureOfService || 'Other',
    confidence: result.confidence || 'Medium',
    reasoning: result.reasoning || ''
  };
};

// AI-driven Automation Decision
export const shouldAutoGenerateWithAI = async (triggerEvent, context) => {
  const prompt = `Should we auto-generate downstream documents for this event?

Trigger Event: ${triggerEvent}
Context: ${JSON.stringify(context, null, 2)}

Consider:
- Data completeness
- Business rules
- Risk factors

Return JSON:
{
  "shouldGenerate": boolean,
  "documentsToGenerate": ["array of document types"],
  "reason": "string explaining decision"
}`;

  const result = await callAI(prompt, 'You are an automation decision engine. Return only valid JSON.');

  return {
    shouldGenerate: result.shouldGenerate !== undefined ? result.shouldGenerate : true,
    documentsToGenerate: result.documentsToGenerate || [],
    reason: result.reason || ''
  };
};

// AI-driven Invoice Calculation
export const calculateInvoiceWithAI = async (invoiceData) => {
  const prompt = `Calculate invoice totals:

Invoice Amount: ₹${invoiceData.invoiceAmount}
GST Type: ${invoiceData.gstType}
GST Percent: ${invoiceData.gstPercent}%
SAC Code: ${invoiceData.sacCode}

Calculate:
- Tax Amount (GST)
- Total Amount (Invoice Amount + Tax)
- TDS Amount (if applicable)

Return JSON:
{
  "taxAmount": number,
  "totalAmount": number,
  "tdsAmount": number,
  "netAmount": number
}`;

  const result = await callAI(prompt, 'You are a financial calculator. Return only valid JSON.');

  return {
    taxAmount: result.taxAmount || 0,
    totalAmount: result.totalAmount || invoiceData.invoiceAmount,
    tdsAmount: result.tdsAmount || 0,
    netAmount: result.netAmount || invoiceData.invoiceAmount
  };
};

// AI-driven Risk Assessment
export const assessRiskWithAI = async (entityType, entityData) => {
  const prompt = `Assess risk for this ${entityType}:

${JSON.stringify(entityData, null, 2)}

Evaluate:
- Financial risk
- Compliance risk
- Operational risk

Return JSON:
{
  "riskLevel": "Low" or "Medium" or "High",
  "riskFactors": ["array of risk factors"],
  "recommendations": "string with recommendations"
}`;

  const result = await callAI(prompt, 'You are a risk assessment expert. Return only valid JSON.');

  return {
    riskLevel: result.riskLevel || 'Medium',
    riskFactors: result.riskFactors || [],
    recommendations: result.recommendations || ''
  };
};

export default {
  calculateTDSWithAI,
  calculateMarginWithAI,
  shouldApproveDealWithAI,
  classifyTaxWithAI,
  shouldAutoGenerateWithAI,
  calculateInvoiceWithAI,
  assessRiskWithAI
};
