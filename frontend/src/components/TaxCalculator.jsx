import { useState, useEffect } from 'react';

const TaxCalculator = ({ title = "Client Amount Payable" }) => {
    const [taxableAmount, setTaxableAmount] = useState('');
    const [gstType, setGstType] = useState('IGST - 18%');
    const [gstPercentage, setGstPercentage] = useState('18');
    const [tdsPercentage, setTdsPercentage] = useState('0');

    const amount = parseFloat(taxableAmount) || 0;
    const gstRate = parseFloat(gstPercentage) || 0;
    const tdsRate = parseFloat(tdsPercentage) || 0;

    const gstAmount = amount * (gstRate / 100);
    const totalAmount = amount + gstAmount;
    const tdsAmount = amount * (tdsRate / 100);
    const netAmount = totalAmount - tdsAmount;

    // Standard Rates
    const gstRates = [0, 5, 12, 18, 28];
    const tdsRates = Array.from({ length: 26 }, (_, i) => i); // 0 to 25 linear

    return (
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', marginTop: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>{title}</h3>

            <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: 'minmax(300px, 1fr) 1fr', alignItems: 'start' }}>

                {/* Inputs Side */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="form-group">
                        <label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>Taxable Amount (₹)</label>
                        <input
                            type="number"
                            value={taxableAmount}
                            onChange={(e) => setTaxableAmount(e.target.value)}
                            placeholder="Enter amount to calculate"
                            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '15px' }}
                        />
                    </div>

                    <div className="form-group">
                        <label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>GST Type</label>
                        <select
                            value={gstType}
                            onChange={(e) => {
                                const newType = e.target.value;
                                setGstType(newType);
                                if (newType === 'No GST') setGstPercentage('0');
                                else if (newType === 'CGST - 9%' || newType === 'SGST - 9%') setGstPercentage('9');
                                else setGstPercentage('18');
                            }}
                            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '15px' }}
                        >
                            <option value="IGST - 18%">IGST - 18%</option>
                            <option value="CGST - 9%">CGST - 9%</option>
                            <option value="SGST - 9%">SGST - 9%</option>
                            <option value="CGST + SGST - 18%">CGST (9%)+ SGST (9%) = 18%</option>
                            <option value="No GST">No GST</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>GST Amount (18% Standard)</label>
                        <input
                            type="text"
                            value={`₹${gstAmount.toLocaleString()}`}
                            readOnly
                            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e5e7eb', background: '#f9fafb', color: '#059669', fontWeight: '500', fontSize: '15px' }}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div className="form-group">
                            <label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>TDS %</label>
                            <select
                                value={tdsPercentage}
                                onChange={(e) => setTdsPercentage(e.target.value)}
                                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '15px' }}
                            >
                                {tdsRates.map((rate) => (
                                    <option key={rate} value={rate}>{rate}%</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>TDS Amount</label>
                            <input
                                type="text"
                                value={`₹${tdsAmount.toLocaleString()}`}
                                readOnly
                                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e5e7eb', background: '#f9fafb', color: '#dc2626', fontWeight: '500' }}
                            />
                        </div>
                    </div>
                </div>

                {/* Results Side */}
                <div style={{ background: '#f8f9fa', padding: '24px', borderRadius: '12px', border: '1px solid #e9ecef', height: '100%' }}>
                    <h4 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#111827', fontWeight: '700' }}>Calculation Summary</h4>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '15px' }}>
                        <span style={{ color: '#4b5563' }}>Taxable Amount:</span>
                        <span style={{ fontWeight: '600', color: '#1f2937' }}>₹{amount.toLocaleString()}</span>
                    </div>

                    {gstType === 'CGST + SGST - 18%' ? (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '15px' }}>
                                <span style={{ color: '#4b5563' }}>CGST ({gstRate / 2}%):</span>
                                <span style={{ fontWeight: '500', color: '#059669' }}>+ ₹{(amount * (gstRate / 200)).toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '15px' }}>
                                <span style={{ color: '#4b5563' }}>SGST ({gstRate / 2}%):</span>
                                <span style={{ fontWeight: '500', color: '#059669' }}>+ ₹{(amount * (gstRate / 200)).toLocaleString()}</span>
                            </div>
                        </>
                    ) : (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '15px' }}>
                            <span style={{ color: '#4b5563' }}>{gstType} ({gstRate}%):</span>
                            <span style={{ fontWeight: '500', color: '#059669' }}>+ ₹{gstAmount.toLocaleString()}</span>
                        </div>
                    )}

                    <div style={{ borderTop: '1px dashed #d1d5db', margin: '12px 0' }}></div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '15px' }}>
                        <span style={{ color: '#4b5563' }}>Total (inc. GST):</span>
                        <span style={{ fontWeight: '600', color: '#1f2937' }}>₹{totalAmount.toLocaleString()}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '15px' }}>
                        <span style={{ color: '#4b5563' }}>TDS Deduction ({tdsRate}%):</span>
                        <span style={{ fontWeight: '500', color: '#dc2626' }}>- ₹{tdsAmount.toLocaleString()}</span>
                    </div>

                    <div style={{ borderTop: '2px solid #e5e7eb', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: '700', color: '#111827', fontSize: '16px' }}>Net Amount:</span>
                        <span style={{ fontWeight: '700', fontSize: '24px', color: '#4f46e5' }}>₹{netAmount.toLocaleString()}</span>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default TaxCalculator;
